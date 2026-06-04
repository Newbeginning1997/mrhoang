create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'student', 'parent');
create type public.document_category as enum ('resource', 'exam', 'quiz');
create type public.calendar_event_type as enum ('exam', 'holiday', 'homework', 'special');
create type public.badge_key as enum (
  'punctual_10',
  'tenure_3_months',
  'tenure_6_months',
  'tenure_1_year',
  'top_5',
  'improved_20',
  'top_score_week',
  'excellent_student'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text not null unique,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  class_name text not null,
  grade int not null check (grade in (6, 7, 8, 9)),
  enrollment_date date not null,
  avatar_initials text,
  created_at timestamptz not null default now()
);

create table public.parents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  grade int not null unique check (grade in (6, 7, 8, 9))
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  file_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  due_date timestamptz not null,
  file_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  content text,
  file_url text,
  submitted_at timestamptz not null default now(),
  score numeric(4, 2) check (score between 0 and 10),
  feedback text,
  unique (homework_id, student_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.document_category not null,
  file_url text not null,
  file_size bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  max_score numeric(5, 2) not null default 10,
  created_by uuid references public.profiles(id) on delete set null
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric(4, 2) not null check (score between 0 and 10),
  entered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (exam_id, student_id)
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  badge_key public.badge_key not null,
  awarded_at timestamptz not null default now(),
  unique (student_id, badge_key)
);

create table public.teacher_comments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  content text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  type public.calendar_event_type not null,
  created_by uuid references public.profiles(id) on delete set null
);

create table public.quiz (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  time_limit_seconds int not null default 600 check (time_limit_seconds > 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quiz(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index int not null check (correct_index >= 0)
);

create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quiz(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric(4, 2) not null check (score between 0 and 10),
  submitted_at timestamptz not null default now(),
  unique (quiz_id, student_id)
);

create index students_grade_idx on public.students(grade);
create index scores_student_idx on public.scores(student_id);
create index scores_exam_idx on public.scores(exam_id);
create index homework_submissions_student_idx on public.homework_submissions(student_id);
create index badges_student_idx on public.badges(student_id);
create index teacher_comments_student_idx on public.teacher_comments(student_id);

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.students where user_id = auth.uid()
$$;

create or replace function public.current_parent_grade()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select grade from public.parents where user_id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.parents enable row level security;
alter table public.announcements enable row level security;
alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.documents enable row level security;
alter table public.exams enable row level security;
alter table public.scores enable row level security;
alter table public.badges enable row level security;
alter table public.teacher_comments enable row level security;
alter table public.calendar_events enable row level security;
alter table public.quiz enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_results enable row level security;

create policy "profiles_select_scoped" on public.profiles
for select using (public.is_admin() or id = auth.uid());

create policy "profiles_admin_all" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

create policy "students_select_scoped" on public.students
for select using (
  public.is_admin()
  or user_id = auth.uid()
  or grade = public.current_parent_grade()
);

create policy "students_admin_all" on public.students
for all using (public.is_admin()) with check (public.is_admin());

create policy "parents_select_scoped" on public.parents
for select using (public.is_admin() or user_id = auth.uid());

create policy "parents_admin_all" on public.parents
for all using (public.is_admin()) with check (public.is_admin());

create policy "announcements_school_read" on public.announcements
for select using (public.current_role() in ('admin', 'student'));

create policy "announcements_admin_all" on public.announcements
for all using (public.is_admin()) with check (public.is_admin());

create policy "homework_school_read" on public.homework
for select using (public.current_role() in ('admin', 'student'));

create policy "homework_admin_all" on public.homework
for all using (public.is_admin()) with check (public.is_admin());

create policy "homework_submissions_scoped_read" on public.homework_submissions
for select using (
  public.is_admin()
  or student_id = public.current_student_id()
);

create policy "homework_submissions_student_insert" on public.homework_submissions
for insert with check (student_id = public.current_student_id());

create policy "homework_submissions_student_update" on public.homework_submissions
for update using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());

create policy "homework_submissions_admin_update" on public.homework_submissions
for update using (public.is_admin()) with check (public.is_admin());

create policy "documents_school_read" on public.documents
for select using (public.current_role() in ('admin', 'student'));

create policy "documents_admin_all" on public.documents
for all using (public.is_admin()) with check (public.is_admin());

create policy "exams_read_scoped" on public.exams
for select using (public.current_role() in ('admin', 'student', 'parent'));

create policy "exams_admin_all" on public.exams
for all using (public.is_admin()) with check (public.is_admin());

create policy "scores_read_scoped" on public.scores
for select using (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (
    select 1
    from public.students s
    where s.id = scores.student_id
      and s.grade = public.current_parent_grade()
  )
);

create policy "scores_admin_all" on public.scores
for all using (public.is_admin()) with check (public.is_admin());

create policy "badges_read_scoped" on public.badges
for select using (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (
    select 1
    from public.students s
    where s.id = badges.student_id
      and s.grade = public.current_parent_grade()
  )
);

create policy "badges_admin_all" on public.badges
for all using (public.is_admin()) with check (public.is_admin());

create policy "teacher_comments_read_scoped" on public.teacher_comments
for select using (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (
    select 1
    from public.students s
    where s.id = teacher_comments.student_id
      and s.grade = public.current_parent_grade()
  )
);

create policy "teacher_comments_admin_all" on public.teacher_comments
for all using (public.is_admin()) with check (public.is_admin());

create policy "calendar_events_read_scoped" on public.calendar_events
for select using (
  public.current_role() in ('admin', 'student')
  or (public.current_role() = 'parent' and type in ('exam', 'holiday', 'special'))
);

create policy "calendar_events_admin_all" on public.calendar_events
for all using (public.is_admin()) with check (public.is_admin());

create policy "quiz_school_read" on public.quiz
for select using (public.current_role() in ('admin', 'student'));

create policy "quiz_admin_all" on public.quiz
for all using (public.is_admin()) with check (public.is_admin());

create policy "quiz_questions_school_read" on public.quiz_questions
for select using (public.current_role() in ('admin', 'student'));

create policy "quiz_questions_admin_all" on public.quiz_questions
for all using (public.is_admin()) with check (public.is_admin());

create policy "quiz_results_read_scoped" on public.quiz_results
for select using (public.is_admin() or student_id = public.current_student_id());

create policy "quiz_results_student_insert" on public.quiz_results
for insert with check (student_id = public.current_student_id());

create policy "quiz_results_student_update" on public.quiz_results
for update using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('announcements', 'announcements', false, 10485760, array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp']),
  ('homework', 'homework', false, 10485760, array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp']),
  ('documents', 'documents', false, 10485760, array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp']),
  ('homework-submissions', 'homework-submissions', false, 10485760, array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "storage_school_read" on storage.objects
for select using (
  bucket_id in ('announcements', 'homework', 'documents', 'homework-submissions')
  and public.current_role() in ('admin', 'student')
);

create policy "storage_admin_insert" on storage.objects
for insert with check (
  bucket_id in ('announcements', 'homework', 'documents')
  and public.is_admin()
);

create policy "storage_student_submission_insert" on storage.objects
for insert with check (
  bucket_id = 'homework-submissions'
  and public.current_role() = 'student'
);
