# MPCircle Student Dashboard API

REST API for a student dashboard: login, students, courses, and assignments.
Built for the MPCircle Backend Developer Intern screening task.

- Node.js + Express + TypeScript
- PostgreSQL with Prisma
- JWT auth
- Zod validation on every route
- Jest + Supertest for testing

**Live deployment:** https://mpcircle-backend.onrender.com
**Note:** free-tier hosting spins down after inactivity, so the first request after idle time can take 30–50 seconds to wake up.

## Why Prisma

The task said an ORM wasn't required, but Prisma or Drizzle were fine if I wanted one.
I went with Prisma because it gives me type-safe queries that match up naturally with
TypeScript, handles migrations cleanly, and is easier to read in a review than raw SQL
strings scattered across files. If I ever need something Prisma's query builder can't
express well, I can still drop into `prisma.$queryRaw`.

## How it's organized

Each resource (students, courses, assignments, auth) has its own folder with a
route file, a controller, a service, and a Zod schema. Routes handle HTTP wiring,
controllers call the service, services hold the actual logic and talk to Prisma.
Nothing fancy, just enough separation that each piece is easy to find and test.

Errors all flow through one `AppError` class and one error-handling middleware,
so every failure (validation, not found, conflict, server error) comes back in
the same shape:

```json
{ "success": false, "message": "Student not found" }
```

## Assumptions I made

- "Mock authentication is acceptable" meant a real bcrypt + JWT login flow against
  a seeded user, not a fake hardcoded token. There's no registration or password
  reset endpoint since the task only asked for login.
- I kept `User` (who logs in) separate from `Student` (academic record). In most
  real systems those aren't the same table.
- Assignment status is a fixed set of values (PENDING, SUBMITTED, GRADED, LATE)
  rather than free text, since a dashboard needs predictable values to render.
- The task lists specific verbs per resource. Students get full CRUD, courses get
  GET/GET one/POST, assignments get GET/POST/PATCH. I stuck to that instead of
  adding DELETE everywhere "just in case." More on why in THINKING.md.

## What I added beyond the minimum

- Pagination and a `meta` block on every list endpoint, not just where it was
  explicitly asked for.
- Case-insensitive search (`?q=`) on students, courses, and assignments.
- Filtering assignments by status, student, and course at the same time.
- `helmet` and `cors` on every response, plus a `/health` endpoint.
- A seed script so the API has real-ish data the moment you start it.

## Running it locally

You don't need Postgres installed. Everything runs through Docker.

```bash
git clone <your-repo-url>
cd mpcircle-backend
docker compose up --build
```

That builds and starts the app, waits for Postgres to be healthy, and applies
the migrations. Once it's running, seed some demo data:

```bash
docker compose exec app npx prisma db seed
```

This gives you a login:

email: admin@mpcircle.org
password: password123


Check it's alive:

```bash
curl http://localhost:3000/health
```

### Without Docker

If you'd rather run your own Postgres:

```bash
npm install
cp .env.example .env   # point DATABASE_URL at your own database
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Environment variables

| Variable | What it's for | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://mpcircle:mpcircle@localhost:5432/mpcircle_dashboard` |
| `JWT_SECRET` | Signs the access tokens | `dev_secret_change_me` |
| `JWT_EXPIRES_IN` | Token lifetime | `1h` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | development / test / production | `development` |

Docker Compose already sets these for you. `.env.example` is only needed if
you're running outside Docker.

## Running tests

```bash
npm install
npx prisma generate
npm test
```

Tests mock the Prisma client, so no database is needed to run them.

## API examples

Everything except `POST /auth/login` needs:

Authorization: Bearer <accessToken>


**Login**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mpcircle.org","password":"password123"}'
```

**Students**

```bash
curl "http://localhost:3000/students?page=1&limit=10&q=ada" -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/students/<id> -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/students \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"Ada","lastName":"Lovelace","email":"ada@example.com"}'

curl -X PUT http://localhost:3000/students/<id> \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"lastName":"King"}'

curl -X DELETE http://localhost:3000/students/<id> -H "Authorization: Bearer $TOKEN"
```

**Courses**

```bash
curl "http://localhost:3000/courses?q=backend" -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/courses/<id> -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/courses \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Intro to Backend Engineering","credits":4}'
```

**Assignments**

```bash
curl "http://localhost:3000/assignments?status=PENDING&studentId=<id>" -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/assignments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Build a REST API","dueDate":"2026-09-01T00:00:00.000Z","studentId":"<id>","courseId":"<id>"}'

curl -X PATCH http://localhost:3000/assignments/<id> \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"GRADED","grade":92}'
```

See `THINKING.md` for the engineering reflection and `PRODUCT_IMPROVEMENTS.md`
for the scale discussion.