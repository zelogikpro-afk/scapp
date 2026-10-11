const API_URL = '/api/learner'

interface ApiCall {
  action: string
  learnerId?: string
  sessionToken?: string
  payload?: Record<string, unknown>
}

function getSession() {
  try {
    const raw = localStorage.getItem('sc_learner_session')
    if (!raw) return null
    return JSON.parse(raw) as { id: string; sessionToken?: string }
  } catch {
    return null
  }
}

export async function learnerApiCall<T = unknown>(opts: ApiCall): Promise<T> {
  const session = getSession()
  const body: Record<string, unknown> = { action: opts.action }
  if (opts.learnerId) body.learnerId = opts.learnerId
  else if (session?.id) body.learnerId = session.id
  if (opts.sessionToken) body.sessionToken = opts.sessionToken
  else if (session?.sessionToken) body.sessionToken = session.sessionToken
  if (opts.payload) body.payload = opts.payload

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json.data as T
}

// Typed helpers
export const learnerApi = {
  login: (username: string, password: string) =>
    learnerApiCall({ action: 'login', payload: { username, password } }),

  logActivity: (page: string, action: string, details?: string) =>
    learnerApiCall({ action: 'log_activity', payload: { page, action, details } }).catch(() => null),

  getProfile: () => learnerApiCall({ action: 'get_profile' }),
  getAccueil: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_accueil', payload }),
  getTests: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_tests', payload }),
  getNotes: () => learnerApiCall({ action: 'get_notes' }),
  saveNote: (payload: Record<string, unknown>) => learnerApiCall({ action: 'save_note', payload }),
  deleteNote: (id: string) => learnerApiCall({ action: 'delete_note', payload: { id } }),
  addCommitment: (payload: Record<string, unknown>) => learnerApiCall({ action: 'add_commitment', payload }),
  deleteCommitment: (id: string) => learnerApiCall({ action: 'delete_commitment', payload: { id } }),
  getMessages: () => learnerApiCall({ action: 'get_messages' }),
  sendMessage: (content: string) => learnerApiCall({ action: 'send_message', payload: { content } }),
  getObjectives: () => learnerApiCall({ action: 'get_objectives' }),
  addObjective: (payload: Record<string, unknown>) => learnerApiCall({ action: 'add_objective', payload }),
  updateObjective: (id: string, status: string) => learnerApiCall({ action: 'update_objective', payload: { id, status } }),
  deleteObjective: (id: string) => learnerApiCall({ action: 'delete_objective', payload: { id } }),
  changePassword: (oldPassword: string, newPassword: string) =>
    learnerApiCall({ action: 'change_password', payload: { oldPassword, newPassword } }),
  getRecordings: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_recordings', payload }),
  getDocuments: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_documents', payload }),
  getPayments: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_payments', payload }),
  getUploadUrl: (bucket: string, path: string) =>
    learnerApiCall({ action: 'get_upload_url', payload: { bucket, path } }),
  getAgenda: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_agenda', payload }),
  rateSession: (payload: Record<string, unknown>) => learnerApiCall({ action: 'rate_session', payload }),
  getProgression: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_progression', payload }),
  getCertif: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_certif', payload }),
  getDevoirs: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_devoirs', payload }),
  submitAssignment: (payload: Record<string, unknown>) => learnerApiCall({ action: 'submit_assignment', payload }),
  getCours: (payload: Record<string, unknown>) => learnerApiCall({ action: 'get_cours', payload }),
  completeLesson: (lessonId: string) => learnerApiCall({ action: 'complete_lesson', payload: { lessonId } }),
}
