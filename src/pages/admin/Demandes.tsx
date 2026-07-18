import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, Clock, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:   { label: 'En attente',  color: '#92400e', bg: '#fef3c7', icon: Clock },
  confirmed: { label: 'Confirmé',    color: '#065f46', bg: '#d1fae5', icon: CheckCircle },
  rejected:  { label: 'Refusé',      color: '#991b1b', bg: '#fee2e2', icon: XCircle },
  approved:  { label: 'Approuvé',    color: '#065f46', bg: '#d1fae5', icon: CheckCircle },
  cancelled: { label: 'Annulé',      color: '#6b7280', bg: '#f3f4f6', icon: XCircle },
}

const OFFER_LABELS: Record<string, string> = {
  seance_decouverte: 'Séance Découverte (700 MAD)',
  seance_senior: 'Séance Coach Senior (400 MAD)',
  pack_bienetre: 'Pack Bien-être (2 200 MAD)',
  pack_transformation: 'Pack Transformation (4 800 MAD)',
}

type Tab = 'coaching' | 'niveau'

async function adminCall(action: string, body: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Non connecté')
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...body }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erreur serveur')
  return json.data
}

export default function Demandes() {
  const [tab, setTab] = useState<Tab>('coaching')
  const [coachingRequests, setCoachingRequests] = useState<any[]>([])
  const [upgradeRequests, setUpgradeRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ id: string; slots: string; url: string } | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { coaching, upgrades } = await adminCall('get_requests')
      setCoachingRequests(coaching)
      setUpgradeRequests(upgrades)
    } catch (e: any) {
      toast.error(e.message || 'Erreur chargement')
    }
    setLoading(false)
  }

  async function updateCoachingStatus(id: string, status: string, adminNote?: string) {
    setUpdatingId(id)
    try {
      await adminCall('update_coaching_status', { id, status, adminNote })
      const update: any = { status }
      if (adminNote !== undefined) update.admin_note = adminNote
      setCoachingRequests(prev => prev.map(r => r.id === id ? { ...r, ...update } : r))
      toast.success('Statut mis à jour')
      setConfirmModal(null)
    } catch (e: any) {
      toast.error(e.message || 'Erreur')
    }
    setUpdatingId(null)
  }

  async function confirmWithSlots() {
    if (!confirmModal) return
    const noteJson = JSON.stringify({ slots: confirmModal.slots, url: confirmModal.url })
    await updateCoachingStatus(confirmModal.id, 'confirmed', noteJson)
  }

  async function updateUpgradeStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      await adminCall('update_upgrade_status', { id, status })
      setUpgradeRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success('Statut mis à jour')
    } catch (e: any) {
      toast.error(e.message || 'Erreur')
    }
    setUpdatingId(null)
  }

  async function deleteCoaching(id: string) {
    if (!confirm('Supprimer cette demande ?')) return
    try {
      await adminCall('delete_coaching', { id })
      setCoachingRequests(prev => prev.filter(r => r.id !== id))
      toast.success('Supprimé')
    } catch (e: any) {
      toast.error(e.message || 'Erreur')
    }
  }

  async function deleteUpgrade(id: string) {
    if (!confirm('Supprimer cette demande ?')) return
    try {
      await adminCall('delete_upgrade', { id })
      setUpgradeRequests(prev => prev.filter(r => r.id !== id))
      toast.success('Supprimé')
    } catch (e: any) {
      toast.error(e.message || 'Erreur')
    }
  }

  const pending = {
    coaching: coachingRequests.filter(r => r.status === 'pending').length,
    niveau: upgradeRequests.filter(r => r.status === 'pending').length,
  }

  function StatusBadge({ status }: { status: string }) {
    const s = STATUS_LABELS[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', icon: Clock }
    const Icon = s.icon
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ background: s.bg, color: s.color }}>
        <Icon className="w-3 h-3" />{s.label}
      </span>
    )
  }

  return (
    <><div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Demandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Coaching et inscriptions niveau suivant</p>
        </div>
        <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button onClick={() => setTab('coaching')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'coaching' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          🎯 Coaching
          {pending.coaching > 0 && <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{pending.coaching}</span>}
        </button>
        <button onClick={() => setTab('niveau')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'niveau' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          🎓 Niveau suivant
          {pending.niveau > 0 && <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{pending.niveau}</span>}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement…</div>
      ) : tab === 'coaching' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{coachingRequests.length} demande{coachingRequests.length !== 1 ? 's' : ''}</p>
          {coachingRequests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-gray-500 text-sm">Aucune demande de coaching</p>
            </div>
          )}
          {coachingRequests.map(r => {
            const isOpen = expanded === r.id
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : r.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{r.learner_name}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-gray-500">{OFFER_LABELS[r.offer_type] || r.offer_label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                </div>
                {isOpen && (
                  <div className="border-t border-gray-50 p-4 space-y-3 bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {r.learner_phone && <div><span className="text-gray-400">Tél :</span> <span className="text-gray-700 font-medium">{r.learner_phone}</span></div>}
                      {r.learner_email && <div><span className="text-gray-400">Email :</span> <span className="text-gray-700">{r.learner_email}</span></div>}
                    </div>
                    {r.message && (
                      <div className="p-3 bg-white rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Message :</p>
                        <p className="text-sm text-gray-700">{r.message}</p>
                      </div>
                    )}
                    {r.admin_note && (
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-500 mb-1">Note admin :</p>
                        <p className="text-sm text-blue-700">{r.admin_note}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => setConfirmModal({ id: r.id, slots: '', url: '' })} disabled={updatingId === r.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-medium">
                            <CheckCircle className="w-3 h-3" /> Confirmer
                          </button>
                          <button onClick={() => updateCoachingStatus(r.id, 'cancelled')} disabled={updatingId === r.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium">
                            <XCircle className="w-3 h-3" /> Annuler
                          </button>
                        </>
                      )}
                      {r.learner_phone && (
                        <a href={`https://wa.me/${r.learner_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium">
                          WhatsApp
                        </a>
                      )}
                      <button onClick={() => deleteCoaching(r.id)}
                        className="ml-auto p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{upgradeRequests.length} demande{upgradeRequests.length !== 1 ? 's' : ''}</p>
          {upgradeRequests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-3xl mb-2">🎓</p>
              <p className="text-gray-500 text-sm">Aucune demande d'inscription niveau suivant</p>
            </div>
          )}
          {upgradeRequests.map(r => {
            const isOpen = expanded === r.id
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : r.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{r.learner_name}</p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {r.current_level} → {r.requested_level}
                      </span>
                      <StatusBadge status={r.status} />
                      {r.quiz_validated && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Quiz validé
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                </div>
                {isOpen && (
                  <div className="border-t border-gray-50 p-4 space-y-3 bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {r.learner_phone && <div><span className="text-gray-400">Tél :</span> <span className="text-gray-700 font-medium">{r.learner_phone}</span></div>}
                      {r.learner_email && <div><span className="text-gray-400">Email :</span> <span className="text-gray-700">{r.learner_email}</span></div>}
                    </div>
                    {r.message && (
                      <div className="p-3 bg-white rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Message :</p>
                        <p className="text-sm text-gray-700">{r.message}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => updateUpgradeStatus(r.id, 'approved')} disabled={updatingId === r.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-medium">
                            <CheckCircle className="w-3 h-3" /> Approuver
                          </button>
                          <button onClick={() => updateUpgradeStatus(r.id, 'rejected')} disabled={updatingId === r.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium">
                            <XCircle className="w-3 h-3" /> Refuser
                          </button>
                        </>
                      )}
                      {r.learner_phone && (
                        <a href={`https://wa.me/${r.learner_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium">
                          WhatsApp
                        </a>
                      )}
                      <button onClick={() => deleteUpgrade(r.id)}
                        className="ml-auto p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>

      {/* Modal confirmation créneaux */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Confirmer la demande</h3>
              <button onClick={() => setConfirmModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Créneaux disponibles</label>
                <textarea
                  value={confirmModal.slots}
                  onChange={e => setConfirmModal(m => m ? { ...m, slots: e.target.value } : m)}
                  rows={4}
                  placeholder={'Ex :\nSamedi 19 juillet — 10h00 ou 14h30\nDimanche 20 juillet — 11h00 ou 15h00'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien de réservation (optionnel)</label>
                <input
                  type="url"
                  value={confirmModal.url}
                  onChange={e => setConfirmModal(m => m ? { ...m, url: e.target.value } : m)}
                  placeholder="https://calendly.com/..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <p className="text-xs text-gray-400">L'apprenant verra les créneaux et le lien dans son espace Coaching.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button onClick={confirmWithSlots} disabled={!confirmModal.slots.trim() || !!updatingId}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
