import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const pdfPath = 'C:/Users/Zineb Eddaqaqi/Downloads/TESTS/TEST MAPPING_Le Marcheur des Tempêtes (Le Résilient Transformateur).pdf'
const buffer = readFileSync(pdfPath)

const { data, error } = await supabase.storage
  .from('test-profiles')
  .upload('marcheur.pdf', buffer, { contentType: 'application/pdf', upsert: true })

if (error) {
  console.error('Error:', error.message)
} else {
  console.log('Uploaded:', data)
}
