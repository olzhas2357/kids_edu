# Kids Edu Platform

Monorepo: Next.js 15 + NestJS + PostgreSQL + Prisma.

## Quick start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up postgres -d
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/docs |

## Test users (password: `Test1234!`)

- admin@test.com — ADMIN
- teacher@test.com — TEACHER
- student@test.com — STUDENT

## Structure

- `apps/api` — NestJS backend (auth, teacher dashboard, Prisma)
- `apps/web` — Next.js 15 App Router (see `apps/web/ARCHITECTURE.md`)
- `packages/shared` — shared types

## Teacher API (`/api/v1/teacher`, role: TEACHER or ADMIN)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courses` | List teacher courses |
| GET/POST | `/courses/:courseId/topics` | List / create topics |
| GET/PATCH/DELETE | `/topics/:topicId` | Topic CRUD + full content |
| PUT/PATCH/DELETE | `/topics/:topicId/theory` | Theory content |
| POST/PATCH/DELETE | `/topics/:topicId/videos/:id?` | YouTube videos |
| PUT/DELETE | `/topics/:topicId/practice/:level` | Practice A/B/C + link |
| GET/POST/PATCH/DELETE | `/topics/:topicId/test` | Final test |
| POST/PATCH/DELETE | `/topics/:topicId/test/questions/:id?` | Test questions |

## Student API (`/api/v1/student`, role: STUDENT)

Learning flow: theory → video → practice A/B/C → test → AI feedback.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courses` | Published courses |
| GET | `/courses/:courseId/topics` | Topics with lock/progress |
| POST | `/courses/:courseId/enroll` | Init progress |
| GET | `/topics/:topicId` | Open topic content |
| POST | `/topics/:topicId/steps/theory\|video\|practice/:level/complete` | Step progress |
| POST | `/topics/:topicId/test/start` | Start attempt |
| POST | `/topics/:topicId/test/attempts/:id/answers/:qid` | Submit answer |
| POST | `/topics/:topicId/test/attempts/:id/submit` | Grade, unlock if ≥85% |
| POST | `/topics/:topicId/retry` | Retry test |
| GET | `/topics/:topicId/result` | Result + recommendation |

## AI API (`/api/v1/ai`, role: STUDENT)

Socratic tutor for children 8–10: hints only, no direct answers. Uses OpenAI when `OPENAI_API_KEY` is set.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | AI status (public) |
| POST | `/topics/:topicId/test/analyze` | Analyze graded test → structured feedback |
| POST | `/topics/:topicId/practice/:practiceTaskId/hint` | Practice Socratic hint |
| POST | `/chat` | Free-form tutor chat |

**AI response shape (test analysis):**

```json
{
  "score": 78,
  "level": "good",
  "feedback": "...",
  "recommendation": "...",
  "allowNextTopic": false,
  "socraticHint": "..."
}
```

Levels: `weak` | `medium` | `good` | `excellent`. Test submit (`/student/.../submit`) also returns `aiFeedback.assessment`.
