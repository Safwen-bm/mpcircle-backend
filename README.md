# MPCircle Student Dashboard API

A REST API powering a student dashboard: authentication, students, courses, and
assignments. Built for the MPCircle Backend Developer Intern screening task.

- **Runtime:** Node.js + Express + TypeScript
- **Database:** PostgreSQL, accessed via Prisma
- **Auth:** JWT (mock login against a seeded `User` table)
- **Validation:** Zod, on every endpoint
- **Tests:** Jest + Supertest

---

## 1. Decisions

- **Prisma over raw SQL.** The task allows either. Prisma was chosen because it
  gives type-safe queries that pair naturally with TypeScript, fast schema
  migrations, and cleaner, more reviewable code — important at any real scale,
  and easier for a reviewer to audit than hand-written SQL strings. Anywhere
  Prisma's query builder would be awkward (complex reporting queries, for
  example), raw SQL via `prisma.$queryRaw` is still available.
- **Module-per-resource structure** (`routes → controller → service → schema`)
  keeps each resource self-contained and mirrors how a small team would split
  ownership as the API grows.
- **Centralized error handling** via a single `AppError` class and one error
  middleware, so every failure path (validation, 404, 409, 500) returns the
  exact same `{ success, message }` shape without each controller
  reimplementing it.
- **JWT auth is mock-real**: it's a genuine bcrypt + JWT flow against a real
  `User` table (not hardcoded credentials), but there's no registration
  endpoint or refresh-token flow, since the task only asked for login.
- **Docker Compose** runs Postgres and the API together, since local
  Postgres installs are unnecessary friction for a screening exercise (and
  reviewers may not have Postgres installed either).

## 2. Assumptions

- "Mock authentication is acceptable" was read as: real password hashing and
  a real JWT, but no registration/password-reset flow — just a seeded demo
  user.
- `Student`, `Course`, and `Assignment` are the only entities that needed
  persistence; `User` (login identity) is intentionally kept separate from
  `Student`, since in a real system staff/admin accounts and student records
  usually aren't the same table.
- Assignment `status` follows a fixed enum (`PENDING`, `SUBMITTED`, `GRADED`,
  `LATE`) rather than a free-text field, since a dashboard consuming this API
  needs predictable values to render UI state.
- `DELETE` was only requested for `/students`, matching the endpoint list in
  the task; courses and assignments have no delete endpoint by design (see
  `THINKING.md` for why).

## 3. Improvements beyond the minimum spec

These are things a reviewer wouldn't strictly require but that meaningfully
raise the quality bar, without over-engineering a screening task:

- Consistent pagination (`page`, `limit`, capped at 100) and `meta` block on
  every list endpoint, not just the ones with a "bonus: pagination" note.
- Case-insensitive `q` search across relevant fields (name/email for
  students, title for courses/assignments).
- Filtering assignments by `status`, `studentId`, and `courseId` together.
- `helmet` + `cors` on every response, and a `/health` endpoint for
  container orchestration / uptime checks.
- A Prisma seed script so the API is immediately usable with real (if fake)
  data instead of an empty database.

---

## 4. Installation

You do **not** need PostgreSQL installed locally — everything runs through
Docker.

**Requirements:** Docker + Docker Compose.

```bash
git clone <your-repo-url>
cd mpcircle-backend
cp .env.example .env   # only needed if you plan to run `npm run dev` outside Docker
```

## 5. Running locally (Docker — recommended)

```bash
docker compose up --build
```

This starts:
- `db` — Postgres 16, with a healthcheck so the app waits for it to be ready
- `app` — builds the TypeScript project, runs `prisma migrate deploy`, then
  starts the server on **http://localhost:3000**

First time only, seed some demo data (in a second terminal, while
`docker compose up` is running):

```bash
docker compose exec app npx prisma db seed
```

This creates a demo login:

```
email:    admin@mpcircle.org
password: password123
```

Check it's alive:

```bash
curl http://localhost:3000/health
```

### Running locally without Docker (optional)

If you'd rather run Postgres yourself and the app directly on your machine:

```bash
npm install
# update DATABASE_URL in .env to point at your own Postgres instance
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## 6. Environment variables

| Variable          | Description                                   | Example                                                            |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`     | Postgres connection string                    | `postgresql://mpcircle:mpcircle@localhost:5432/mpcircle_dashboard`  |
| `JWT_SECRET`       | Secret used to sign access tokens             | `dev_secret_change_me`                                              |
| `JWT_EXPIRES_IN`   | Access token lifetime                         | `1h`                                                                 |
| `PORT`             | Port the server listens on                    | `3000`                                                               |
| `NODE_ENV`         | `development` / `test` / `production`         | `development`                                                       |

`docker-compose.yml` already sets these for the containerized run; `.env.example`
covers the non-Docker case.

## 7. Running tests

```bash
npm install
npx prisma generate
npm test
```

Tests mock the Prisma client, so they don't require a running database.

---

## 8. API Reference

All responses follow:

```json
{ "success": true, "data": ... }
```

or on error:

```json
{ "success": false, "message": "Student not found" }
```

Every endpoint except `POST /auth/login` requires:

```
Authorization: Bearer <accessToken>
```

### Auth

**POST `/auth/login`**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mpcircle.org","password":"password123"}'
```

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": { "id": "...", "email": "admin@mpcircle.org", "name": "Admin User", "role": "ADMIN" }
  }
}
```

### Students

```bash
# List (paginated, searchable)
curl "http://localhost:3000/students?page=1&limit=10&q=ada" \
  -H "Authorization: Bearer $TOKEN"

# Get one
curl http://localhost:3000/students/<id> -H "Authorization: Bearer $TOKEN"

# Create
curl -X POST http://localhost:3000/students \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"Ada","lastName":"Lovelace","email":"ada@example.com"}'

# Update
curl -X PUT http://localhost:3000/students/<id> \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"lastName":"King"}'

# Delete
curl -X DELETE http://localhost:3000/students/<id> -H "Authorization: Bearer $TOKEN"
```

### Courses

```bash
curl "http://localhost:3000/courses?q=backend" -H "Authorization: Bearer $TOKEN"

curl http://localhost:3000/courses/<id> -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/courses \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Intro to Backend Engineering","credits":4}'
```

### Assignments

```bash
curl "http://localhost:3000/assignments?status=PENDING&studentId=<id>" \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/assignments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Build a REST API","dueDate":"2026-09-01T00:00:00.000Z","studentId":"<id>","courseId":"<id>"}'

curl -X PATCH http://localhost:3000/assignments/<id> \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"GRADED","grade":92}'
```

---

See [`THINKING.md`](./THINKING.md) for the engineering reflection and
[`PRODUCT_IMPROVEMENTS.md`](./PRODUCT_IMPROVEMENTS.md) for the scale
discussion.
