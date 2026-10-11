import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { trainerApiCall, type TrainerSession, clearTrainerSession } from '../../lib/trainerApi'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, Eye, EyeOff, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TrainerProfil() {
  const session = useOutletContext<TrainerSession>()
  const navigate = useNavigate()

  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd !== confirmPwd) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (newPwd.length < 6) { toast.error('Le mot de passe doit faire au moins 6 caractères'); return }
    setSaving(true)
    try {
      await trainerApiCall({ action: 'change_password', payload: { oldPassword: oldPwd, newPassword: newPwd } })
      setOldPwd('')
      setNewPwd('')
      setConfirmPwd('')
      toast.success('Mot de passe modifié avec succès')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du changement de mot de passe')
    }
    setSaving(false)
  }

  function handleLogout() {
    clearTrainerSession()
    navigate('/formateur/login')
  }

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez vos informations et votre mot de passe</p>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{session.name}</p>
            <p className="text-sm text-gray-500">@{session.username}</p>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">Formateur</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-800">Changer le mot de passe</p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe actuel</label>
            <div className="relative">
              <input type={showOld ? 'text' : 'password'} value={oldPwd} onChange={e => setOldPwd(e.target.value)}
                required placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-9 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button type="button" onClick={() => setShowOld(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                required placeholder="Minimum 6 caractères"
                className="w-full px-3 py-2.5 pr-9 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
              required placeholder="Répétez le mot de passe"
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                confirmPwd && confirmPwd !== newPwd ? 'border-red-300' : 'border-gray-200'
              }`} />
            {confirmPwd && confirmPwd !== newPwd && (
              <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          <button type="submit" disabled={saving || !oldPwd || !newPwd || !confirmPwd}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors mt-1">
            {saving ? 'Enregistrement…' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 border border-red-100 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-medium transition-colors">
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    </div>
  )
}
