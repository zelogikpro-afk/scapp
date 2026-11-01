import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// CSV column layout (0-indexed):
// 0: date, 1: name
// 2-4: Q1-Q3  (Liberté)
// 5-7: Q4-Q6  (Famille)
// 8-9: Q7-Q8  (Santé 1/2)
// 10: Liberté score (skip), 11: Famille score (skip)
// 12: Q9      (Santé 3/3)
// 13-15: Q10-Q12 (Succès)
// 16-18: Q13-Q15 (Amour)
// 19-21: Q16-Q18 (Connaissance)
// 22-24: Q19-Q21 (Contribution)
// 25-27: Q22-Q24 (Créativité)
// 28-30: Q25-Q27 (Spiritualité)
// 31-33: Q28-Q30 (Indépendance financière)
// 34-36: Q31-Q33 (Reconnaissance)
// 37-39: Q34-Q36 (Équilibre)
// 40-42: Q37-Q39 (Respect)
// 43-45: Q40-Q42 (Aventure)
// 46-47: Q43-Q44 (Sécurité – Q45 missing from JotForm)

// Map col index → question id (skip cols 10, 11)
const COL_TO_QID = {
  2:1, 3:2, 4:3,
  5:4, 6:5, 7:6,
  8:7, 9:8,
  12:9,
  13:10, 14:11, 15:12,
  16:13, 17:14, 18:15,
  19:16, 20:17, 21:18,
  22:19, 23:20, 24:21,
  25:22, 26:23, 27:24,
  28:25, 29:26, 30:27,
  31:28, 32:29, 33:30,
  34:31, 35:32, 36:33,
  37:34, 38:35, 39:36,
  40:37, 41:38, 42:39,
  43:40, 44:41, 45:42,
  46:43, 47:44,
}

const VALEUR_QUESTIONS = {
  liberte:                [1,2,3],
  famille:                [4,5,6],
  sante:                  [7,8,9],
  succes:                 [10,11,12],
  amour:                  [13,14,15],
  connaissance:           [16,17,18],
  contribution:           [19,20,21],
  creativite:             [22,23,24],
  spiritualite:           [25,26,27],
  independance_financiere:[28,29,30],
  reconnaissance:         [31,32,33],
  equilibre:              [34,35,36],
  respect:                [37,38,39],
  aventure:               [40,41,42],
  securite:               [43,44],   // Q45 missing
}

function parseScore(raw) {
  if (!raw || typeof raw !== 'string') return 0
  const t = raw.trim()
  // "4 : Important", "5 : Très important", etc.
  const m = t.match(/^(\d)/)
  if (m) return parseInt(m[1])
  // "Moyennement" → 3
  if (t.toLowerCase().includes('moyen')) return 3
  // Pure number already ("15", "9")
  const n = parseInt(t)
  return isNaN(n) ? 0 : n
}

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
  if (parts.length === 1) return { first_name: parts[0], last_name: '' }
  return { first_name: parts.slice(1).join(' '), last_name: parts[0] }
}

// Fetch participants for linking
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

const csv = readFileSync('C:/Users/Zineb Eddaqaqi/Downloads/Test_des_Valeurs2026-06-23_07_03_06.csv', 'utf-8')
const lines = csv.split('\n').filter(l => l.trim())
const dataLines = lines.slice(1)
console.log(`Found ${dataLines.length} submissions`)

const toInsert = []
const seen = new Set() // deduplicate (Aicha Agnaou appears twice)

for (const line of dataLines) {
  if (!line.trim()) continue
  const cols = parseCSVLine(line)

  const dateRaw = cols[0] || ''
  const nom     = cols[1] || ''
  const key = `${nom}|${dateRaw}`
  if (seen.has(key)) { console.log(`  Skipping duplicate: ${nom}`) ; continue }
  seen.add(key)

  // Build answers dict (qid → numeric score 1-5)
  const answers = {}
  for (const [colIdx, qid] of Object.entries(COL_TO_QID)) {
    const val = parseScore(cols[Number(colIdx)])
    if (val > 0) answers[qid] = val
  }

  // Compute valeur scores
  const scores = {}
  let dominantKey = 'liberte'
  let dominantScore = 0
  for (const [key, qids] of Object.entries(VALEUR_QUESTIONS)) {
    const s = qids.reduce((sum, qid) => sum + (answers[qid] || 0), 0)
    scores[key] = s
    if (s > dominantScore) { dominantScore = s; dominantKey = key }
  }

  const { first_name, last_name } = splitName(nom)
  const participant = findParticipant(first_name, last_name)

  toInsert.push({
    test_type:        'valeurs',
    first_name,
    last_name,
    participant_id:   participant?.id || null,
    scores,
    answers,
    dominant_profile: dominantKey,
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
  else { inserted += batch.length; console.log(`Inserted batch ${i}–${i + batch.length}`) }
}

console.log(`\nDone. Inserted: ${inserted}`)
const linked = toInsert.filter(r => r.participant_id).length
console.log(`Linked to participant: ${linked}/${toInsert.length}`)

// Top dominant values
const byDom = {}
toInsert.forEach(r => { byDom[r.dominant_profile] = (byDom[r.dominant_profile] || 0) + 1 })
console.log('Dominant values:', byDom)
