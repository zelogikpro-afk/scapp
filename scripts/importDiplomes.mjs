import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const MONTH_MAP = {
  'janvier':1,'fevrier':2,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,
  'juillet':7,'août':8,'aout':8,'septembre':9,'octobre':10,'novembre':11,
  'decembre':12,'décembre':12
}
function parseDate(raw) {
  if (!raw) return null
  const m = raw.toLowerCase().match(/(\w+)\s+(\d{4})/)
  if (!m) return null
  const mo = String(MONTH_MAP[m[1]] || 1).padStart(2,'0')
  return `${m[2]}-${mo}-01`
}
function normalizeLevel(t) {
  if (!t) return 'Coach de Vie & Développement Personnel'
  if (/MASTER COACH|THERAPEUTE/i.test(t)) return 'Master Coach Thérapeute'
  if (/FORMATEURS/i.test(t)) return 'Formation des Formateurs'
  if (/COMMERCIALE/i.test(t)) return 'Commerciale & Autobranding'
  if (/PARENTAL/i.test(t)) return 'Coach Parental & Scolaire'
  return 'Coach de Vie & Développement Personnel'
}

// Lines to skip when looking for a name
function isNameLine(s) {
  if (!s || s.length < 2 || s.length > 60) return false
  // Exclude known non-name tokens
  if (/^(ICE:|CIN:|SESSION|Session|CERTIFICAT|SUCCESS|COMPASS|COACH|MASTER|FORMATION|COMMERCIALE|PARENTAL|THERAPEUTE|DÉVELOPPEMENT|DES FORMATEURS|LA FORMATION|Avec mention|Pour la|de participation|de réussite|Attestation|Certification|Certificat|Sofya|Master Trainer|Cachet|ACADEMY|&)/i.test(s)) return false
  if (/^[A-Z]$/.test(s)) return false // single uppercase letter
  if (/^\d/.test(s)) return false // starts with digit
  // Must look like a name: letters + spaces + hyphens + apostrophes
  const letters = s.replace(/[\s'\-\.]/g,'')
  if (letters.length < 2) return false
  if (/^[A-ZÀ-Ü][A-ZÀ-Üa-zà-ü\-\s'\.]+$/u.test(s)) return true
  return false
}

function findSession(lines, fromIdx, direction = 'both', maxDist = 25) {
  const sessionRe = /Session de formation\s+(?:de\s+)?(.+)/i
  const sessionRe2 = /Pour la session de formation\s+(?:de\s+)?(.+)/i

  // Search backwards
  if (direction === 'both' || direction === 'back') {
    for (let k = fromIdx - 1; k >= Math.max(0, fromIdx - maxDist); k--) {
      const sm = lines[k].match(sessionRe) || lines[k].match(sessionRe2)
      if (sm) return sm[1].trim()
      // "SESSION JANVIER\n2026" style
      const sm2 = lines[k].match(/^SESSION\s+(\w+)$/i)
      if (sm2 && k + 1 < lines.length && lines[k+1].match(/^\d{4}$/)) {
        return sm2[1] + ' ' + lines[k+1]
      }
    }
  }
  // Search forwards
  if (direction === 'both' || direction === 'forward') {
    for (let k = fromIdx + 1; k <= Math.min(lines.length - 1, fromIdx + maxDist); k++) {
      const sm = lines[k].match(sessionRe) || lines[k].match(sessionRe2)
      if (sm) return sm[1].trim()
    }
  }
  return ''
}

// Read text
const text = readFileSync('C:/Users/Zineb Eddaqaqi/Downloads/diplomes_text.txt', 'utf-8')
const lines = text.split('\n').map(l => l.trim()).filter(l => l)

const diplomes = []
const processed = new Set() // avoid duplicate cert numbers

for (let i = 0; i < lines.length; i++) {
  const certMatch = lines[i].match(/CERTIFICAT\s+N°(\d+)/i)
  if (!certMatch) continue

  const certNum = parseInt(certMatch[1])
  // Allow same cert number if different level (ZINEB MEROUAH N°371 appears twice)
  // Track by certNum + position to avoid re-processing same line
  if (processed.has(i)) continue
  processed.add(i)

  // Find name — scan backwards first, then forwards
  let name = ''
  for (let k = i - 1; k >= Math.max(0, i - 12); k--) {
    if (isNameLine(lines[k])) { name = lines[k].replace(/\s+/g,' ').trim(); break }
  }
  if (!name) {
    for (let k = i + 1; k <= Math.min(lines.length - 1, i + 8); k++) {
      if (isNameLine(lines[k])) { name = lines[k].replace(/\s+/g,' ').trim(); break }
    }
  }

  // Find level
  let level = ''
  for (let k = Math.max(0, i - 8); k <= Math.min(lines.length - 1, i + 8); k++) {
    if (/MASTER COACH|THERAPEUTE|FORMATION DES FORM|COMMERCIALE|COACH PARENTAL|COACH DE VIE/i.test(lines[k])) {
      level = lines[k]; break
    }
  }

  // Find session (search wider window)
  const session = findSession(lines, i)

  if (!name) {
    console.log(`  ⚠️  No name for N°${certNum} (line ${i}): context=[${lines.slice(Math.max(0,i-4),i+3).join(' | ')}]`)
    continue
  }

  diplomes.push({ certNum, name, level: normalizeLevel(level), session, sessionDate: parseDate(session) })
}

// Academy diplomas (no cert number)
const coveredLines = new Set()
diplomes.forEach(d => {}) // covered by cert lines search above
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/CERTIFICAT\s+N°/i)) {
    for (let k = Math.max(0,i-15); k <= Math.min(lines.length-1,i+12); k++) coveredLines.add(k)
  }
}
for (let i = 0; i < lines.length; i++) {
  if (coveredLines.has(i)) continue
  if (/^COACH DE VIE\s*$/.test(lines[i])) {
    let name = ''
    for (let k = i - 1; k >= Math.max(0, i - 10); k--) {
      if (isNameLine(lines[k])) { name = lines[k].replace(/\s+/g,' ').trim(); break }
    }
    if (name) {
      const session = findSession(lines, i)
      diplomes.push({ certNum: null, name, level: 'Coach de Vie & Développement Personnel', session, sessionDate: parseDate(session) })
    }
  }
}

// Sort by cert number
diplomes.sort((a, b) => (a.certNum || 9999) - (b.certNum || 9999))

console.log(`\n✅ Parsed ${diplomes.length} diplomas\n`)
diplomes.forEach(d => {
  const cert = d.certNum ? `N°${d.certNum}` : 'N°-'
  console.log(`  ${cert.padEnd(6)} | ${d.name.padEnd(35)} | ${d.level.padEnd(40)} | ${d.session}`)
})

// ─── FETCH PARTICIPANTS ───────────────────────────────────────────────────────

const { data: participants } = await supabase.from('participants').select('id, first_name, last_name')
console.log(`\nFetched ${participants?.length || 0} participants`)

function norm(s) {
  return (s||'').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/\s+/g,' ').trim()
}
function findParticipant(fullName) {
  if (!participants) return null
  const n = norm(fullName)
  return participants.find(p => {
    const pf = norm(`${p.first_name} ${p.last_name}`)
    const pr = norm(`${p.last_name} ${p.first_name}`)
    return pf === n || pr === n ||
      (p.first_name && p.last_name &&
       n.includes(norm(p.first_name)) && n.includes(norm(p.last_name)))
  }) || null
}

