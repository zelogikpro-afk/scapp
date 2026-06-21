import { useState, useEffect, useRef } from 'react'
import { Plus, ClipboardList, X, Trash2, Link, Copy, ExternalLink, Download, ChevronDown, ChevronUp, Eye, Mail, Phone, Calendar, Search, ArrowUpDown, RefreshCw } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import { PROFILE_NAMES, PROFILE_DESCRIPTIONS, type ProfileKey } from '../../data/testMappingQuestions'
import { getIELevel, getLevelColor, SECTION_ORDER as IE_SECTION_ORDER, getDimInfo, IE_QUESTIONS, getDimContent, type IEDimension } from '../../data/testIEQuestions'
import { QUESTIONS as MAPPING_QUESTIONS } from '../../data/testMappingQuestions'
import IEReportTemplate, { PAGE_W, PAGE_H } from '../test/IEReportTemplate'
import QSReportTemplate from '../test/QSReportTemplate'
import { QS_PILIER_ORDER, getPilierInfo, getPilierScore, getQSLevel, getTotalScore, getQSGlobalLevel } from '../../data/testQSQuestions'
import type { TestType } from '../../types'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'

const TEST_URL = `${window.location.origin}/test/mapping`
const TEST_IE_URL = `${window.location.origin}/test/ie`
const TEST_QS_URL = `${window.location.origin}/test/qs`

const TEST_TYPES: TestType[] = ['DISC', 'MBTI', 'Enneagram', 'Life Wheel', 'Values', 'Ikigai', 'Strengths', 'LifeBook']

const TEST_COLORS: Record<TestType, string> = {
  DISC: 'info', MBTI: 'purple', Enneagram: 'warning', 'Life Wheel': 'success',
  Values: 'default', Ikigai: 'info', Strengths: 'success', LifeBook: 'purple',
}

const PROFILE_EMOJI: Record<ProfileKey, string> = {
  sentinelle: '👑', gardien: '🌳', alchimiste: '🔥',
  navigateur: '🌊', explorateur: '🌍', architecte: '🏛️', marcheur: '⛈️',
}

const PROFILE_COLOR: Record<ProfileKey, string> = {
  sentinelle: 'bg-amber-50 text-amber-700 border-amber-200',
  gardien: 'bg-green-50 text-green-700 border-green-200',
  alchimiste: 'bg-red-50 text-red-700 border-red-200',
  navigateur: 'bg-blue-50 text-blue-700 border-blue-200',
  explorateur: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  architecte: 'bg-violet-50 text-violet-700 border-violet-200',
  marcheur: 'bg-gray-50 text-gray-700 border-gray-200',
}

interface IEResult {
  id: string
  created_at: string
  first_name: string
  last_name: string
  email: string
  phone: string
  scores: Record<IEDimension, number>
}

const IE_SCALE: Record<number, string> = { 1: 'Rarement', 2: 'Parfois', 3: 'Souvent', 4: 'Toujours' }

