# THINKING.md — Engineering Reflection

## 1. What assumptions did you make?

- "Mock authentication is acceptable" meant I didn't need a registration
  endpoint or password reset flow — just a real bcrypt+JWT login against a
  seeded user. I kept `User` (login identity) separate from `Student`
  (academic record), since in most real systems staff/admin accounts and
  student records aren't the same table.
- The task lists specific verbs per resource (`Students` gets full CRUD,
  `Courses` gets GET/GET:id/POST, `Assignments` gets GET/POST/PATCH). I took
  that literally rather than adding DELETE everywhere "for completeness" —
  adding endpoints the spec didn't ask for is scope creep, and in a real
  team it'd mean an unreviewed, unrequested surface area.
- `dueDate` is a required field for creating an assignment, since a due date
  is central to what makes it an assignment rather than a task.
- Pagination defaults to `page=1, limit=10`, capped at `limit=100`, since an
  unbounded `limit` is an easy way to accidentally DoS your own database.

## 2. What was the hardest part?

Deciding how much structure to add without over-engineering a screening
task. It would have been easy to add a full RBAC system, refresh tokens, or
a repository/service/domain layer split — but that's disproportionate to a
4-day take-home and would make the code harder, not easier, to review. The
actual hard part was picking the right *amount* of engineering: real
validation and real error handling, but no premature abstraction.

## 3. If you had another week, what would you improve?

- Add integration tests that run against a real (dockerized, ephemeral)
  Postgres instance in CI, rather than only mocking Prisma — mocks verify
  the HTTP/validation layer well but not actual query correctness (e.g.
  cascade deletes, unique constraint behavior).
- Add a `GET /students/:id/assignments` convenience route, since a real
  dashboard would hit that constantly and shouldn't have to over-fetch via
  `/assignments?studentId=`.
- Add refresh tokens and token revocation, since a 1-hour access token with
  no refresh flow means users get logged out mid-session in a real product.
- Add OpenAPI/Swagger generation from the Zod schemas so the README examples
  can't drift from the actual API.

## 4. What would you refactor first?

The Zod schema shape (`z.object({ body, query, params })` on every schema
file) is repetitive. I'd extract small factory helpers like
`bodySchema(shape)` and `paramsIdSchema('student')` to cut the boilerplate,
once there were enough resources to justify the abstraction. I didn't do
this now because with only 4 resources, the "shared helper" would still be
mostly one-off logic and add an indirection layer for not much saved code.

## 5. What AI tools (if any) did you use, and how did they help?

I used Claude to help scaffold the project structure and boilerplate
(Express app wiring, Prisma schema, middleware, Docker setup) quickly, so I
could spend my own time on the decisions that actually matter: what goes in
each layer, what the error contract looks like, what's in vs. out of scope,
and the write-up in this file and the product improvements doc. I reviewed
every generated file, fixed type errors Prisma's generated types surfaced,
and made the scope calls myself (e.g. deciding not to add DELETE to courses/
assignments). I did not have AI write the reflection answers themselves —
these are my own judgment calls about the trade-offs I made.

## 6. What did you deliberately choose not to build, and why?

- **Role-based access control beyond a single `role` field.** The schema
  supports `ADMIN`/`TEACHER`/`STUDENT` and there's a `requireRole()`
  middleware ready to use, but I didn't wire fine-grained permissions
  (e.g. "students can only see their own assignments") into every route,
  since the task didn't specify authorization rules and guessing wrong here
  would be worse than leaving the primitive available but unused.
- **DELETE on courses/assignments.** Not in the spec's endpoint list, and
  deleting a course with existing assignments is a real product decision
  (soft delete? cascade? block it?) that I didn't want to guess at silently.
- **Rate limiting and request logging infrastructure** (beyond `morgan` for
  dev). Belongs at the infrastructure/gateway layer in a real deployment,
  discussed instead in `PRODUCT_IMPROVEMENTS.md`.
- **A full ORM-agnostic repository layer.** Would decouple services from
  Prisma directly, but for a 4-resource API that's speculative abstraction
  with no second implementation in sight.
