const KEY = 'sc_trainer_session'

export interface TrainerSession {
  id: string
  username: string
  name: string
  promotionIds: string[]
  sessionToken: string
}

export const getTrainerSession = (): TrainerSession | null => {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
}
export const setTrainerSession = (s: TrainerSession) => localStorage.setItem(KEY, JSON.stringify(s))
export const clearTrainerSession = () => localStorage.removeItem(KEY)

export async function trainerApiCall<T = any>(body: object): Promise<T> {
  const session = getTrainerSession()
  const res = await fetch('/api/trainer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      trainerId: session?.id,
      sessionToken: session?.sessionToken,
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erreur serveur')
  return (json.data !== undefined ? json.data : json) as T
}
