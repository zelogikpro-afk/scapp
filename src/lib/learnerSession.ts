const KEY = 'sc_learner_session'

export interface LearnerSession {
  id: string
  username: string
  participantName: string
  formationLevel: string
  isActive: boolean
}

export const getLearnerSession = (): LearnerSession | null => {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
}

export const setLearnerSession = (s: LearnerSession) =>
  localStorage.setItem(KEY, JSON.stringify(s))

export const clearLearnerSession = () => localStorage.removeItem(KEY)
