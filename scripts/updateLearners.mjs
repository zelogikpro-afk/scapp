import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SK = readFileSync('.env', 'utf8').match(/VITE_SUPABASE_SERVICE_KEY=(.+)/)[1].trim()
const sb = createClient('https://twcqvpgpzayjxiwzzesb.supabase.co', SK, { auth: { persistSession: false } })

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
}

function toUsername(fullName) {
  // "ZINEB MIHRAJ" → "z.mihraj"
  // "Houda El abkari" → "h.elabkari"
  // "NAOUAL CHERKAOUI" → "n.cherkaoui"
  const n = norm(fullName)
  const parts = n.split(' ').filter(Boolean)
  if (parts.length < 2) return norm(fullName).replace(/\s/g, '.')
  const firstName = parts[0]
  const lastName = parts.slice(1).join('') // join multi-part surnames without separator
  return `${firstName[0]}.${lastName}`
}

// Map program_id → level
const PROG_LEVEL = {
  'a997dec7-8989-40ba-a9d1-b4669702fe78': 'N1',
  '1782a369-0615-4b8c-920f-51772d554cb8': 'N2',
  'd11972ac-25bb-4db3-98c0-15960a835530': 'N3',
}

// Fetch all data
const [{ data: learners }, { data: participants }, { data: promotions }] = await Promise.all([
  sb.from('learner_accounts').select('*').order('created_at'),
  sb.from('participants').select('id,first_name,last_name,promotion_id,reference'),
  sb.from('promotions').select('id,program_id,name'),
])

console.log(`Learners: ${learners.length}, Participants: ${participants.length}, Promotions: ${promotions.length}\n`)

// Build promo lookup
const promoById = Object.fromEntries((promotions || []).map(p => [p.id, p]))

function findParticipant(name) {
  const n = norm(name)
  return participants.find(p => {
    const pf = norm(`${p.first_name} ${p.last_name}`)
    const pr = norm(`${p.last_name} ${p.first_name}`)
    return pf === n || pr === n ||
      (p.first_name && p.last_name &&
       n.includes(norm(p.first_name)) && n.includes(norm(p.last_name)))
  }) || null
}

// Track used usernames to avoid duplicates
const usedUsernames = new Set()

let updated = 0, skipped = 0

for (const learner of learners) {
  const participant = findParticipant(learner.participant_name)

  // Build new username
  let username = toUsername(learner.participant_name)
  // Handle duplicates
  if (usedUsernames.has(username)) {
    let i = 2
    while (usedUsernames.has(`${username}${i}`)) i++
    username = `${username}${i}`
  }
  usedUsernames.add(username)

  // Get promotion_id and formation_level from participant
  let promotionId = learner.promotion_id
  let formationLevel = learner.formation_level

  if (participant) {
    if (participant.promotion_id) {
      promotionId = participant.promotion_id
      const promo = promoById[promotionId]
      if (promo?.program_id) {
        formationLevel = PROG_LEVEL[promo.program_id] || formationLevel
      }
    }
  }

  const patch = {
    username,
    participant_id: participant?.id || learner.participant_id,
    promotion_id: promotionId,
    formation_level: formationLevel,
  }

  const { error } = await sb.from('learner_accounts').update(patch).eq('id', learner.id)
  if (error) {
    console.log(`  ❌ ${learner.participant_name}: ${error.message}`)
    skipped++
  } else {
    const promoName = promoById[promotionId]?.name || '—'
    console.log(`  ✅ ${learner.participant_name.padEnd(30)} → ${username.padEnd(20)} | ${formationLevel} | ${promoName}`)
    updated++
  }
}

console.log(`\n✅ ${updated} comptes mis à jour, ${skipped} erreurs`)
