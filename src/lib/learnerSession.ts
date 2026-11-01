const KEY = 'sc_learner_session'
const SESSION_VERSION = 2

export interface LearnerSession {
  id: string
  username: string
  participantName: string
  formationLevel: string   // niveau actuel (le plus avancé)
  isActive: boolean
  participantId?: string
  promotionId?: string     // session principale
  email?: string
  allPromotionIds: string[]  // toutes les sessions suivies
  allLevels: string[]        // ex: ['N1', 'N2']
  sessionToken?: string      // server-issued UUID, verified on every API call
}

export const getLearnerSession = (): LearnerSession | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if ((s._v ?? 1) < SESSION_VERSION) { localStorage.removeItem(KEY); return null }
    return s
  } catch { return null }
}

export const setLearnerSession = (s: LearnerSession) =>
  localStorage.setItem(KEY, JSON.stringify({ ...s, _v: SESSION_VERSION }))

export const clearLearnerSession = () => localStorage.removeItem(KEY)
