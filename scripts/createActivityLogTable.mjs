const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'

const sql = `
ALTER TABLE learner_accounts ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE learner_accounts ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS learner_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES learner_accounts(id) ON DELETE CASCADE,
  action text NOT NULL,
  page text,
  details text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_learner ON learner_activity_log(learner_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON learner_activity_log(created_at DESC);
ALTER TABLE learner_activity_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='learner_activity_log' AND policyname='Allow all authenticated') THEN
    EXECUTE 'CREATE POLICY "Allow all authenticated" ON learner_activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='learner_activity_log' AND policyname='Service role all') THEN
    EXECUTE 'CREATE POLICY "Service role all" ON learner_activity_log FOR ALL TO service_role USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='learner_activity_log' AND policyname='Anon all') THEN
    EXECUTE 'CREATE POLICY "Anon all" ON learner_activity_log FOR ALL TO anon USING (true) WITH CHECK (true)';
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
  console.log('✅ Table learner_activity_log créée + colonnes last_login/login_count ajoutées')
} else {
  const err = await res.text()
  console.log('Erreur RPC:', err.slice(0, 500))
}
