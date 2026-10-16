import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PROG_LEVEL: Record<string, string> = {
  'a997dec7-8989-40ba-a9d1-b4669702fe78': 'N1',
  '1782a369-0615-4b8c-920f-51772d554cb8': 'N2',
  'd11972ac-25bb-4db3-98c0-15960a835530': 'N3',
}
const LEVEL_LABEL: Record<string, string> = { N1: 'Niveau 1', N2: 'Niveau 2', N3: 'Niveau 3' }

async function verifySession(learnerId: string, token: string): Promise<boolean> {
  if (!learnerId || !token) return false
  const { data } = await db.from('learner_accounts')
    .select('id').eq('id', learnerId).eq('session_token', token).single()
  return !!data
}

// ─── Action handlers ──────────────────────────────────────────

async function handleLogin({ username, password }: any) {
  const { data, error } = await db.from('learner_accounts')
    .select('*').eq('username', username).eq('is_active', true).single()
  if (error || !data) throw new Error('Identifiant ou mot de passe incorrect')
  if (data.password !== password) throw new Error('Identifiant ou mot de passe incorrect')

  // Generate session token
  const sessionToken = crypto.randomUUID()
  await db.from('learner_accounts').update({
    session_token: sessionToken,
    last_login: new Date().toISOString(),
  }).eq('id', data.id)
  await db.from('learner_activity_log').insert({
    learner_id: data.id, page: 'login', action: 'Connexion',
    details: `Connexion de ${data.username}`, created_at: new Date().toISOString(),
  })

  // Fetch participant + promotions
  let participantId = data.participant_id || null
  let reference = null
  if (participantId) {
    const { data: part } = await db.from('participants').select('reference').eq('id', participantId).single()
    reference = part?.reference || null
  }
  const allPromotionIds: string[] = []
  if (data.promotion_id) allPromotionIds.push(data.promotion_id)
  if (data.all_promotion_ids?.length) {
    for (const id of data.all_promotion_ids) if (!allPromotionIds.includes(id)) allPromotionIds.push(id)
  }
  let allLevels: string[] = []
  if (allPromotionIds.length) {
    const { data: promos } = await db.from('promotions').select('id,program_id').in('id', allPromotionIds)
    allLevels = (promos || []).map(p => PROG_LEVEL[p.program_id] || '').filter(Boolean)
  }

  return {
    id: data.id, username: data.username,
    participantName: data.participant_name,
    formationLevel: data.formation_level || allLevels[0] || 'N1',
    isActive: data.is_active,
    participantId, promotionId: data.promotion_id,
    email: data.email,
    allPromotionIds, allLevels, reference,
    sessionToken,
  }
}

async function handleLogActivity(learnerId: string, { page, action, details }: any) {
  await db.from('learner_activity_log').insert({
    learner_id: learnerId, page, action, details, created_at: new Date().toISOString(),
  })
  return null
}

async function handleGetProfile(learnerId: string) {
  const { data: acc } = await db.from('learner_accounts')
    .select('participant_id,promotion_id,formation_level,participant_name,username')
    .eq('id', learnerId).single()
  if (!acc) throw new Error('Account not found')

  let reference = null
  let participant: any = null
  if (acc.participant_id) {
    const { data: part } = await db.from('participants')
      .select('reference,first_name,last_name,email,phone,whatsapp,address,profession,gender,birth_date,city,cin')
      .eq('id', acc.participant_id).single()
    reference = part?.reference || null
    participant = part || null
  }
  const allPromotionIds: string[] = []
  if (acc.promotion_id) allPromotionIds.push(acc.promotion_id)
  let allLevels: string[] = []
  let promoMap: Record<string, string> = {}
  if (allPromotionIds.length) {
    const { data: promos } = await db.from('promotions').select('id,program_id,start_date').in('id', allPromotionIds).order('start_date')
    allLevels = (promos || []).map(p => PROG_LEVEL[p.program_id] || '').filter(Boolean)
    for (const p of promos || []) if (PROG_LEVEL[p.program_id]) promoMap[p.id] = PROG_LEVEL[p.program_id]
  }

  // Coaching packs for this participant
  let coachingPacks: any[] = []
  if (acc.participant_id) {
    const { data: packs } = await db.from('coaching_packs')
      .select('id,name,total_sessions,used_sessions,price,amount_paid,purchase_date,expiration_date,status')
      .eq('participant_id', acc.participant_id).order('purchase_date', { ascending: false })
    coachingPacks = packs || []
  }

  return { acc, reference, participant, allPromotionIds, allLevels, promoMap, coachingPacks }
}

