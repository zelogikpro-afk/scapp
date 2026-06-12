-- ============================================================
-- SUCCESS COMPASS — Schéma base de données complet
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── PROFILES (étend auth.users) ──────────────────────────────
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  role text not null default 'sales_agent' check (role in ('super_admin','admin','sales_agent','coach')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─── LEADS ────────────────────────────────────────────────────
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  whatsapp text,
  email text,
  facebook_name text,
  instagram text,
  source text not null default 'Meta Ads',
  campaign text,
  ad_set text,
  status text not null default 'new' check (status in ('new','interested','callback','not_interested','no_answer','registered')),
  assigned_to uuid references profiles(id),
  next_follow_up_date date,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lead_notes (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade,
  content text not null,
  author_id uuid references profiles(id),
  author_name text not null,
  created_at timestamptz default now()
);

create table if not exists follow_ups (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade,
  type text not null check (type in ('call','whatsapp','email','meeting')),
  outcome text not null,
  notes text,
  date timestamptz default now(),
  author_id uuid references profiles(id),
  author_name text not null,
  created_at timestamptz default now()
);

-- ─── PARTICIPANTS ──────────────────────────────────────────────
create table if not exists participants (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id),
  first_name text not null,
  last_name text not null,
  email text,
  phone text not null,
  whatsapp text,
  gender text check (gender in ('male','female')),
  birth_date date,
  cin text,
  address text,
  profession text,
  company text,
  emergency_contact text,
  type text not null default 'coaching' check (type in ('coaching','training','both')),
  avatar_url text,
  notes text default '',
  tags text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── COACHING PACKS ───────────────────────────────────────────
create table if not exists coaching_packs (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references participants(id) on delete cascade,
  name text not null,
  total_sessions integer not null default 6,
  used_sessions integer not null default 0,
  price numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  purchase_date date not null default current_date,
  expiration_date date,
  status text not null default 'active' check (status in ('active','completed','expired','paused')),
  coach_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- ─── COACHING SESSIONS ────────────────────────────────────────
create table if not exists coaching_sessions (
  id uuid primary key default uuid_generate_v4(),
  pack_id uuid references coaching_packs(id) on delete cascade,
  participant_id uuid references participants(id),
  coach_id uuid references profiles(id),
  date date not null,
  time text not null,
  duration integer not null default 60,
  session_number integer not null default 1,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','rescheduled','missed')),
  summary text,
  objectives text,
  homework text,
  private_notes text,
  meet_link text,
  zoom_link text,
  created_at timestamptz default now()
);

-- ─── TRAINING PROGRAMS ────────────────────────────────────────
create table if not exists training_programs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  level text,
  duration_days integer default 30,
  price numeric(10,2) not null default 0,
  max_capacity integer default 20,
  is_active boolean default true,
  color text default '#3b82f6',
  created_at timestamptz default now()
);

create table if not exists cohorts (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references training_programs(id),
  program_name text not null,
  start_date date not null,
  end_date date not null,
  trainer_id uuid references profiles(id),
  trainer_name text not null,
  location text not null,
  capacity integer not null default 20,
  enrollment_count integer not null default 0,
  status text not null default 'upcoming' check (status in ('upcoming','active','completed','cancelled')),
  created_at timestamptz default now()
);

create table if not exists training_enrollments (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references participants(id),
  cohort_id uuid references cohorts(id),
  enrollment_date date default current_date,
  attendance_percent integer default 0,
  status text not null default 'enrolled' check (status in ('enrolled','completed','dropped','certified')),
  certificate_issued boolean default false,
  certificate_date date,
  certificate_number text,
  amount_paid numeric(10,2) default 0,
  total_amount numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- ─── PAYMENTS ─────────────────────────────────────────────────
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references participants(id),
  participant_name text not null,
  program_type text not null check (program_type in ('coaching','training')),
  program_name text not null,
  total_amount numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  remaining_amount numeric(10,2) generated always as (total_amount - amount_paid) stored,
  status text not null default 'pending' check (status in ('paid','pending','partial','overdue','cancelled')),
  method text not null default 'cash' check (method in ('cash','bank_transfer','card','cheque','virement')),
  reference text,
  date date not null default current_date,
  due_date date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists installments (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid references payments(id) on delete cascade,
  amount numeric(10,2) not null,
  date date not null,
  method text not null,
  reference text,
  status text not null default 'pending' check (status in ('paid','pending')),
  created_at timestamptz default now()
);

-- ─── APPOINTMENTS ─────────────────────────────────────────────
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  participant_id uuid references participants(id),
  participant_name text,
  coach_id uuid references profiles(id),
  coach_name text not null,
  program_type text check (program_type in ('coaching','training')),
  date date not null,
  start_time text not null,
  end_time text not null,
  location text,
  meet_link text,
  zoom_link text,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','rescheduled')),
  reminder_sent boolean default false,
  color text default '#3b82f6',
  created_at timestamptz default now()
);

-- ─── PSYCHOMETRIC TESTS ───────────────────────────────────────
create table if not exists psychometric_tests (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references participants(id),
  type text not null check (type in ('DISC','MBTI','Enneagram','Life Wheel','Values','Ikigai','Strengths','LifeBook')),
  date date not null,
  result text,
  score text,
  interpretation text,
  coach_notes text,
  pdf_url text,
  administered_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ─── DOCUMENTS ────────────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references participants(id),
  name text not null,
  type text not null default 'other',
  size_bytes bigint,
  storage_path text not null,
  uploaded_by uuid references profiles(id),
  tags text[] default '{}',
  version integer default 1,
  created_at timestamptz default now()
);

-- ─── TASKS ────────────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  assigned_to uuid references profiles(id),
  assigned_to_name text not null,
  created_by uuid references profiles(id),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'todo' check (status in ('todo','in_progress','done','cancelled')),
  due_date date,
  related_to uuid,
  related_type text check (related_type in ('lead','participant','payment')),
  is_recurring boolean default false,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- ─── ACTIVITY LOGS ────────────────────────────────────────────
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  user_name text not null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details text,
  created_at timestamptz default now()
);

