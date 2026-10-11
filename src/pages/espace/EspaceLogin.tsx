import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { learnerApiCall } from '../../lib/learnerApi'
import { setLearnerSession } from '../../lib/learnerSession'
import { Eye, EyeOff, BookOpen } from 'lucide-react'

export default function EspaceLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) { setError('Identifiant et mot de passe requis'); return }
    setLoading(true)
    try {
      const data = await learnerApiCall<any>({
        action: 'login',
        payload: { username: username.trim(), password: password.trim() },
      })
      setLearnerSession({
        id: data.id,
        username: data.username,
        participantName: data.participantName,
        formationLevel: data.formationLevel,
        isActive: data.isActive,
        participantId: data.participantId,
        promotionId: data.promotionId,
        email: data.email,
        allPromotionIds: data.allPromotionIds,
        allLevels: data.allLevels,
        sessionToken: data.sessionToken,
      })
      const redirect = searchParams.get('redirect')
      if (redirect) {
        navigate(redirect)
      } else if (data.formationLevel === 'digital') {
        navigate('/digital/accueil')
      } else {
        navigate('/espace/accueil')
      }
    } catch (err: any) {
      setError(err.message || 'Identifiant ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Success Compass" className="w-20 h-20 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Espace Apprenant</h1>
          <p className="text-blue-200 text-sm mt-1">Success Compass Academy</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Connexion</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="ex: SC-2026-042"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm mt-2">
              {loading ? 'Connexion…' : 'Accéder à mon espace'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Identifiants fournis par Success Compass · 06 03 60 97 92
          </p>
        </div>
      </div>
    </div>
  )
}
