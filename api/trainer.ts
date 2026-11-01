import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PROG_LEVEL: Record<string, string> = {
  'a997dec7-8989-40ba-a9d1-b4669702fe78': 'N1',
  '1782a369-0615-4b8c-920f-51772d554cb8': 'N2',
  'd11972ac-25bb-4db3-98c0-15960a835530': 'N3',
}

async function verifySession(trainerId: string, token: string): Promise<boolean> {
  if (!trainerId || !token) return false
  const { data } = await db.from('trainer_accounts')
    .select('id').eq('id', trainerId).eq('session_token', token).single()
  return !!data
}

// ─── Handlers ──────────────────────────────────────────────────

async function handleLogin({ username, password }: any) {
  const { data } = await db.from('trainer_accounts')
    .select('*').eq('username', username).eq('is_active', true).single()
  if (!data || data.password !== password) throw new Error('Identifiant ou mot de passe incorrect')
  const token = randomUUID()
  await db.from('trainer_accounts').update({ session_token: token }).eq('id', data.id)
  return { id: data.id, username: data.username, name: data.name, promotionIds: data.promotion_ids || [], sessionToken: token }
}

async function handleGetDashboard(trainer: any) {
  const promotionIds: string[] = trainer.promotion_ids || []
  const [{ data: learners }, { data: promos }, { data: testResults }, { data: docs }, { data: annonces }] = await Promise.all([
    db.from('learner_accounts').select('id,is_active').in('promotion_id', promotionIds.length ? promotionIds : ['']),
    db.from('promotions').select('id,name,program_id').in('id', promotionIds.length ? promotionIds : ['']),
    db.from('test_results').select('id,learner_id,test_type,created_at').in('learner_id',
      promotionIds.length
        ? (await db.from('learner_accounts').select('id').in('promotion_id', promotionIds)).data?.map((l: any) => l.id) || []
        : []
    ).order('created_at', { ascending: false }).limit(5),
    db.from('elearning_docs').select('id').eq('is_published', true),
    db.from('announcements').select('id,content,target,created_at').in('promotion_id', promotionIds.length ? promotionIds : ['']).order('created_at', { ascending: false }).limit(3),
  ])

  const total = learners?.length || 0
  const actifs = learners?.filter((l: any) => l.is_active).length || 0
  const promoMap: Record<string, string> = {}
  for (const p of promos || []) promoMap[p.id] = p.name

  return {
    stats: { total, actifs, inactifs: total - actifs, tests: testResults?.length || 0, docs: docs?.length || 0 },
    recentTests: testResults || [],
    recentAnnonces: annonces || [],
    promoMap,
  }
}

async function handleGetLearners(trainer: any) {
  const promotionIds: string[] = trainer.promotion_ids || []
  if (!promotionIds.length) return { learners: [], promoMap: {} }
  const [{ data: learners }, { data: promos }] = await Promise.all([
    db.from('learner_accounts').select('id,participant_id,participant_name,username,promotion_id,formation_level,is_active').in('promotion_id', promotionIds).order('participant_name'),
    db.from('promotions').select('id,name,program_id').in('id', promotionIds),
  ])
  const promoMap: Record<string, { name: string; level: string }> = {}
  for (const p of promos || []) { const level = PROG_LEVEL[p.program_id] || '?'; promoMap[p.id] = { name: p.name, level } }
  return { learners: learners || [], promoMap }
}

async function handleGetTestUnlocks(trainer: any) {
  const promotionIds: string[] = trainer.promotion_ids || []
  if (!promotionIds.length) return { unlocks: [] }
  const { data: learners } = await db.from('learner_accounts').select('id').in('promotion_id', promotionIds)
  const learnerIds = (learners || []).map((l: any) => l.id)
  if (!learnerIds.length) return { unlocks: [] }
  const { data } = await db.from('test_unlocks').select('*').in('learner_id', learnerIds)
  return { unlocks: data || [] }
}

