import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Names are in "LastName(s) FirstName" format — last word = first_name, rest = last_name
const results = [
  { nom: "Bargach Khalid", score: 38 },
  { nom: "Oumaima El Bouchtaoui", score: 37 },
  { nom: "Cherkaoui Naoual", score: 37 },
  { nom: "Aator Meryam", score: 38 },
  { nom: "EL KHALFI fatima ezzahra", score: 38 },
  { nom: "Ballaoui Abdelhadi", score: 38 },
  { nom: "ABDOU Amal", score: 38 },
  { nom: "AGNAOU AIcha", score: 38 },
  { nom: "Terrafi Widad", score: 38 },
  { nom: "Talbi Khadija", score: 38 },
  { nom: "Hourri Naoual", score: 38 },
  { nom: "Lahsaini Intissar", score: 38 },
  { nom: "eddaqaqi zineb", score: 40 },
  { nom: "El Mdaoui Jawhara", score: 37 },
  { nom: "Sadik Maria", score: 37 },
  { nom: "Nadia TAZI", score: 36 },
  { nom: "Fiher Hind", score: 38 },
  { nom: "Merouah Zineb", score: 38 },
  { nom: "Mihraj Zineb", score: 38 },
  { nom: "EL KHATTAB Aroua", score: 38 },
  { nom: "WAFAE AKEL", score: 36 },
  { nom: "DINIA Mounia", score: 37 },
  { nom: "RAMDANI Bouchra", score: 38 },
]

async function run() {
  let inserted = 0
  let skipped = 0

  for (const entry of results) {
    const parts = entry.nom.trim().split(/\s+/)
    const first_name = parts[parts.length - 1]
    const last_name = parts.slice(0, parts.length - 1).join(' ')

    // Check for duplicate
    const { data: existing } = await supabase
      .from('test_results')
      .select('id')
      .eq('test_type', 'quiz_coach_n2')
      .ilike('first_name', first_name)
      .ilike('last_name', last_name)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`  SKIP (already exists): ${first_name} ${last_name}`)
      skipped++
      continue
    }

    const pct = Math.round((entry.score / 40) * 100)
    const dominant = pct >= 90 ? 'Excellent' : pct >= 75 ? 'Validé' : 'Non validé'

    const { error } = await supabase.from('test_results').insert({
      test_type: 'quiz_coach_n2',
      first_name,
      last_name,
      scores: { correct: entry.score, total: 40, percentage: pct },
      dominant_profile: dominant,
      answers: {},
      created_at: '2026-01-15T10:00:00Z',
    })

    if (error) {
      console.error(`  ERROR for ${first_name} ${last_name}:`, error.message)
    } else {
      console.log(`  OK: ${first_name} ${last_name} — ${entry.score}/40 (${pct}%) — ${dominant}`)
      inserted++
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`)
}

run()
