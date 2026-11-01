-- ============================================================
-- SECURITY: Enable Row-Level Security on all tables
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable RLS
ALTER TABLE IF EXISTS profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lead_notes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS participants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS installments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coaching_packs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coaching_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS psychometric_tests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_programs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diplomes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prospect_inscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS digital_tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS digital_posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchases                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS test_results              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS test_unlocks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learner_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learner_activity_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learner_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learner_notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learner_commitments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learner_objectives        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learner_assignments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignment_submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS session_schedule          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS session_ratings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recordings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS elearning_docs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS elearning_modules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS elearning_lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_progress           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learner_payment_declarations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Allow authenticated admin users (Supabase Auth) to do everything
-- ============================================================

DO $$ DECLARE t text; BEGIN
  FOR t IN VALUES
    ('profiles'), ('leads'), ('lead_notes'), ('participants'), ('payments'),
    ('installments'), ('appointments'), ('tasks'), ('notifications'),
    ('coaching_packs'), ('app_settings'), ('coaching_sessions'),
    ('psychometric_tests'), ('training_programs'), ('promotions'),
    ('diplomes'), ('prospect_inscriptions'), ('digital_tasks'),
    ('digital_posts'), ('purchases'), ('test_results'), ('test_unlocks'),
    ('learner_accounts'), ('learner_activity_log'), ('learner_messages'),
    ('learner_notes'), ('learner_commitments'), ('learner_objectives'),
    ('learner_assignments'), ('assignment_submissions'), ('session_schedule'),
    ('session_ratings'), ('recordings'), ('elearning_docs'),
    ('elearning_modules'), ('elearning_lessons'), ('lesson_progress'),
    ('announcements'), ('learner_payment_declarations')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS admin_full ON %I;
       CREATE POLICY admin_full ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- Add session_token column to learner_accounts (for API auth)
-- ============================================================
ALTER TABLE learner_accounts ADD COLUMN IF NOT EXISTS session_token text;

-- ============================================================
-- Anon role: blocked on all tables (no policy = no access)
-- Service role: bypasses RLS always (used server-side only)
-- ============================================================