-- ============================================================
-- TRIGGERS — updated_at automatique
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at before update on leads
  for each row execute function update_updated_at();

create trigger participants_updated_at before update on participants
  for each row execute function update_updated_at();

create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER — créer profil automatiquement après signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'sales_agent')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table profiles enable row level security;
alter table leads enable row level security;
alter table lead_notes enable row level security;
alter table follow_ups enable row level security;
alter table participants enable row level security;
alter table coaching_packs enable row level security;
alter table coaching_sessions enable row level security;
alter table training_programs enable row level security;
alter table cohorts enable row level security;
alter table training_enrollments enable row level security;
alter table payments enable row level security;
alter table installments enable row level security;
alter table appointments enable row level security;
alter table psychometric_tests enable row level security;
alter table documents enable row level security;
alter table tasks enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;

-- Politique générale : utilisateurs authentifiés voient tout
-- (on affinera avec les rôles si besoin)
create policy "Authenticated users can read all" on profiles for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read leads" on leads for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read lead_notes" on lead_notes for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read follow_ups" on follow_ups for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read participants" on participants for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read coaching_packs" on coaching_packs for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read coaching_sessions" on coaching_sessions for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read training_programs" on training_programs for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read cohorts" on cohorts for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read training_enrollments" on training_enrollments for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read payments" on payments for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read installments" on installments for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read appointments" on appointments for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read psychometric_tests" on psychometric_tests for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read documents" on documents for all using (auth.role() = 'authenticated');
create policy "Authenticated users can read tasks" on tasks for all using (auth.role() = 'authenticated');
create policy "Users can read own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);
create policy "Authenticated users can read activity_logs" on activity_logs for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert activity_logs" on activity_logs for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- INDEXES pour performance
-- ============================================================
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_assigned_to_idx on leads(assigned_to);
create index if not exists leads_created_at_idx on leads(created_at desc);
create index if not exists participants_type_idx on participants(type);
create index if not exists payments_status_idx on payments(status);
create index if not exists payments_participant_idx on payments(participant_id);
create index if not exists coaching_sessions_date_idx on coaching_sessions(date);
create index if not exists appointments_date_idx on appointments(date);
create index if not exists notifications_user_idx on notifications(user_id, is_read);
create index if not exists activity_logs_created_idx on activity_logs(created_at desc);