// ─── INSERT ───────────────────────────────────────────────────────────────────

const toInsert = diplomes.map(d => {
  const p = findParticipant(d.name)
  return {
    cert_number: d.certNum,
    participant_name: d.name,
    level: d.level,
    session_label: d.session || null,
    session_date: d.sessionDate || null,
    participant_id: p?.id || null,
  }
})

// Clear then insert
await supabase.from('diplomes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

let inserted = 0
for (let i = 0; i < toInsert.length; i += 20) {
  const batch = toInsert.slice(i, i + 20)
  const { error } = await supabase.from('diplomes').insert(batch)
  if (error) {
    if (error.code === '42P01' || error.message?.includes('diplomes')) {
      console.log('\n❌ Table "diplomes" n\'existe pas. Exécute ce SQL dans Supabase:\n')
      console.log(`CREATE TABLE diplomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_number integer,
  participant_name text NOT NULL,
  level text NOT NULL,
  session_label text,
  session_date date,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_diplomes_cert ON diplomes(cert_number);
CREATE INDEX idx_diplomes_participant ON diplomes(participant_id);
ALTER TABLE diplomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON diplomes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role all" ON diplomes FOR ALL TO service_role USING (true);`)
      process.exit(1)
    }
    console.error(`Batch error:`, error.message)
  } else {
    inserted += batch.length
    process.stdout.write(`Inserted ${inserted}/${toInsert.length}\r`)
  }
}

const linked = toInsert.filter(r => r.participant_id).length
console.log(`\n✅ Inserted: ${inserted}/${diplomes.length}`)
console.log(`🔗 Linked to participants: ${linked}/${diplomes.length}`)

const byLevel = {}
diplomes.forEach(d => { byLevel[d.level] = (byLevel[d.level]||0)+1 })
console.log('\nNiveaux:')
Object.entries(byLevel).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${v}x ${k}`))
