# Web frontend architecture

## App Router

```
src/app/
├── layout.tsx              # Root + Providers
├── page.tsx                # Landing
├── loading.tsx / error.tsx / not-found.tsx
├── (auth)/                 # Public auth pages
│   ├── login/
│   └── register/
└── (dashboard)/            # Protected (middleware + AuthGuard)
    ├── layout.tsx          # AuthGuard
    ├── teacher/            # RoleGuard TEACHER | ADMIN
    │   ├── page.tsx        # Dashboard
    │   ├── topics/
    │   ├── analytics/
    │   └── students/
    └── student/            # RoleGuard STUDENT | ADMIN
        ├── topics/
        ├── lessons/[topicId]/
        ├── lessons/[topicId]/test/
        ├── assistant/
        └── progress/
```

## Layers

| Layer | Path | Role |
|-------|------|------|
| API | `src/lib/api/` | `fetch` client, domain APIs |
| Auth | `src/lib/auth/` | Cookies, redirects, role helpers |
| Stores | `src/stores/` | Zustand (auth, UI) |
| Hooks | `src/hooks/` | `useAuth`, etc. |
| Components | `src/components/` | UI, layouts, feedback, auth guards |
| Config | `src/config/` | Navigation items |

## Route protection

1. **Middleware** — cookie `access_token` required for `/teacher/*` and `/student/*`
2. **AuthGuard** — hydrates session via `GET /auth/me`, redirects to login
3. **RoleGuard** — redirects wrong role to home route

## API usage

```ts
import { studentApi, aiApi } from '@/lib/api';

const topics = await studentApi.listTopics(courseId);
const hint = await aiApi.practiceHint(topicId, taskId, message);
```

Credentials: `credentials: 'include'` (httpOnly cookies from API).
