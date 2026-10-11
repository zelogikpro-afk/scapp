const KEY = 'sc_learner_session'

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
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
}

export const setLearnerSession = (s: LearnerSession) =>
  localStorage.setItem(KEY, JSON.stringify(s))

export const clearLearnerSession = () => localStorage.removeItem(KEY)
