# Kids Edu Platform

Простая образовательная платформа: **Next.js 15** + **Supabase** + **OpenAI**.

Курс: **Информатика → 3 класс → 3 четверть** · 8 тем · финальный тест.

## Запуск

```bash
npm install
cp .env.example .env.local
# заполните ключи Supabase
npm run dev
```

http://localhost:3000

## Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. **SQL Editor** → выполните `supabase/schema.sql`
3. **Authentication → Users** → добавьте:
   - `teacher@demo.com` / `demo1234` — metadata: `{"role":"teacher","display_name":"Учитель"}`
   - `student@demo.com` / `demo1234` — metadata: `{"role":"student","display_name":"Ученик"}`
4. Скопируйте ключи в `.env.local` (см. `.env.example`)

## Роли

### Ученик
- `/student/course` — 8 тем (линейно)
- Урок: теория → YouTube → практика A/B/C (внешние ссылки) → тест (5 вопросов) → AI feedback
- **0–50%** — не усвоено, повтор  
- **50–70%** — повтор, следующая тема закрыта  
- **70–85%** — переход с рекомендацией  
- **85%+** — следующая тема открыта  
- После 8 тем — **финальный тест** (10 вопросов), 9/10+ → «Курсты сәтті аяқтадың»

### Учитель
- `/teacher` — панель + краткая аналитика
- `/teacher/topics` — создать / удалить темы
- `/teacher/topics/[id]` — теория, видео, ссылки A/B/C, 5 вопросов теста
- `/teacher/analytics` — прогресс, слабые ученики, сложные темы
- `/teacher/final-test` — 10 вопросов финального теста

## База данных

| Таблица | Назначение |
|---------|------------|
| `profiles` | учителя и ученики |
| `course_paths` | предмет / класс / четверть |
| `topics` | 8 тем |
| `topic_content` | теория + видео |
| `tasks` | ссылки A, B, C |
| `tests` + `test_questions` | тест темы и финальный |
| `progress` | шаги ученика |
| `attempts` | попытки тестов |
| `ai_logs` | AI-обратная связь |
| `final_progress` | финальный экзамен |

## Структура

```
src/app/          страницы и API routes
src/components/   UI
src/lib/          Supabase, scoring, OpenAI
supabase/         schema.sql
```

## OpenAI

Опционально: `OPENAI_API_KEY` в `.env.local`. Без ключа — встроенные дружелюбные сообщения.
