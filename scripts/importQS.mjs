import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
})

// Convert JotForm answer to score
function toScore(val) {
  if (!val) return 0
  const v = val.trim()
  if (v.startsWith('A.')) return 3
  if (v.startsWith('B.')) return 2
  if (v.startsWith('C.')) return 1
  return 0
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

// Split "Firstname Lastname" — first token = first_name, rest = last_name
function splitName(nom) {
  if (!nom) return { first_name: '', last_name: '' }
  const parts = nom.trim().split(/\s+/)
  const first_name = parts[0] || ''
  const last_name = parts.slice(1).join(' ') || ''
  return { first_name, last_name }
}

const csv = readFileSync('C:/Users/Zineb Eddaqaqi/Downloads/Test_QS2026-06-21_09_04_23.csv', 'utf-8')
const lines = csv.split('\n').filter(l => l.trim())
// Skip header (line 0)
const dataLines = lines.slice(1)

console.log(`Found ${dataLines.length} submissions`)

// Fetch existing participants to try to match
const { data: participants } = await supabase.from('participants').select('id, first_name, last_name, email')
console.log(`Fetched ${participants?.length || 0} participants`)

function findParticipant(first, last) {
  if (!participants) return null
  const fullName = `${first} ${last}`.toLowerCase().replace(/\s+/g, ' ').trim()
  // Try exact match first
  let match = participants.find(p => {
    const pFull = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().replace(/\s+/g, ' ').trim()
    return pFull === fullName
  })
  if (!match) {
    // Try reversed (some participants have last/first inverted)
    const reversed = `${last} ${first}`.toLowerCase().replace(/\s+/g, ' ').trim()
    match = participants.find(p => {
      const pFull = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().replace(/\s+/g, ' ').trim()
      return pFull === reversed
    })
  }
  return match || null
}

const toInsert = []

for (const line of dataLines) {
  if (!line.trim()) continue
  const cols = parseCSVLine(line)

  // cols[0] = date, cols[1] = Nom
  // cols[2..10] = Q1-Q9
  // cols[11] = Calcul (skip)
  // cols[12..32] = Q10-Q30

  const dateRaw = cols[0] || ''
  const nom = cols[1] || ''

  // Build answers Record<number, number>
  const answers = {}
  // Q1-Q9: indices 2-10
  for (let q = 1; q <= 9; q++) {
    answers[q] = toScore(cols[q + 1])
  }
  // Q10-Q30: indices 12-32
  for (let q = 10; q <= 30; q++) {
    answers[q] = toScore(cols[q + 2]) // offset +2: q10 is col 12
  }

  const { first_name, last_name } = splitName(nom)
  const participant = findParticipant(first_name, last_name)

  // Parse date — format like "juin 19, 2026" or "déc. 12, 2025"
  const monthMap = {
    'janv': '01', 'févr': '02', 'mars': '03', 'avr': '04',
    'mai': '05', 'juin': '06', 'juil': '07', 'août': '08',
    'sept': '09', 'oct': '10', 'nov': '11', 'déc': '12',
  }
  let submittedAt = null
  const dm = dateRaw.match(/(\w+)\.?\s+(\d+),\s+(\d{4})/)
  if (dm) {
    const mo = monthMap[dm[1].toLowerCase()] || '01'
    submittedAt = `${dm[3]}-${mo}-${dm[2].padStart(2, '0')}T00:00:00Z`
  }

  toInsert.push({
    test_type: 'qs',
    first_name,
    last_name,
    participant_id: participant?.id || null,
    answers,
    dominant_profile: null,
    created_at: submittedAt,
  })
}

console.log(`\nPrepared ${toInsert.length} records to insert`)
console.log('Sample:', JSON.stringify(toInsert[0], null, 2))

// Insert in batches of 20
let inserted = 0
let errors = 0
for (let i = 0; i < toInsert.length; i += 20) {
  const batch = toInsert.slice(i, i + 20)
  const { error } = await supabase.from('test_results').insert(batch)
  if (error) {
    console.error(`Batch ${i}-${i+20} error:`, error.message)
    errors++
  } else {
    inserted += batch.length
    console.log(`Inserted batch ${i}-${i+batch.length}`)
  }
}

console.log(`\nDone. Inserted: ${inserted}, Errors: ${errors}`)

// Show how many were linked to learners
const linked = toInsert.filter(r => r.participant_id).length
console.log(`Linked to participant: ${linked}/${toInsert.length}`)
if (linked > 0) {
  const linkedNames = toInsert.filter(r => r.participant_id).map(r => `${r.first_name} ${r.last_name}`)
  console.log('Matched:', linkedNames)
}
