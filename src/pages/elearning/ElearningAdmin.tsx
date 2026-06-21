import { useEffect, useState, useRef } from 'react'
import { supabaseAdmin } from '../../lib/supabase'
import {
  Plus, Pencil, Trash2, X, Search, Users, BookOpen, FileText,
  FlaskConical, Megaphone, Calendar, Upload, ChevronRight, ChevronDown,
  Eye, EyeOff, PlayCircle, Lock, Unlock, RefreshCw, UserCheck,
  UserX, Send, AlertCircle, Bell, Info, Zap
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Session { id: string; name: string; level: string; start_date: string; end_date: string; is_active: boolean }
interface Recording { id: string; promotion_id: string; title: string; file_url: string; duration_minutes: number; order_index: number; created_at: string }
interface ElearningDoc { id: string; level: string; title: string; file_url: string; is_visible: boolean; order_index: number }
interface LearnerAccount { id: string; participant_id?: string; participant_name: string; username: string; password: string; formation_level: string; promotion_id: string | null; is_active: boolean }
interface Participant { id: string; first_name: string; last_name: string; email: string; phone: string }
interface TestUnlock { id: string; learner_id: string; test_type: string }
interface Announcement { id: string; promotion_id: string | null; learner_id: string | null; target: string; type: string; content: string; created_at: string }
interface ScheduleItem { id: string; promotion_id: string; title: string; seance_date: string; seance_time: string; location_or_link: string; notes: string }

const LEVELS = ['N1', 'N2', 'N3']
const LEVEL_LABEL: Record<string, string> = { N1: 'Niveau 1', N2: 'Niveau 2', N3: 'Niveau 3' }
const TESTS = [{ type: 'mapping', label: 'Mapping', icon: '🧠' }, { type: 'ie', label: 'IE', icon: '❤️' }]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>{children}</div>
}

const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
const btn = (variant: 'primary' | 'outline') => variant === 'primary'
  ? "px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
  : "px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"

