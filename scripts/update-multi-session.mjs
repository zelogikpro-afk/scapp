import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://twcqvpgpzayjxiwzzesb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'
)

// Cohort data: id -> { programId, startDate, endDate }
const COHORTS = {
  c4:  { programId: 'tp2', startDate: '2026-01-25', endDate: '2026-04-12' },
  c5:  { programId: 'tp1', startDate: '2026-01-25', endDate: '2026-04-05' },
  c6:  { programId: 'tp1', startDate: '2024-09-14', endDate: '2024-10-12' },
  c7:  { programId: 'tp1', startDate: '2024-11-02', endDate: '2024-11-23' },
  c8:  { programId: 'tp2', startDate: '2024-12-07', endDate: '2025-02-15' },
  c9:  { programId: 'tp1', startDate: '2025-05-24', endDate: '2025-06-21' },
  c10: { programId: 'tp1', startDate: '2025-09-06', endDate: '2025-10-12' },
  c11: { programId: 'tp1', startDate: '2025-10-12', endDate: '2025-11-02' },
  c12: { programId: 'tp2', startDate: '2025-11-09', endDate: '2026-01-04' },
  c13: { programId: 'tp1', startDate: '2025-11-15', endDate: '2025-12-13' },
  c14: { programId: 'tp1', startDate: '2025-12-20', endDate: '2026-01-18' },
  c15: { programId: 'tp3', startDate: '2026-01-25', endDate: '2026-04-05' },
  c16: { programId: 'tp1', startDate: '2026-03-28', endDate: '2026-05-23' },
  c17: { programId: 'tp2', startDate: '2026-04-19', endDate: '2026-07-06' },
  c18: { programId: 'tp1', startDate: '2026-04-19', endDate: '2026-07-06' },
  c19: { programId: 'tp3', startDate: '2026-05-16', endDate: '2026-08-15' },
  c20: { programId: 'tp1', startDate: '2026-06-13', endDate: '2026-09-06' },
}

// Multi-session participants: name patterns -> all cohort IDs (sorted by start date)
const MULTI_SESSION_MAP = [
  { patterns: ['bouchra ramdani'], cohorts: ['c6', 'c8', 'c15'] },
  { patterns: ['mounia dinia'], cohorts: ['c6', 'c8'] },
  { patterns: ['wafae akel'], cohorts: ['c6', 'c8'] },
  { patterns: ['zineb merouah'], cohorts: ['c6', 'c8'] },
  { patterns: ['aroua el khattab', 'aroa el khattab'], cohorts: ['c7', 'c8'] },
  { patterns: ['zineb mihraj'], cohorts: ['c7', 'c8', 'c15'] },
  { patterns: ['nadia tazi'], cohorts: ['c9', 'c12', 'c19'] },
  { patterns: ['meryem charmig', 'meryem charmit'], cohorts: ['c9', 'c12'] },
  { patterns: ['fatima ezzahra el khalfi', 'fatima-ezzahra el khalfi'], cohorts: ['c10', 'c4'] },
  { patterns: ['jawhara el mdaoui'], cohorts: ['c10', 'c12', 'c15'] },
  { patterns: ['hind fiher'], cohorts: ['c10', 'c12', 'c15'] },
  { patterns: ['maria sadik'], cohorts: ['c10', 'c12'] },
  { patterns: ['zakaria lamech'], cohorts: ['c11', 'c19'] },
  { patterns: ['houda el abkari'], cohorts: ['c13', 'c17'] },
  { patterns: ['abderrahim moutana'], cohorts: ['c13', 'c4'] },
  { patterns: ['naoual cherkaoui'], cohorts: ['c13', 'c4', 'c19'] },
  { patterns: ['abdelhadi ballaoui'], cohorts: ['c13', 'c4', 'c19'] },
  { patterns: ['khalid bargach'], cohorts: ['c14', 'c4', 'c19'] },
  { patterns: ['oumaima el bouchtaoui'], cohorts: ['c14', 'c4', 'c19'] },
  { patterns: ['naoual hourri'], cohorts: ['c14', 'c4', 'c19'] },
  { patterns: ['widad terrafi'], cohorts: ['c14', 'c4'] },
  { patterns: ['aicha agnaou'], cohorts: ['c14', 'c4'] },
  { patterns: ['amal abdou'], cohorts: ['c14', 'c4'] },
  { patterns: ['khadija talbi'], cohorts: ['c14', 'c4', 'c19'] },
  { patterns: ['intissar lahsaini'], cohorts: ['c14', 'c4', 'c19'] },
  { patterns: ['meryam aator', 'meryem aator'], cohorts: ['c14', 'c4', 'c19'] },
  { patterns: ['hind kamil'], cohorts: ['c5', 'c17'] },
  { patterns: ['bouchra oumhamed'], cohorts: ['c5', 'c17'] },
  { patterns: ['jessica rodrigues', 'jessica pavao'], cohorts: ['c5', 'c17'] },
  { patterns: ['oumaima tatlalou'], cohorts: ['c5', 'c17'] },
  { patterns: ['nora raji'], cohorts: ['c5', 'c17'] },
  { patterns: ['najat haidouri'], cohorts: ['c5', 'c17'] },
]

