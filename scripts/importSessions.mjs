import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { createClient } from '@supabase/supabase-js'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const SK = readFileSync('.env', 'utf8').match(/VITE_SUPABASE_SERVICE_KEY=(.+)/)[1].trim()
const sb = createClient('https://twcqvpgpzayjxiwzzesb.supabase.co', SK, { auth: { persistSession: false } })

const PROG = {
  'Niveau 1': { id: 'a997dec7-8989-40ba-a9d1-b4669702fe78', name: 'Coach de vie et Développement Personnel', short: 'N1' },
  'Niveau 2': { id: '1782a369-0615-4b8c-920f-51772d554cb8', name: 'Master Coach Thérapeute', short: 'N2' },
  'Niveau 3': { id: 'd11972ac-25bb-4db3-98c0-15960a835530', name: 'Master Coach Consultant', short: 'N3' },
}

const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

function xlDate(n) {
  if (!n || typeof n !== 'number') return null
  return new Date((n - 25569) * 86400000)
}
function toISO(n) {
  const d = xlDate(n)
  return d ? d.toISOString().split('T')[0] : null
}
function monthYear(n) {
  const d = xlDate(n)
  if (!d) return ''
  return MONTHS_FR[d.getMonth()] + ' ' + d.getFullYear()
}
function isEnCours(val) {
  return typeof val === 'string' && val.toLowerCase().includes('cours')
}

// ─── READ EXCEL ────────────────────────────────────────────────────────────────
const wb = XLSX.readFile('C:/Users/Zineb Eddaqaqi/Downloads/participants.xlsx')
const ws = wb.Sheets['Feuil1']
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }).slice(1).filter(r => r[0])

// ─── BUILD SESSION KEYS ────────────────────────────────────────────────────────
// key = "Niveau X|startDateNum"
const sessionMap = new Map() // key → { level, startDate, endDate, schedule, status }

rows.forEach(row => {
  const slots = [
    [row[4], row[5], row[6], row[7]],
    [row[9], row[10], row[11], row[12]],
    [row[14], row[15], row[16], row[17]],
  ]
  slots.forEach(([lv, start, sched, end]) => {
    if (!lv || !start) return
    const key = `${lv}|${start}`
    if (!sessionMap.has(key)) {
      const ongoing = isEnCours(end)
      const today = new Date()
      const endDate = !ongoing && end && typeof end === 'number' ? new Date((end - 25569) * 86400000) : null
      const status = ongoing || !endDate || endDate > today ? 'active' : 'completed'
      sessionMap.set(key, { level: lv, startNum: start, startDate: toISO(start), endDate: ongoing ? null : toISO(end), schedule: sched || '', status })
    }
  })
})

// Sort by start date
const sessions = [...sessionMap.values()].sort((a, b) => a.startNum - b.startNum)

console.log(`\n📋 ${sessions.length} sessions trouvées:\n`)
sessions.forEach((s, i) => {
  console.log(`  ${i+1}. ${s.level} | ${s.startDate} → ${s.endDate || 'En cours'} | ${s.schedule} | ${s.status}`)
})

// ─── UPSERT PROMOTIONS ─────────────────────────────────────────────────────────
// Clear existing then insert fresh
await sb.from('promotions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
console.log('\n🗑️  Anciennes promotions supprimées')

const promoInserts = sessions.map(s => {
  const prog = PROG[s.level]
  const label = `${prog.short} — ${monthYear(s.startNum)}`
  return {
    program_id: prog.id,
    program_name: prog.name,
    name: label,
    start_date: s.startDate,
    end_date: s.endDate,
    location: 'Casablanca',
    trainer_name: 'Sofya EL QOUASSI',
    status: s.status,
    capacity: 30,
  }
})

const { data: inserted, error: insErr } = await sb.from('promotions').insert(promoInserts).select('id,name,start_date,program_id')
if (insErr) { console.error('Erreur insert promotions:', insErr.message); process.exit(1) }

// Build reverse map: key → promo UUID
const keyToPromoId = new Map()
inserted.forEach((promo, i) => {
  keyToPromoId.set(`${sessions[i].level}|${sessions[i].startNum}`, promo.id)
})

console.log(`\n✅ ${inserted.length} promotions créées`)
inserted.forEach(p => console.log(`  ${p.name} → ${p.id}`))

// ─── FETCH PARTICIPANTS ────────────────────────────────────────────────────────
const { data: participants } = await sb.from('participants').select('id,first_name,last_name')

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim()
}
function findParticipant(fullName) {
  const n = norm(fullName)
  return participants.find(p => {
    const pf = norm(`${p.first_name} ${p.last_name}`)
    const pr = norm(`${p.last_name} ${p.first_name}`)
    return pf === n || pr === n ||
      (p.first_name && p.last_name && n.includes(norm(p.first_name)) && n.includes(norm(p.last_name)))
  }) || null
}

// ─── LINK PARTICIPANTS ────────────────────────────────────────────────────────
console.log(`\n🔗 Liaison participants…\n`)
let linked = 0, notFound = 0

for (const row of rows) {
  const fullName = (row[0] || '').trim()
  const p = findParticipant(fullName)
  if (!p) { console.log(`  ⚠️  Non trouvé: ${fullName}`); notFound++; continue }

  const slots = [
    [row[4], row[5]], [row[9], row[10]], [row[14], row[15]]
  ]
  const promoIds = slots
    .filter(([lv, start]) => lv && start)
    .map(([lv, start]) => keyToPromoId.get(`${lv}|${start}`))
    .filter(Boolean)

  if (promoIds.length === 0) continue

  const reference = promoIds.join(',')
  const promotionId = promoIds[promoIds.length - 1] // dernière session = active

  const { error } = await sb.from('participants').update({ reference, promotion_id: promotionId }).eq('id', p.id)
  if (error) console.error(`  ❌ ${fullName}:`, error.message)
  else { linked++; console.log(`  ✅ ${fullName} → ${promoIds.length} session(s)`) }
}

console.log(`\n✅ ${linked} participants liés, ${notFound} non trouvés`)