function genCreds(firstName: string) {
  const year = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 900) + 100)
  const slug = (firstName || 'appr').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '').slice(0, 8)
  return { username: `SC-${year}-${slug}`, password: `${slug}2026` }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ElearningAdmin() {
  type Tab = 'sessions' | 'recordings' | 'documents' | 'tests' | 'announcements' | 'learners'
  const [tab, setTab] = useState<Tab>('sessions')

  const [sessions, setSessions] = useState<Session[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [docs, setDocs] = useState<ElearningDoc[]>([])
  const [learners, setLearners] = useState<LearnerAccount[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [testUnlocks, setTestUnlocks] = useState<TestUnlock[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadError, setUploadError] = useState('')

  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['N1']))
  const [sessionParticipantsOpen, setSessionParticipantsOpen] = useState<Set<string>>(new Set())

  const [sessionModal, setSessionModal] = useState<Partial<Session> | null>(null)
  const [recordingModal, setRecordingModal] = useState<{ data: Partial<Recording>; sessionId: string } | null>(null)
  const [docModal, setDocModal] = useState<Partial<ElearningDoc> | null>(null)
  const [scheduleModal, setScheduleModal] = useState<{ data: Partial<ScheduleItem>; sessionId: string } | null>(null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [syncing, setSyncing] = useState(false)

  // Announcement composer state
  const [annoTarget, setAnnoTarget] = useState<'all' | 'session' | 'learner'>('all')
  const [annoSessionId, setAnnoSessionId] = useState('')
  const [annoLearnerId, setAnnoLearnerId] = useState('')
  const [annoType, setAnnoType] = useState<'info' | 'rappel' | 'urgent'>('info')
  const [annoContent, setAnnoContent] = useState('')
  const [annoSending, setAnnoSending] = useState(false)
  const [annoLearnerSearch, setAnnoLearnerSearch] = useState('')

  const recFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [sRes, rRes, dRes, lRes, pRes, tuRes, aRes, schRes] = await Promise.all([
      supabaseAdmin.from('promotions').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('recordings').select('*').order('order_index'),
      supabaseAdmin.from('elearning_docs').select('*').order('order_index'),
      supabaseAdmin.from('learner_accounts').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('participants').select('id, first_name, last_name, email, phone').order('first_name'),
      supabaseAdmin.from('test_unlocks').select('*'),
      supabaseAdmin.from('announcements').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('session_schedule').select('*').order('seance_date'),
    ])
    setSessions(sRes.data || [])
    setRecordings(rRes.data || [])
    setDocs(dRes.data || [])
    setLearners(lRes.data || [])
    setParticipants(pRes.data || [])
    setTestUnlocks(tuRes.data || [])
    setAnnouncements(aRes.data || [])
    setSchedule(schRes.data || [])
    setLoading(false)
  }

  // ── Sessions ──
  async function saveSession() {
    if (!sessionModal?.name) return
    setSaving(true)
    const payload = { name: sessionModal.name, level: sessionModal.level || 'N1', start_date: sessionModal.start_date || null, end_date: sessionModal.end_date || null, is_active: sessionModal.is_active ?? true }
    if (sessionModal.id) await supabaseAdmin.from('promotions').update(payload).eq('id', sessionModal.id)
    else await supabaseAdmin.from('promotions').insert(payload)
    setSaving(false); setSessionModal(null); await load()
  }
  async function deleteSession(id: string) {
    if (!confirm('Supprimer cette session et tous ses enregistrements ?')) return
    await supabaseAdmin.from('promotions').delete().eq('id', id); await load()
  }
  async function toggleSessionActive(s: Session) {
    await supabaseAdmin.from('promotions').update({ is_active: !s.is_active }).eq('id', s.id)
    setSessions(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !s.is_active } : x))
  }
  async function assignLearnerToSession(learnerId: string, sessionId: string | null) {
    await supabaseAdmin.from('learner_accounts').update({ promotion_id: sessionId }).eq('id', learnerId)
    setLearners(prev => prev.map(x => x.id === learnerId ? { ...x, promotion_id: sessionId } : x))
  }

  // ── Recordings ──
  async function handleRecordingFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadError('')
    setUploading(true); setUploadPct(10)
    // ensure bucket exists
    await supabaseAdmin.storage.createBucket('elearning', { public: true }).catch(() => {})
    const ext = file.name.split('.').pop() || 'mp4'
    const path = `recordings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    setUploadPct(40)
    const { data, error } = await supabaseAdmin.storage.from('elearning').upload(path, file, { cacheControl: '3600', upsert: false })
    setUploadPct(90)
    if (error) {
      setUploadError(`Erreur upload: ${error.message}`)
    } else if (data) {
      const { data: urlData } = supabaseAdmin.storage.from('elearning').getPublicUrl(data.path)
      setRecordingModal(prev => prev ? { ...prev, data: { ...prev.data, file_url: urlData.publicUrl } } : prev)
    }
    setUploadPct(100); setUploading(false)
    if (recFileRef.current) recFileRef.current.value = ''
  }
  async function saveRecording() {
    if (!recordingModal?.data.title) return
    setSaving(true)
    const payload = { promotion_id: recordingModal.sessionId, title: recordingModal.data.title, file_url: recordingModal.data.file_url || '', duration_minutes: recordingModal.data.duration_minutes || 0, order_index: recordingModal.data.order_index || 1 }
    if (recordingModal.data.id) await supabaseAdmin.from('recordings').update(payload).eq('id', recordingModal.data.id)
    else await supabaseAdmin.from('recordings').insert(payload)
    setSaving(false); setRecordingModal(null); await load()
  }
  async function deleteRecording(id: string) {
    if (!confirm('Supprimer cet enregistrement ?')) return
    await supabaseAdmin.from('recordings').delete().eq('id', id); await load()
  }

  // ── Documents ──
  async function handleDocFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setUploadPct(30)
    await supabaseAdmin.storage.createBucket('elearning', { public: true }).catch(() => {})
    const ext = file.name.split('.').pop() || 'pdf'
    const path = `documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabaseAdmin.storage.from('elearning').upload(path, file, { cacheControl: '3600', upsert: false })
    setUploadPct(90)
    if (!error && data) {
      const { data: urlData } = supabaseAdmin.storage.from('elearning').getPublicUrl(data.path)
      setDocModal(prev => prev ? { ...prev, file_url: urlData.publicUrl } : prev)
    }
    setUploadPct(100); setUploading(false); e.target.value = ''
  }
  async function saveDoc() {
    if (!docModal?.title) return
    setSaving(true)
    const payload = { level: docModal.level || 'N1', title: docModal.title, file_url: docModal.file_url || '', is_visible: docModal.is_visible ?? false, order_index: docModal.order_index || 1 }
    if (docModal.id) await supabaseAdmin.from('elearning_docs').update(payload).eq('id', docModal.id)
    else await supabaseAdmin.from('elearning_docs').insert(payload)
    setSaving(false); setDocModal(null); await load()
  }
  async function toggleDocVisible(d: ElearningDoc) {
    await supabaseAdmin.from('elearning_docs').update({ is_visible: !d.is_visible }).eq('id', d.id)
    setDocs(prev => prev.map(x => x.id === d.id ? { ...x, is_visible: !d.is_visible } : x))
  }
  async function deleteDoc(id: string) {
    if (!confirm('Supprimer ce document ?')) return
    await supabaseAdmin.from('elearning_docs').delete().eq('id', id); await load()
  }

  // ── Test unlocks ──
  async function toggleTestUnlock(learnerId: string, testType: string) {
    const exists = testUnlocks.find(u => u.learner_id === learnerId && u.test_type === testType)
    if (exists) {
      await supabaseAdmin.from('test_unlocks').delete().eq('id', exists.id)
      setTestUnlocks(prev => prev.filter(u => u.id !== exists.id))
    } else {
      const { data } = await supabaseAdmin.from('test_unlocks').insert({ learner_id: learnerId, test_type: testType }).select().single()
      if (data) setTestUnlocks(prev => [...prev, data])
    }
  }
  async function unlockAllTests(learnerId: string) {
    for (const t of TESTS) {
      if (!testUnlocks.find(u => u.learner_id === learnerId && u.test_type === t.type))
        await supabaseAdmin.from('test_unlocks').insert({ learner_id: learnerId, test_type: t.type })
    }
    await load()
  }

  // ── Announcements ──
  async function sendAnnouncement() {
    if (!annoContent.trim()) return
    setAnnoSending(true)
    const payload: any = {
      content: annoContent.trim(),
      type: annoType,
      target: annoTarget,
      promotion_id: annoTarget === 'session' ? annoSessionId || null : null,
      learner_id: annoTarget === 'learner' ? annoLearnerId || null : null,
    }
    await supabaseAdmin.from('announcements').insert(payload)
    setAnnoContent(''); setAnnoSending(false); await load()
  }
  async function deleteAnnouncement(id: string) {
    await supabaseAdmin.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  // ── Schedule ──
  async function saveScheduleItem() {
    if (!scheduleModal?.data.title || !scheduleModal?.data.seance_date) return
    setSaving(true)
    const payload = { promotion_id: scheduleModal.sessionId, title: scheduleModal.data.title, seance_date: scheduleModal.data.seance_date, seance_time: scheduleModal.data.seance_time || '', location_or_link: scheduleModal.data.location_or_link || '', notes: scheduleModal.data.notes || '' }
    if (scheduleModal.data.id) await supabaseAdmin.from('session_schedule').update(payload).eq('id', scheduleModal.data.id)
    else await supabaseAdmin.from('session_schedule').insert(payload)
    setSaving(false); setScheduleModal(null); await load()
  }

  // ── Learners sync ──
  async function syncAllParticipants() {
    setSyncing(true)
    const existingNames = new Set(learners.map(l => l.participant_name.toLowerCase()))
    const toCreate = participants.filter(p => !existingNames.has(`${p.first_name} ${p.last_name}`.toLowerCase()))
    for (const p of toCreate) {
      const creds = genCreds(p.first_name)
      await supabaseAdmin.from('learner_accounts').insert({
        participant_name: `${p.first_name} ${p.last_name}`,
        username: creds.username,
        password: creds.password,
        formation_level: 'N1',
        is_active: false,
        promotion_id: null,
      })
    }
    setSyncing(false)
    await load()
  }
  async function toggleLearnerActive(l: LearnerAccount) {
    await supabaseAdmin.from('learner_accounts').update({ is_active: !l.is_active }).eq('id', l.id)
    setLearners(prev => prev.map(x => x.id === l.id ? { ...x, is_active: !l.is_active } : x))
  }
  async function deleteLearner(id: string) {
    if (!confirm('Supprimer ce compte apprenant ?')) return
    await supabaseAdmin.from('learner_accounts').delete().eq('id', id); await load()
  }
  async function updateLearnerField(id: string, field: string, value: string) {
    await supabaseAdmin.from('learner_accounts').update({ [field]: value }).eq('id', id)
    setLearners(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  const toggleSession = (id: string) => setExpandedSessions(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const toggleLevel = (l: string) => setExpandedLevels(prev => { const s = new Set(prev); s.has(l) ? s.delete(l) : s.add(l); return s })
  const toggleSessionParticipants = (id: string) => setSessionParticipantsOpen(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement…</div>

  const TABS = [
    { key: 'sessions',      label: 'Sessions',        icon: Calendar },
    { key: 'recordings',    label: 'Enregistrements', icon: PlayCircle },
    { key: 'documents',     label: 'Documents',       icon: FileText },
    { key: 'tests',         label: 'Tests',           icon: FlaskConical },
    { key: 'announcements', label: 'Annonces',        icon: Megaphone },
    { key: 'learners',      label: 'Apprenants',      icon: Users },
  ] as const

  const ANNO_TYPE_CONFIG = {
    info:   { label: 'Information', icon: Info,         color: 'bg-blue-50 border-blue-200 text-blue-700',   dot: 'bg-blue-400' },
    rappel: { label: 'Rappel',      icon: Bell,         color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400' },
    urgent: { label: 'Urgent',      icon: AlertCircle,  color: 'bg-red-50 border-red-200 text-red-700',      dot: 'bg-red-500' },
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">E-Learning — Administration</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ── SESSIONS ── */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setSessionModal({ level: 'N1', is_active: true })} className={btn('primary')}>
              <Plus className="w-4 h-4 inline mr-1" />Nouvelle session
            </button>
          </div>
          {LEVELS.map(lvl => {
            const lvlSessions = sessions.filter(s => s.level === lvl)
            if (!lvlSessions.length) return null
            return (
              <div key={lvl}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{LEVEL_LABEL[lvl]}</h3>
                <div className="space-y-2">
                  {lvlSessions.map(s => {
                    const recs = recordings.filter(r => r.promotion_id === s.id)
                    const annos = announcements.filter(a => a.promotion_id === s.id)
                    const sched = schedule.filter(sc => sc.promotion_id === s.id)
                    const sessionLearners = learners.filter(l => l.promotion_id === s.id)
                    const isOpen = expandedSessions.has(s.id)
                    const partsOpen = sessionParticipantsOpen.has(s.id)
                    return (
                      <div key={s.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-3 p-4">
                          <button onClick={() => toggleSession(s.id)} className="flex items-center gap-3 flex-1 text-left">
                            {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">{s.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {sessionLearners.length} participant(s) · {recs.length} enreg. · {sched.length} séances
                                {s.start_date ? ` · Du ${new Date(s.start_date).toLocaleDateString('fr-FR')}` : ''}
                              </p>
                            </div>
                          </button>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => toggleSessionActive(s)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${s.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </button>
                            <button onClick={() => setScheduleModal({ data: { promotion_id: s.id }, sessionId: s.id })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Séance"><Calendar className="w-4 h-4" /></button>
                            <button onClick={() => setRecordingModal({ data: { promotion_id: s.id, order_index: recs.length + 1 }, sessionId: s.id })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Enregistrement"><PlayCircle className="w-4 h-4" /></button>
                            <button onClick={() => setSessionModal({ ...s })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => deleteSession(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="border-t border-gray-50 divide-y divide-gray-50">
                            {/* Planning */}
                            {sched.length > 0 && (
                              <div className="px-4 py-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Planning</p>
                                <div className="space-y-1.5">
                                  {sched.map(sc => (
                                    <div key={sc.id} className="flex items-center gap-3 text-sm">
                                      <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                      <span className="font-medium text-gray-700">{sc.title}</span>
                                      <span className="text-gray-400 text-xs">{new Date(sc.seance_date).toLocaleDateString('fr-FR')} {sc.seance_time && `· ${sc.seance_time}`}</span>
                                      {sc.location_or_link && (
                                        sc.location_or_link.startsWith('http')
                                          ? <a href={sc.location_or_link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 truncate max-w-xs">{sc.location_or_link}</a>
                                          : <span className="text-xs text-gray-400">{sc.location_or_link}</span>
                                      )}
                                      <button onClick={() => setScheduleModal({ data: { ...sc }, sessionId: s.id })} className="ml-auto p-1 text-gray-300 hover:text-blue-500"><Pencil className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Enregistrements */}
                            {recs.length > 0 && (
                              <div className="px-4 py-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Enregistrements</p>
                                <div className="space-y-1.5">
                                  {recs.sort((a, b) => a.order_index - b.order_index).map(r => (
                                    <div key={r.id} className="flex items-center gap-3">
                                      <PlayCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                      <span className="text-sm text-gray-800 flex-1 truncate">{r.title}</span>
                                      {r.duration_minutes > 0 && <span className="text-xs text-gray-400">{r.duration_minutes} min</span>}
                                      <button onClick={() => setRecordingModal({ data: { ...r }, sessionId: s.id })} className="p-1 text-gray-300 hover:text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => deleteRecording(r.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Participants section */}
                            <div className="px-4 py-3">
                              <button onClick={() => toggleSessionParticipants(s.id)} className="flex items-center gap-2 w-full text-left">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex-1">Participants ({sessionLearners.length})</p>
                                {partsOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-300" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                              </button>
                              {partsOpen && (
                                <div className="mt-3 space-y-2">
                                  {/* Assigned learners */}
                                  {sessionLearners.length > 0 && (
                                    <div className="space-y-1.5">
                                      {sessionLearners.map(l => (
                                        <div key={l.id} className="flex items-center gap-3 py-1.5 px-2 bg-gray-50 rounded-xl">
                                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                                            {l.participant_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                          </div>
                                          <span className="text-sm text-gray-800 flex-1 truncate">{l.participant_name}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${l.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {l.is_active ? 'Actif' : 'Inactif'}
                                          </span>
                                          <button onClick={() => assignLearnerToSession(l.id, null)} className="p-1 text-gray-300 hover:text-red-500" title="Retirer de cette session">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {/* Add participants */}
                                  {learners.filter(l => !l.promotion_id || l.promotion_id !== s.id).length > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-400 mb-1.5">Ajouter un participant :</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {learners.filter(l => !l.promotion_id).map(l => (
                                          <button key={l.id} onClick={() => assignLearnerToSession(l.id, s.id)}
                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                            <Plus className="w-3 h-3" />{l.participant_name}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {sessionLearners.length === 0 && learners.filter(l => !l.promotion_id).length === 0 && (
                                    <p className="text-xs text-gray-400 py-2">Tous les apprenants sont déjà assignés à une session.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {sessions.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune session créée</p>
            </div>
          )}
        </div>
      )}

      {/* ── RECORDINGS ── */}
      {tab === 'recordings' && (
        <div className="space-y-4">
          {LEVELS.map(lvl => {
            const lvlSessions = sessions.filter(s => s.level === lvl)
            if (!lvlSessions.length) return null
            const isLvlOpen = expandedLevels.has(lvl)
            return (
              <div key={lvl} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => toggleLevel(lvl)} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                  {isLvlOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{lvl}</div>
                  <span className="font-semibold text-gray-900">{LEVEL_LABEL[lvl]}</span>
                  <span className="text-xs text-gray-400">{lvlSessions.length} session(s)</span>
                </button>
                {isLvlOpen && (
                  <div className="border-t border-gray-50">
                    {lvlSessions.map(s => {
                      const recs = recordings.filter(r => r.promotion_id === s.id).sort((a, b) => a.order_index - b.order_index)
                      const isOpen = expandedSessions.has(`rec-${s.id}`)
                      return (
                        <div key={s.id} className="border-t border-gray-50 first:border-0">
                          <div className="flex items-center gap-3 px-5 py-3">
                            <button onClick={() => setExpandedSessions(prev => { const ss = new Set(prev); ss.has(`rec-${s.id}`) ? ss.delete(`rec-${s.id}`) : ss.add(`rec-${s.id}`); return ss })}
                              className="flex items-center gap-2 flex-1 text-left hover:opacity-70">
                              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                              <span className="text-sm font-medium text-gray-700">{s.name}</span>
                              <span className="text-xs text-gray-400">({recs.length} enreg.)</span>
                            </button>
                            <button onClick={() => setRecordingModal({ data: { promotion_id: s.id, order_index: recs.length + 1 }, sessionId: s.id })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                              <Upload className="w-3.5 h-3.5" />Ajouter
                            </button>
                          </div>
                          {isOpen && (
                            <div className="px-8 pb-3 space-y-1.5">
                              {recs.length === 0 ? (
                                <button onClick={() => setRecordingModal({ data: { promotion_id: s.id, order_index: 1 }, sessionId: s.id })}
                                  className="w-full flex items-center gap-3 px-4 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-300 hover:text-blue-500 text-sm transition-colors">
                                  <Upload className="w-5 h-5" />Uploader le premier enregistrement de cette session
                                </button>
                              ) : recs.map(r => (
                                <div key={r.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50">
                                  <PlayCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-800 flex-1 truncate">{r.title}</span>
                                  {r.duration_minutes > 0 && <span className="text-xs text-gray-400">{r.duration_minutes} min</span>}
                                  {r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Voir</a>}
                                  <button onClick={() => setRecordingModal({ data: { ...r }, sessionId: s.id })} className="p-1 text-gray-300 hover:text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => deleteRecording(r.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── DOCUMENTS ── */}
      {tab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setDocModal({ level: 'N1', is_visible: false, order_index: 1 })} className={btn('primary')}>
              <Plus className="w-4 h-4 inline mr-1" />Nouveau document
            </button>
          </div>
          {LEVELS.map(lvl => {
            const lvlDocs = docs.filter(d => d.level === lvl)
            if (!lvlDocs.length) return null
            return (
              <div key={lvl}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{LEVEL_LABEL[lvl]}</h3>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {lvlDocs.sort((a, b) => a.order_index - b.order_index).map(d => (
                    <div key={d.id} className="flex items-center gap-4 px-4 py-3">
                      <FileText className={`w-4 h-4 flex-shrink-0 ${d.is_visible ? 'text-green-500' : 'text-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                        {d.file_url && <p className="text-xs text-gray-400 truncate">{d.file_url.split('/').pop()}</p>}
                      </div>
                      <button onClick={() => toggleDocVisible(d)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${d.is_visible ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {d.is_visible ? <><Eye className="w-3 h-3" />Visible</> : <><EyeOff className="w-3 h-3" />Verrouillé</>}
                      </button>
                      <button onClick={() => setDocModal({ ...d })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteDoc(d.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {docs.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun document</p>
            </div>
          )}
        </div>
      )}

      {/* ── TESTS ── */}
      {tab === 'tests' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Déverrouillez les tests par apprenant. Par défaut tous les tests sont verrouillés.</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {learners.length === 0 ? (
              <p className="text-center py-12 text-gray-400">Aucun apprenant</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Apprenant</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Session</th>
                    {TESTS.map(t => <th key={t.type} className="px-4 py-3 text-center">{t.icon} {t.label}</th>)}
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {learners.map(l => {
                    const sess = sessions.find(s => s.id === l.promotion_id)
                    return (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{l.participant_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{l.username}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">{sess?.name || <span className="text-gray-300">—</span>}</td>
                        {TESTS.map(t => {
                          const unlocked = testUnlocks.some(u => u.learner_id === l.id && u.test_type === t.type)
                          return (
                            <td key={t.type} className="px-4 py-3 text-center">
                              <button onClick={() => toggleTestUnlock(l.id, t.type)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${unlocked ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}>
                                {unlocked ? <><Unlock className="w-3 h-3" />Ouvert</> : <><Lock className="w-3 h-3" />Fermé</>}
                              </button>
                            </td>
                          )
                        })}
                        <td className="px-4 py-3">
                          <button onClick={() => unlockAllTests(l.id)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">Tout ouvrir</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── ANNOUNCEMENTS ── */}
      {tab === 'announcements' && (
        <div className="space-y-5">
          {/* Composer */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Nouvelle annonce</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Type */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Type</p>
                <div className="flex gap-2">
                  {(Object.entries(ANNO_TYPE_CONFIG) as [keyof typeof ANNO_TYPE_CONFIG, typeof ANNO_TYPE_CONFIG.info][]).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button key={key} onClick={() => setAnnoType(key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${annoType === key ? cfg.color : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                        <Icon className="w-4 h-4" />{cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Target */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Destinataires</p>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { key: 'all',     label: '🌍 Tous les apprenants' },
                    { key: 'session', label: '📅 Une session' },
                    { key: 'learner', label: '👤 Un apprenant' },
                  ] as const).map(t => (
                    <button key={t.key} onClick={() => setAnnoTarget(t.key)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${annoTarget === t.key ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {annoTarget === 'session' && (
                  <select value={annoSessionId} onChange={e => setAnnoSessionId(e.target.value)}
                    className="mt-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Choisir une session —</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.level})</option>)}
                  </select>
                )}
                {annoTarget === 'learner' && (
                  <div className="mt-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={annoLearnerSearch} onChange={e => setAnnoLearnerSearch(e.target.value)} placeholder="Rechercher un apprenant…"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {annoLearnerSearch && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                        {learners.filter(l => l.participant_name.toLowerCase().includes(annoLearnerSearch.toLowerCase())).map(l => (
                          <button key={l.id} onClick={() => { setAnnoLearnerId(l.id); setAnnoLearnerSearch(l.participant_name) }}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0">
                            {l.participant_name} <span className="text-gray-400 text-xs font-mono ml-2">{l.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Message</p>
                <textarea value={annoContent} onChange={e => setAnnoContent(e.target.value)} rows={3}
                  placeholder="Ex: La séance de samedi est reportée au dimanche à 10h. Lien Teams inchangé."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {annoTarget === 'all' && `→ ${learners.length} apprenants`}
                  {annoTarget === 'session' && annoSessionId && `→ ${learners.filter(l => l.promotion_id === annoSessionId).length} apprenants`}
                  {annoTarget === 'learner' && annoLearnerId && `→ ${learners.find(l => l.id === annoLearnerId)?.participant_name || ''}`}
                </div>
                <button onClick={sendAnnouncement} disabled={annoSending || !annoContent.trim() || (annoTarget === 'session' && !annoSessionId) || (annoTarget === 'learner' && !annoLearnerId)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  <Send className="w-4 h-4" />{annoSending ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Historique</p>
            {announcements.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">Aucune annonce envoyée</p>
            ) : announcements.map(a => {
              const cfg = ANNO_TYPE_CONFIG[(a.type as keyof typeof ANNO_TYPE_CONFIG) || 'info'] || ANNO_TYPE_CONFIG.info
              const sess = sessions.find(s => s.id === a.promotion_id)
              const learner = learners.find(l => l.id === (a as any).learner_id)
              return (
                <div key={a.id} className={`flex gap-3 p-4 rounded-2xl border ${cfg.color}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{a.content}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs opacity-70">
                      <span>{new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>
                        {sess ? `📅 ${sess.name}` : learner ? `👤 ${learner.participant_name}` : '🌍 Tous'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteAnnouncement(a.id)} className="p-1 opacity-50 hover:opacity-100 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LEARNERS ── */}
      {tab === 'learners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {learners.length} compte(s) · {learners.filter(l => l.is_active).length} actif(s) · {participants.length - learners.length > 0 ? `${participants.length - learners.length} participant(s) sans compte` : 'tous synchronisés'}
            </p>
            <button onClick={syncAllParticipants} disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronisation…' : 'Sync tous les participants'}
            </button>
          </div>

          {learners.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun compte apprenant</p>
              <p className="text-xs mt-1">Cliquez sur "Sync tous les participants" pour générer les comptes automatiquement.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Nom</th>
                    <th className="text-left px-4 py-3">Identifiant</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Mot de passe</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Session</th>
                    <th className="text-center px-4 py-3">Accès</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {learners.map(l => (
                    <tr key={l.id} className={`hover:bg-gray-50 ${!l.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{l.participant_name}</td>
                      <td className="px-4 py-3">
                        <input defaultValue={l.username} onBlur={e => { if (e.target.value !== l.username) updateLearnerField(l.id, 'username', e.target.value) }}
                          className="font-mono text-xs text-gray-600 border-0 bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 hover:bg-gray-100" />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <input defaultValue={l.password} onBlur={e => { if (e.target.value !== l.password) updateLearnerField(l.id, 'password', e.target.value) }}
                          className="font-mono text-xs text-gray-500 border-0 bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 hover:bg-gray-100" />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <select value={l.promotion_id || ''} onChange={async e => { const val = e.target.value || null; await supabaseAdmin.from('learner_accounts').update({ promotion_id: val }).eq('id', l.id); setLearners(prev => prev.map(x => x.id === l.id ? { ...x, promotion_id: val } : x)) }}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 max-w-[160px]">
                          <option value="">— Aucune —</option>
                          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleLearnerActive(l)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${l.is_active ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700'}`}>
                          {l.is_active ? <><UserCheck className="w-3.5 h-3.5" />Actif</> : <><UserX className="w-3.5 h-3.5" />Inactif</>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteLearner(l.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Session modal */}
      {sessionModal && (
        <Modal title={sessionModal.id ? 'Modifier la session' : 'Nouvelle session'} onClose={() => setSessionModal(null)}>
          <div className="p-5 space-y-4">
            <Field label="Nom de la session *"><input value={sessionModal.name || ''} onChange={e => setSessionModal(f => ({ ...f!, name: e.target.value }))} className={inp} placeholder="ex: Promo Juin 2026" /></Field>
            <Field label="Niveau">
              <select value={sessionModal.level || 'N1'} onChange={e => setSessionModal(f => ({ ...f!, level: e.target.value }))} className={inp}>
                {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date de début"><input type="date" value={sessionModal.start_date || ''} onChange={e => setSessionModal(f => ({ ...f!, start_date: e.target.value }))} className={inp} /></Field>
              <Field label="Date de fin"><input type="date" value={sessionModal.end_date || ''} onChange={e => setSessionModal(f => ({ ...f!, end_date: e.target.value }))} className={inp} /></Field>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sessionModal.is_active ?? true} onChange={e => setSessionModal(f => ({ ...f!, is_active: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-700">Session active</span>
            </label>
          </div>
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={() => setSessionModal(null)} className={btn('outline')}>Annuler</button>
            <button onClick={saveSession} disabled={saving || !sessionModal.name} className={btn('primary')}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </Modal>
      )}

      {/* Recording modal */}
      {recordingModal && (
        <Modal title={recordingModal.data.id ? "Modifier l'enregistrement" : 'Ajouter un enregistrement'} onClose={() => { setRecordingModal(null); setUploadError('') }}>
          <div className="p-5 space-y-4">
            <Field label="Titre *"><input value={recordingModal.data.title || ''} onChange={e => setRecordingModal(f => f ? { ...f, data: { ...f.data, title: e.target.value } } : f)} className={inp} placeholder="ex: Séance 1 — Introduction" /></Field>
            <Field label="Durée (min)"><input type="number" min={0} value={recordingModal.data.duration_minutes || 0} onChange={e => setRecordingModal(f => f ? { ...f, data: { ...f.data, duration_minutes: parseInt(e.target.value) || 0 } } : f)} className={inp} /></Field>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Fichier vidéo (MP4, WebM…)</label>
              <label className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                <input ref={recFileRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleRecordingFile} disabled={uploading} className="hidden" />
                {uploading ? (
                  <><div className="w-full bg-gray-200 rounded-full h-2 max-w-xs"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadPct}%` }} /></div><p className="text-sm text-blue-600">Upload… {uploadPct}%</p></>
                ) : recordingModal.data.file_url && recordingModal.data.file_url.includes('supabase') ? (
                  <><PlayCircle className="w-8 h-8 text-green-500" /><p className="text-sm text-green-600 font-medium">Fichier uploadé ✓</p><p className="text-xs text-gray-400">Cliquer pour remplacer</p></>
                ) : (
                  <><Upload className="w-8 h-8 text-gray-300" /><p className="text-sm text-gray-500">Cliquer pour uploader une vidéo</p><p className="text-xs text-gray-400">MP4, WebM, MOV</p></>
                )}
              </label>
              {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ou coller un lien (Teams, YouTube…)</label>
              <input value={recordingModal.data.file_url?.includes('supabase') ? '' : (recordingModal.data.file_url || '')}
                onChange={e => setRecordingModal(f => f ? { ...f, data: { ...f.data, file_url: e.target.value } } : f)}
                className={inp} placeholder="https://teams.microsoft.com/..." />
            </div>
            <Field label="Ordre"><input type="number" min={1} value={recordingModal.data.order_index || 1} onChange={e => setRecordingModal(f => f ? { ...f, data: { ...f.data, order_index: parseInt(e.target.value) || 1 } } : f)} className={inp} /></Field>
          </div>
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={() => { setRecordingModal(null); setUploadError('') }} className={btn('outline')}>Annuler</button>
            <button onClick={saveRecording} disabled={saving || !recordingModal.data.title} className={btn('primary')}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </Modal>
      )}

      {/* Document modal */}
      {docModal && (
        <Modal title={docModal.id ? 'Modifier le document' : 'Nouveau document'} onClose={() => setDocModal(null)}>
          <div className="p-5 space-y-4">
            <Field label="Titre *"><input value={docModal.title || ''} onChange={e => setDocModal(f => ({ ...f!, title: e.target.value }))} className={inp} placeholder="ex: Support Séance 1" /></Field>
            <Field label="Niveau">
              <select value={docModal.level || 'N1'} onChange={e => setDocModal(f => ({ ...f!, level: e.target.value }))} className={inp}>
                {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
              </select>
            </Field>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Fichier PDF</label>
              <label className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                <input type="file" accept="application/pdf" onChange={handleDocFile} disabled={uploading} className="hidden" />
                {uploading ? (
                  <><div className="w-full bg-gray-200 rounded-full h-2 max-w-xs"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadPct}%` }} /></div><p className="text-sm text-blue-600">Upload… {uploadPct}%</p></>
                ) : docModal.file_url ? (
                  <><FileText className="w-8 h-8 text-green-500" /><p className="text-sm text-green-600 font-medium">PDF uploadé ✓</p><p className="text-xs text-gray-400">Cliquer pour remplacer</p></>
                ) : (
                  <><Upload className="w-8 h-8 text-gray-300" /><p className="text-sm text-gray-500">Uploader un PDF</p></>
                )}
              </label>
            </div>
            <Field label="Ordre"><input type="number" min={1} value={docModal.order_index || 1} onChange={e => setDocModal(f => ({ ...f!, order_index: parseInt(e.target.value) || 1 }))} className={inp} /></Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={docModal.is_visible ?? false} onChange={e => setDocModal(f => ({ ...f!, is_visible: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-700">Visible par les apprenants dès maintenant</span>
            </label>
          </div>
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={() => setDocModal(null)} className={btn('outline')}>Annuler</button>
            <button onClick={saveDoc} disabled={saving || !docModal.title} className={btn('primary')}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </Modal>
      )}

      {/* Schedule modal */}
      {scheduleModal && (
        <Modal title={scheduleModal.data.id ? 'Modifier la séance' : 'Ajouter une séance au planning'} onClose={() => setScheduleModal(null)}>
          <div className="p-5 space-y-4">
            <Field label="Titre *"><input value={scheduleModal.data.title || ''} onChange={e => setScheduleModal(f => f ? { ...f, data: { ...f.data, title: e.target.value } } : f)} className={inp} placeholder="ex: Séance 3 — Les émotions" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date *"><input type="date" value={scheduleModal.data.seance_date || ''} onChange={e => setScheduleModal(f => f ? { ...f, data: { ...f.data, seance_date: e.target.value } } : f)} className={inp} /></Field>
              <Field label="Heure"><input type="time" value={scheduleModal.data.seance_time || ''} onChange={e => setScheduleModal(f => f ? { ...f, data: { ...f.data, seance_time: e.target.value } } : f)} className={inp} /></Field>
            </div>
            <Field label="Lien Teams / Lieu"><input value={scheduleModal.data.location_or_link || ''} onChange={e => setScheduleModal(f => f ? { ...f, data: { ...f.data, location_or_link: e.target.value } } : f)} className={inp} placeholder="https://teams.microsoft.com/..." /></Field>
            <Field label="Notes"><input value={scheduleModal.data.notes || ''} onChange={e => setScheduleModal(f => f ? { ...f, data: { ...f.data, notes: e.target.value } } : f)} className={inp} placeholder="Informations complémentaires…" /></Field>
          </div>
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={() => setScheduleModal(null)} className={btn('outline')}>Annuler</button>
            <button onClick={saveScheduleItem} disabled={saving || !scheduleModal.data.title || !scheduleModal.data.seance_date} className={btn('primary')}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
