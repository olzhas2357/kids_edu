# Kids Edu Platform

Monorepo: Next.js 15 + NestJS + PostgreSQL + Prisma.

## Quick start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up -d   # postgres (+ redis optional; set REDIS_ENABLED=true in apps/api/.env)
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/docs |

## Production

See **[docs/PRODUCTION.md](docs/PRODUCTION.md)** — Docker, nginx, CI/CD, Redis, monitoring, checklist, OpenAI cost tips.

```bash
cp .env.production.example .env
./deploy/scripts/validate-env.sh .env
docker compose -f docker-compose.prod.yml up -d --build
```

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

## Teacher Analytics (`/api/v1/teacher/courses/:courseId/analytics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Full dashboard (KPIs, charts, AI risk) |
| GET | `/summary` | Average score, pass rate, attempts |
| GET | `/topics/difficult` | Hardest topics |
| GET | `/students/weak` | Students needing help |
| GET | `/charts/progress` | Chart.js-ready progress data |
| GET | `/charts/attempts` | Attempts time series + by status |
| GET | `/ai-risk` | Anti-cheat + weak AI performance risk |

Query: `?days=30` for time-series charts.

## Student API (`/api/v1/student`, role: STUDENT)

Learning flow: theory → video → practice A/B/C → test → AI feedback.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courses` | Published courses |
| GET | `/courses/:courseId/topics` | Topics with lock/progress |
| POST | `/courses/:courseId/enroll` | Init progress |
| GET | `/topics/:topicId` | Open topic content |
| POST | `/topics/:topicId/steps/theory\|video\|practice/:level/complete` | Step progress |
| POST | `/topics/:topicId/test/start` | Start/resume MC test (5×4) |
| GET | `/topics/:topicId/test/attempts/:id/session` | Session + timer + saved answers |
| POST | `.../answers/:qid` | Autosave one answer |
| POST | `.../autosave` | Batch autosave |
| POST | `.../events` | Anti-cheat (`tab_blur`, `paste`) |
| POST | `.../submit` | Score + AI feedback + unlock |
| GET | `/topics/:topicId/test/history` | Attempt history |
| GET | `.../attempts/:id/result` | Single result |
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
