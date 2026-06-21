import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// Col 6-12 → profile key mapping
const COL_TO_PROFILE = {
  6: 'orange',
  7: 'violet',
  8: 'magenta',
  9: 'sable',
  10: 'indigo',
  11: 'peche',
  12: 'jade',
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

function splitName(nom) {
  const parts = (nom || '').trim().split(/\s+/)
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' }
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

const csv = readFileSync('C:/Users/Zineb Eddaqaqi/Downloads/Test_Compass2026-06-21_09_59_21.csv', 'utf-8')
const lines = csv.split('\n').filter(l => l.trim())
const dataLines = lines.slice(1)
console.log(`Found ${dataLines.length} submissions`)

// Fetch participants for linking
const { data: participants } = await supabase.from('participants').select('id, first_name, last_name')
console.log(`Fetched ${participants?.length || 0} participants`)

function findParticipant(first, last) {
  if (!participants) return null
  const full = `${first} ${last}`.toLowerCase().replace(/\s+/g, ' ').trim()
  return participants.find(p => {
    const pf = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().replace(/\s+/g, ' ').trim()
    return pf === full || `${p.last_name || ''} ${p.first_name || ''}`.toLowerCase().replace(/\s+/g, ' ').trim() === full
  }) || null
}

const toInsert = []
for (const line of dataLines) {
  if (!line.trim()) continue
  const cols = parseCSVLine(line)

  const dateRaw    = cols[0] || ''
  const nom        = cols[1] || ''
  const orangeScore = parseInt(cols[4]) || 0
  const violetScore = parseInt(cols[5]) || 0

  // Determine dominant profile from PDF link columns (6-12)
  let dominant = null
  for (const [col, key] of Object.entries(COL_TO_PROFILE)) {
    if (cols[parseInt(col)] && cols[parseInt(col)].trim()) {
      dominant = key
      break
    }
  }
  // Fallback: highest of orange vs violet
  if (!dominant) dominant = orangeScore >= violetScore ? 'orange' : 'violet'

  const { first_name, last_name } = splitName(nom)
  const participant = findParticipant(first_name, last_name)

  toInsert.push({
    test_type: 'compass',
    first_name,
    last_name,
    participant_id: participant?.id || null,
    scores: { orange: orangeScore, violet: violetScore },
    answers: {},
    dominant_profile: dominant,
    created_at: parseDate(dateRaw),
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

const byProfile = {}
toInsert.forEach(r => { byProfile[r.dominant_profile] = (byProfile[r.dominant_profile] || 0) + 1 })
console.log('By profile:', byProfile)