async function handleUpdateProfile(learnerId: string, { phone, whatsapp, address, city, profession, email, gender, cin }: any) {
  const accUpdates: any = {}
  if (phone !== undefined) accUpdates.phone = phone
  if (email !== undefined) accUpdates.email = email
  if (Object.keys(accUpdates).length) {
    await db.from('learner_accounts').update(accUpdates).eq('id', learnerId)
  }
  const { data: acc } = await db.from('learner_accounts').select('participant_id').eq('id', learnerId).single()
  if (acc?.participant_id) {
    const updates: any = {}
    if (phone !== undefined) updates.phone = phone
    if (whatsapp !== undefined) updates.whatsapp = whatsapp
    if (address !== undefined) updates.address = address
    if (city !== undefined) updates.city = city
    if (profession !== undefined) updates.profession = profession
    if (email !== undefined) updates.email = email
    if (gender !== undefined) updates.gender = gender
    if (cin !== undefined) updates.cin = cin
    if (Object.keys(updates).length) {
      await db.from('participants').update(updates).eq('id', acc.participant_id)
    }
  }
  return { ok: true }
}

async function handleGetAccueil(learnerId: string, {
  promotionId, allPromotionIds, allLevels, participantId, participantName,
}: any) {
  const ids = allPromotionIds || []
  const levels = allLevels || []
  const firstName = (participantName || '').split(' ')[0] || ''
  const lastName = (participantName || '').split(' ').slice(1).join(' ') || ''

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [annoRes, sessRes, recRes, docRes, unlockRes, testRes1, testRes2, quizRes1, quizRes2, recentDocRes] = await Promise.all([
    promotionId ? db.from('announcements').select('*').eq('promotion_id', promotionId).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
    ids.length ? db.from('session_schedule').select('*').eq('promotion_id', promotionId).gte('seance_date', new Date().toISOString().slice(0, 10)).order('seance_date').limit(3) : Promise.resolve({ data: [] }),
    ids.length ? db.from('recordings').select('id', { count: 'exact', head: true }).in('promotion_id', ids) : Promise.resolve({ count: 0 }),
    levels.length ? db.from('elearning_docs').select('id', { count: 'exact', head: true }).in('level', levels).eq('is_visible', true) : Promise.resolve({ count: 0 }),
    db.from('test_unlocks').select('id', { count: 'exact', head: true }).eq('learner_id', learnerId),
    participantId ? db.from('test_results').select('test_type').eq('participant_id', participantId) : Promise.resolve({ data: [] }),
    firstName ? db.from('test_results').select('test_type').ilike('first_name', `%${firstName}%`).ilike('last_name', `%${lastName}%`) : Promise.resolve({ data: [] }),
    participantId ? db.from('test_results').select('test_type').eq('participant_id', participantId).in('test_type', ['quiz_coach', 'quiz_coach_n2', 'quiz_coach_n3']) : Promise.resolve({ data: [] }),
    firstName ? db.from('test_results').select('test_type').ilike('first_name', `%${firstName}%`).ilike('last_name', `%${lastName}%`).in('test_type', ['quiz_coach', 'quiz_coach_n2', 'quiz_coach_n3']) : Promise.resolve({ data: [] }),
    levels.length ? db.from('elearning_docs').select('id,title,level,created_at').in('level', levels).eq('is_visible', true).gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
  ])

  const allTypes = [...new Set([...(testRes1.data || []), ...(testRes2.data || [])].map((r: any) => r.test_type))]
  const quizTypes = [...new Set([...(quizRes1.data || []), ...(quizRes2.data || [])].map((r: any) => r.test_type))]

  return {
    announcements: annoRes.data || [],
    upcomingSessions: sessRes.data || [],
    recordingCount: recRes.count || 0,
    docCount: docRes.count || 0,
    testUnlockCount: unlockRes.count || 0,
    testCount: allTypes.length,
    quizTypes,
    recentDocs: recentDocRes.data || [],
  }
}

