import { useEffect, useState, useRef } from 'react'
import { supabaseAdmin } from '../../lib/supabase'
import {
  Plus, Pencil, Trash2, X, Search, Users, BookOpen, FileText, Mail,
  FlaskConical, Megaphone, Calendar, Upload, ChevronRight, ChevronDown,
  Eye, EyeOff, PlayCircle, Lock, Unlock, RefreshCw, UserCheck,
  UserX, Send, AlertCircle, Bell, Info, Zap, Award
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Session { id: string; name: string; level: string; start_date: string; end_date: string; is_active: boolean }
interface Recording { id: string; promotion_id: string; title: string; file_url: string; duration_minutes: number; order_index: number; created_at: string }
interface ElearningDoc { id: string; level: string; title: string; file_url: string; is_visible: boolean; order_index: number; excluded_promotion_ids?: string[]; excluded_learner_ids?: string[] }
interface LearnerAccount { id: string; participant_id?: string; participant_name: string; username: string; password: string; formation_level: string; promotion_id: string | null; is_active: boolean; last_login?: string | null; login_count?: number }
interface ActivityLogItem { id: string; learner_id: string; action: string; page: string | null; details: string | null; created_at: string }
interface Participant { id: string; first_name: string; last_name: string; email: string; phone: string }
interface TestUnlock { id: string; learner_id: string; test_type: string }
interface Announcement { id: string; promotion_id: string | null; learner_id: string | null; target: string; type: string; content: string; created_at: string }
interface ScheduleItem { id: string; promotion_id: string; title: string; seance_date: string; seance_time: string; location_or_link: string; notes: string }

const LEVELS = ['N1', 'N2', 'N3']
const LEVEL_LABEL: Record<string, string> = { N1: 'Niveau 1', N2: 'Niveau 2', N3: 'Niveau 3' }
const TESTS = [
  { type: 'mapping', label: 'Mapping', icon: '🧠' },
  { type: 'ie', label: 'IE', icon: '❤️' },
  { type: 'qs', label: 'QS', icon: '🏆' },
  { type: 'compass', label: 'Compass', icon: '🧭' },
  { type: 'valeurs', label: 'Valeurs', icon: '💎' },
  { type: 'quiz_coach', label: 'Quiz N1', icon: '📝' },
  { type: 'quiz_coach_n2', label: 'Quiz N2', icon: '📋' },
  { type: 'quiz_dev_pers', label: 'Quiz Dév. Pers.', icon: '🌱' },
]

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

function genCreds(firstName: string, lastName: string) {
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')
  const first = normalize(firstName || 'appr')
  const last = normalize(lastName || '')
  const username = last ? `${first[0]}.${last}` : first
  return { username, password: `${first}2026` }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ElearningAdmin() {
  type Tab = 'sessions' | 'recordings' | 'documents' | 'tests' | 'announcements' | 'learners' | 'digital' | 'activity'
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
  const [sendingAccessId, setSendingAccessId] = useState<string | null>(null)

  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['N1']))
  const [sessionParticipantsOpen, setSessionParticipantsOpen] = useState<Set<string>>(new Set())

  const [sessionModal, setSessionModal] = useState<Partial<Session> | null>(null)
  const [recordingModal, setRecordingModal] = useState<{ data: Partial<Recording>; sessionId: string } | null>(null)
  const [docModal, setDocModal] = useState<Partial<ElearningDoc> | null>(null)
  const [visibilityModal, setVisibilityModal] = useState<ElearningDoc | null>(null)
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

  // Digital state
  interface DigitalTaskAdmin { id: string; title: string; description: string | null; platform: string | null; deadline: string | null; status: string; priority: string; notes: string | null; created_at: string }
  interface DigitalPostAdmin { id: string; task_id: string | null; platform: string; subject: string; chosen_caption: string | null; chosen_hashtags: string | null; canva_url: string | null; status: string; admin_comment: string | null; created_at: string; submitted_at: string | null }
  const [digitalTasks, setDigitalTasks] = useState<DigitalTaskAdmin[]>([])
  const [digitalPosts, setDigitalPosts] = useState<DigitalPostAdmin[]>([])
  const [digitalSubTab, setDigitalSubTab] = useState<'tasks' | 'posts'>('tasks')
  const [digitalTaskModal, setDigitalTaskModal] = useState<Partial<DigitalTaskAdmin> | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; comment: string } | null>(null)
  const [digitalSaving, setDigitalSaving] = useState(false)

  // Quiz results for certificate date editing
  interface QuizResult { id: string; test_type: string; first_name: string; last_name: string; participant_id: string | null; created_at: string }
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [quizDateEdits, setQuizDateEdits] = useState<Record<string, string>>({})
  const [quizDateSaving, setQuizDateSaving] = useState<Record<string, boolean>>({})

  async function loadQuizResults() {
    const { data } = await supabaseAdmin.from('test_results')
      .select('id, test_type, first_name, last_name, participant_id, created_at')
      .in('test_type', ['quiz_coach', 'quiz_coach_n2', 'quiz_coach_n3', 'quiz_dev_pers'])
      .order('last_name')
    setQuizResults(data || [])
  }

  async function saveQuizDate(id: string) {
    const newDate = quizDateEdits[id]
    if (!newDate) return
    setQuizDateSaving(prev => ({ ...prev, [id]: true }))
    await supabaseAdmin.from('test_results').update({ created_at: new Date(newDate).toISOString() }).eq('id', id)
    setQuizResults(prev => prev.map(r => r.id === id ? { ...r, created_at: new Date(newDate).toISOString() } : r))
    setQuizDateEdits(prev => { const n = { ...prev }; delete n[id]; return n })
    setQuizDateSaving(prev => ({ ...prev, [id]: false }))
  }

  // Activity log state
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([])
  const [activitySearch, setActivitySearch] = useState('')
  const [activityLearnerFilter, setActivityLearnerFilter] = useState('')

  async function loadActivity() {
    const { data } = await supabaseAdmin.from('learner_activity_log')
      .select('*').order('created_at', { ascending: false }).limit(500)
    setActivityLog(data || [])
  }

  async function loadDigital() {
    const [tRes, pRes] = await Promise.all([
      supabaseAdmin.from('digital_tasks').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('digital_posts').select('*').order('created_at', { ascending: false }),
    ])
    setDigitalTasks(tRes.data || [])
    setDigitalPosts(pRes.data || [])
  }

  async function saveDigitalTask() {
    if (!digitalTaskModal?.title) return
    setDigitalSaving(true)
    const payload = {
      title: digitalTaskModal.title,
      description: digitalTaskModal.description || null,
      platform: digitalTaskModal.platform || null,
      deadline: digitalTaskModal.deadline || null,
      status: digitalTaskModal.status || 'todo',
      priority: digitalTaskModal.priority || 'normal',
      notes: digitalTaskModal.notes || null,
    }
    if (digitalTaskModal.id) {
      await supabaseAdmin.from('digital_tasks').update(payload).eq('id', digitalTaskModal.id)
    } else {
      await supabaseAdmin.from('digital_tasks').insert(payload)
    }
    setDigitalSaving(false)
    setDigitalTaskModal(null)
    await loadDigital()
  }

  async function deleteDigitalTask(id: string) {
    if (!confirm('Supprimer cette tâche ?')) return
    await supabaseAdmin.from('digital_tasks').delete().eq('id', id)
    await loadDigital()
  }

  async function approvePost(id: string) {
    await supabaseAdmin.from('digital_posts').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id)
    setDigitalPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p))
  }

  async function rejectPost(id: string, comment: string) {
    await supabaseAdmin.from('digital_posts').update({ status: 'rejected', admin_comment: comment, reviewed_at: new Date().toISOString() }).eq('id', id)
    setDigitalPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected', admin_comment: comment } : p))
    setRejectModal(null)
  }

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
  async function saveDocRestrictions(doc: ElearningDoc, excludedPromos: string[], excludedLearners: string[]) {
    let config: Record<string, { excluded_promotion_ids: string[]; excluded_learner_ids: string[] }> = {}
    try {
      const { data } = await supabaseAdmin.storage.from('elearning').download('config/doc_visibility.json')
      if (data) config = JSON.parse(await data.text()) || {}
    } catch { /* no config yet */ }
    if (!excludedPromos.length && !excludedLearners.length) {
      delete config[doc.id]
    } else {
      config[doc.id] = { excluded_promotion_ids: excludedPromos, excluded_learner_ids: excludedLearners }
    }
    const blob = new Blob([JSON.stringify(config)], { type: 'application/json' })
    await supabaseAdmin.storage.from('elearning').upload('config/doc_visibility.json', blob, { upsert: true })
    setDocs(prev => prev.map(x => x.id === doc.id ? { ...x, excluded_promotion_ids: excludedPromos, excluded_learner_ids: excludedLearners } : x))
    setVisibilityModal(null)
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
      const creds = genCreds(p.first_name, p.last_name)
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
  async function sendAccessEmail(l: LearnerAccount) {
    if (!l.participant_id) { toast.error('Aucun participant lié à ce compte'); return }
    setSendingAccessId(l.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/send-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ learnerId: l.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      toast.success(`Email envoyé à ${json.email}`)
    } catch (err: any) {
      toast.error(err.message || 'Erreur envoi email')
    }
    setSendingAccessId(null)
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
    { key: 'digital',       label: '📱 Digital',      icon: Zap },
    { key: 'activity',      label: 'Activité',        icon: Eye },
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
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'digital') loadDigital(); if (t.key === 'activity') loadActivity(); if (t.key === 'tests') loadQuizResults() }}
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
                      <button onClick={() => setVisibilityModal(d)} title="Gérer la visibilité par session/apprenant"
                        className={`p-1.5 rounded-lg transition-colors ${(d.excluded_promotion_ids?.length || d.excluded_learner_ids?.length) ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`}>
                        <Users className="w-4 h-4" />
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

          {/* Dates des certificats */}
          {quizResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <h2 className="font-semibold text-gray-900">Dates des certificats</h2>
                <span className="text-xs text-gray-400 ml-1">— Corrigez les dates affichées sur les certificats</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Apprenant</th>
                    <th className="text-left px-4 py-3">Quiz</th>
                    <th className="text-left px-4 py-3">Date actuelle</th>
                    <th className="text-left px-4 py-3">Corriger la date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quizResults.map(r => {
                    const quizLabel = r.test_type === 'quiz_coach' ? 'Quiz N1' : r.test_type === 'quiz_coach_n2' ? 'Quiz N2' : r.test_type === 'quiz_dev_pers' ? 'Quiz Dév. Pers.' : 'Quiz N3'
                    const currentDate = new Date(r.created_at).toLocaleDateString('fr-FR')
                    const editValue = quizDateEdits[r.id] ?? r.created_at.slice(0, 10)
                    const isDirty = quizDateEdits[r.id] && quizDateEdits[r.id] !== r.created_at.slice(0, 10)
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.last_name} {r.first_name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.test_type === 'quiz_coach' ? 'bg-blue-100 text-blue-700' : r.test_type === 'quiz_coach_n2' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{quizLabel}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{currentDate}</td>
                        <td className="px-4 py-3">
                          <input type="date" value={editValue}
                            onChange={e => setQuizDateEdits(prev => ({ ...prev, [r.id]: e.target.value }))}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </td>
                        <td className="px-4 py-3">
                          {isDirty && (
                            <button onClick={() => saveQuizDate(r.id)} disabled={quizDateSaving[r.id]}
                              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                              {quizDateSaving[r.id] ? '…' : 'Enregistrer'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => sendAccessEmail(l)} disabled={sendingAccessId === l.id} title="Envoyer les accès par email"
                            className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg disabled:opacity-40 transition-colors">
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteLearner(l.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {/* Visibility restrictions modal */}
      {visibilityModal && (
        <VisibilityModal
          doc={visibilityModal}
          sessions={sessions}
          learners={learners}
          onClose={() => setVisibilityModal(null)}
          onSave={saveDocRestrictions}
        />
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

      {/* ── DIGITAL ── */}
      {tab === 'digital' && (
        <div className="space-y-5">
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-purple-50 p-1 rounded-xl w-fit">
            <button onClick={() => setDigitalSubTab('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${digitalSubTab === 'tasks' ? 'bg-white text-purple-800 shadow-sm' : 'text-purple-500 hover:text-purple-700'}`}>
              ✅ Tâches
            </button>
            <button onClick={() => setDigitalSubTab('posts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${digitalSubTab === 'posts' ? 'bg-white text-purple-800 shadow-sm' : 'text-purple-500 hover:text-purple-700'}`}>
              📋 Posts à valider
              {digitalPosts.filter(p => p.status === 'pending').length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {digitalPosts.filter(p => p.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {/* Tasks sub-tab */}
          {digitalSubTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setDigitalTaskModal({ status: 'todo', priority: 'normal' })} className={btn('primary')}>
                  <Plus className="w-4 h-4 inline mr-1" />Nouvelle tâche
                </button>
              </div>
              {digitalTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">Aucune tâche digitale</div>
              ) : (
                <div className="space-y-2">
                  {digitalTasks.map(task => (
                    <div key={task.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{task.title}</p>
                          {task.platform && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">{task.platform}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'low' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                            {task.priority === 'high' ? 'Urgent' : task.priority === 'low' ? 'Faible' : 'Normal'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'todo' ? 'bg-gray-100 text-gray-600' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : task.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {task.status === 'todo' ? 'À faire' : task.status === 'in_progress' ? 'En cours' : task.status === 'pending' ? 'En attente' : task.status === 'approved' ? 'Approuvé' : 'Publié'}
                          </span>
                        </div>
                        {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                        {task.deadline && <p className="text-xs text-gray-400 mt-0.5">📅 {new Date(task.deadline).toLocaleDateString('fr-FR')}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => setDigitalTaskModal({ ...task })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteDigitalTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Posts sub-tab */}
          {digitalSubTab === 'posts' && (
            <div className="space-y-3">
              {digitalPosts.filter(p => p.status === 'pending').length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
                  <p className="text-3xl mb-2">✅</p>
                  <p>Aucun post en attente de validation</p>
                </div>
              ) : (
                digitalPosts.filter(p => p.status === 'pending').map(post => (
                  <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{post.platform === 'instagram' ? '📸' : post.platform === 'linkedin' ? '💼' : post.platform === 'story' ? '📱' : post.platform === 'facebook' ? '📘' : '📌'}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 capitalize">{post.platform}</p>
                        <p className="text-xs text-gray-500">{post.subject}</p>
                        {post.submitted_at && <p className="text-xs text-gray-400">Soumis le {new Date(post.submitted_at).toLocaleDateString('fr-FR')}</p>}
                      </div>
                    </div>
                    {post.chosen_caption && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{post.chosen_caption}</p>
                    )}
                    {post.chosen_hashtags && (
                      <p className="text-xs text-purple-500 font-mono">{post.chosen_hashtags}</p>
                    )}
                    {post.canva_url && (
                      <a href={post.canva_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                        🎨 Voir le design Canva
                      </a>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => approvePost(post.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
                        ✅ Approuver
                      </button>
                      <button onClick={() => setRejectModal({ id: post.id, comment: '' })}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-medium transition-colors">
                        ❌ Refuser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Digital task modal */}
      {digitalTaskModal && (
        <Modal title={digitalTaskModal.id ? 'Modifier la tâche' : 'Nouvelle tâche digitale'} onClose={() => setDigitalTaskModal(null)} wide>
          <div className="p-5 space-y-4">
            <Field label="Titre *"><input value={digitalTaskModal.title || ''} onChange={e => setDigitalTaskModal(f => ({ ...f!, title: e.target.value }))} className={inp} placeholder="Titre de la tâche" /></Field>
            <Field label="Description"><textarea value={digitalTaskModal.description || ''} onChange={e => setDigitalTaskModal(f => ({ ...f!, description: e.target.value }))} rows={2} className={inp} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plateforme">
                <select value={digitalTaskModal.platform || ''} onChange={e => setDigitalTaskModal(f => ({ ...f!, platform: e.target.value }))} className={inp}>
                  <option value="">— Sélectionner —</option>
                  <option value="instagram">📸 Instagram</option>
                  <option value="linkedin">💼 LinkedIn</option>
                  <option value="story">📱 Story</option>
                  <option value="facebook">📘 Facebook</option>
                  <option value="autre">📌 Autre</option>
                </select>
              </Field>
              <Field label="Deadline"><input type="date" value={digitalTaskModal.deadline || ''} onChange={e => setDigitalTaskModal(f => ({ ...f!, deadline: e.target.value }))} className={inp} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Statut">
                <select value={digitalTaskModal.status || 'todo'} onChange={e => setDigitalTaskModal(f => ({ ...f!, status: e.target.value }))} className={inp}>
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvé</option>
                  <option value="published">Publié</option>
                </select>
              </Field>
              <Field label="Priorité">
                <select value={digitalTaskModal.priority || 'normal'} onChange={e => setDigitalTaskModal(f => ({ ...f!, priority: e.target.value }))} className={inp}>
                  <option value="low">Faible</option>
                  <option value="normal">Normal</option>
                  <option value="high">Urgent</option>
                </select>
              </Field>
            </div>
            <Field label="Notes"><textarea value={digitalTaskModal.notes || ''} onChange={e => setDigitalTaskModal(f => ({ ...f!, notes: e.target.value }))} rows={2} className={inp} /></Field>
          </div>
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={() => setDigitalTaskModal(null)} className={btn('outline')}>Annuler</button>
            <button onClick={saveDigitalTask} disabled={digitalSaving || !digitalTaskModal.title} className={btn('primary')}>{digitalSaving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </Modal>
      )}

      {/* Reject post modal */}
      {rejectModal && (
        <Modal title="Refuser le post" onClose={() => setRejectModal(null)}>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">Indiquez la raison du refus (visible par la chargée digital) :</p>
            <textarea
              value={rejectModal.comment}
              onChange={e => setRejectModal(f => f ? { ...f, comment: e.target.value } : f)}
              rows={4}
              placeholder="Ex: Caption trop longue, revoir le ton…"
              className={inp}
            />
          </div>
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={() => setRejectModal(null)} className={btn('outline')}>Annuler</button>
            <button onClick={() => rejectPost(rejectModal.id, rejectModal.comment)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
              Confirmer le refus
            </button>
          </div>
        </Modal>
      )}

      {/* ── ACTIVITÉ ── */}
      {tab === 'activity' && (() => {
        const ACTION_LABELS: Record<string, string> = { login: 'Connexion', page_view: 'Page consultée' }
        const learnerById = Object.fromEntries(learners.map(l => [l.id, l]))
        const filteredLearners = learners
          .filter(l => l.participant_name.toLowerCase().includes(activitySearch.toLowerCase()) || l.username.toLowerCase().includes(activitySearch.toLowerCase()))
          .slice()
          .sort((a, b) => (b.last_login || '').localeCompare(a.last_login || ''))
        const filteredLog = activityLog.filter(a => !activityLearnerFilter || a.learner_id === activityLearnerFilter)

        function timeAgo(iso: string | null | undefined) {
          if (!iso) return 'Jamais connecté'
          const diffMs = Date.now() - new Date(iso).getTime()
          const mins = Math.floor(diffMs / 60000)
          if (mins < 1) return "À l'instant"
          if (mins < 60) return `Il y a ${mins} min`
          const hrs = Math.floor(mins / 60)
          if (hrs < 24) return `Il y a ${hrs} h`
          const days = Math.floor(hrs / 24)
          if (days < 30) return `Il y a ${days} j`
          return new Date(iso).toLocaleDateString('fr-FR')
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={activitySearch} onChange={e => setActivitySearch(e.target.value)}
                  placeholder="Rechercher un apprenant…"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={loadActivity} className={btn('outline')}>
                <RefreshCw className="w-4 h-4 inline mr-1" />Actualiser
              </button>
            </div>

            {/* Dernières connexions */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Dernières connexions</h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-3">Apprenant</th>
                      <th className="text-left px-4 py-3">Identifiant</th>
                      <th className="text-left px-4 py-3">Dernière connexion</th>
                      <th className="text-left px-4 py-3">Connexions</th>
                      <th className="text-left px-4 py-3">Statut</th>
                      <th className="text-right px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLearners.map(l => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{l.participant_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.username}</td>
                        <td className="px-4 py-3">
                          <span className={l.last_login ? 'text-gray-700' : 'text-gray-400 italic'}>{timeAgo(l.last_login)}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{l.login_count ?? 0}</td>
                        <td className="px-4 py-3">
                          {l.is_active
                            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actif</span>
                            : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Désactivé</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setActivityLearnerFilter(l.id === activityLearnerFilter ? '' : l.id)}
                            className="text-xs text-blue-600 hover:underline">
                            {activityLearnerFilter === l.id ? 'Voir tout' : 'Voir activité'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLearners.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun apprenant trouvé</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Journal d'activité */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">
                  Journal d'activité {activityLearnerFilter && learnerById[activityLearnerFilter] ? `— ${learnerById[activityLearnerFilter].participant_name}` : ''}
                </h2>
                {activityLearnerFilter && (
                  <button onClick={() => setActivityLearnerFilter('')} className="text-xs text-gray-400 hover:text-gray-600">Réinitialiser le filtre</button>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {filteredLog.slice(0, 200).map(a => {
                  const l = learnerById[a.learner_id]
                  return (
                    <div key={a.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.action === 'login' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      <span className="font-medium text-gray-800 flex-shrink-0">{l?.participant_name || 'Apprenant inconnu'}</span>
                      <span className="text-gray-400 flex-shrink-0">{ACTION_LABELS[a.action] || a.action}</span>
                      {a.page && <span className="text-gray-400 text-xs flex-shrink-0">· {a.page}</span>}
                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{new Date(a.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  )
                })}
                {filteredLog.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-400">Aucune activité enregistrée</div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Visibility Modal ──────────────────────────────────────────────────────────
function VisibilityModal({ doc, sessions, learners, onClose, onSave }: {
  doc: ElearningDoc
  sessions: Session[]
  learners: LearnerAccount[]
  onClose: () => void
  onSave: (doc: ElearningDoc, excludedPromos: string[], excludedLearners: string[]) => Promise<void>
}) {
  const [excludedPromos, setExcludedPromos] = useState<string[]>(doc.excluded_promotion_ids || [])
  const [excludedLearners, setExcludedLearners] = useState<string[]>(doc.excluded_learner_ids || [])
  const [saving, setSaving] = useState(false)

  function togglePromo(id: string) {
    setExcludedPromos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleLearner(id: string) {
    setExcludedLearners(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  async function handleSave() {
    setSaving(true)
    await onSave(doc, excludedPromos, excludedLearners)
    setSaving(false)
  }

  const restrictionsCount = excludedPromos.length + excludedLearners.length

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">Visibilité — {doc.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {restrictionsCount === 0 ? 'Visible pour tous les apprenants du niveau ' + doc.level : `${restrictionsCount} restriction${restrictionsCount > 1 ? 's' : ''} active${restrictionsCount > 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Promotions */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Masquer pour ces sessions ({excludedPromos.length} exclue{excludedPromos.length > 1 ? 's' : ''})
            </p>
            <div className="space-y-1.5">
              {sessions.map(s => (
                <label key={s.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors ${excludedPromos.includes(s.id) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                  <input type="checkbox" checked={excludedPromos.includes(s.id)} onChange={() => togglePromo(s.id)} className="rounded text-orange-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.level}</p>
                  </div>
                  {excludedPromos.includes(s.id) && <span className="text-xs text-orange-600 font-medium">Masqué</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Learners */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Masquer pour ces apprenants ({excludedLearners.length} exclu{excludedLearners.length > 1 ? 's' : ''})
            </p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {learners.map(l => (
                <label key={l.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors ${excludedLearners.includes(l.id) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                  <input type="checkbox" checked={excludedLearners.includes(l.id)} onChange={() => toggleLearner(l.id)} className="rounded text-orange-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{l.username}</p>
                    {l.participant_name && <p className="text-xs text-gray-400">{l.participant_name}</p>}
                  </div>
                  {excludedLearners.includes(l.id) && <span className="text-xs text-orange-600 font-medium">Masqué</span>}
                </label>
              ))}
              {learners.length === 0 && <p className="text-sm text-gray-400 py-2">Aucun apprenant</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#1D3462] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
