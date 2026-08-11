# Engineering reflection

## Assumptions I made

Mock auth meant a real login flow (bcrypt + JWT against a seeded user), not
a fake token. I didn't build registration or password reset since the task
never asked for them.

I kept the login identity (`User`) separate from the academic record
(`Student`). Felt weird to merge those into one table.

I followed the exact verb list the task gave per resource instead of adding
DELETE everywhere for symmetry. Adding endpoints nobody asked for is just
more surface area to review and maintain.

Assignment status is a fixed enum instead of a text field, because a
dashboard needs to know exactly what values it might get back.

## Hardest part

Honestly, it was holding back. It's easy to go overboard on a take-home,
adding full RBAC, refresh tokens, a repository layer on top of Prisma, all
the "proper" stuff. But that's disproportionate for a 4-day exercise and
mostly just adds surface area a reviewer has to read through. The hard part
was figuring out where real engineering ends and over-engineering starts.

## If I had another week

- Run the integration tests against an actual dockerized Postgres instead of
  a mocked Prisma client. Mocks are good for testing the HTTP and validation
  layer, but they won't catch real query bugs like a broken cascade delete.
- Add a `GET /students/:id/assignments` route. A real dashboard would hit
  that constantly instead of filtering `/assignments` every time.
- Add refresh tokens. A 1 hour access token with no refresh means people get
  logged out mid-session, which isn't great for a real product.
- Generate API docs straight from the Zod schemas so the README examples
  can't drift from what the code actually accepts.

## What I'd refactor first

Every schema file repeats the same `z.object({ body, query, params })`
wrapper. I'd pull that into a couple of small helpers once there were more
resources to justify it. With only 4 resources right now, that abstraction
would save maybe a few lines and add a layer of indirection that isn't
worth it yet.

## AI tools I used

I used Claude to scaffold the project fast (Express setup, Prisma schema,
middleware, Docker config) so I could spend my time on the decisions that
actually matter, like what belongs in each layer, what the error format
should look like, and what to leave out. I reviewed every file, fixed the
type errors that came up once Prisma's client was generated, and made the
scope calls myself, like deciding not to add DELETE to courses and
assignments. The reflection answers here are mine, not generated.

## What I chose not to build

- Fine-grained permissions beyond the `role` field on `User`. The schema
  supports ADMIN/TEACHER/STUDENT and there's a `requireRole()` middleware
  ready to use, but I didn't wire "students can only see their own stuff"
  into every route because the task never specified authorization rules,
  and guessing wrong seemed worse than leaving it available but unused.
- DELETE on courses and assignments. Wasn't in the spec, and deleting a
  course that has assignments attached to it is a real product decision
  (soft delete? cascade? block it?) I didn't want to silently guess at.
- Rate limiting beyond basic request logging. That belongs at the
  infrastructure level in a real deployment, covered instead in
  PRODUCT_IMPROVEMENTS.md.
- A full repository layer decoupling services from Prisma directly. With
  only 4 resources and no second data-access implementation in sight, that
  would be abstraction for its own sake.