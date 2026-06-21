import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { UserCheck, Clock, CheckCircle, XCircle, Eye, UserPlus, Phone, Mail, MapPin, Calendar, Pencil, Trash2, Save, X } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'
import { useAppStore } from '../../store/appStore'

interface Prospect {
  id: string
  nom: string; prenom: string; genre: string
  date_naissance?: string; telephone: string; email?: string
  adresse?: string; ville?: string; cin?: string
  programme: string; modalite: string; horaire: string
  prix_formation: number; modalite_paiement: string
  montant_paye: number; date_versement_2?: string; date_versement_3?: string
  statut: 'en_attente' | 'valide' | 'refuse'
  created_at: string
}

const statusBadge = {
  en_attente: { label: 'En attente', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
  valide:     { label: 'Validé',     bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
  refuse:     { label: 'Refusé',     bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-400',    icon: XCircle },
}

export default function ProspectsList() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Prospect | null>(null)
  const [converting, setConverting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Prospect>>({})
  const [editSaving, setEditSaving] = useState(false)
  const { addParticipant, addPayment } = useAppStore()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabaseAdmin
      .from('prospect_inscriptions')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setProspects(data as Prospect[])
    setLoading(false)
  }

  function openEdit(p: Prospect) {
    setEditForm({ ...p })
    setEditing(true)
  }

  async function handleEditSave() {
    if (!selected || !editForm) return
    setEditSaving(true)
    const { error } = await supabaseAdmin.from('prospect_inscriptions').update({
      nom: editForm.nom, prenom: editForm.prenom, genre: editForm.genre,
      telephone: editForm.telephone, email: editForm.email || null,
      adresse: editForm.adresse || null, ville: editForm.ville || null,
      cin: editForm.cin || null, date_naissance: editForm.date_naissance || null,
      modalite: editForm.modalite, horaire: editForm.horaire,
      modalite_paiement: editForm.modalite_paiement,
      montant_paye: editForm.montant_paye,
      prix_formation: editForm.prix_formation,
      date_versement_2: editForm.date_versement_2 || null,
      date_versement_3: editForm.date_versement_3 || null,
    }).eq('id', selected.id)
    if (error) { toast.error('Erreur lors de la sauvegarde'); setEditSaving(false); return }
    const updated = { ...selected, ...editForm } as Prospect
    setProspects(prev => prev.map(p => p.id === selected.id ? updated : p))
    setSelected(updated)
    setEditing(false)
    toast.success('Fiche mise à jour')
    setEditSaving(false)
  }

  async function handleDelete(p: Prospect) {
    if (!confirm(`Supprimer la fiche de ${p.prenom} ${p.nom} ?`)) return
    const { error } = await supabaseAdmin.from('prospect_inscriptions').delete().eq('id', p.id)
    if (error) { toast.error('Erreur lors de la suppression'); return }
    setProspects(prev => prev.filter(x => x.id !== p.id))
    setSelected(null)
    toast.success('Fiche supprimée')
  }

  async function updateStatut(id: string, statut: Prospect['statut']) {
    const { error } = await supabaseAdmin.from('prospect_inscriptions').update({ statut }).eq('id', id)
    if (error) { toast.error('Erreur mise à jour'); return }
    setProspects(prev => prev.map(p => p.id === id ? { ...p, statut } : p))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, statut } : prev)
    toast.success('Statut mis à jour')
  }

  async function convertToParticipant(p: Prospect) {
    setConverting(true)
    try {
      await addParticipant({
        firstName: p.prenom, lastName: p.nom, email: p.email ?? '',
        phone: p.telephone, gender: p.genre === 'female' ? 'female' : 'male',
        birthDate: p.date_naissance || undefined, cin: p.cin || undefined,
        address: p.adresse || undefined, type: 'training',
        notes: `Ville: ${p.ville ?? ''}`, tags: [], isActive: true,
        whatsapp: p.telephone,
      })
      const participants = useAppStore.getState().participants
      const newP = participants[0]
      if (p.prix_formation > 0) {
        await addPayment({
          participantId: newP?.id,
          participantName: `${p.nom} ${p.prenom}`,
          programName: p.programme, programType: 'training',
          totalAmount: p.prix_formation,
          amountPaid: p.montant_paye,
          status: p.montant_paye >= p.prix_formation ? 'paid' : p.montant_paye > 0 ? 'partial' : 'pending',
          method: 'cash',
          date: new Date().toISOString().split('T')[0],
          notes: 'Niveau 1',
        } as any)
      }
      await updateStatut(p.id, 'valide')
      toast.success(`${p.prenom} ${p.nom} ajouté comme participant`)
      setSelected(null)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la conversion')
    } finally {
      setConverting(false)
    }
  }

  const counts = {
    en_attente: prospects.filter(p => p.statut === 'en_attente').length,
    valide: prospects.filter(p => p.statut === 'valide').length,
    refuse: prospects.filter(p => p.statut === 'refuse').length,
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Inscriptions reçues</h1>
            <p className="text-sm text-gray-500">Fiches soumises par les prospects</p>
          </div>
        </div>
        <button onClick={load} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Actualiser</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'En attente', count: counts.en_attente, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Validés', count: counts.valide, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Refusés', count: counts.refuse, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.count}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement…</div>
      ) : prospects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune fiche reçue pour l'instant</p>
          <p className="text-xs mt-1">Partagez le lien public pour recevoir des inscriptions</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {['Nom', 'Contact', 'Modalité paiement', 'Montant payé', 'Date', 'Statut', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => {
                const s = statusBadge[p.statut]
                const Icon = s.icon
                return (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{p.nom} {p.prenom}</p>
                      <p className="text-xs text-gray-400">{p.ville || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 dark:text-gray-300">{p.telephone}</p>
                      {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">
                      {p.modalite_paiement === 'complet' ? 'Complet' : p.modalite_paiement === 'acompte' ? 'Acompte + solde' : 'Échelonné (3x)'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">{p.montant_paye.toLocaleString('fr-MA')} MAD</span>
                      {p.montant_paye < p.prix_formation && (
                        <p className="text-xs text-amber-500">Reste: {(p.prix_formation - p.montant_paye).toLocaleString('fr-MA')} MAD</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                        <Icon className="w-3 h-3" />{s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(p)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{selected.nom} {selected.prenom}</h2>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusBadge[selected.statut].bg} ${statusBadge[selected.statut].text}`}>
                  {statusBadge[selected.statut].label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!editing && (
                  <>
                    <button onClick={() => openEdit(selected)} title="Modifier"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(selected)} title="Supprimer"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={() => { setSelected(null); setEditing(false) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-light ml-1">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Edit Form */}
              {editing && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Modifier la fiche</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {([
                      { label: 'Nom', key: 'nom' }, { label: 'Prénom', key: 'prenom' },
                      { label: 'Téléphone', key: 'telephone' }, { label: 'Email', key: 'email' },
                      { label: 'Ville', key: 'ville' }, { label: 'CIN', key: 'cin' },
                      { label: 'Adresse', key: 'adresse' }, { label: 'Date naissance', key: 'date_naissance', type: 'date' },
                    ] as { label: string; key: keyof Prospect; type?: string }[]).map(({ label, key, type }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                        <input type={type || 'text'} value={(editForm[key] as string) ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modalité</label>
                      <select value={editForm.modalite ?? ''} onChange={e => setEditForm(f => ({ ...f, modalite: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="presentiel">Présentiel</option>
                        <option value="enligne">En ligne</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modalité paiement</label>
                      <select value={editForm.modalite_paiement ?? ''} onChange={e => setEditForm(f => ({ ...f, modalite_paiement: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="complet">Paiement complet</option>
                        <option value="acompte">Acompte + solde</option>
                        <option value="echelonne">Échelonné (3x)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Montant payé (MAD)</label>
                      <input type="number" value={editForm.montant_paye ?? 0} onChange={e => setEditForm(f => ({ ...f, montant_paye: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix formation (MAD)</label>
                      <input type="number" value={editForm.prix_formation ?? 0} onChange={e => setEditForm(f => ({ ...f, prix_formation: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setEditing(false)}
                      className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <X className="w-4 h-4" /> Annuler
                    </button>
                    <button onClick={handleEditSave} disabled={editSaving}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> {editSaving ? 'Sauvegarde…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {/* View Mode */}
              {!editing && <>
              {/* Infos perso */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informations personnelles</h3>
                <div className="space-y-2">
                  {[
                    { icon: Phone, label: 'Téléphone', val: selected.telephone },
                    { icon: Mail, label: 'Email', val: selected.email || '—' },
                    { icon: MapPin, label: 'Ville', val: selected.ville || '—' },
                    { icon: Calendar, label: 'Date naissance', val: selected.date_naissance || '—' },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 w-28">{label}</span>
                      <span className="text-gray-900 dark:text-white font-medium">{val}</span>
                    </div>
                  ))}
                  {selected.cin && <div className="flex items-center gap-3 text-sm">
                    <span className="w-4 h-4" /><span className="text-gray-500 w-28">CIN</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selected.cin}</span>
                  </div>}
                  {selected.adresse && <div className="flex items-center gap-3 text-sm">
                    <span className="w-4 h-4" /><span className="text-gray-500 w-28">Adresse</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selected.adresse}</span>
                  </div>}
                </div>
              </div>

              {/* Formation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Formation</h3>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selected.programme}</p>
                <p className="text-xs text-gray-500 mt-1">{selected.modalite === 'presentiel' ? 'Présentiel' : 'En ligne'} · {selected.horaire}</p>
              </div>

              {/* Paiement */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Paiement</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Modalité</span>
                    <span className="font-medium">{selected.modalite_paiement === 'complet' ? 'Complet' : selected.modalite_paiement === 'acompte' ? 'Acompte + solde' : 'Échelonné (3x)'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">{selected.prix_formation.toLocaleString('fr-MA')} MAD</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">1er versement</span><span className="font-semibold text-green-600">{selected.montant_paye.toLocaleString('fr-MA')} MAD</span></div>
                  {(selected.prix_formation - selected.montant_paye) > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500">Reste</span><span className="font-semibold text-amber-600">{(selected.prix_formation - selected.montant_paye).toLocaleString('fr-MA')} MAD</span></div>
                  )}
                  {selected.date_versement_2 && <div className="flex justify-between"><span className="text-gray-500">2e versement prévu</span><span>{selected.date_versement_2}</span></div>}
                  {selected.date_versement_3 && <div className="flex justify-between"><span className="text-gray-500">3e versement prévu</span><span>{selected.date_versement_3}</span></div>}
                </div>
              </div>

              {/* Documents */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Documents à recevoir</h3>
                <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <li>• CIN recto verso</li>
                  <li>• Dernier diplôme obtenu</li>
                </ul>
              </div>

              {/* Actions */}
              {selected.statut === 'en_attente' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => updateStatut(selected.id, 'refuse')}
                    className="flex-1 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Refuser
                  </button>
                  <button onClick={() => convertToParticipant(selected)} disabled={converting}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    {converting ? 'Conversion...' : 'Valider → Participant'}
                  </button>
                </div>
              )}
              {selected.statut === 'valide' && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4" /> Ce prospect a été converti en participant
                </div>
              )}
              </>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