async function handleGetTests(learnerId: string, { participantId, participantName }: any) {
  const parts = (participantName || '').trim().split(/\s+/).filter(Boolean)
  const firstName = parts[0] || ''
  const lastName = parts[parts.length - 1] || ''

  const [unlockRes, byId, byName1, byName2, byFL, byLF] = await Promise.all([
    db.from('test_unlocks').select('*').eq('learner_id', learnerId),
    participantId ? db.from('test_results').select('test_type,created_at,dominant_profile,scores,answers,first_name,last_name').eq('participant_id', participantId) : Promise.resolve({ data: [] }),
    parts.length >= 2 ? db.from('test_results').select('test_type,created_at,dominant_profile,scores,answers,first_name,last_name').ilike('participant_name', `%${firstName}%`).ilike('participant_name', `%${lastName}%`) : Promise.resolve({ data: [] }),
    parts.length >= 2 ? db.from('test_results').select('test_type,created_at,dominant_profile,scores,answers,first_name,last_name').ilike('participant_name', `%${lastName}%`).ilike('participant_name', `%${firstName}%`) : Promise.resolve({ data: [] }),
    parts.length >= 2 ? db.from('test_results').select('test_type,created_at,dominant_profile,scores,answers,first_name,last_name').ilike('first_name', `%${firstName}%`).ilike('last_name', `%${lastName}%`) : Promise.resolve({ data: [] }),
    parts.length >= 2 ? db.from('test_results').select('test_type,created_at,dominant_profile,scores,answers,first_name,last_name').ilike('first_name', `%${lastName}%`).ilike('last_name', `%${firstName}%`) : Promise.resolve({ data: [] }),
  ])

  // Merge: most recent per test_type wins
  const map = new Map<string, any>()
  for (const r of [...(byId.data||[]), ...(byName1.data||[]), ...(byName2.data||[]), ...(byFL.data||[]), ...(byLF.data||[])]) {
    const ex = map.get(r.test_type)
    if (!ex || new Date(r.created_at) > new Date(ex.created_at)) map.set(r.test_type, r)
  }
  return { unlocks: unlockRes.data || [], results: Array.from(map.values()) }
}

async function handleGetNotes(learnerId: string) {
  const [notesRes, commitRes] = await Promise.all([
    db.from('learner_notes').select('*').eq('learner_id', learnerId).order('updated_at', { ascending: false }),
    db.from('learner_commitments').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
  ])
  return { notes: notesRes.data || [], commitments: commitRes.data || [] }
}

async function handleSaveNote(learnerId: string, { id, title, content }: any) {
  const now = new Date().toISOString()
  if (id) {
    await db.from('learner_notes').update({ title: title || '', content, updated_at: now }).eq('id', id).eq('learner_id', learnerId)
  } else {
    await db.from('learner_notes').insert({ learner_id: learnerId, title: title || '', content, created_at: now, updated_at: now })
  }
  return null
}

async function handleDeleteNote(learnerId: string, { id }: any) {
  await db.from('learner_notes').delete().eq('id', id).eq('learner_id', learnerId)
  return null
}

async function handleAddCommitment(learnerId: string, { commitment, seanceRef }: any) {
  await db.from('learner_commitments').insert({ learner_id: learnerId, commitment, seance_ref: seanceRef })
  return null
}

async function handleDeleteCommitment(learnerId: string, { id }: any) {
  await db.from('learner_commitments').delete().eq('id', id).eq('learner_id', learnerId)
  return null
}

async function handleGetMessages(learnerId: string) {
  const { data } = await db.from('learner_messages').select('*').eq('learner_id', learnerId).order('created_at', { ascending: true })
  await db.from('learner_messages').update({ read: true }).eq('learner_id', learnerId).eq('sender', 'admin').eq('read', false)
  return data || []
}