function normalizeName(name) {
  return name.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
}

function findMultiEntry(firstName, lastName) {
  const full = normalizeName(`${firstName} ${lastName}`)
  const fullReverse = normalizeName(`${lastName} ${firstName}`)
  for (const entry of MULTI_SESSION_MAP) {
    for (const p of entry.patterns) {
      if (full.includes(p) || fullReverse.includes(p) || p.includes(full) || p.includes(fullReverse)) {
        return entry
      }
    }
  }
  return null
}

async function main() {
  console.log('Fetching participants...')
  const { data: participants, error: pErr } = await supabase
    .from('participants')
    .select('id, first_name, last_name, promotion_id, reference, created_at')
  if (pErr) { console.error(pErr); process.exit(1) }
  console.log(`Found ${participants.length} participants`)

  console.log('\nFetching payments...')
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('id, participant_id, notes, date')
  if (payErr) { console.error(payErr); process.exit(1) }
  console.log(`Found ${payments.length} payments`)

  // Build participant -> cohort list
  let participantUpdates = 0
  let paymentUpdates = 0

  for (const p of participants) {
    const multiEntry = findMultiEntry(p.first_name, p.last_name)

    let allCohorts
    if (multiEntry) {
      allCohorts = multiEntry.cohorts
    } else {
      // Single cohort: use promotion_id
      allCohorts = p.promotion_id ? [p.promotion_id] : []
    }

    if (allCohorts.length === 0) continue

    // Sort cohorts by start date
    allCohorts.sort((a, b) => COHORTS[a]?.startDate?.localeCompare(COHORTS[b]?.startDate || '') || 0)

    const firstCohort = COHORTS[allCohorts[0]]
    const reference = allCohorts.join(',')
    const createdAt = firstCohort ? `${firstCohort.startDate}T00:00:00Z` : p.created_at

    // Update participant
    const { error: upErr } = await supabase
      .from('participants')
      .update({ reference, created_at: createdAt })
      .eq('id', p.id)

    if (upErr) {
      console.error(`Error updating ${p.first_name} ${p.last_name}:`, upErr.message)
    } else {
      participantUpdates++
      if (multiEntry) {
        console.log(`✓ ${p.first_name} ${p.last_name}: ${reference} | created: ${firstCohort?.startDate}`)
      }
    }

    // Update payments for this participant
    const participantPayments = payments.filter(pay => pay.participant_id === p.id)

    for (const pay of participantPayments) {
      const notes = (pay.notes || '').toLowerCase()
      let level = null
      if (notes.includes('niveau 1')) level = 'tp1'
      else if (notes.includes('niveau 2')) level = 'tp2'
      else if (notes.includes('niveau 3')) level = 'tp3'

      if (!level) continue

      // Find the cohort for this level
      const matchingCohort = allCohorts.find(cId => COHORTS[cId]?.programId === level)
      if (!matchingCohort) continue

      const cohortData = COHORTS[matchingCohort]
      const newDate = cohortData.endDate

      if (newDate === pay.date) continue

      const { error: payUpErr } = await supabase
        .from('payments')
        .update({ date: newDate })
        .eq('id', pay.id)

      if (payUpErr) {
        console.error(`Error updating payment ${pay.id}:`, payUpErr.message)
      } else {
        paymentUpdates++
      }
    }
  }

  console.log(`\n✅ Done: ${participantUpdates} participants updated, ${paymentUpdates} payments updated`)
}

main()
