import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import { type LearnerSession } from '../../lib/learnerSession'
import { User, Lock, Eye, EyeOff, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EspaceProfil() {
  const session = useOutletContext<LearnerSession>()
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const initials = session.participantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const levels = session.allLevels?.length ? session.allLevels : [session.formationLevel]
  const levelLabel = levels.map(l => l === 'N1' ? 'Niveau 1' : l === 'N2' ? 'Niveau 2' : 'Niveau 3').join(' · ')

  async function changePassword() {
    if (!currentPwd || !newPwd || !confirmPwd) { toast.error('Tous les champs sont requis'); return }
    if (newPwd !== confirmPwd) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (newPwd.length < 4) { toast.error('Mot de passe trop court (min. 4 caractères)'); return }
    setSaving(true)
    try {
      await learnerApi.changePassword(currentPwd, newPwd)
      toast.success('Mot de passe modifié ✅')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (e: any) {
      toast.error(e.message || 'Erreur')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>

      {/* Identity */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl">
            {initials}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{session.participantName}</p>
            <p className="text-sm text-gray-500">{levelLabel}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Identifiant de connexion</p>
              <p className="text-sm font-medium text-gray-900 font-mono">{session.username}</p>
            </div>
          </div>
          {session.email && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-400 text-sm">@</span>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900">{session.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gray-500" />
          <p className="font-semibold text-gray-900">Changer de mot de passe</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
              placeholder="Mot de passe actuel"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
              placeholder="Nouveau mot de passe"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
            placeholder="Confirmer le nouveau mot de passe"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={changePassword} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" />{saving ? 'Enregistrement…' : 'Modifier le mot de passe'}
          </button>
        </div>
      </div>
    </div>
  )
}