async function handleSendMessage(learnerId: string, { content }: any) {
  await db.from('learner_messages').insert({ learner_id: learnerId, sender: 'learner', content })
  return null
}

async function handleGetObjectives(learnerId: string) {
  const { data } = await db.from('learner_objectives').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false })
  return data || []
}

async function handleAddObjective(learnerId: string, { title, description, targetDate }: any) {
  await db.from('learner_objectives').insert({
    learner_id: learnerId, title, description: description || null,
    target_date: targetDate || null, status: 'active',
  })
  return null
}

async function handleUpdateObjective(learnerId: string, { id, status }: any) {
  await db.from('learner_objectives').update({ status }).eq('id', id).eq('learner_id', learnerId)
  return null
}

async function handleDeleteObjective(learnerId: string, { id }: any) {
  await db.from('learner_objectives').delete().eq('id', id).eq('learner_id', learnerId)
  return null
}

async function handleChangePassword(learnerId: string, { oldPassword, newPassword }: any) {
  const { data } = await db.from('learner_accounts').select('password').eq('id', learnerId).single()
  if (!data || data.password !== oldPassword) throw new Error('Mot de passe actuel incorrect')
  await db.from('learner_accounts').update({ password: newPassword }).eq('id', learnerId)
  return null
}

async function handleGetRecordings(_learnerId: string, { allPromotionIds }: any) {
  const ids = allPromotionIds || []
  if (!ids.length) return { recordings: [], promotions: [] }
  const [recRes, promoRes] = await Promise.all([
    db.from('recordings').select('*').in('promotion_id', ids).order('order_index'),
    db.from('promotions').select('id,name,program_id,start_date').in('id', ids).order('start_date'),
  ])
  return { recordings: recRes.data || [], promotions: promoRes.data || [] }
}

async function getDocVisibilityConfig(): Promise<Record<string, { excluded_promotion_ids: string[]; excluded_learner_ids: string[] }>> {
  try {
    const { data } = await db.storage.from('elearning').download('config/doc_visibility.json')
    if (!data) return {}
    const text = await data.text()
    return JSON.parse(text) || {}
  } catch { return {} }
}

async function handleGetDocuments(learnerId: string, { allLevels, promotionId }: any) {
  const levels = allLevels || []
  if (!levels.length) return []
  const [docsRes, visConfig] = await Promise.all([
    db.from('elearning_docs').select('*').in('level', levels).eq('is_visible', true).order('order_index'),
    getDocVisibilityConfig(),
  ])
  return (docsRes.data || []).filter((doc: any) => {
    const cfg = visConfig[doc.id]
    if (!cfg) return true
    if (promotionId && cfg.excluded_promotion_ids?.includes(promotionId)) return false
    if (learnerId && cfg.excluded_learner_ids?.includes(learnerId)) return false
    return true
  })
}

async function handleSetDocVisibility(_learnerId: string, { docId, excludedPromotionIds, excludedLearnerIds }: any) {
  const config = await getDocVisibilityConfig()
  if (!excludedPromotionIds?.length && !excludedLearnerIds?.length) {
    delete config[docId]
  } else {
    config[docId] = { excluded_promotion_ids: excludedPromotionIds || [], excluded_learner_ids: excludedLearnerIds || [] }
  }
  const blob = Buffer.from(JSON.stringify(config), 'utf8')
  await db.storage.from('elearning').upload('config/doc_visibility.json', blob, { contentType: 'application/json', upsert: true })
  return { ok: true }
}

