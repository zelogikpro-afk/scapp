-- Migration: étendre la table leads pour les nouveaux champs et statuts

-- 1. Supprimer l'ancienne contrainte de statut
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- 2. Ajouter les nouvelles colonnes
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS program_interest text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_level text check (interest_level in ('low','medium','high'));

-- 3. Recréer la contrainte statut étendue
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN (
    'new', 'to_contact', 'contacted', 'no_answer',
    'callback', 'interested', 'appointment',
    'pending_payment', 'registered', 'not_interested'
  ));
