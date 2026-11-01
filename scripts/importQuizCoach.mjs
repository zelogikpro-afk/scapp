import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// Letter → answer index
const LETTER_MAP = { a: 0, b: 1, c: 2, d: 3 }

function parseCSVLine(line) {
  const result = []
  let current = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += ch }
  }
  result.push(current)
  return result
}

function getLevel(pct) {
  if (pct >= 90) return 'Excellent'
  if (pct >= 75) return 'Validé'
  return 'Non validé'
}

const monthMap = {
  'janv': '01', 'févr': '02', 'mars': '03', 'avr': '04',
  'mai': '05', 'juin': '06', 'juil': '07', 'août': '08',
  'sept': '09', 'oct': '10', 'nov': '11', 'déc': '12',
}
function parseDate(raw) {
  const m = raw.match(/(\w+)\.?\s+(\d+),\s+(\d{4})/)
  if (!m) return null
  const mo = monthMap[m[1].toLowerCase()] || '01'
  return `${m[3]}-${mo}-${m[2].padStart(2, '0')}T00:00:00Z`
}

function splitName(nom) {
  const parts = nom.trim().split(/\s+/)
  // Format in CSV seems to be "Last First" based on the data
  // Try to detect: if first word is all-caps it's likely the last name
  if (parts.length === 1) return { first_name: parts[0], last_name: '' }
  // Return first word as last_name, rest as first_name (most CSV entries seem "LAST First")
  // But we'll store both possibilities and match
  return { first_name: parts.slice(1).join(' '), last_name: parts[0] }
}

// Fetch participants
const { data: participants } = await supabase.from('participants').select('id, first_name, last_name')
console.log(`Fetched ${participants?.length || 0} participants`)

function findParticipant(first, last) {
  if (!participants) return null
  const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim()
  const full1 = norm(`${first} ${last}`)
  const full2 = norm(`${last} ${first}`)
  return participants.find(p => {
    const pf = norm(`${p.first_name} ${p.last_name}`)
    const pr = norm(`${p.last_name} ${p.first_name}`)
    return pf === full1 || pf === full2 || pr === full1 || pr === full2
  }) || null
}

const csv = readFileSync('C:/Users/Zineb Eddaqaqi/Downloads/Quiz_Formation_coach_de_vie_et_2026-06-21_10_25_03.csv', 'utf-8')
const lines = csv.split('\n').filter(l => l.trim())
const dataLines = lines.slice(1) // skip header
console.log(`Found ${dataLines.length} submissions`)

const toInsert = []
for (const line of dataLines) {
  if (!line.trim()) continue
  const cols = parseCSVLine(line)

  const dateRaw  = cols[0] || ''
  const nom      = cols[1] || ''
  const scoreRaw = cols[cols.length - 1]  // last column = Score
  const scoreNum = parseInt(scoreRaw) || 0
  // Questions are cols[2] through cols[cols.length - 2]
  const answerCols = cols.slice(2, cols.length - 1)
  const totalQ = answerCols.length // should be 39

  // Build answers object: key = question id (1-based), value = index (0-3)
  const answers = {}
  for (let i = 0; i < answerCols.length; i++) {
    const raw = answerCols[i].trim()
    const letter = raw[0]?.toLowerCase()
    const idx = LETTER_MAP[letter]
    if (idx !== undefined) answers[i + 1] = idx
  }

  const pct = Math.round((scoreNum / totalQ) * 100)
  const { first_name, last_name } = splitName(nom)
  const participant = findParticipant(first_name, last_name)

  toInsert.push({
    test_type:        'quiz_coach',
    first_name,
    last_name,
    participant_id:   participant?.id || null,
    scores:           { correct: scoreNum, total: totalQ, percentage: pct },
    answers,
    dominant_profile: getLevel(pct),
    created_at:       parseDate(dateRaw),
  })
}

console.log(`\nPrepared ${toInsert.length} records`)
console.log('Sample:', JSON.stringify(toInsert[0], null, 2))

let inserted = 0
for (let i = 0; i < toInsert.length; i += 20) {
  const batch = toInsert.slice(i, i + 20)
  const { error } = await supabase.from('test_results').insert(batch)
  if (error) console.error(`Batch error:`, error.message)
  else { inserted += batch.length; console.log(`Inserted batch ${i}-${i + batch.length}`) }
}

console.log(`\nDone. Inserted: ${inserted}`)
const linked = toInsert.filter(r => r.participant_id).length
console.log(`Linked to participant: ${linked}/${toInsert.length}`)

const byLevel = {}
toInsert.forEach(r => { byLevel[r.dominant_profile] = (byLevel[r.dominant_profile] || 0) + 1 })
console.log('By level:', byLevel)

const scores = toInsert.map(r => r.scores.percentage)
console.log(`Score range: ${Math.min(...scores)}% – ${Math.max(...scores)}%`)
console.log(`Average: ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`)