async function handleGetPayments(learnerId: string, { participantId: pid, allPromotionIds }: any) {
  // Auto-resolve participant_id from learner account if not provided
  let participantId = pid
  if (!participantId) {
    const { data: acc } = await db.from('learner_accounts').select('participant_id').eq('id', learnerId).single()
    participantId = acc?.participant_id || null
  }
  const [payRes, promoRes] = await Promise.all([
    participantId ? db.from('payments').select('*').eq('participant_id', participantId).order('date', { ascending: false }) : Promise.resolve({ data: [] }),
    allPromotionIds?.length ? db.from('promotions').select('id,name,program_id').in('id', allPromotionIds) : Promise.resolve({ data: [] }),
  ])
  const promoMap: Record<string, { level: string; name: string }> = {}
  for (const p of promoRes.data || []) {
    const level = PROG_LEVEL[p.program_id] || '?'
    promoMap[p.id] = { level, name: LEVEL_LABEL[level] || p.name || level }
  }
  const { data: files } = await db.storage.from('payment-receipts').list(learnerId)
  const receipts: Record<string, string> = {}
  for (const f of files || []) {
    const paymentId = f.name.split('_')[0]
    const { data: urlData } = db.storage.from('payment-receipts').getPublicUrl(`${learnerId}/${f.name}`)
    receipts[paymentId] = urlData.publicUrl
  }
  return { payments: payRes.data || [], promoMap, receipts }
}

async function handleGetUploadUrl(_learnerId: string, { bucket, path }: any) {
  const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path)
  if (error) throw new Error(error.message)
  const { data: urlData } = db.storage.from(bucket).getPublicUrl(path)
  return { signedUrl: data.signedUrl, token: data.token, publicUrl: urlData.publicUrl }
}

async function handleGetAgenda(learnerId: string, { allPromotionIds }: any) {
  const ids = allPromotionIds || []
  if (!ids.length) return { sessions: [], ratings: [] }
  const [sessRes, ratingsRes] = await Promise.all([
    db.from('session_schedule').select('*').in('promotion_id', ids).order('date', { ascending: true }),
    db.from('session_ratings').select('*').eq('learner_id', learnerId),
  ])
  return { sessions: sessRes.data || [], ratings: ratingsRes.data || [] }
}

async function handleRateSession(learnerId: string, { sessionId, rating, comment }: any) {
  await db.from('session_ratings').upsert({
    learner_id: learnerId, schedule_id: sessionId, rating, comment,
    created_at: new Date().toISOString(),
  }, { onConflict: 'learner_id,schedule_id' })
  return null
}

async function handleGetProgression(learnerId: string, { allPromotionIds, allLevels, participantId, participantName }: any) {
  const ids = allPromotionIds || []
  const levels = allLevels || []
  const parts = (participantName || '').trim().split(/\s+/).filter(Boolean)
  const firstName = parts[0] || ''
  const lastName = parts[parts.length - 1] || ''
  const hasName = parts.length >= 2

  // Only fetch real per-learner data — no promotion-wide counts that inflate progress
  const [testById, testByFL, testByLF, objRes, lessonProgressRes, totalLessonsRes, totalDocsRes, totalRecsRes, devoirsRes, submissionsRes] = await Promise.all([
    participantId ? db.from('test_results').select('test_type').eq('participant_id', participantId) : Promise.resolve({ data: [] }),
    hasName ? db.from('test_results').select('test_type').ilike('first_name', `%${firstName}%`).ilike('last_name', `%${lastName}%`) : Promise.resolve({ data: [] }),
    hasName ? db.from('test_results').select('test_type').ilike('first_name', `%${lastName}%`).ilike('last_name', `%${firstName}%`) : Promise.resolve({ data: [] }),
    db.from('learner_objectives').select('id,status').eq('learner_id', learnerId),
    db.from('lesson_progress').select('lesson_id').eq('learner_id', learnerId),
    levels.length ? db.from('elearning_lessons').select('id').in('formation_level', levels).eq('is_published', true) : Promise.resolve({ data: [] }),
    levels.length ? db.from('elearning_docs').select('id').in('level', levels) : Promise.resolve({ data: [] }),
    ids.length ? db.from('recordings').select('id').in('promotion_id', ids) : Promise.resolve({ data: [] }),
    ids.length
      ? db.from('learner_assignments').select('id').or(`learner_id.eq.${learnerId},promotion_id.in.(${ids.join(',')})`)
      : db.from('learner_assignments').select('id').eq('learner_id', learnerId),
    db.from('assignment_submissions').select('assignment_id').eq('learner_id', learnerId),
  ])
  const allTestRows = [...(testById.data || []), ...(testByFL.data || []), ...(testByLF.data || [])]
  const testTypes = [...new Set(allTestRows.map((r: any) => r.test_type))]
  return {
    testTypes,
    objectives: objRes.data || [],
    lessonsCompleted: lessonProgressRes.data?.length || 0,
    totalLessons: totalLessonsRes.data?.length || 0,
    totalDocs: totalDocsRes.data?.length || 0,
    totalRecordings: totalRecsRes.data?.length || 0,
    totalDevoirs: devoirsRes.data?.length || 0,
    devoirsSubmitted: submissionsRes.data?.length || 0,
  }
}

