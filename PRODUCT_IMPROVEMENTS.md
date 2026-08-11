# Product improvements at 50,000 students

## 1. Read replicas and caching

Reads are going to massively outnumber writes at this scale. Students check
their dashboard constantly but rarely create anything. Right now everything
hits one Postgres instance for both reads and writes, which becomes the
bottleneck first.

I'd add a read replica and route all GET requests there, keeping writes on
the primary. On top of that, a short-lived cache (Redis, which is already
in the stack) in front of things like course lists, since those barely
change and get requested constantly. Writes would invalidate the relevant
cache keys.

The tradeoff is replication lag. A student could briefly not see something
they just created if their read hits a replica that hasn't caught up yet.
You can work around that by routing a user's own just-written data back to
the primary for a bit. Caching also means one more thing to keep running
and one more source of subtle bugs if invalidation isn't handled right.

## 2. Rate limiting

Right now nothing stops one bad client, a buggy polling loop, a scraper, a
compromised account, from hammering the API and degrading it for everyone
else.

I'd add rate limiting keyed by user ID from the JWT, with tighter limits
specifically on `/auth/login` to slow down brute-force attempts. For
multiple app instances this needs to be backed by Redis rather than
in-memory, since in-memory limits don't share state across instances.
Responses would return 429 with a Retry-After header, same JSON shape as
everything else.

The tradeoff is tuning. Too strict and you start blocking legitimate heavy
users, like a teacher's dashboard pulling a lot of student data at once. If
Redis goes down, the limiter needs to fail open rather than fail closed, so
an infrastructure hiccup doesn't take the whole API down with it.

## 3. Background jobs for side effects

Some actions look simple now but will grow side effects as the product
matures. Grading an assignment, for example, might eventually need to
notify the student, recalculate their course average, and write an audit
log entry. Doing all of that inside the request handler makes responses
slower and means a failure in something non-critical, like a notification,
could fail the whole request.

I'd move anything that isn't needed for the immediate response into a job
queue (BullMQ on Redis fits naturally here). The request does the actual DB
write, queues the rest, and returns right away. A separate worker process
handles the queue.

The tradeoff is eventual consistency. A grade average might take a few
seconds to update, which needs to be reflected in the UI somehow. It also
means running and monitoring a worker process, and handling job failures
and retries, which is real operational overhead. I'd only bring this in
once there are actual side effects to move, not ahead of time.