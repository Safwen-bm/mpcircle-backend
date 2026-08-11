# Product Improvement Challenge

Scenario: this API now serves 50,000 students.

## 1. Read replicas + caching for list/read endpoints

**Why it matters.** At 50k students, `GET /students`, `GET /courses`, and
`GET /assignments` (with filters) become the overwhelming majority of
traffic — dashboards poll constantly, and reads vastly outnumber writes
(a student rarely creates data, but views it every session). A single
Postgres primary handling both reads and writes becomes the bottleneck.

**How I'd implement it.**
- Add a Postgres read replica; route all `GET` queries through it via a
  second Prisma client (or a connection-string switch based on request
  method), keeping writes on the primary.
- Add a short-TTL cache (Redis — already listed as a technology in the job
  post) in front of expensive/frequent reads: course lists change rarely,
  so a 60s TTL cache would eliminate most repeated identical queries.
- Invalidate the relevant cache keys on write (e.g. `POST /courses`
  invalidates the `courses:list:*` cache keys).

**Trade-offs.** Replication lag means a student could briefly not see data
they just created if the read hits a lagging replica — mitigated by
routing a user's own just-written data to the primary for a short window,
or reading their own writes from the primary explicitly. Caching adds
invalidation complexity and one more moving part (Redis) to operate and
monitor.

## 2. Rate limiting and request quotas per user/IP

**Why it matters.** At this scale, a single misbehaving client (buggy
frontend polling loop, a scraping script, or a compromised account) can
degrade the API for everyone. There's currently no protection against
that beyond Postgres itself falling over.

**How I'd implement it.**
- Add `express-rate-limit` (or a Redis-backed token-bucket limiter for
  multi-instance deployments, since in-memory limiting doesn't work once
  you horizontally scale the app) keyed by `userId` from the JWT, falling
  back to IP for unauthenticated routes like `/auth/login`.
- Tighter limits specifically on `/auth/login` to slow down credential
  stuffing/brute force attempts.
- Return `429` with a `Retry-After` header, consistent with the existing
  `{ success: false, message }` error shape.

**Trade-offs.** Overly aggressive limits create false positives for
legitimate power users (e.g. a teacher's dashboard batch-loading many
students' assignments). Requires tuning per-endpoint, and a Redis-backed
limiter is one more piece of shared infrastructure to keep available —
if Redis goes down, the limiter needs a safe fallback (fail open, not
fail closed, so an infra outage doesn't take down the whole API).

## 3. Background processing for write-heavy/side-effect-heavy operations

**Why it matters.** Some operations that look simple today (e.g. grading
an assignment, which might trigger a notification to the student, a
recalculation of their course average, and an audit log entry) will grow
side effects as the product matures. Doing all of that synchronously inside
the `PATCH /assignments/:id` request handler means the response gets
slower and less reliable as more side effects get added, and a failure in
a non-critical side effect (e.g. sending a notification) would fail the
whole request.

**How I'd implement it.**
- Introduce a job queue (BullMQ on Redis is a natural fit given Redis is
  already in the stack) for anything that isn't required for the
  immediate API response: notifications, grade-average recalculation,
  audit logging, analytics events.
- The request handler does the core DB write, enqueues a job, and returns
  immediately; a worker process consumes the queue.

**Trade-offs.** Introduces eventual consistency — a student's course
average might not update for a few seconds after a grade is posted, which
needs to be communicated in the UI (e.g. optimistic update, or a
"processing" state). It also adds operational surface area: a worker
process to deploy and monitor, and jobs that can fail and need retry/dead-
letter handling, which is real complexity that needs to be worth it before
introducing it — I'd only add this once side effects actually existed,
not preemptively.