async function handleGetCertif(_learnerId: string, { participantId, participantName }: any) {
  const parts = (participantName || '').trim().split(/\s+/).filter(Boolean)
  const firstName = parts[0] || ''
  const lastName = parts[parts.length - 1] || ''
  const [r1, r2, r3] = await Promise.all([
    participantId ? db.from('test_results').select('test_type, created_at, scores').eq('participant_id', participantId) : Promise.resolve({ data: [] }),
    firstName ? db.from('test_results').select('test_type, created_at, scores').ilike('first_name', `%${firstName}%`).ilike('last_name', `%${lastName}%`) : Promise.resolve({ data: [] }),
    firstName ? db.from('test_results').select('test_type, created_at, scores').ilike('first_name', `%${lastName}%`).ilike('last_name', `%${firstName}%`) : Promise.resolve({ data: [] }),
  ])
  const map = new Map<string, any>()
  for (const r of [...(r1.data||[]), ...(r2.data||[]), ...(r3.data||[])]) {
    const ex = map.get(r.test_type)
    if (!ex || new Date(r.created_at) > new Date(ex.created_at)) map.set(r.test_type, r)
  }
  return Array.from(map.values())
}

async function handleGetDevoirs(learnerId: string, { allPromotionIds }: any) {
  const ids = allPromotionIds || []
  const [assignRes, subRes] = await Promise.all([
    ids.length
      ? db.from('learner_assignments').select('*').or(`learner_id.eq.${learnerId},promotion_id.in.(${ids.join(',')})` ).order('created_at', { ascending: false })
      : db.from('learner_assignments').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
    db.from('assignment_submissions').select('*').eq('learner_id', learnerId),
  ])
  return { assignments: assignRes.data || [], submissions: subRes.data || [] }
}

async function handleSubmitAssignment(learnerId: string, { assignmentId, fileUrl, content }: any) {
  await db.from('assignment_submissions').upsert({
    learner_id: learnerId, assignment_id: assignmentId,
    file_url: fileUrl, content, submitted_at: new Date().toISOString(),
  }, { onConflict: 'learner_id,assignment_id' })
  return null
}

async function handleGetCoachingRequests(learnerId: string) {
  const { data } = await db.from('coaching_requests').select('id,offer_type,offer_label,status,admin_note,created_at').eq('learner_id', learnerId).order('created_at', { ascending: false })
  return { requests: data || [] }
}

async function handleSubmitCoachingRequest(learnerId: string, { offerType, offerLabel, phone, message }: any) {
  const { data: acc } = await db.from('learner_accounts').select('participant_name').eq('id', learnerId).single()
  await db.from('coaching_requests').insert({
    learner_id: learnerId,
    learner_name: acc?.participant_name || '',
    learner_email: null,
    learner_phone: phone || null,
    offer_type: offerType,
    offer_label: offerLabel,
    message: message || null,
    status: 'pending',
  })
  return { ok: true }
}

async function handleSubmitLevelUpgradeRequest(learnerId: string, { currentLevel, requestedLevel, phone, message, quizValidated }: any) {
  const { data: acc } = await db.from('learner_accounts').select('participant_name').eq('id', learnerId).single()
  await db.from('level_upgrade_requests').insert({
    learner_id: learnerId,
    learner_name: acc?.participant_name || '',
    learner_email: null,
    learner_phone: phone || null,
    current_level: currentLevel,
    requested_level: requestedLevel,
    message: message || null,
    quiz_validated: quizValidated || false,
    status: 'pending',
  })
  return { ok: true }
}