function IEDetailModal({ result, onClose, onDownload, downloading }: {
  result: IEResult; onClose: () => void
  onDownload: () => void; downloading: boolean
}) {
  const scores = result.scores || {}
  const answers = (result as any).answers || {}
  const total = IE_SECTION_ORDER.reduce((a, d) => a + (scores[d] || 0), 0)
  const [selectedQ, setSelectedQ] = useState<number | null>(null)
  const levelLabels: Record<string, string> = { forte: 'Forte', moyenne: 'Moyenne', faible: 'Faible' }

  return (
    <Modal open onClose={onClose} title={`${result.first_name} ${result.last_name} — Test IE`} size="lg">
      <div className="space-y-4">
        {/* Info participant */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
          {result.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{result.email}</span>}
          {result.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{result.phone}</span>}
          <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(result.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' à '}
            {new Date(result.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Score global + download */}
        <div className="flex gap-3">
          <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{total} <span className="text-sm font-normal text-yellow-600">/ 80</span></p>
            <p className="text-xs text-yellow-600 mt-0.5">Score global d'Intelligence Émotionnelle</p>
          </div>
          <button onClick={onDownload} disabled={downloading}
            className="flex flex-col items-center justify-center gap-1.5 px-5 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-60 text-white rounded-xl text-xs font-medium transition-colors flex-shrink-0">
            <Download className="w-5 h-5" />
            {downloading ? 'Génération…' : 'PDF'}
          </button>
        </div>

        {/* Dimensions */}
        <div className="space-y-2.5">
          {IE_SECTION_ORDER.map(dim => {
            const info = getDimInfo(dim)
            const score = scores[dim] || 0
            const level = getIELevel(score)
            const color = getLevelColor(level)
            const pct = Math.round((score / 16) * 100)
            return (
              <div key={dim} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{info.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color }}>{levelLabels[level]}</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{score}/16</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Questions & réponses */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Réponses par question</p>
          <div className="space-y-2">
            {IE_SECTION_ORDER.map(dim => {
              const info = getDimInfo(dim)
              const dimQs = IE_QUESTIONS.filter(q => q.dimension === dim)
              return (
                <div key={dim}>
                  <p className="text-xs font-semibold text-gray-400 mb-1 ml-1">{info.label}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {dimQs.map(q => {
                      const val = answers[q.id] ?? answers[String(q.id)]
                      const isSelected = selectedQ === q.id
                      const color = val === 4 ? '#22c55e' : val === 3 ? '#84cc16' : val === 2 ? '#f59e0b' : val === 1 ? '#ef4444' : '#d1d5db'
                      return (
                        <button
                          key={q.id}
                          onClick={() => setSelectedQ(isSelected ? null : q.id)}
                          className={`text-left rounded-lg p-2 border transition-all text-xs ${isSelected ? 'ring-2 ring-blue-400 border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300'}`}
                        >
                          <span className="text-gray-400 block text-[10px]">Q{q.id}</span>
                          <span className="font-bold" style={{ color }}>{val ? IE_SCALE[val] : '—'}</span>
                        </button>
                      )
                    })}
                  </div>
                  {dimQs.some(q => selectedQ === q.id) && (() => {
                    const q = dimQs.find(q => q.id === selectedQ)!
                    const val = answers[q.id] ?? answers[String(q.id)]
                    return (
                      <div className="mt-1.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{q.text}</p>
                        <p className="text-blue-700 dark:text-blue-300 font-semibold">
                          Réponse : {val ? `${val} — ${IE_SCALE[val]}` : 'Non répondu'}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function QSDetailModal({ result, onClose, onDownload, downloading }: {
  result: any; onClose: () => void; onDownload: () => void; downloading: boolean
}) {
  const answers = result.answers || {}
  const total = getTotalScore(answers)
  const pct = Math.round((total / 90) * 100)
  const level = getQSGlobalLevel(total)
  const colMap: Record<string, string> = { forte: '#22c55e', moyenne: '#f59e0b', faible: '#ef4444' }
  const lblMap: Record<string, string> = { forte: 'Forte', moyenne: 'Moyenne', faible: 'Faible' }

  return (
    <Modal open onClose={onClose} title={`${result.first_name} ${result.last_name} — Test QS`} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
          {result.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{result.email}</span>}
          {result.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{result.phone}</span>}
          <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(result.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' à '}
            {new Date(result.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{pct}% <span className="text-sm font-normal text-teal-600">— {level}</span></p>
            <p className="text-xs text-teal-600 mt-0.5">Score global Quotient de Succès</p>
          </div>
          <button onClick={onDownload} disabled={downloading}
            className="flex flex-col items-center justify-center gap-1.5 px-5 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-medium transition-colors flex-shrink-0">
            <Download className="w-5 h-5" />
            {downloading ? 'Génération…' : 'PDF'}
          </button>
        </div>

        <div className="space-y-2.5">
          {QS_PILIER_ORDER.map(pilier => {
            const info = getPilierInfo(pilier)
            const score = getPilierScore(pilier, answers)
            const lv = getQSLevel(score, info.maxScore)
            const col = colMap[lv]
            const p = Math.round((score / info.maxScore) * 100)
            return (
              <div key={pilier} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{info.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: col }}>{lblMap[lv]}</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{p}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: col }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

interface MappingResult {
  id: string
  created_at: string
  first_name: string
  last_name: string
  email: string
  phone: string
  dominant_profile: ProfileKey
  answers: Record<string, string>
}

const EMPTY = {
  participantId: '', type: 'DISC' as TestType,
  date: new Date().toISOString().split('T')[0],
  result: '', score: '', interpretation: '', coachNotes: '',
}

function NewTestModal({ onClose }: { onClose: () => void }) {
  const { participants, addTest } = useAppStore()
  const { user } = useAuthStore()
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.participantId) return toast.error('Sélectionnez un participant')
    setLoading(true)
    try {
      await addTest({
        participantId: form.participantId,
        type: form.type,
        date: form.date,
        result: form.result || undefined,
        score: form.score || undefined,
        interpretation: form.interpretation || undefined,
        coachNotes: form.coachNotes || undefined,
        administeredBy: user?.name || user?.email || '',
        pdfUrl: undefined,
      })
      toast.success('Test enregistré !')
      onClose()
    } catch { toast.error('Erreur lors de l\'enregistrement') }
    setLoading(false)
  }

  return (
    <Modal open onClose={onClose} title="Nouveau test psychométrique" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Participant *</label>
          <select value={form.participantId} onChange={e => setF('participantId', e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Sélectionner —</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de test *</label>
            <select value={form.type} onChange={e => setF('type', e.target.value as TestType)}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input label="Date *" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
        </div>
        <Input label="Résultat" value={form.result} onChange={e => setF('result', e.target.value)} placeholder="Ex: Type D dominant" />
        <Input label="Score" value={form.score} onChange={e => setF('score', e.target.value)} placeholder="Ex: D:70% I:50% S:30% C:40%" />
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Interprétation</label>
          <textarea rows={3} value={form.interpretation} onChange={e => setF('interpretation', e.target.value)}
            placeholder="Description du profil et recommandations…"
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes coach (privées)</label>
          <textarea rows={2} value={form.coachNotes} onChange={e => setF('coachNotes', e.target.value)}
            placeholder="Observations personnelles…"
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !form.participantId}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function MappingDetailModal({ r, onClose, onDownload }: { r: MappingResult; onClose: () => void; onDownload: (r: MappingResult) => void }) {
  const profile = r.dominant_profile
  const colorClass = PROFILE_COLOR[profile] || 'bg-gray-50 text-gray-700 border-gray-200'
  const answersEntries = Object.entries(r.answers || {})
  const [selectedQ, setSelectedQ] = useState<string | null>(null)

  return (
    <Modal open onClose={onClose} title="Résultat du Test Mapping" size="lg">
      <div className="space-y-5">
        {/* Participant info */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl flex-shrink-0">
            {(r.first_name?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">{r.first_name} {r.last_name}</p>
            <div className="flex flex-wrap gap-3 mt-1.5">
              {r.email && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail className="w-3 h-3" /> {r.email}</span>}
              {r.phone && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" /> {r.phone}</span>}
              <span className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                {' à '}
                {new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Dominant profile */}
        <div className={`rounded-xl border-2 p-5 ${colorClass}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{PROFILE_EMOJI[profile] || '🎯'}</span>
            <div>
              <p className="text-xs uppercase tracking-widest opacity-70 font-medium">Archétype dominant</p>
              <p className="text-xl font-bold">{PROFILE_NAMES[profile]}</p>
            </div>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">{PROFILE_DESCRIPTIONS[profile]}</p>
        </div>

        {/* Réponses par question avec click */}
        {answersEntries.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Réponses par question — <span className="font-bold text-gray-700 dark:text-gray-300">{answersEntries.length}</span>/64 — cliquez une question pour voir le détail
            </p>
            <div className="grid grid-cols-8 gap-1.5">
              {answersEntries.slice(0, 64).map(([qId, label]) => {
                const isSelected = selectedQ === qId
                return (
                  <button
                    key={qId}
                    onClick={() => setSelectedQ(isSelected ? null : qId)}
                    className={`text-center rounded-lg py-1.5 px-1 border transition-all text-xs ${isSelected ? 'ring-2 ring-indigo-400 border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-200'}`}
                  >
                    <span className="text-[10px] text-gray-400 block leading-none">Q{qId}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{label}</span>
                  </button>
                )
              })}
            </div>
            {selectedQ && (() => {
              const qData = MAPPING_QUESTIONS.find(q => String(q.id) === String(selectedQ))
              const chosenLabel = r.answers[selectedQ]
              const chosenOption = qData?.options.find(o => o.label === chosenLabel)
              return (
                <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm">
                  <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                    <span className="text-xs font-semibold text-indigo-500 mr-2">Q{selectedQ}</span>
                    {qData?.text || 'Question inconnue'}
                  </p>
                  <p className="text-indigo-700 dark:text-indigo-300 font-semibold">
                    Réponse ({chosenLabel}) : {chosenOption?.text || '—'}
                  </p>
                </div>
              )
            })()}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">Fermer</Button>
          <Button variant="primary" icon={<Download className="w-4 h-4" />} onClick={() => { onDownload(r); onClose() }} className="flex-1">
            Télécharger le rapport PDF
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function MappingResultRow({ r, onDownload }: { r: MappingResult; onDownload: (r: MappingResult) => void }) {
  const [showDetail, setShowDetail] = useState(false)
  const profile = r.dominant_profile
  const colorClass = PROFILE_COLOR[profile] || 'bg-gray-50 text-gray-700 border-gray-200'

  return (
    <>
      <div
        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xl flex-shrink-0">
          {PROFILE_EMOJI[profile] || '🎯'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {r.first_name} {r.last_name}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
              {PROFILE_NAMES[profile]}
            </span>
            <span className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full font-medium">
              <Calendar className="w-3 h-3" />
              {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' '}
              {new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {r.email && <span className="text-xs text-gray-400">{r.email}</span>}
            {r.phone && <span className="text-xs text-gray-400">{r.phone}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onDownload(r)}
            className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 transition-colors"
            title="Télécharger le rapport PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDetail(true)}
            className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-colors"
            title="Voir le détail"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
      {showDetail && (
        <MappingDetailModal r={r} onClose={() => setShowDetail(false)} onDownload={onDownload} />
      )}
    </>
  )
}

export default function Tests() {
  const { tests, participants, fetchTests, deleteTest } = useAppStore()
  const [showNew, setShowNew] = useState(false)
  const [mappingResults, setMappingResults] = useState<MappingResult[]>([])
  const [loadingMapping, setLoadingMapping] = useState(true)
  const [ieResults, setIEResults] = useState<IEResult[]>([])
  const [loadingIE, setLoadingIE] = useState(true)
  const [qsResults, setQSResults] = useState<any[]>([])
  const [loadingQS, setLoadingQS] = useState(true)
  const [qsSearch, setQSSearch] = useState('')
  const [refreshingQS, setRefreshingQS] = useState(false)
  const [activeTab, setActiveTab] = useState<'mapping' | 'ie' | 'qs' | 'psycho'>('mapping')
  const [search, setSearch] = useState('')
  const [ieSearch, setIESearch] = useState('')
  const [profileFilter, setProfileFilter] = useState<ProfileKey | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [ieSortOrder, setIESortOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedIE, setSelectedIE] = useState<IEResult | null>(null)
  const [selectedQS, setSelectedQS] = useState<any | null>(null)
  const [refreshingIE, setRefreshingIE] = useState(false)
  const [refreshingMapping, setRefreshingMapping] = useState(false)
  const [downloadingIE, setDownloadingIE] = useState(false)
  const [downloadingQS, setDownloadingQS] = useState(false)
  const ieReportRef = useRef<HTMLDivElement>(null)
  const qsReportRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchTests() }, [])

  async function loadMappingResults(showSpinner = true) {
    if (showSpinner) setLoadingMapping(true)
    else setRefreshingMapping(true)
    const { data } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_type', 'mapping')
      .order('created_at', { ascending: false })
    setMappingResults(data || [])
    setLoadingMapping(false)
    setRefreshingMapping(false)
  }

  useEffect(() => { loadMappingResults() }, [])

  async function loadIEResults(showSpinner = true) {
    if (showSpinner) setLoadingIE(true)
    else setRefreshingIE(true)
    const { data } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_type', 'ie')
      .order('created_at', { ascending: false })
    setIEResults(data || [])
    setLoadingIE(false)
    setRefreshingIE(false)
  }

  useEffect(() => { loadIEResults() }, [])

  async function loadQSResults(showSpinner = true) {
    if (showSpinner) setLoadingQS(true)
    else setRefreshingQS(true)
    const { data } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_type', 'qs')
      .order('created_at', { ascending: false })
    setQSResults(data || [])
    setLoadingQS(false)
    setRefreshingQS(false)
  }

  useEffect(() => { loadQSResults() }, [])

  async function downloadIEPDF(r: IEResult) {
    if (!ieReportRef.current) return
    setDownloadingIE(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const container = ieReportRef.current
      const pages = Array.from(container.children) as HTMLElement[]
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PAGE_W, PAGE_H] })
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, allowTaint: true,
          backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H,
        })
        if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait')
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_W, PAGE_H)
      }
      pdf.save(`Test IE - ${r.first_name} ${r.last_name}.pdf`)
    } catch (e) {
      toast.error('Erreur lors de la génération du PDF')
    }
    setDownloadingIE(false)
  }

  async function downloadQSPDF(r: any) {
    if (!qsReportRef.current) return
    setDownloadingQS(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const pages = Array.from(qsReportRef.current.children) as HTMLElement[]
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PAGE_W, PAGE_H] })
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, allowTaint: true,
          backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H,
        })
        if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait')
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PAGE_W, PAGE_H)
      }
      pdf.save(`TEST QS_${r.first_name} ${r.last_name?.toUpperCase()}.pdf`)
    } catch (e) {
      toast.error('Erreur lors de la génération du PDF')
    }
    setDownloadingQS(false)
  }

  async function downloadPDF(r: MappingResult) {
    const pdfMap: Partial<Record<ProfileKey, string>> = {
      sentinelle: 'sentinelle.pdf',
      gardien: 'gardien.pdf',
      alchimiste: 'alchimiste.pdf',
      explorateur: 'explorateur.pdf',
      architecte: 'architecte.pdf',
      marcheur: 'marcheur.pdf',
    }
    const filename = pdfMap[r.dominant_profile]
    if (!filename) return toast('Rapport pas encore disponible pour ce profil')

    try {
      const url = `${SUPABASE_URL}/storage/v1/object/public/test-profiles/${filename}`
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${r.first_name} ${r.last_name} - ${PROFILE_NAMES[r.dominant_profile]}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(TEST_URL)
    toast.success('Lien copié !')
  }

  const profileCounts = mappingResults.reduce<Record<string, number>>((acc, r) => {
    acc[r.dominant_profile] = (acc[r.dominant_profile] || 0) + 1
    return acc
  }, {})

  const filteredIEResults = ieResults
    .filter(r => `${r.first_name} ${r.last_name}`.toLowerCase().includes(ieSearch.toLowerCase()))
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return ieSortOrder === 'desc' ? -diff : diff
    })

  const filteredResults = mappingResults
    .filter(r => {
      const matchName = `${r.first_name} ${r.last_name}`.toLowerCase().includes(search.toLowerCase())
      const matchProfile = profileFilter === 'all' || r.dominant_profile === profileFilter
      return matchName && matchProfile
    })
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? -diff : diff
    })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tests</h2>
          <p className="text-sm text-gray-500">{mappingResults.length} passation{mappingResults.length > 1 ? 's' : ''} du Test Mapping · {tests.length} tests psychométriques</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>
          Nouveau test
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('mapping')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'mapping'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🧭 Test Mapping {mappingResults.length > 0 && <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">{mappingResults.length}</span>}
        </button>
        <button
          onClick={() => { setActiveTab('ie'); loadIEResults(false) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ie'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💡 Test IE {ieResults.length > 0 && <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">{ieResults.length}</span>}
        </button>
        <button
          onClick={() => { setActiveTab('qs'); loadQSResults(false) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'qs'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏆 Test QS {qsResults.length > 0 && <span className="ml-1 text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">{qsResults.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('psycho')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'psycho'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Tests psychométriques {tests.length > 0 && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{tests.length}</span>}
        </button>
      </div>

      {/* TAB: MAPPING */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          {/* Share link card */}
          <Card className="border-2 border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link className="w-4 h-4 text-indigo-600" />
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Lien de passation</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Public</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Partagez ce lien à vos participants — ils passent le test depuis n'importe quel appareil, sans compte.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-xs text-indigo-600 font-mono truncate">
                    {TEST_URL}
                  </div>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier
                  </button>
                  <a
                    href={TEST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-50 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats by profile — cliquables pour filtrer */}
          {mappingResults.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {(Object.keys(PROFILE_NAMES) as ProfileKey[]).map(pk => {
                const isActive = profileFilter === pk
                return (
                  <button
                    key={pk}
                    onClick={() => setProfileFilter(isActive ? 'all' : pk)}
                    className={`text-center p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm ring-2 ring-indigo-300'
                        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-200 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="text-xl mb-1">{PROFILE_EMOJI[pk]}</div>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{profileCounts[pk] || 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{PROFILE_NAMES[pk].split(' ').slice(-2).join(' ')}</p>
                  </button>
                )
              })}
            </div>
          )}

          {/* Filtres */}
          {mappingResults.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par nom…"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                title="Changer l'ordre de tri"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
              </button>
              <button
                onClick={() => loadMappingResults(false)}
                disabled={refreshingMapping}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap disabled:opacity-50"
                title="Actualiser les résultats"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingMapping ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              {(search || profileFilter !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setProfileFilter('all') }}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <X className="w-3 h-3" /> Réinitialiser
                </button>
              )}
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {filteredResults.length} / {mappingResults.length} résultat{filteredResults.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Results list */}
          <div className="space-y-2">
            {loadingMapping ? (
              <Card className="text-center py-8">
                <p className="text-gray-400 text-sm">Chargement des résultats…</p>
              </Card>
            ) : mappingResults.length === 0 ? (
              <Card className="text-center py-12">
                <div className="text-4xl mb-3">🧭</div>
                <p className="text-gray-500 font-medium mb-1">Aucune passation pour l'instant</p>
                <p className="text-gray-400 text-sm">Partagez le lien ci-dessus à vos participants</p>
              </Card>
            ) : filteredResults.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-400 text-sm">Aucun résultat pour cette recherche</p>
              </Card>
            ) : (
              filteredResults.map(r => (
                <MappingResultRow key={r.id} r={r} onDownload={downloadPDF} />
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: IE */}
      {activeTab === 'ie' && (
        <div className="space-y-4">
          {/* Share link card */}
          <Card className="border-2 border-yellow-100 dark:border-yellow-900/30 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Lien de passation — Test IE</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Public</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Partagez ce lien à vos participants pour le Test d'Intelligence Émotionnelle.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-gray-900 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 text-xs text-yellow-700 font-mono truncate">
                    {TEST_IE_URL}
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(TEST_IE_URL); toast.success('Lien copié !') }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 transition-colors flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier
                  </button>
                  <a
                    href={TEST_IE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 border border-yellow-200 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-50 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Filters */}
          {ieResults.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={ieSearch}
                  onChange={e => setIESearch(e.target.value)}
                  placeholder="Rechercher par nom…"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <button
                onClick={() => setIESortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {ieSortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
              </button>
              <button
                onClick={() => loadIEResults(false)}
                disabled={refreshingIE}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap disabled:opacity-50"
                title="Actualiser les résultats"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingIE ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {filteredIEResults.length} / {ieResults.length} résultat{filteredIEResults.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Results list */}
          <div className="space-y-2">
            {loadingIE ? (
              <Card className="text-center py-8">
                <p className="text-gray-400 text-sm">Chargement des résultats…</p>
              </Card>
            ) : ieResults.length === 0 ? (
              <Card className="text-center py-12">
                <div className="text-4xl mb-3">💡</div>
                <p className="text-gray-500 font-medium mb-1">Aucune passation pour l'instant</p>
                <p className="text-gray-400 text-sm">Partagez le lien ci-dessus à vos participants</p>
              </Card>
            ) : filteredIEResults.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-400 text-sm">Aucun résultat pour cette recherche</p>
              </Card>
            ) : (
              filteredIEResults.map(r => {
                const scores = r.scores || {}
                const total = IE_SECTION_ORDER.reduce((a, d) => a + (scores[d] || 0), 0)
                return (
                  <div key={r.id} onClick={() => setSelectedIE(r)} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-yellow-200 dark:hover:border-yellow-800 hover:shadow-sm transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-xl flex-shrink-0">
                      💡
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {r.first_name} {r.last_name}
                        </p>
                        <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">
                          Score global : {total}/80
                        </span>
                        <span className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full font-medium">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' '}
                          {new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {IE_SECTION_ORDER.map(d => {
                          const dimInfo = getDimInfo(d)
                          const score = scores[d] || 0
                          const level = getIELevel(score)
                          const color = getLevelColor(level)
                          return (
                            <span key={d} className="text-xs px-2 py-0.5 rounded-full border font-medium" style={{ backgroundColor: color + '15', color, borderColor: color + '40' }}>
                              {dimInfo.label.split(' ')[0]} : {score}/16
                            </span>
                          )
                        })}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {r.email && <span className="text-xs text-gray-400">{r.email}</span>}
                        {r.phone && <span className="text-xs text-gray-400">{r.phone}</span>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* TAB: QS */}
      {activeTab === 'qs' && (
        <div className="space-y-4">
          {/* Share link */}
          <Card className="border-2 border-teal-100 dark:border-teal-900/30 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/10 dark:to-blue-900/10">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link className="w-4 h-4 text-teal-600" />
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Lien de passation — Test QS</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Public</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Partagez ce lien à vos participants pour le Test Quotient de Succès (45 questions · 15 piliers).</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-gray-900 border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs text-teal-700 font-mono truncate">
                    {TEST_QS_URL}
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(TEST_QS_URL); toast.success('Lien copié !') }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier
                  </button>
                  <a href={TEST_QS_URL} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 border border-teal-200 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-50 transition-colors flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Results */}
          {loadingQS ? (
            <div className="text-center py-12 text-gray-400">Chargement…</div>
          ) : qsResults.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🏆</div>
              <p className="font-medium">Aucun résultat QS pour le moment</p>
              <p className="text-sm mt-1">Les résultats apparaîtront ici dès qu'un participant aura complété le test.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={qsSearch} onChange={e => setQSSearch(e.target.value)} placeholder="Rechercher par nom…"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <button onClick={() => loadQSResults(false)} disabled={refreshingQS}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingQS ? 'animate-spin' : ''}`} /> Actualiser
                </button>
              </div>

              <div className="space-y-3">
                {qsResults
                  .filter(r => `${r.first_name} ${r.last_name}`.toLowerCase().includes(qsSearch.toLowerCase()))
                  .map(r => {
                    const answers = r.answers || {}
                    const total = getTotalScore(answers)
                    const pct = Math.round((total / 90) * 100)
                    return (
                      <Card key={r.id} className="border border-gray-100 dark:border-gray-700 hover:border-teal-200 transition-colors cursor-pointer" onClick={() => setSelectedQS(r)}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {r.first_name?.[0]}{r.last_name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {r.first_name} {r.last_name?.toUpperCase()}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                {r.dominant_profile}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {r.phone && <span className="text-xs text-gray-400">{r.phone}</span>}
                              {r.email && <span className="text-xs text-gray-400">{r.email}</span>}
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                            </div>
                            {/* Score bar */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                                <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-600"
                                  style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-bold text-teal-600">{pct}%</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: PSYCHO */}
      {activeTab === 'psycho' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {TEST_TYPES.map(type => {
              const count = tests.filter(t => t.type === type).length
              return (
                <Card key={type} className="text-center p-3">
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{type}</p>
                </Card>
              )
            })}
          </div>

          <div className="space-y-3">
            {tests.map(test => {
              const participant = participants.find(p => p.id === test.participantId)
              return (
                <Card key={test.id} hover>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          {participant && <Avatar name={`${participant.firstName} ${participant.lastName}`} size="sm" />}
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                              {participant ? `${participant.firstName} ${participant.lastName}` : '—'}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(test.date)}</p>
                          </div>
                        </div>
                        <Badge variant={TEST_COLORS[test.type] as any}>{test.type}</Badge>
                      </div>
                      {test.result && (
                        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Résultat: <span className="text-blue-600 dark:text-blue-400">{test.result}</span>
                        </p>
                      )}
                      {test.score && <p className="text-xs text-gray-500 mt-0.5">{test.score}</p>}
                      {test.interpretation && (
                        <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">{test.interpretation}</p>
                      )}
                      {test.administeredBy && (
                        <p className="text-xs text-gray-400 mt-1">Administré par: {test.administeredBy}</p>
                      )}
                      <button
                        onClick={async () => { if (!confirm('Supprimer ce test ?')) return; await deleteTest(test.id); toast.success('Test supprimé') }}
                        className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
            {tests.length === 0 && (
              <Card className="text-center py-12">
                <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Aucun test enregistré</p>
                <Button variant="primary" className="mt-4" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>
                  Créer le premier test
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {showNew && <NewTestModal onClose={() => setShowNew(false)} />}
      {selectedQS && (
        <>
          <QSDetailModal
            result={selectedQS}
            onClose={() => setSelectedQS(null)}
            onDownload={() => downloadQSPDF(selectedQS)}
            downloading={downloadingQS}
          />
          <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
            <QSReportTemplate
              ref={qsReportRef}
              firstName={selectedQS.first_name}
              lastName={selectedQS.last_name}
              answers={selectedQS.answers || {}}
            />
          </div>
        </>
      )}
      {selectedIE && (
        <>
          <IEDetailModal
            result={selectedIE}
            onClose={() => setSelectedIE(null)}
            onDownload={() => downloadIEPDF(selectedIE)}
            downloading={downloadingIE}
          />
          <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
            <IEReportTemplate
              ref={ieReportRef}
              firstName={selectedIE.first_name}
              lastName={selectedIE.last_name}
              scores={selectedIE.scores}
            />
          </div>
        </>
      )}
    </div>
  )
}
