import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
})

const CREATE_DIGITAL_TASKS = `
CREATE TABLE IF NOT EXISTS digital_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  platform text,
  deadline date,
  status text default 'todo',
  priority text default 'normal',
  notes text,
  created_at timestamptz default now()
);
`

const CREATE_DIGITAL_POSTS = `
CREATE TABLE IF NOT EXISTS digital_posts (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references digital_tasks(id) on delete set null,
  platform text not null,
  subject text not null,
  generated_captions jsonb,
  chosen_caption text,
  chosen_hashtags text,
  canva_url text,
  status text default 'draft',
  admin_comment text,
  created_at timestamptz default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);
`

async function main() {
  console.log('Checking if digital_tasks table exists...')
  const { error: e1 } = await sb.from('digital_tasks').select('id').limit(1)

  if (e1?.code === '42P01') {
    console.log('Table digital_tasks does not exist.')
    console.log('\nRun this SQL in Supabase SQL Editor (https://supabase.com/dashboard/project/twcqvpgpzayjxiwzzesb/sql/new):\n')
    console.log(CREATE_DIGITAL_TASKS)
    console.log(CREATE_DIGITAL_POSTS)
  } else if (e1) {
    console.log('Error checking digital_tasks:', e1.message)
    console.log('\nRun this SQL in Supabase SQL Editor:\n')
    console.log(CREATE_DIGITAL_TASKS)
    console.log(CREATE_DIGITAL_POSTS)
  } else {
    console.log('digital_tasks table already exists.')
  }

  console.log('\nChecking if digital_posts table exists...')
  const { error: e2 } = await sb.from('digital_posts').select('id').limit(1)

  if (e2?.code === '42P01') {
    console.log('Table digital_posts does not exist.')
  } else if (e2) {
    console.log('Error checking digital_posts:', e2.message)
  } else {
    console.log('digital_posts table already exists.')
  }
}

main().catch(console.error)