async function handleToggleTestUnlock(trainer: any, { learnerId, testType }: any) {
  // Verify learner belongs to trainer's promotions
  const promotionIds: string[] = trainer.promotion_ids || []
  const { data: learner } = await db.from('learner_accounts').select('id').eq('id', learnerId).in('promotion_id', promotionIds).single()
  if (!learner) throw new Error('Apprenant non autorisé')

  const { data: existing } = await db.from('test_unlocks').select('id').eq('learner_id', learnerId).eq('test_type', testType).single()
  if (existing) {
    await db.from('test_unlocks').delete().eq('id', existing.id)
    return { unlocked: false }
  } else {
    await db.from('test_unlocks').insert({ learner_id: learnerId, test_type: testType })
    return { unlocked: true }
  }
}

async function handleToggleLearner({ learnerId, isActive }: any) {
  await db.from('learner_accounts').update({ is_active: isActive }).eq('id', learnerId)
  return { ok: true }
}

async function handleGetTests(trainer: any) {
  const promotionIds: string[] = trainer.promotion_ids || []
  if (!promotionIds.length) return { results: [], learners: [] }
  const { data: learners } = await db.from('learner_accounts').select('id,participant_id,participant_name,promotion_id').in('promotion_id', promotionIds)
  if (!(learners || []).length) return { results: [], learners: [] }

  const tagged: any[] = []
  const seen = new Set<string>()

  // 1. Search by participant_id for learners that have one
  const pidMap: Record<string, string> = {}
  for (const l of learners || []) if (l.participant_id) pidMap[l.participant_id] = l.id
  const participantIds = Object.keys(pidMap)
  if (participantIds.length) {
    const { data } = await db.from('test_results').select('*').in('participant_id', participantIds).order('created_at', { ascending: false })
    for (const r of data || []) {
      tagged.push({ ...r, _learner_id: pidMap[r.participant_id] || null })
      seen.add(r.id)
    }
  }

  // 2. Search by name for ALL learners (catches tests saved without participant_id)
  for (const l of learners || []) {
    const parts = (l.participant_name || '').trim().split(/\s+/).filter(Boolean)
    if (parts.length < 2) continue
    const [first, last] = [parts[0], parts[parts.length - 1]]
    const [{ data: r1 }, { data: r2 }] = await Promise.all([
      db.from('test_results').select('*').ilike('first_name', `%${first}%`).ilike('last_name', `%${last}%`),
      db.from('test_results').select('*').ilike('first_name', `%${last}%`).ilike('last_name', `%${first}%`),
    ])
    for (const r of [...(r1 || []), ...(r2 || [])]) {
      if (!seen.has(r.id)) { tagged.push({ ...r, _learner_id: l.id }); seen.add(r.id) }
    }
  }

  return { results: tagged, learners: learners || [] }
}

async function handleGetRecordings(trainer: any) {
  const promotionIds: string[] = trainer.promotion_ids || []
  if (!promotionIds.length) return { recordings: [], promotions: [] }
  const [recRes, promoRes] = await Promise.all([
    db.from('recordings').select('*').in('promotion_id', promotionIds).order('order_index'),
    db.from('promotions').select('id,name,program_id,start_date').in('id', promotionIds).order('start_date'),
  ])
  return { recordings: recRes.data || [], promotions: promoRes.data || [] }
}

async function getLevelsForPromotions(promotionIds: string[]): Promise<string[]> {
  if (!promotionIds.length) return []
  const { data } = await db.from('promotions').select('program_id').in('id', promotionIds)
  const levels: string[] = []
  for (const p of data || []) {
    const level = PROG_LEVEL[p.program_id]
    if (level && !levels.includes(level)) levels.push(level)
  }
  return levels
}

async function handleGetDocuments(trainer: any) {
  const promotionIds: string[] = trainer.promotion_ids || []
  const levels = await getLevelsForPromotions(promotionIds)
  if (!levels.length) return []

  const [docsRes, cfgResult] = await Promise.all([
    db.from('elearning_docs').select('*').in('level', levels).eq('is_visible', true).order('order_index'),
    db.storage.from('elearning').download('config/doc_visibility.json').catch(() => ({ data: null })),
  ])
  let config: Record<string, { excluded_promotion_ids: string[]; excluded_learner_ids: string[] }> = {}
  try { if ((cfgResult as any)?.data) config = JSON.parse(await ((cfgResult as any).data as Blob).text()) } catch { /* */ }

  return (docsRes.data || []).map((d: any) => ({
    ...d,
    excluded_promotion_ids: config[d.id]?.excluded_promotion_ids || [],
    excluded_learner_ids:   config[d.id]?.excluded_learner_ids   || [],
  }))
}

