import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'

const sb = createClient(
  'https://twcqvpgpzayjxiwzzesb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'
)

function excelToDate(serial) {
  if (!serial || isNaN(serial)) return null
  return new Date((serial - 25569) * 86400 * 1000).toISOString().split('T')[0]
}

// ─── Load Excel ─────────────────────────────────────────────────────────────
const wb = XLSX.readFile('C:/Users/Zineb Eddaqaqi/Downloads/participants.xlsx')
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Feuil1'], { defval: '' })

// Cohort definitions (from Excel analysis)
// id → { level, programId, programName, startDate, endDate, startTime, endTime }
const COHORT_DEFS = {
  c6:  { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2024-09-14', endDate: '2024-10-12', startTime: '10:00', endTime: '18:00', schedule: 'Samedi' },
  c7:  { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2024-11-02', endDate: '2024-11-23', startTime: '10:00', endTime: '18:00', schedule: 'Samedi' },
  c8:  { level: 2, programId: 'tp2', programName: 'Master Coach Thérapeute', startDate: '2024-12-07', endDate: '2025-02-15', startTime: '10:00', endTime: '18:00', schedule: 'Samedi' },
  c9:  { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2025-05-24', endDate: '2025-06-21', startTime: '10:00', endTime: '17:00', schedule: 'Samedi' },
  c10: { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2025-09-06', endDate: '2025-10-12', startTime: '10:00', endTime: '17:00', schedule: 'Samedi' },
  c11: { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2025-10-12', endDate: '2025-11-02', startTime: '10:00', endTime: '16:00', schedule: 'Dimanche' },
  c12: { level: 2, programId: 'tp2', programName: 'Master Coach Thérapeute', startDate: '2025-11-09', endDate: '2026-01-04', startTime: '10:00', endTime: '17:00', schedule: 'Samedi' },
  c13: { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2025-11-15', endDate: '2025-12-13', startTime: '10:00', endTime: '17:00', schedule: 'Samedi' },
  c14: { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2025-12-20', endDate: '2026-01-18', startTime: '10:00', endTime: '17:00', schedule: 'Samedi' },
  c15: { level: 3, programId: 'tp3', programName: 'Master Coach Consultant', startDate: '2026-01-25', endDate: null, startTime: '10:00', endTime: '14:00', schedule: 'Samedi' },
  // c4: MCT N2 Dimanche 10h-14h Jan 25 2026 (already exists)
  // c5: CVD N1 Dimanche 14h30-18h30 Jan 25 2026 (already exists)
  c16: { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2026-03-28', endDate: '2026-05-23', startTime: '10:00', endTime: '14:00', schedule: 'Samedi' },
  c17: { level: 2, programId: 'tp2', programName: 'Master Coach Thérapeute', startDate: '2026-04-19', endDate: null, startTime: '10:00', endTime: '14:00', schedule: 'Dimanche' },
  c18: { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2026-04-19', endDate: null, startTime: '14:30', endTime: '18:30', schedule: 'Dimanche' },
  c19: { level: 3, programId: 'tp3', programName: 'Master Coach Consultant', startDate: '2026-05-16', endDate: null, startTime: '14:30', endTime: '18:30', schedule: 'Samedi' },
  c20: { level: 1, programId: 'tp1', programName: 'Coach de vie et Développement Personnel', startDate: '2026-06-13', endDate: null, startTime: '10:00', endTime: '14:00', schedule: 'Samedi' },
}

// Map each participant to their latest cohort and all their payment records
function getParticipantCohortAndPayments(row) {
  const n1Start = excelToDate(row['Date de la session'])
  const n2Start = excelToDate(row['Date de la session3'])
  const n3Start = excelToDate(row['Date de la session7'])
  const reste = Number(row['Reste a payer '] || 0)

  // Map start dates to cohort IDs
  const dateToCohort = {
    '2024-09-14': 'c6', '2024-11-02': 'c7', '2024-12-07': 'c8',
    '2025-05-24': 'c9', '2025-09-06': 'c10', '2025-10-12': 'c11',
    '2025-11-09': 'c12', '2025-11-15': 'c13', '2025-12-20': 'c14',
    '2026-01-24': null, // special: depends on schedule
    '2026-03-28': 'c16', '2026-04-19': null, // special: N1=c18, N2=c17
    '2026-05-16': 'c19', '2026-06-13': 'c20',
  }

  const getN1Cohort = (date, schedule) => {
    if (date === '2026-01-24') return schedule.includes('14h30') ? 'c5' : 'c5' // both CVD c5 (Jan 25 stored)
    if (date === '2026-04-19') return 'c18'
    return dateToCohort[date] || 'c6'
  }
  const getN2Cohort = (date) => {
    if (date === '2026-01-24') return 'c4' // MCT c4
    if (date === '2026-04-19') return 'c17'
    return dateToCohort[date] || 'c8'
  }
  const getN3Cohort = (date) => {
    if (date === '2026-01-24') return 'c15'
    return dateToCohort[date] || 'c19'
  }

  const hasN1 = !!row['Session']
  const hasN2 = !!row['Session2']
  const hasN3 = !!row['Session6']

  const n1CohortId = hasN1 ? getN1Cohort(n1Start, row['Horaire'] || '') : null
  const n2CohortId = hasN2 ? getN2Cohort(n2Start) : null
  const n3CohortId = hasN3 ? getN3Cohort(n3Start) : null

  // Latest cohort = highest level
  const latestCohort = n3CohortId || n2CohortId || n1CohortId

  // Build payments
  const payments = []
  const n1Amount = row['Montant payé']
  const n2Amount = row['Montant']
  const n3Amount = row['Montant ']

  if (hasN1 && n1Amount !== '') {
    const isOffert = n1Amount === 'OFFERTE'
    const paid = isOffert ? 0 : Number(n1Amount)
    let remaining = hasN2 || hasN3 ? 0 : reste
    const total = paid + remaining
    payments.push({
      session: 'Niveau 1',
      programName: 'Coach de vie et Développement Personnel',
      totalAmount: isOffert ? 0 : total,
      amountPaid: paid,
      remainingAmount: remaining,
      status: remaining > 0 ? 'partial' : 'paid',
      date: n1Start || '2024-09-01',
    })
  }

  if (hasN2 && n2Amount !== '') {
    const isOffert = n2Amount === 'OFFERTE'
    const total = isOffert ? 0 : Number(n2Amount)
    let remaining = hasN3 ? 0 : reste
    const paid = isOffert ? 0 : Math.max(0, total - remaining)
    payments.push({
      session: 'Niveau 2',
      programName: 'Master Coach Thérapeute',
      totalAmount: total,
      amountPaid: paid,
      remainingAmount: remaining,
      status: remaining > 0 ? 'partial' : 'paid',
      date: n2Start || n1Start || '2024-12-01',
    })
  }

  if (hasN3 && n3Amount !== '') {
    const isOffert = n3Amount === 'OFFERTE'
    const total = isOffert ? 0 : Number(n3Amount)
    const remaining = isOffert ? 0 : reste
    const paid = isOffert ? 0 : Math.max(0, total - remaining)
    payments.push({
      session: 'Niveau 3',
      programName: 'Master Coach Consultant',
      totalAmount: total,
      amountPaid: paid,
      remainingAmount: remaining,
      status: remaining > 0 ? 'partial' : 'paid',
      date: n3Start || n2Start || n1Start || '2026-01-25',
    })
  }

  return { latestCohort, payments }
}

// Parse name into first/last
function parseName(fullName) {
  const parts = fullName.trim().split(/\s+/)
  // Convention: first word = first name, rest = last name
  // But some are ALL_CAPS for last name, mixed for first...
  // Just split: first token = firstName, rest = lastName
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

async function run() {
  console.log('=== Sync participants.xlsx → Supabase ===\n')

  // ─── Step 0: Add session column to payments if needed ────────────────────
  // Try to add column (will fail silently if exists)
  try {
    await sb.rpc('exec', { sql: 'ALTER TABLE payments ADD COLUMN IF NOT EXISTS session TEXT' })
  } catch {}
  // Also try direct approach - just let inserts handle it

  // ─── Step 1: Fetch existing participants ────────────────────────────────
  const { data: existing } = await sb.from('participants').select('id, first_name, last_name, email, phone')
  const existingMap = {} // normalized name → {id, ...}
  existing.forEach(p => {
    const key = (p.first_name + ' ' + p.last_name).toLowerCase().replace(/\s+/g, ' ').trim()
    existingMap[key] = p
  })
  console.log(`Found ${existing.length} existing participants in Supabase`)

  // ─── Step 2: Build Excel participant list ───────────────────────────────
  const excelParticipants = rows.map(row => {
    const fullName = row['Nom et prénom']
    const { firstName, lastName } = parseName(fullName)
    const email = (row['Email'] || '').trim().replace(/^\t/, '')
    const phone = String(row['N°téléphone'] || '').trim()
    const cin = String(row['CIN'] || '').trim()
    const { latestCohort, payments } = getParticipantCohortAndPayments(row)
    return { firstName, lastName, email, phone, cin, latestCohort, payments, fullName }
  })

  // Normalize for matching
  function normalize(s) { return s.toLowerCase().replace(/\s+/g, ' ').trim() }

  // ─── Step 3: Match Excel → Supabase IDs ────────────────────────────────
  const matched = [] // { excelP, supabaseId }
  const toCreate = []

  excelParticipants.forEach(ep => {
    // Try multiple name combinations
    const tries = [
      normalize(ep.firstName + ' ' + ep.lastName),
      normalize(ep.lastName + ' ' + ep.firstName),
    ]
    let found = null
    for (const key of tries) {
      if (existingMap[key]) { found = existingMap[key]; break }
    }
    // Fuzzy: try ignoring accents/case via partial match
    if (!found) {
      const normalFirst = normalize(ep.firstName)
      const normalLast = normalize(ep.lastName)
      for (const [key, val] of Object.entries(existingMap)) {
        const parts = key.split(' ')
        if (parts.some(p => p === normalFirst) && parts.some(p => p === normalLast)) {
          found = val; break
        }
      }
    }
    if (found) {
      matched.push({ excelP: ep, supabaseId: found.id })
    } else {
      toCreate.push(ep)
    }
  })

  console.log(`Matched: ${matched.length}, To create: ${toCreate.length}`)

  // ─── Step 4: Find participants to DELETE ────────────────────────────────
  const matchedIds = new Set(matched.map(m => m.supabaseId))
  const toDelete = existing.filter(p => !matchedIds.has(p.id))
  console.log(`To delete: ${toDelete.length}`)
  toDelete.forEach(p => console.log('  DELETE: ' + p.first_name + ' ' + p.last_name))

  // ─── Step 5: Delete participants not in Excel ───────────────────────────
  for (const p of toDelete) {
    const { error } = await sb.from('participants').delete().eq('id', p.id)
    if (error) console.log('  ✗ Delete error for ' + p.first_name + ': ' + error.message)
    else console.log('  ✓ Deleted: ' + p.first_name + ' ' + p.last_name)
  }

  // ─── Step 6: Update existing participants ──────────────────────────────
  for (const { excelP, supabaseId } of matched) {
    const updates = {
      promotion_id: excelP.latestCohort,
    }
    if (excelP.email) updates.email = excelP.email
    if (excelP.phone) updates.phone = excelP.phone
    if (excelP.cin) updates.cin = excelP.cin
    const { error } = await sb.from('participants').update(updates).eq('id', supabaseId)
    if (error) console.log('  ✗ Update error for ' + excelP.fullName + ': ' + error.message)
    else console.log('  ✓ Updated: ' + excelP.fullName + ' → cohort: ' + excelP.latestCohort)
  }

  // ─── Step 7: Create new participants ────────────────────────────────────
  const createdIds = {}
  for (const ep of toCreate) {
    const { data, error } = await sb.from('participants').insert({
      first_name: ep.firstName,
      last_name: ep.lastName,
      email: ep.email || null,
      phone: ep.phone || null,
      cin: ep.cin || null,
      type: 'training',
      gender: 'female',
      notes: '',
      tags: [],
      is_active: true,
      promotion_id: ep.latestCohort,
    }).select('id').single()
    if (error) console.log('  ✗ Create error for ' + ep.fullName + ': ' + error.message)
    else {
      createdIds[ep.fullName] = data.id
      console.log('  ✓ Created: ' + ep.fullName + ' → ' + data.id)
    }
  }

  // ─── Step 8: Delete old payments, then recreate ─────────────────────────
  // Build map of participantName → id for payment creation
  const nameToId = {}
  matched.forEach(({ excelP, supabaseId }) => { nameToId[excelP.fullName] = supabaseId })
  toCreate.forEach(ep => { if (createdIds[ep.fullName]) nameToId[ep.fullName] = createdIds[ep.fullName] })

  // Delete existing payments for these participants
  const allIds = Object.values(nameToId)
  if (allIds.length > 0) {
    const { error: delErr } = await sb.from('payments').delete().in('participant_id', allIds)
    if (delErr) console.log('  ✗ Delete payments error: ' + delErr.message)
    else console.log('\n  ✓ Cleared old payments for ' + allIds.length + ' participants')
  }

  // ─── Step 9: Create payments ─────────────────────────────────────────────
  let payCount = 0
  for (const ep of excelParticipants) {
    const participantId = nameToId[ep.fullName]
    if (!participantId) { console.log('  ✗ No ID found for ' + ep.fullName); continue }

    for (const pay of ep.payments) {
      const { error } = await sb.from('payments').insert({
        participant_id: participantId,
        participant_name: ep.firstName + ' ' + ep.lastName,
        program_type: 'training',
        program_name: pay.programName,
        notes: pay.session,
        total_amount: pay.totalAmount,
        amount_paid: pay.amountPaid,
        remaining_amount: pay.remainingAmount,
        status: pay.status,
        method: 'cash',
        date: pay.date,
      })
      if (error) console.log('  ✗ Payment error for ' + ep.fullName + ' ' + pay.session + ': ' + error.message)
      else payCount++
    }
  }
  console.log('\n  ✓ Created ' + payCount + ' payment records')

  console.log('\n=== Done ===')
}

run().catch(console.error)
