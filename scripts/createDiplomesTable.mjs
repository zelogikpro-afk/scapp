import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'

const sql = `
CREATE TABLE IF NOT EXISTS diplomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_number integer,
  participant_name text NOT NULL,
  level text NOT NULL,
  session_label text,
  session_date date,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diplomes_cert ON diplomes(cert_number);
CREATE INDEX IF NOT EXISTS idx_diplomes_participant ON diplomes(participant_id);
ALTER TABLE diplomes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='diplomes' AND policyname='Allow all authenticated') THEN
    EXECUTE 'CREATE POLICY "Allow all authenticated" ON diplomes FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='diplomes' AND policyname='Service role all') THEN
    EXECUTE 'CREATE POLICY "Service role all" ON diplomes FOR ALL TO service_role USING (true)';
  END IF;
END $$;
`

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sql }),
})

if (res.ok) {
  console.log('✅ Table créée via RPC')
} else {
  const err = await res.text()
  console.log('RPC non disponible:', err.slice(0, 200))
  console.log('\nEssai via pg directement...')

  // Try via management API
  const mgmtRes = await fetch(
    `https://api.supabase.com/v1/projects/twcqvpgpzayjxiwzzesb/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  )
  if (mgmtRes.ok) {
    console.log('✅ Table créée via management API')
  } else {
    const mgmtErr = await mgmtRes.text()
    console.log('Management API:', mgmtErr.slice(0, 200))
  }
}