async function handleGetCours(learnerId: string, { formationLevel }: any) {
  const [modRes, lesRes, progRes] = await Promise.all([
    db.from('elearning_modules').select('*').eq('formation_level', formationLevel).eq('is_published', true).order('order_index'),
    db.from('elearning_lessons').select('*').eq('is_published', true).order('order_index'),
    db.from('lesson_progress').select('lesson_id').eq('learner_id', learnerId),
  ])
  return { modules: modRes.data || [], lessons: lesRes.data || [], progress: progRes.data || [] }
}

async function handleCompleteLesson(learnerId: string, { lessonId }: any) {
  await db.from('lesson_progress').upsert({ learner_id: learnerId, lesson_id: lessonId }, { onConflict: 'learner_id,lesson_id' })
  return null
}

// ─── Main handler ─────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
  const { action, learnerId, sessionToken, payload = {} } = req.body || {}

  if (action !== 'login') {
    const ok = await verifySession(learnerId, sessionToken)
    if (!ok) return res.status(401).json({ error: 'Session invalide' })
  }

    let data: any
    switch (action) {
      case 'login':            data = await handleLogin(payload); break
      case 'log_activity':     data = await handleLogActivity(learnerId, payload); break
      case 'get_profile':      data = await handleGetProfile(learnerId); break
      case 'get_accueil':      data = await handleGetAccueil(learnerId, payload); break
      case 'get_tests':        data = await handleGetTests(learnerId, payload); break
      case 'get_notes':        data = await handleGetNotes(learnerId); break
      case 'save_note':        data = await handleSaveNote(learnerId, payload); break
      case 'delete_note':      data = await handleDeleteNote(learnerId, payload); break
      case 'add_commitment':   data = await handleAddCommitment(learnerId, payload); break
      case 'delete_commitment':data = await handleDeleteCommitment(learnerId, payload); break
      case 'get_messages':     data = await handleGetMessages(learnerId); break
      case 'send_message':     data = await handleSendMessage(learnerId, payload); break
      case 'get_objectives':   data = await handleGetObjectives(learnerId); break
      case 'add_objective':    data = await handleAddObjective(learnerId, payload); break
      case 'update_objective': data = await handleUpdateObjective(learnerId, payload); break
      case 'delete_objective': data = await handleDeleteObjective(learnerId, payload); break
      case 'change_password':  data = await handleChangePassword(learnerId, payload); break
      case 'update_profile':   data = await handleUpdateProfile(learnerId, payload); break
      case 'get_recordings':   data = await handleGetRecordings(learnerId, payload); break
      case 'get_documents':    data = await handleGetDocuments(learnerId, payload); break
      case 'set_doc_visibility': data = await handleSetDocVisibility(learnerId, payload); break
      case 'get_payments':     data = await handleGetPayments(learnerId, payload); break
      case 'get_upload_url':   data = await handleGetUploadUrl(learnerId, payload); break
      case 'get_agenda':       data = await handleGetAgenda(learnerId, payload); break
      case 'rate_session':     data = await handleRateSession(learnerId, payload); break
      case 'get_progression':  data = await handleGetProgression(learnerId, payload); break
      case 'get_certif':       data = await handleGetCertif(learnerId, payload); break
      case 'get_devoirs':      data = await handleGetDevoirs(learnerId, payload); break
      case 'submit_assignment':data = await handleSubmitAssignment(learnerId, payload); break
      case 'get_cours':        data = await handleGetCours(learnerId, payload); break
      case 'complete_lesson':  data = await handleCompleteLesson(learnerId, payload); break
      case 'get_coaching_requests':          data = await handleGetCoachingRequests(learnerId); break
      case 'submit_coaching_request':       data = await handleSubmitCoachingRequest(learnerId, payload); break
      case 'submit_level_upgrade_request':  data = await handleSubmitLevelUpgradeRequest(learnerId, payload); break
      default: return res.status(400).json({ error: `Unknown action: ${action}` })
    }
    return res.status(200).json({ data })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erreur serveur' })
  }
}
