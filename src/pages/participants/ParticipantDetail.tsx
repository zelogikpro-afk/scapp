import { useState, useRef } from 'react'
import { Phone, Mail, MapPin, Briefcase, Calendar, CreditCard, BookOpen, ClipboardList, Activity, Edit2, Save, X, Upload, FileText, Trash2 } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Progress } from '../../components/ui/Progress'
import { Card } from '../../components/ui/Card'
import { useAppStore } from '../../store/appStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { Participant } from '../../types'

const TYPE_CONFIG = {
  coaching: { label: 'Coaching', color: 'info' as const },
  training: { label: 'Formation', color: 'purple' as const },
  both: { label: 'Coaching & Formation', color: 'success' as const },
}

const PAY_STATUS = {
  paid: { label: 'Payé', color: 'success' as const },
  partial: { label: 'Partiel', color: 'warning' as const },
  pending: { label: 'En attente', color: 'default' as const },
  overdue: { label: 'En retard', color: 'danger' as const },
  cancelled: { label: 'Annulé', color: 'danger' as const },
}

const SESSION_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500',
  scheduled: 'bg-blue-500',
  cancelled: 'bg-red-400',
  missed: 'bg-gray-300',
  rescheduled: 'bg-amber-500',
}

interface DocFile { name: string; url: string; size: number; created_at: string }