async function handleSetDocVisibility({ docId, excludedPromotionIds, excludedLearnerIds }: any) {
  let config: Record<string, any> = {}
  try { const { data } = await db.storage.from('elearning').download('config/doc_visibility.json'); if (data) config = JSON.parse(await (data as Blob).text()) || {} } catch { /* */ }
  if (!excludedPromotionIds?.length && !excludedLearnerIds?.length) { delete config[docId] }
  else { config[docId] = { excluded_promotion_ids: excludedPromotionIds || [], excluded_learner_ids: excludedLearnerIds || [] } }
  const blob = Buffer.from(JSON.stringify(config), 'utf8')
  await db.storage.from('elearning').upload('config/doc_visibility.json', blob, { contentType: 'application/json', upsert: true })
  return { ok: true }
}

async function handleGetAnnonces(trainer: any) {
  const promotionIds: string[] = trainer.promotion_ids || []
  if (!promotionIds.length) return { annonces: [], learners: [] }
  const [{ data: annonces }, { data: learners }] = await Promise.all([
    db.from('announcements').select('*').in('promotion_id', promotionIds).order('created_at', { ascending: false }),
    db.from('learner_accounts').select('id,participant_name,promotion_id').in('promotion_id', promotionIds).order('participant_name'),
  ])
  return { annonces: annonces || [], learners: learners || [] }
}

async function handleSendAnnonce(trainer: any, { content, type, promotionId, learnerId }: any) {
  const promoId = promotionId || (trainer.promotion_ids || [])[0]
  const { data } = await db.from('announcements').insert({
    promotion_id: promoId,
    learner_id: learnerId || null,
    target: learnerId ? 'individual' : 'session',
    type: type || 'info',
    content,
  }).select().single()
  return data
}

async function handleDeleteAnnonce({ annonceId }: any) {
  await db.from('announcements').delete().eq('id', annonceId)
  return { ok: true }
}

async function handleChangePassword(trainerId: string, { oldPassword, newPassword }: any) {
  const { data } = await db.from('trainer_accounts').select('password').eq('id', trainerId).single()
  if (!data || data.password !== oldPassword) throw new Error('Mot de passe actuel incorrect')
  await db.from('trainer_accounts').update({ password: newPassword }).eq('id', trainerId)
  return { ok: true }
}

// ─── Main handler ───────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, payload, trainerId, sessionToken } = req.body || {}

  try {
    if (action === 'login') return res.json(await handleLogin(payload))

    if (!await verifySession(trainerId, sessionToken)) return res.status(401).json({ error: 'Session invalide' })

    const { data: trainerRow } = await db.from('trainer_accounts').select('id,name,username,promotion_ids').eq('id', trainerId).single()
    if (!trainerRow) return res.status(401).json({ error: 'Formateur introuvable' })

    let data: any
    switch (action) {
      case 'get_dashboard':        data = await handleGetDashboard(trainerRow); break
      case 'get_learners':         data = await handleGetLearners(trainerRow); break
      case 'toggle_learner':       data = await handleToggleLearner(payload); break
      case 'get_tests':            data = await handleGetTests(trainerRow); break
      case 'get_test_unlocks':    data = await handleGetTestUnlocks(trainerRow); break
      case 'toggle_test_unlock':  data = await handleToggleTestUnlock(trainerRow, payload); break
      case 'get_recordings':       data = await handleGetRecordings(trainerRow); break
      case 'get_documents':        data = await handleGetDocuments(trainerRow); break
      case 'set_doc_visibility':   data = await handleSetDocVisibility(payload); break
      case 'get_annonces':         data = await handleGetAnnonces(trainerRow); break
      case 'send_annonce':         data = await handleSendAnnonce(trainerRow, payload); break
      case 'delete_annonce':       data = await handleDeleteAnnonce(payload); break
      case 'change_password':      data = await handleChangePassword(trainerId, payload); break
      default: return res.status(400).json({ error: `Unknown action: ${action}` })
    }
    return res.json({ data })
  } catch (e: any) {
    console.error('[trainer]', e)
    return res.status(500).json({ error: e.message || 'Erreur serveur' })
  }
}
