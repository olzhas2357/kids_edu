-- Kids Edu Platform — full schema (run in Supabase SQL Editor)
-- If you have old tables, drop them first or use a fresh Supabase project.

-- ─── Profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null check (role in ('teacher', 'student')),
  created_at timestamptz not null default now()
);

-- ─── Course path: Информатика → 3 класс → 3 четверть ───────────────────────
create table if not exists public.course_paths (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  grade int not null,
  quarter int not null,
  title text not null,
  created_at timestamptz not null default now(),
  unique (subject, grade, quarter)
);

-- ─── Topics (8 per course) ───────────────────────────────────────────────────
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  course_path_id uuid not null references public.course_paths (id) on delete cascade,
  title text not null,
  description text,
  order_index int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (course_path_id, order_index)
);

-- ─── Theory + video ──────────────────────────────────────────────────────────
create table if not exists public.topic_content (
  topic_id uuid primary key references public.topics (id) on delete cascade,
  theory_title text,
  theory_text text,
  video_url text,
  updated_at timestamptz not null default now()
);

-- ─── Practice A / B / C (external links) ─────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  level text not null check (level in ('A', 'B', 'C')),
  title text not null,
  link_url text not null,
  unique (topic_id, level)
);

-- ─── Tests (topic = 5 questions, final = 10 questions) ─────────────────────
create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  course_path_id uuid not null references public.course_paths (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete cascade,
  test_type text not null check (test_type in ('topic', 'final')),
  title text not null,
  unique (topic_id)
);

create unique index if not exists tests_one_final_per_course
  on public.tests (course_path_id) where (test_type = 'final');

create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests (id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_answer text not null,
  order_index int not null default 0
);

-- ─── Student progress per topic ──────────────────────────────────────────────
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  theory_done boolean not null default false,
  video_done boolean not null default false,
  task_a_done boolean not null default false,
  task_b_done boolean not null default false,
  task_c_done boolean not null default false,
  test_score_percent int,
  test_passed boolean not null default false,
  ai_feedback_seen boolean not null default false,
  topic_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (student_id, topic_id)
);

-- ─── Test attempts ───────────────────────────────────────────────────────────
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  test_id uuid not null references public.tests (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  score int not null,
  total int not null,
  score_percent int not null,
  answers jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ─── AI logs ─────────────────────────────────────────────────────────────────
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  score_percent int not null,
  level text not null check (level in ('weak', 'medium', 'good', 'excellent')),
  feedback text not null,
  recommendation text not null,
  action text not null check (action in ('retry', 'review', 'continue')),
  created_at timestamptz not null default now()
);

-- ─── Final exam progress ─────────────────────────────────────────────────────
create table if not exists public.final_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_path_id uuid not null references public.course_paths (id) on delete cascade,
  final_completed boolean not null default false,
  final_score int,
  final_total int,
  unique (student_id, course_path_id)
);

-- ─── Auth trigger ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.course_paths enable row level security;
alter table public.topics enable row level security;
alter table public.topic_content enable row level security;
alter table public.tasks enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.progress enable row level security;
alter table public.attempts enable row level security;
alter table public.ai_logs enable row level security;
alter table public.final_progress enable row level security;

create policy "profiles own" on public.profiles for all using (auth.uid() = id);

create policy "course_paths read" on public.course_paths for select to authenticated using (true);
create policy "course_paths teacher write" on public.course_paths for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

create policy "topics read" on public.topics for select to authenticated
  using (is_published = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));
create policy "topics teacher write" on public.topics for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

create policy "topic_content read" on public.topic_content for select to authenticated using (true);
create policy "topic_content teacher write" on public.topic_content for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

create policy "tasks read" on public.tasks for select to authenticated using (true);
create policy "tasks teacher write" on public.tasks for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

create policy "tests read" on public.tests for select to authenticated using (true);
create policy "tests teacher write" on public.tests for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

create policy "questions read" on public.test_questions for select to authenticated using (true);
create policy "questions teacher write" on public.test_questions for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

create policy "progress own" on public.progress for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "attempts own" on public.attempts for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "ai_logs own" on public.ai_logs for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "final own" on public.final_progress for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ─── Seed: Информатика 3 класс 3 четверть + 8 topics ───────────────────────
insert into public.course_paths (id, subject, grade, quarter, title)
values (
  '00000000-0000-0000-0000-000000000001',
  'Информатика',
  3,
  3,
  'Информатика · 3 класс · 3 четверть'
) on conflict (id) do nothing;

insert into public.tests (id, course_path_id, topic_id, test_type, title)
values (
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000001',
  null,
  'final',
  'Финальный тест'
) on conflict (id) do nothing;

-- 8 topic placeholders (teacher fills content in UI)
insert into public.topics (id, course_path_id, title, order_index, is_published)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Тема 1', 0, true),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Тема 2', 1, true),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Тема 3', 2, true),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Тема 4', 3, true),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Тема 5', 4, true),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Тема 6', 5, true),
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'Тема 7', 6, true),
  ('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'Тема 8', 7, true)
on conflict (id) do nothing;