export default function ParticipantDetail({ participant: p, onClose }: { participant: Participant; onClose: () => void }) {
  const [tab, setTab] = useState<'profile' | 'edit' | 'coaching' | 'payments' | 'tests' | 'documents' | 'journey'>('profile')
  const { coachingPacks, coachingSessions, payments, tests, updateParticipant, deleteParticipant } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<DocFile[]>([])
  const [docsLoaded, setDocsLoaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const pPacks = coachingPacks.filter(cp => cp.participantId === p.id)
  const pSessions = coachingSessions.filter(s => s.participantId === p.id).sort((a, b) => b.sessionNumber - a.sessionNumber)
  const pPayments = payments.filter(pay => pay.participantId === p.id)
  const pTests = tests.filter(t => t.participantId === p.id)

  const totalPaid = pPayments.reduce((s, pay) => s + pay.amountPaid, 0)
  const totalOwed = pPayments.reduce((s, pay) => s + pay.remainingAmount, 0)

  // Edit form state
  const [form, setForm] = useState({
    firstName: p.firstName, lastName: p.lastName,
    email: p.email, phone: p.phone, whatsapp: p.whatsapp ?? '',
    gender: p.gender, birthDate: p.birthDate ?? '', cin: p.cin ?? '',
    address: p.address ?? '', profession: p.profession ?? '',
    company: p.company ?? '', emergencyContact: p.emergencyContact ?? '',
    type: p.type, notes: p.notes, isActive: p.isActive,
  })

  async function handleSave() {
    setSaving(true)
    await updateParticipant(p.id, { ...form })
    setSaving(false)
    setTab('profile')
  }

  async function loadDocs() {
    const { data } = await supabase.storage.from('participant-docs').list(`${p.id}/`, { sortBy: { column: 'created_at', order: 'desc' } })
    if (data) {
      const withUrls = await Promise.all(data.map(async f => {
        const { data: urlData } = supabase.storage.from('participant-docs').getPublicUrl(`${p.id}/${f.name}`)
        return { name: f.name, url: urlData.publicUrl, size: f.metadata?.size ?? 0, created_at: f.created_at ?? '' }
      }))
      setDocs(withUrls)
    }
    setDocsLoaded(true)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const path = `${p.id}/${Date.now()}_${file.name}`
      await supabase.storage.from('participant-docs').upload(path, file, { upsert: true })
    }
    await loadDocs()
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDeleteDoc(name: string) {
    if (!window.confirm(`Supprimer "${name}" ?`)) return
    await supabase.storage.from('participant-docs').remove([`${p.id}/${name}`])
    setDocs(d => d.filter(f => f.name !== name))
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'edit', label: 'Modifier' },
    { id: 'coaching', label: `Coaching (${pPacks.length})` },
    { id: 'payments', label: `Paiements (${pPayments.length})` },
    { id: 'tests', label: `Tests (${pTests.length})` },
    { id: 'documents', label: 'Documents' },
    { id: 'journey', label: 'Parcours' },
  ] as const

  return (
    <Modal open onClose={onClose} title="" size="xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar name={`${p.firstName} ${p.lastName}`} size="xl" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{p.firstName} {p.lastName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant={TYPE_CONFIG[p.type].color}>{TYPE_CONFIG[p.type].label}</Badge>
              <Badge variant={p.isActive ? 'success' : 'danger'}>{p.isActive ? 'Actif' : 'Inactif'}</Badge>
              {(p.tags || []).map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t}</span>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${p.phone}`} className="hover:text-blue-600">{p.phone}</a>
              </div>
              {p.email && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Mail className="w-4 h-4 text-gray-400" /><a href={`mailto:${p.email}`} className="hover:text-blue-600">{p.email}</a></div>}
              {p.profession && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Briefcase className="w-4 h-4 text-gray-400" /> {p.profession}</div>}
            </div>
          </div>
          <div className="hidden sm:flex gap-3 items-start">
            <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 min-w-24">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Payé</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalPaid)}</p>
            </div>
            {totalOwed > 0 && (
              <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 min-w-24">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Restant</p>
                <p className="text-base font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totalOwed)}</p>
              </div>
            )}
            <button
              onClick={async () => { if (!confirm(`Supprimer ${p.firstName} ${p.lastName} ?`)) return; await deleteParticipant(p.id); onClose() }}
              className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors"
              title="Supprimer le participant"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'documents' && !docsLoaded) loadDocs() }}
                className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Prénom', value: p.firstName },
              { label: 'Nom', value: p.lastName },
              { label: 'Genre', value: p.gender === 'male' ? 'Homme' : 'Femme' },
              { label: 'Date de naissance', value: p.birthDate ? formatDate(p.birthDate) : '—' },
              { label: 'CIN', value: p.cin || '—' },
              { label: 'Téléphone', value: p.phone },
              { label: 'Email', value: p.email || '—' },
              { label: 'WhatsApp', value: p.whatsapp || '—' },
              { label: 'Adresse', value: p.address || '—' },
              { label: 'Profession', value: p.profession || '—' },
              { label: 'Entreprise', value: p.company || '—' },
              { label: 'Contact urgence', value: p.emergencyContact || '—' },
              { label: 'Inscription', value: formatDate(p.createdAt) },
              { label: 'Notes internes', value: p.notes || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Edit Tab */}
        {tab === 'edit' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom *</label>
                <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone *</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">WhatsApp</label>
                <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Genre</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="female">Femme</option>
                  <option value="male">Homme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date de naissance</label>
                <Input value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} type="date" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CIN</label>
                <Input value={form.cin} onChange={e => setForm(f => ({ ...f, cin: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Profession</label>
                <Input value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Entreprise</label>
                <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="coaching">Coaching</option>
                  <option value="training">Formation</option>
                  <option value="both">Coaching & Formation</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Adresse</label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contact d'urgence</label>
                <Input value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} placeholder="Nom et téléphone" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes internes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Participant actif</label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => setTab('profile')}>Annuler</Button>
              <Button variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />} onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        )}

        {/* Coaching Tab */}
        {tab === 'coaching' && (
          <div className="space-y-4">
            {pPacks.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun pack de coaching</p>}
            {pPacks.map(pack => (
              <Card key={pack.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{pack.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Acheté le {formatDate(pack.purchaseDate)}</p>
                  </div>
                  <Badge variant={pack.status === 'active' ? 'success' : pack.status === 'completed' ? 'info' : 'warning'}>
                    {pack.status === 'active' ? 'Actif' : pack.status === 'completed' ? 'Terminé' : pack.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div><p className="text-xs text-gray-400">Séances</p><p className="font-semibold">{pack.usedSessions}/{pack.totalSessions}</p></div>
                  <div><p className="text-xs text-gray-400">Prix</p><p className="font-semibold">{formatCurrency(pack.price)}</p></div>
                  <div><p className="text-xs text-gray-400">Payé</p><p className="font-semibold text-emerald-600">{formatCurrency(pack.amountPaid)}</p></div>
                  <div><p className="text-xs text-gray-400">Restant</p><p className={`font-semibold ${pack.price - pack.discount - pack.amountPaid > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{formatCurrency(Math.max(0, pack.price - pack.discount - pack.amountPaid))}</p></div>
                </div>
                <Progress value={pack.usedSessions} max={pack.totalSessions} showLabel color="blue" />
                {pSessions.filter(s => s.packId === pack.id).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Séances</p>
                    <div className="space-y-1.5">
                      {pSessions.filter(s => s.packId === pack.id).map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${SESSION_STATUS_COLORS[s.status] || 'bg-gray-300'}`} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Séance #{s.sessionNumber}</span>
                          <span className="text-xs text-gray-400">{formatDate(s.date)} à {s.time}</span>
                          <Badge variant={s.status === 'completed' ? 'success' : s.status === 'scheduled' ? 'info' : 'warning'} size="sm" className="ml-auto">
                            {s.status === 'completed' ? 'Complétée' : s.status === 'scheduled' ? 'Programmée' : s.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Payments Tab */}
        {tab === 'payments' && (
          <div className="space-y-3">
            {pPayments.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun paiement enregistré</p>}
            {pPayments.map(pay => (
              <Card key={pay.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{pay.programName}</p>
                    <p className="text-xs text-gray-400 capitalize">{pay.programType} · {formatDate(pay.date)}</p>
                  </div>
                  <Badge variant={PAY_STATUS[pay.status].color}>{PAY_STATUS[pay.status].label}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-xs text-gray-400">Total</p><p className="font-semibold">{formatCurrency(pay.totalAmount)}</p></div>
                  <div><p className="text-xs text-gray-400">Payé</p><p className="font-semibold text-emerald-600">{formatCurrency(pay.amountPaid)}</p></div>
                  <div><p className="text-xs text-gray-400">Reste</p><p className={`font-semibold ${pay.remainingAmount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{formatCurrency(pay.remainingAmount)}</p></div>
                </div>
                {pay.totalAmount > 0 && (
                  <div className="mt-3">
                    <Progress value={pay.amountPaid} max={pay.totalAmount} showLabel color={pay.status === 'paid' ? 'green' : pay.status === 'overdue' ? 'red' : 'amber'} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Tests Tab */}
        {tab === 'tests' && (
          <div className="space-y-3">
            {pTests.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun test réalisé</p>}
            {pTests.map(test => (
              <Card key={test.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{test.type}</p>
                    <p className="text-xs text-gray-400">{formatDate(test.date)}</p>
                  </div>
                  <Badge variant="purple">{test.type}</Badge>
                </div>
                {test.result && <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Résultat:</span> {test.result}</p>}
                {test.score && <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Score:</span> {test.score}</p>}
                {test.interpretation && <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Interprétation:</span> {test.interpretation}</p>}
              </Card>
            ))}
          </div>
        )}

        {/* Documents Tab */}
        {tab === 'documents' && (
          <div className="space-y-4">
            {/* Upload zone */}
            <div
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {uploading ? 'Upload en cours…' : 'Cliquer pour uploader'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PDF, images, Word, Excel — max 50 MB</p>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" />
            </div>

            {/* File list */}
            {docs.length === 0 && docsLoaded && (
              <p className="text-sm text-gray-400 text-center py-4">Aucun document uploadé</p>
            )}
            {!docsLoaded && (
              <p className="text-sm text-gray-400 text-center py-4">Chargement…</p>
            )}
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.name} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.name.replace(/^\d+_/, '')}</p>
                    <p className="text-xs text-gray-400">{formatSize(doc.size)} · {doc.created_at ? formatDate(doc.created_at) : ''}</p>
                  </div>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium px-2">Ouvrir</a>
                  <button onClick={() => handleDeleteDoc(doc.name)} className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Journey Tab */}
        {tab === 'journey' && (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800" />
            <div className="space-y-4">
              {[
                { icon: '🎯', title: 'Lead reçu', date: p.createdAt, desc: `Via ${p.leadId ? 'Meta Ads' : 'inscription directe'}` },
                { icon: '✅', title: 'Inscrit comme participant', date: p.createdAt, desc: TYPE_CONFIG[p.type].label },
                ...pPacks.map(pack => ({ icon: '📦', title: `Pack acheté: ${pack.name}`, date: pack.purchaseDate, desc: `${pack.totalSessions} séances · ${formatCurrency(pack.price)}` })),
                ...pSessions.filter(s => s.status === 'completed').map(s => ({ icon: '🧭', title: `Séance #${s.sessionNumber} complétée`, date: s.date, desc: s.summary || 'Séance de coaching' })),
                ...pPayments.flatMap(pay => pay.installments.filter(i => i.status === 'paid').map(i => ({ icon: '💳', title: `Paiement: ${formatCurrency(i.amount)}`, date: i.date, desc: `${pay.programName} · ${pay.method}` }))),
                ...pTests.map(t => ({ icon: '📊', title: `Test ${t.type}`, date: t.date, desc: t.result || 'Test réalisé' })),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((event, i) => (
                <div key={i} className="flex items-start gap-4 relative">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-base flex-shrink-0 z-10">
                    {event.icon}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{event.desc}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
