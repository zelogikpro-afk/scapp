import { useState, useRef, useEffect } from 'react'
import { Phone, Mail, MapPin, Briefcase, Calendar, CreditCard, BookOpen, ClipboardList, Activity, Edit2, Save, X, Upload, FileText, Trash2, Download, RefreshCw, Award } from 'lucide-react'
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
import { COHORTS } from '../../lib/mockData'
import { PROFILE_NAMES, PROFILE_DESCRIPTIONS, PROFILE_PDF, type ProfileKey } from '../../data/testMappingQuestions'
import { getIELevel, getLevelLabel, getLevelColor, getDimInfo, SECTION_ORDER } from '../../data/testIEQuestions'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'

const PROFILE_COLOR: Record<ProfileKey, string> = {
  sentinelle: 'bg-amber-50 text-amber-700 border-amber-200',
  gardien: 'bg-green-50 text-green-700 border-green-200',
  alchimiste: 'bg-red-50 text-red-700 border-red-200',
  navigateur: 'bg-blue-50 text-blue-700 border-blue-200',
  explorateur: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  architecte: 'bg-violet-50 text-violet-700 border-violet-200',
  marcheur: 'bg-slate-50 text-slate-700 border-slate-200',
}

interface TestResult {
  id: string
  test_type: 'ie' | 'mapping'
  created_at: string
  first_name: string
  last_name: string
  scores: Record<string, number> | null
  dominant_profile: ProfileKey | null
  profile_name: string | null
}

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
  const [tab, setTab] = useState<'profile' | 'edit' | 'coaching' | 'payments' | 'tests' | 'documents' | 'journey' | 'certificats'>('profile')
  const { coachingPacks, coachingSessions, payments, tests, updateParticipant, deleteParticipant, updateCoachingPack } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<DocFile[]>([])
  const [docsLoaded, setDocsLoaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingPackSessions, setEditingPackSessions] = useState<string | null>(null)
  const [packSessionInput, setPackSessionInput] = useState('')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testsLoaded, setTestsLoaded] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [diplomes, setDiplomes] = useState<any[]>([])
  const [diplomesLoaded, setDiplomesLoaded] = useState(false)

  useEffect(() => { loadTestResults() }, [])

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
    promotionId: p.promotionId ?? '', reference: p.reference ?? '',
  })

  async function handleSave() {
    setSaving(true)
    await updateParticipant(p.id, { ...form })
    setSaving(false)
    setTab('profile')
  }

  async function loadDiplomes() {
    const fn = p.firstName.trim()
    const ln = p.lastName.trim()
    const fullA = `${fn} ${ln}`.toUpperCase()
    const fullB = `${ln} ${fn}`.toUpperCase()
    const { data } = await supabase.from('diplomes')
      .select('*')
      .or(`participant_name.ilike.%${fn}%,participant_id.eq.${p.id}`)
      .order('session_date', { ascending: false })
    // Filter to keep only records that match this participant
    const filtered = (data || []).filter((d: any) => {
      const name = (d.participant_name || '').toUpperCase().replace(/\s+/g,' ').trim()
      return name === fullA || name === fullB ||
        (name.includes(fn.toUpperCase()) && name.includes(ln.toUpperCase())) ||
        d.participant_id === p.id
    })
    setDiplomes(filtered)
    setDiplomesLoaded(true)
  }

  async function loadTestResults() {
    const fn = p.firstName.trim()
    const ln = p.lastName.trim()
    const [res1, res2] = await Promise.all([
      supabase.from('test_results')
        .select('id, test_type, created_at, first_name, last_name, scores, dominant_profile, profile_name')
        .ilike('first_name', fn).ilike('last_name', ln)
        .order('created_at', { ascending: false }),
      supabase.from('test_results')
        .select('id, test_type, created_at, first_name, last_name, scores, dominant_profile, profile_name')
        .ilike('first_name', ln).ilike('last_name', fn)
        .order('created_at', { ascending: false }),
    ])
    const seen = new Set<string>()
    const merged = [...(res1.data || []), ...(res2.data || [])].filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setTestResults(merged as TestResult[])
    setTestsLoaded(true)
  }

  async function downloadMappingPDF(result: TestResult) {
    const profile = result.dominant_profile
    if (!profile) return
    const filename = PROFILE_PDF[profile]
    if (!filename) return
    setDownloadingPdf(result.id)
    try {
      const url = `${SUPABASE_URL}/storage/v1/object/public/test-profiles/${filename}`
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${result.first_name} ${result.last_name} - ${PROFILE_NAMES[profile]}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      console.error(err)
    }
    setDownloadingPdf(null)
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
    { id: 'tests', label: `Tests (${testResults.length})` },
    { id: 'certificats', label: `Certificats${diplomes.length ? ` (${diplomes.length})` : ''}` },
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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{p.firstName} {p.lastName}</h2>
              {p.reference && <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">{p.reference}</span>}
            </div>
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
              <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'documents' && !docsLoaded) loadDocs(); if (t.id === 'tests' && !testsLoaded) loadTestResults(); if (t.id === 'certificats' && !diplomesLoaded) loadDiplomes() }}
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
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Référence</label>
                <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="SC-2025-001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Promotion</label>
                <select value={form.promotionId} onChange={e => setForm(f => ({ ...f, promotionId: e.target.value }))}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Aucune promotion</option>
                  {COHORTS.map(c => <option key={c.id} value={c.id}>{c.programName} ({(c as any).startDate?.slice(0,7)})</option>)}
                </select>
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
                  <div>
                    <p className="text-xs text-gray-400">Séances réalisées</p>
                    {editingPackSessions === pack.id ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number" min={0} max={pack.totalSessions}
                          value={packSessionInput}
                          onChange={e => setPackSessionInput(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              const val = Math.min(pack.totalSessions, Math.max(0, parseInt(packSessionInput) || 0))
                              await updateCoachingPack(pack.id, { usedSessions: val })
                              setEditingPackSessions(null)
                            } else if (e.key === 'Escape') {
                              setEditingPackSessions(null)
                            }
                          }}
                          autoFocus
                          className="w-14 text-sm font-semibold border border-blue-400 rounded px-1.5 py-0.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none"
                        />
                        <span className="text-xs text-gray-400">/ {pack.totalSessions}</span>
                        <button onClick={async () => {
                          const val = Math.min(pack.totalSessions, Math.max(0, parseInt(packSessionInput) || 0))
                          await updateCoachingPack(pack.id, { usedSessions: val })
                          setEditingPackSessions(null)
                        }} className="text-xs text-blue-600 font-medium hover:underline">✓</button>
                        <button onClick={() => setEditingPackSessions(null)} className="text-xs text-gray-400 hover:underline">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingPackSessions(pack.id); setPackSessionInput(String(pack.usedSessions)) }}
                        className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 group"
                        title="Cliquer pour modifier"
                      >
                        {pack.usedSessions}/{pack.totalSessions}
                        <span className="text-xs text-gray-300 dark:text-gray-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
                      </button>
                    )}
                  </div>
                  <div><p className="text-xs text-gray-400">Prix</p><p className="font-semibold">{formatCurrency(pack.price)}</p></div>
                  <div><p className="text-xs text-gray-400">Payé</p><p className="font-semibold text-emerald-600">{formatCurrency(pack.amountPaid)}</p></div>
                  <div><p className="text-xs text-gray-400">Restant</p><p className={`font-semibold ${pack.price - pack.discount - pack.amountPaid > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{formatCurrency(Math.max(0, pack.price - pack.discount - pack.amountPaid))}</p></div>
                </div>
                <Progress value={pack.usedSessions} max={pack.totalSessions} showLabel color="blue" />
                {pack.weeklySlot && (
                  <p className="text-xs text-gray-400 mt-1.5">🗓 {pack.weeklySlot} · 50 min</p>
                )}
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
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {`Tests liés à ${p.firstName} ${p.lastName}`}
              </p>
              <button onClick={() => { setTestsLoaded(false); setTestResults([]); loadTestResults() }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {!testsLoaded && <p className="text-sm text-gray-400 text-center py-6">Chargement…</p>}

            {testsLoaded && testResults.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Aucun test réalisé</p>
            )}

            {testsLoaded && testResults.map(r => {
              if (r.test_type === 'ie') {
                const totalScore = r.scores ? Object.values(r.scores).reduce((a, b) => a + b, 0) : 0
                return (
                  <Card key={r.id}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Test Intelligence Émotionnelle</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{totalScore}/80</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-medium">IE</span>
                      </div>
                    </div>
                    {r.scores && (
                      <div className="space-y-2">
                        {SECTION_ORDER.map(dim => {
                          const dimInfo = getDimInfo(dim)
                          const score = r.scores![dim] ?? 0
                          const level = getIELevel(score)
                          const color = getLevelColor(level)
                          return (
                            <div key={dim}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <span>{dimInfo.icon}</span> {dimInfo.label}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-1.5 py-0.5 rounded-full border font-medium"
                                    style={{ backgroundColor: color + '20', color, borderColor: color + '50' }}>
                                    {getLevelLabel(level)}
                                  </span>
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{score}/16</span>
                                </div>
                              </div>
                              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                                <div className="h-full rounded-full transition-all" style={{ width: `${(score / 16) * 100}%`, backgroundColor: color }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Card>
                )
              }

              // Mapping
              const profile = r.dominant_profile
              const colorClass = profile ? (PROFILE_COLOR[profile] || 'bg-gray-50 text-gray-700 border-gray-200') : 'bg-gray-50 text-gray-700 border-gray-200'
              const hasPdf = profile && !!PROFILE_PDF[profile]
              return (
                <Card key={r.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Test Mapping des Profils</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">Mapping</span>
                  </div>
                  {profile && (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
                          {PROFILE_NAMES[profile]}
                        </span>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{PROFILE_DESCRIPTIONS[profile]}</p>
                      </div>
                      {hasPdf && (
                        <button
                          onClick={() => downloadMappingPDF(r)}
                          disabled={downloadingPdf === r.id}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingPdf === r.id ? 'Téléchargement…' : 'Rapport PDF'}
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Certificats Tab */}
        {tab === 'certificats' && (
          <div className="space-y-3">
            {!diplomesLoaded && <p className="text-sm text-gray-400 text-center py-8">Chargement…</p>}
            {diplomesLoaded && diplomes.length === 0 && (
              <div className="text-center py-12">
                <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Aucun certificat délivré</p>
              </div>
            )}
            {diplomes.map((d: any) => {
              const levelColor =
                d.level.includes('Master Coach') ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' :
                d.level.includes('Parental') ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' :
                d.level.includes('Formateurs') ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' :
                d.level.includes('Commerciale') ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300' :
                'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              return (
                <div key={d.id} className={`flex items-center gap-4 p-4 rounded-xl border ${levelColor}`}>
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-2 border-current flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{d.level}</p>
                    <p className="text-xs opacity-75 mt-0.5">
                      {d.session_label ? `Session de ${d.session_label}` : ''}
                      {d.session_date ? ` · ${new Date(d.session_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` : ''}
                    </p>
                  </div>
                  {d.cert_number && (
                    <span className="text-xs font-mono bg-white dark:bg-gray-900 border border-current px-2 py-1 rounded-lg opacity-80 flex-shrink-0">
                      N°{d.cert_number}
                    </span>
                  )}
                </div>
              )
            })}
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
          <div className="space-y-6">
            {/* Formation parcours */}
            {p.reference && (() => {
              const cohortIds = p.reference.split(',').map((s: string) => s.trim()).filter(Boolean)
              const participantCohorts = cohortIds
                .map(id => COHORTS.find(c => c.id === id))
                .filter(Boolean)
                .sort((a: any, b: any) => a.startDate.localeCompare(b.startDate))
              if (participantCohorts.length === 0) return null
              return (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Parcours Formation</h4>
                  <div className="space-y-2">
                    {participantCohorts.map((cohort: any, i: number) => {
                      const levelLabel = cohort.programId === 'tp1' ? 'Niveau 1 — Coach de vie' : cohort.programId === 'tp2' ? 'Niveau 2 — Master Coach Thérapeute' : 'Niveau 3 — Master Coach Consultant'
                      const levelColor = cohort.programId === 'tp1' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : cohort.programId === 'tp2' ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' : 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      const statusLabel = cohort.status === 'completed' ? 'Terminée' : cohort.status === 'active' ? 'En cours' : 'À venir'
                      const pay = pPayments.find((pay: any) => {
                        const notes = (pay.notes || '').toLowerCase()
                        return cohort.programId === 'tp1' ? notes.includes('niveau 1') : cohort.programId === 'tp2' ? notes.includes('niveau 2') : notes.includes('niveau 3')
                      })
                      return (
                        <div key={cohort.id} className={`flex items-center gap-3 p-3 rounded-lg border ${levelColor}`}>
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{levelLabel}</p>
                            <p className="text-xs opacity-75">{formatDate(cohort.startDate)} → {cohort.endDate ? formatDate(cohort.endDate) : '…'} · {statusLabel}</p>
                          </div>
                          {pay && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-semibold">{formatCurrency(pay.amountPaid)}</p>
                              {pay.remainingAmount > 0 && <p className="text-xs opacity-60">Reste: {formatCurrency(pay.remainingAmount)}</p>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
            {/* Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Historique</h4>
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
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
