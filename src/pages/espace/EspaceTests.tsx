import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import { type LearnerSession } from '../../lib/learnerSession'
import { FlaskConical, Lock, ChevronRight, CheckCircle, RefreshCw, Download, ChevronDown, ChevronUp, Eye, X, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { QUIZ_QUESTIONS } from '../../data/quizCoachData'
import { QUIZ_N2_QUESTIONS } from '../../data/quizCoachN2Data'
import { QUIZ_QUESTIONS as QUIZ_DP_QUESTIONS } from '../../data/quizDevPersData'
import QSReportTemplate, { PAGE_W as QS_W, PAGE_H as QS_H } from '../test/QSReportTemplate'
import IEReportTemplate, { PAGE_W as IE_W, PAGE_H as IE_H } from '../test/IEReportTemplate'
import ValeursReportTemplate, { PAGE_W as VAL_W, PAGE_H as VAL_H } from '../test/ValeursReportTemplate'
import { COMPASS_PROFILES } from '../../data/testCompassData'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const MAPPING_PDF: Record<string, string> = {
  sentinelle: 'sentinelle.pdf', gardien: 'gardien.pdf', alchimiste: 'alchimiste.pdf',
  explorateur: 'explorateur.pdf', architecte: 'architecte.pdf', marcheur: 'marcheur.pdf',
}
const MAPPING_NAMES: Record<string, string> = {
  sentinelle: 'La Sentinelle des Cimes', gardien: 'Le Gardien des Racines',
  alchimiste: "L'Alchimiste des Émotions", navigateur: 'Le Navigateur des Profondeurs',
  explorateur: "L'Explorateur des Horizons", architecte: "L'Architecte des Ponts",
  marcheur: 'Le Marcheur des Tempêtes',
}

interface TestUnlock { id: string; test_type: string; unlocked_at: string }
interface TestResult {
  test_type: string
  created_at: string
  dominant_profile: string | null
  scores: Record<string, number> | null
  answers: Record<string, number> | null
  first_name: string | null
  last_name: string | null
}

const PROFILE_TESTS = [
  { type: 'mapping',    label: 'Mapping',                    subtitle: 'Découvrez votre profil et vos forces naturelles',             icon: '🧠', path: '/test/mapping',    gradient: 'from-purple-500 to-purple-700' },
  { type: 'ie',         label: 'Intelligence Émotionnelle',  subtitle: 'Évaluez votre quotient émotionnel en 5 dimensions',           icon: '❤️', path: '/test/ie',         gradient: 'from-rose-500 to-rose-700' },
  { type: 'qs',         label: 'Quotient de Succès',         subtitle: 'Mesurez votre potentiel de réussite sur 15 piliers',          icon: '🏆', path: '/test/qs',         gradient: 'from-teal-500 to-blue-700' },
  { type: 'compass',    label: 'Test Compass',               subtitle: 'Découvrez votre profil de leadership parmi 10 archétypes',    icon: '🧭', path: '/test/compass',    gradient: 'from-indigo-500 to-purple-700' },
  { type: 'valeurs',    label: 'Test des Valeurs',           subtitle: 'Découvrez vos valeurs fondamentales — 45 affirmations',       icon: '💎', path: '/test/valeurs',    gradient: 'from-violet-500 to-purple-700' },
]
const QUIZ_TESTS = [
  { type: 'quiz_coach',    label: 'Quiz Final N1', subtitle: 'Évaluez vos acquis — 40 questions : Développement Personnel & Coaching de Vie', icon: '📝', path: '/test/quiz-coach', gradient: 'from-amber-500 to-orange-600' },
  { type: 'quiz_coach_n2', label: 'Quiz Final N2', subtitle: 'Évaluez vos acquis Master Coach Thérapeute — 40 questions', icon: '📋', path: '/test/quiz-coach-n2', gradient: 'from-purple-500 to-purple-600' },
]
const TESTS = [...PROFILE_TESTS, ...QUIZ_TESTS]

// ─── Labels for score keys ─────────────────────────────────────────────────

const MAPPING_PROFILES: Record<string, string> = {
  sentinelle: 'La Sentinelle des Cimes',
  gardien: 'Le Gardien des Racines',
  alchimiste: "L'Alchimiste des Émotions",
  navigateur: 'Le Navigateur des Profondeurs',
  explorateur: "L'Explorateur des Horizons",
  architecte: "L'Architecte des Ponts",
  marcheur: 'Le Marcheur des Tempêtes',
}

const COMPASS_NAMES: Record<string, string> = {
  orange: 'Le Visionnaire Proactif',
  violet: 'Le Stratège Décisionnel',
  vert: 'Le Facilitateur Adaptable',
  bleu: "L'Analyste Rigoureux",
  rouge: 'Le Leader Engagé',
  jaune: "L'Innovateur Créatif",
  turquoise: "L'Harmonisateur Empathique",
  rose: 'Le Communicateur Inspirant',
  gris: "L'Expert Indépendant",
  marron: 'Le Constructeur Solide',
}

const IE_DIM_LABELS: Record<string, string> = {
  conscience: 'Conscience de soi',
  maitrise: 'Maîtrise de soi',
  motivation: 'Auto-motivation',
  empathie: 'Empathie',
  social: 'Compétences sociales',
}

const QS_PILIER_LABELS: Record<string, string> = {
  ie: 'Intelligence Émotionnelle',
  communication: 'Communication',
  strategie: 'Pensée Stratégique',
  discipline: 'Focus & Discipline',
  branding: 'Personal Branding',
  temps: 'Gestion du Temps',
  stress: 'Gestion du Stress',
  leadership: 'Leadership',
  creativite: 'Créativité & Innovation',
  vision: 'Vision & Objectifs',
  risque: 'Prise de Risque & Audace',
  autonomie: 'Autonomie & Initiative',
  confiance: 'Confiance en soi',
  optimisme: 'Optimisme',
  ethique: 'Éthique & Intégrité',
}

const VALEUR_LABELS: Record<string, string> = {
  liberte: 'Liberté', famille: 'Famille', sante: 'Santé', succes: 'Succès',
  amour: 'Amour', connaissance: 'Connaissance', contribution: 'Contribution',
  creativite: 'Créativité', spiritualite: 'Spiritualité',
  independance_financiere: 'Indépendance financière', reconnaissance: 'Reconnaissance',
  equilibre: 'Équilibre', respect: 'Respect', aventure: 'Aventure', securite: 'Sécurité',
}

// ─── Merge dedup results (by test_type, most recent wins) ─────────────────

function mergeResults(a: TestResult[], b: TestResult[]): TestResult[] {
  const map = new Map<string, TestResult>()
  for (const r of [...a, ...b]) {
    const existing = map.get(r.test_type)
    if (!existing || new Date(r.created_at) > new Date(existing.created_at)) {
      map.set(r.test_type, r)
    }
  }
  return Array.from(map.values())
}

// ─── Print/download a result ────────────────────────────────────────────────

function printResult(name: string, test: typeof TESTS[0], result: TestResult) {
  const date = new Date(result.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const dominant = result.dominant_profile || ''
  const scores = result.scores || {}

  let scoreRows = ''

  if (test.type === 'quiz_coach' || test.type === 'quiz_coach_n2') {
    const pct = scores.percentage ?? 0
    const correct = scores.correct ?? 0
    const total = scores.total ?? 0
    scoreRows = `
      <div class="score-main">
        <div class="big-score">${pct}%</div>
        <div class="score-label">${correct} / ${total} bonnes réponses</div>
        <div class="badge ${pct >= 70 ? 'pass' : 'fail'}">${dominant || (pct >= 70 ? 'Validé' : 'À retravailler')}</div>
      </div>`
  } else if (test.type === 'mapping') {
    const profileName = MAPPING_PROFILES[dominant] || dominant
    scoreRows = `<div class="score-main"><div class="profile-name">${profileName}</div></div>`
  } else if (test.type === 'compass') {
    const profileName = COMPASS_NAMES[dominant] || dominant
    scoreRows = `
      <div class="score-main"><div class="profile-name">${profileName}</div></div>
      <table class="score-table">
        ${Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
          `<tr><td>${COMPASS_NAMES[k] ? `<span style="color:#555">${k.charAt(0).toUpperCase() + k.slice(1)}</span> — ${COMPASS_NAMES[k]}` : k}</td><td class="score-val">${v} pts</td></tr>`
        ).join('')}
      </table>`
  } else if (test.type === 'ie') {
    const max = 16
    scoreRows = `
      <table class="score-table">
        ${Object.entries(scores).map(([k, v]) => {
          const pct = Math.round((v / max) * 100)
          return `<tr>
            <td>${IE_DIM_LABELS[k] || k}</td>
            <td><div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div></td>
            <td class="score-val">${v} / ${max}</td>
          </tr>`
        }).join('')}
      </table>`
  } else if (test.type === 'qs') {
    const entries = Object.entries(scores)
    scoreRows = `
      <div class="score-main">
        <div class="badge pass">${dominant || 'Résultat'}</div>
      </div>
      <table class="score-table">
        ${entries.map(([k, v]) => {
          const label = QS_PILIER_LABELS[k] || k
          return `<tr><td>${label}</td><td class="score-val">${v} pts</td></tr>`
        }).join('')}
      </table>`
  } else if (test.type === 'valeurs') {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    const maxVal = sorted[0]?.[1] || 15
    scoreRows = `
      <div class="score-main"><div class="profile-name">Valeur dominante : ${VALEUR_LABELS[dominant] || dominant}</div></div>
      <table class="score-table">
        ${sorted.map(([k, v]) => {
          const pct = Math.round((v / maxVal) * 100)
          return `<tr>
            <td>${VALEUR_LABELS[k] || k}</td>
            <td><div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div></td>
            <td class="score-val">${v} / 15</td>
          </tr>`
        }).join('')}
      </table>`
  }

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Résultats — ${test.label}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #1a1a2e; padding: 0 20px; }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
  .icon { font-size: 40px; }
  .meta h1 { margin: 0; font-size: 22px; }
  .meta p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
  .participant { background: #f9fafb; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; }
  .participant strong { display: block; font-size: 16px; }
  .participant span { font-size: 13px; color: #6b7280; }
  .score-main { text-align: center; margin: 20px 0; }
  .big-score { font-size: 64px; font-weight: 800; color: #1d4ed8; line-height: 1; }
  .score-label { font-size: 16px; color: #374151; margin-top: 8px; }
  .profile-name { font-size: 22px; font-weight: 700; color: #1d4ed8; }
  .badge { display: inline-block; padding: 6px 18px; border-radius: 20px; font-weight: 700; font-size: 15px; margin-top: 10px; }
  .badge.pass { background: #dcfce7; color: #166534; }
  .badge.fail { background: #fee2e2; color: #991b1b; }
  .score-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .score-table td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  .score-val { text-align: right; font-weight: 700; color: #1d4ed8; white-space: nowrap; }
  .bar-wrap { background: #e5e7eb; border-radius: 4px; height: 8px; width: 180px; overflow: hidden; }
  .bar { background: #3b82f6; height: 100%; border-radius: 4px; }
  .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  @media print { .no-print { display: none; } }
</style>
</head><body>
<div class="header">
  <div class="icon">${test.icon}</div>
  <div class="meta"><h1>${test.label}</h1><p>${test.subtitle}</p></div>
</div>
<div class="participant">
  <strong>${name}</strong>
  <span>Passé le ${date}</span>
</div>
${scoreRows}
<div class="footer">Success Compass Academy · Résultats générés le ${new Date().toLocaleDateString('fr-FR')}</div>
<br><button class="no-print" onclick="window.print()" style="display:block;margin:0 auto;padding:10px 30px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Imprimer / Enregistrer en PDF</button>
</body></html>`

  // Use Blob URL to avoid popup blocker
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ─── Score summary for inline display ────────────────────────────────────

function ScoreSummary({ test, result }: { test: typeof TESTS[0]; result: TestResult }) {
  const dominant = result.dominant_profile || ''
  const scores = result.scores || {}

  if (test.type === 'quiz_coach' || test.type === 'quiz_coach_n2') {
    const pct = scores.percentage ?? 0
    const correct = scores.correct ?? 0
    const total = scores.total ?? 0
    return (
      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-extrabold text-amber-600">{pct}%</div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{correct} / {total} bonnes réponses</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pct >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {dominant || (pct >= 70 ? 'Validé' : 'À retravailler')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (test.type === 'mapping') {
    return (
      <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
        <p className="text-xs text-purple-500 font-medium uppercase tracking-wide mb-0.5">Profil dominant</p>
        <p className="text-sm font-bold text-purple-800">{MAPPING_PROFILES[dominant] || dominant}</p>
      </div>
    )
  }

  if (test.type === 'compass') {
    const top3 = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return (
      <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
        <p className="text-xs text-indigo-500 font-medium mb-1">Top profils</p>
        <div className="flex flex-wrap gap-1.5">
          {top3.map(([k, v]) => (
            <span key={k} className="text-xs bg-white border border-indigo-200 text-indigo-700 rounded-lg px-2 py-1 font-medium">
              {k.charAt(0).toUpperCase() + k.slice(1)} · {v} pts
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (test.type === 'ie') {
    const max = 16
    const entries = Object.entries(scores)
    return (
      <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-36 shrink-0">{IE_DIM_LABELS[k] || k}</span>
            <div className="flex-1 h-1.5 bg-rose-200 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.round((v / max) * 100)}%` }} />
            </div>
            <span className="text-xs font-semibold text-rose-700 w-10 text-right">{v}/{max}</span>
          </div>
        ))}
      </div>
    )
  }

  if (test.type === 'qs') {
    // Scores per pilier may be empty — fall back to raw answers sum
    let total = Object.values(scores).filter(v => typeof v === 'number').reduce((a, b) => a + (b as number), 0)
    if (total === 0 && result.answers) {
      total = Object.values(result.answers).reduce((sum, v) => sum + (Number(v) || 0), 0)
    }
    const pct = Math.round(total / 90 * 100)
    const level = dominant || (pct >= 85 ? 'EXCELLENT' : pct >= 70 ? 'TRÈS BON' : pct >= 55 ? 'BON' : pct >= 40 ? 'EN DÉVELOPPEMENT' : 'À RENFORCER')
    return (
      <div className="mt-3 p-3 bg-teal-50 rounded-xl border border-teal-100 flex items-center gap-3">
        <div className="text-2xl font-bold text-teal-700">{pct}%</div>
        <div>
          <p className="text-sm font-semibold text-teal-800">{level}</p>
          <p className="text-xs text-teal-600">Score global Quotient de Succès</p>
        </div>
      </div>
    )
  }

  if (test.type === 'valeurs') {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const maxVal = sorted[0]?.[1] || 15
    return (
      <div className="mt-3 p-3 bg-violet-50 rounded-xl border border-violet-100 space-y-1.5">
        <p className="text-xs text-violet-500 font-medium mb-2">Top 5 valeurs</p>
        {sorted.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-36 shrink-0">{VALEUR_LABELS[k] || k}</span>
            <div className="flex-1 h-1.5 bg-violet-200 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.round((v / maxVal) * 100)}%` }} />
            </div>
            <span className="text-xs font-semibold text-violet-700 w-8 text-right">{v}/15</span>
          </div>
        ))}
      </div>
    )
  }

  return null
}

// ─── Main component ────────────────────────────────────────────────────────

export default function EspaceTests() {
  const session = useOutletContext<LearnerSession>()
  const navigate = useNavigate()
  const [unlocks, setUnlocks] = useState<TestUnlock[]>([])
  const [results, setResults] = useState<TestResult[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [passation, setPassation] = useState<string | null>(null) // 'quiz_coach' | 'quiz_coach_n2'
  const [loading, setLoading] = useState(true)
  const [qsDownloadTarget, setQsDownloadTarget] = useState<TestResult | null>(null)
  const [qsDownloading, setQsDownloading] = useState(false)
  const qsDirectRef = useRef<HTMLDivElement>(null)
  const [ieDownloadTarget, setIeDownloadTarget] = useState<TestResult | null>(null)
  const [ieDownloading, setIeDownloading] = useState(false)
  const ieDirectRef = useRef<HTMLDivElement>(null)
  const [valDownloadTarget, setValDownloadTarget] = useState<TestResult | null>(null)
  const [valDownloading, setValDownloading] = useState(false)
  const valDirectRef = useRef<HTMLDivElement>(null)
  const [downloadingTest, setDownloadingTest] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!qsDownloadTarget) return
    const timer = setTimeout(async () => {
      if (!qsDirectRef.current) return
      setQsDownloading(true)
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import('html2canvas'),
          import('jspdf'),
        ])
        const pages = Array.from(qsDirectRef.current.children) as HTMLElement[]
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [QS_W, QS_H] })
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], {
            scale: 2, useCORS: true, allowTaint: true,
            backgroundColor: '#ffffff', width: QS_W, height: QS_H,
          })
          if (i > 0) pdf.addPage([QS_W, QS_H], 'portrait')
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, QS_W, QS_H)
        }
        const fn = qsDownloadTarget.first_name || ''
        const ln = qsDownloadTarget.last_name || ''
        pdf.save(`TEST QS_${fn} ${ln.toUpperCase()}.pdf`)
      } catch (e: any) {
        toast.error('Erreur téléchargement QS : ' + (e?.message || 'inconnue'))
      }
      setQsDownloading(false)
      setQsDownloadTarget(null)
    }, 800)
    return () => clearTimeout(timer)
  }, [qsDownloadTarget])

  useEffect(() => {
    if (!ieDownloadTarget) return
    const timer = setTimeout(async () => {
      if (!ieDirectRef.current) return
      setIeDownloading(true)
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import('html2canvas'), import('jspdf'),
        ])
        const pages = Array.from(ieDirectRef.current.children) as HTMLElement[]
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [IE_W, IE_H] })
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: IE_W, height: IE_H })
          if (i > 0) pdf.addPage([IE_W, IE_H], 'portrait')
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, IE_W, IE_H)
        }
        const fn = ieDownloadTarget.first_name || ''
        const ln = ieDownloadTarget.last_name || ''
        pdf.save(`Test IE - ${fn} ${ln}.pdf`)
      } catch (e: any) {
        toast.error('Erreur téléchargement IE : ' + (e?.message || 'inconnue'))
      }
      setIeDownloading(false)
      setIeDownloadTarget(null)
    }, 800)
    return () => clearTimeout(timer)
  }, [ieDownloadTarget])

  useEffect(() => {
    if (!valDownloadTarget) return
    const timer = setTimeout(async () => {
      if (!valDirectRef.current) return
      setValDownloading(true)
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import('html2canvas'), import('jspdf'),
        ])
        const pages = Array.from(valDirectRef.current.children) as HTMLElement[]
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [VAL_W, VAL_H] })
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: VAL_W, height: VAL_H })
          if (i > 0) pdf.addPage([VAL_W, VAL_H], 'portrait')
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, VAL_W, VAL_H)
        }
        const fn = valDownloadTarget.first_name || ''
        const ln = valDownloadTarget.last_name || ''
        pdf.save(`Test Valeurs - ${fn} ${ln}.pdf`)
      } catch (e: any) {
        toast.error('Erreur téléchargement Valeurs : ' + (e?.message || 'inconnue'))
      }
      setValDownloading(false)
      setValDownloadTarget(null)
    }, 800)
    return () => clearTimeout(timer)
  }, [valDownloadTarget])

  async function downloadMappingPDF(result: TestResult) {
    const profile = (result.dominant_profile || '').toLowerCase().trim()
    const filename = MAPPING_PDF[profile]
    if (!filename) {
      // eslint-disable-next-line no-console
      console.warn('[mapping download] profil non reconnu:', profile)
      return
    }
    setDownloadingTest('mapping')
    const url = `${SUPABASE_URL}/storage/v1/object/public/test-profiles/${filename}`
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${session.participantName} - ${MAPPING_NAMES[profile] || profile}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch {
      // Fallback: ouvrir directement l'URL
      window.open(url, '_blank')
    }
    setDownloadingTest(null)
  }

  function downloadCompassPDF(result: TestResult) {
    const profile = result.dominant_profile || ''
    const prof = COMPASS_PROFILES[profile as keyof typeof COMPASS_PROFILES]
    if (!prof?.pdfFile) return
    const a = document.createElement('a')
    a.href = `/pdfs/compass/${encodeURIComponent(prof.pdfFile)}`
    a.download = prof.pdfFile
    a.target = '_blank'
    a.click()
  }

  function handleDownload(test: typeof TESTS[0], result: TestResult) {
    if (test.type === 'qs') { setQsDownloadTarget(result) }
    else if (test.type === 'ie') { setIeDownloadTarget(result) }
    else if (test.type === 'valeurs') { setValDownloadTarget(result) }
    else if (test.type === 'mapping') { downloadMappingPDF(result) }
    else if (test.type === 'compass') { downloadCompassPDF(result) }
    else { printResult(session.participantName, test, result) }
  }

  function isTestDownloading(type: string) {
    if (type === 'qs') return qsDownloading
    if (type === 'ie') return ieDownloading
    if (type === 'valeurs') return valDownloading
    if (type === 'mapping') return downloadingTest === 'mapping'
    if (type === 'quiz_coach_n2') return false
    return false
  }

  async function load() {
    setLoading(true)
    const data = await learnerApi.getTests({
      participantId: session.participantId || null,
      participantName: session.participantName,
    }) as any
    setUnlocks(data.unlocks || [])
    setResults(data.results || [])
    setLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  const completedCount = TESTS.filter(t => results.some(r => r.test_type === t.type)).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes tests</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {completedCount > 0
            ? `${completedCount} test${completedCount > 1 ? 's' : ''} complété${completedCount > 1 ? 's' : ''}`
            : 'Ces tests sont déverrouillés par votre formateur au moment opportun dans le programme.'}
        </p>
      </div>

      {/* Tests de profil */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tests de profil</p>
        <div className="space-y-3">
        {PROFILE_TESTS.map(test => {
          const unlock = unlocks.find(u => u.test_type === test.type)
          const result = results.find(r => r.test_type === test.type)
          const isUnlocked = !!unlock
          const isDone = !!result
          const isExpanded = expanded === test.type

          return (
            <div key={test.type} className={`bg-white rounded-2xl border overflow-hidden transition-all ${isDone ? 'border-green-100' : !isUnlocked ? 'border-gray-100 opacity-75' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4 p-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${test.gradient} flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${!isUnlocked && !isDone ? 'opacity-50 grayscale' : ''}`}>
                  {test.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900 text-sm">{test.label}</h2>
                    {isDone && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />Complété
                      </span>
                    )}
                    {!isUnlocked && !isDone && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-xs">
                        <Lock className="w-2.5 h-2.5" />Verrouillé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{test.subtitle}</p>
                  {isDone && result && (
                    <p className="text-xs text-green-600 mt-0.5">
                      Passé le {new Date(result.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isDone && result && (
                    <>
                      {(test.type === 'quiz_coach' || test.type === 'quiz_coach_n2' || test.type === 'quiz_dev_pers') && (
                        <button
                          onClick={() => setPassation(test.type)}
                          title="Voir ma passation"
                          className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(test, result)}
                        disabled={isTestDownloading(test.type)}
                        title="Télécharger les résultats"
                        className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50">
                        {isTestDownloading(test.type) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setExpanded(isExpanded ? null : test.type)}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => navigate(test.path)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                        <RefreshCw className="w-3 h-3" />Refaire
                      </button>
                    </>
                  )}
                  {!isDone && isUnlocked && (
                    <button onClick={() => navigate(test.path)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-br ${test.gradient} hover:opacity-90 transition-opacity shadow-sm`}>
                      Commencer <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {!isDone && !isUnlocked && (
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded score detail */}
              {isDone && result && isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-0">
                  <ScoreSummary test={test} result={result} />
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {/* Quiz */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quiz de certification</p>
        <div className="space-y-3">
          {QUIZ_TESTS.map(test => {
            const unlock = unlocks.find(u => u.test_type === test.type)
            const result = results.find(r => r.test_type === test.type)
            const isUnlocked = !!unlock
            const isDone = !!result
            const isExpanded = expanded === test.type

            return (
              <div key={test.type} className={`bg-white rounded-2xl border overflow-hidden transition-all ${isDone ? 'border-green-100' : !isUnlocked ? 'border-gray-100 opacity-75' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${test.gradient} flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${!isUnlocked && !isDone ? 'opacity-50 grayscale' : ''}`}>
                    {test.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-gray-900 text-sm">{test.label}</h2>
                      {isDone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />Complété
                        </span>
                      )}
                      {!isUnlocked && !isDone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-xs">
                          <Lock className="w-2.5 h-2.5" />Verrouillé
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{test.subtitle}</p>
                    {isDone && result && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Passé le {new Date(result.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isDone && result && (
                      <>
                        {(test.type === 'quiz_coach' || test.type === 'quiz_coach_n2' || test.type === 'quiz_dev_pers') && (
                          <button onClick={() => setPassation(test.type)} title="Voir ma passation"
                            className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDownload(test, result)} disabled={isTestDownloading(test.type)}
                          title="Télécharger les résultats"
                          className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50">
                          {isTestDownloading(test.type) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setExpanded(isExpanded ? null : test.type)}
                          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => navigate(test.path)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                          <RefreshCw className="w-3 h-3" />Refaire
                        </button>
                      </>
                    )}
                    {!isDone && isUnlocked && (
                      <button onClick={() => navigate(test.path)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-br ${test.gradient} hover:opacity-90 transition-opacity shadow-sm`}>
                        Commencer <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    {!isDone && !isUnlocked && (
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                {isDone && result && isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-0">
                    <ScoreSummary test={test} result={result} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {unlocks.length === 0 && completedCount === 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
          <FlaskConical className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-60" />
          <p className="text-sm text-amber-800 font-medium">Tests verrouillés pour l'instant</p>
          <p className="text-xs text-amber-600 mt-1">Votre formateur vous donnera accès au bon moment dans le programme.</p>
        </div>
      )}

      {/* Passation modal */}
      {passation && (() => {
        const quizResult = results.find(r => r.test_type === passation)
        if (!quizResult) return null
        const questions = passation === 'quiz_coach' ? QUIZ_QUESTIONS : passation === 'quiz_coach_n2' ? QUIZ_N2_QUESTIONS : QUIZ_DP_QUESTIONS
        const answers = quizResult.answers || {}
        const scores = quizResult.scores || {}
        const pct = (scores as any).percentage ?? 0
        const correct = (scores as any).correct ?? 0
        const total = (scores as any).total ?? questions.length
        const passedAt = new Date(quizResult.created_at)
        const label = passation === 'quiz_coach' ? 'Quiz Final N1' : passation === 'quiz_coach_n2' ? 'Quiz Final N2' : 'Quiz Développement Personnel'

        // Hide correction for quiz_coach results taken before the question update (2026-08-22 12:00)
        const QUIZ_COACH_UPDATE = new Date('2026-08-22T12:00:00+01:00')
        const liveCorrect = questions.filter(q => {
          const sel = answers[String(q.id)]
          return sel !== undefined && sel === q.correct
        }).length
        const livePct = Math.round((liveCorrect / questions.length) * 100)
        const scoreMismatch = (passation === 'quiz_coach' && passedAt < QUIZ_COACH_UPDATE) ||
          Math.abs(livePct - pct) > 2

        // Group questions by theme
        const themes = [...new Set(questions.map(q => q.theme))]

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4" onClick={() => setPassation(null)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Passation — {label}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {passedAt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {' à '}
                    {passedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-center">
                    <p className={`text-2xl font-extrabold ${pct >= 70 ? 'text-green-600' : 'text-red-500'}`}>{pct}%</p>
                    <p className="text-xs text-gray-400">{correct}/{total}</p>
                  </div>
                  <button onClick={() => setPassation(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Questions by theme */}
              <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
                {scoreMismatch && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                    <p className="font-semibold mb-1">⚠️ Correction non disponible</p>
                    <p>Le détail des réponses ne peut pas être affiché correctement (version du quiz incompatible). Le score officiel enregistré est <strong>{pct}% ({correct}/{total})</strong>.</p>
                  </div>
                )}
                {!scoreMismatch && themes.map(theme => {

                  const themeQs = questions.filter(q => q.theme === theme)
                  return (
                    <div key={theme}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 pb-1.5 border-b border-gray-100">{theme}</p>
                      <div className="space-y-4">
                        {themeQs.map(q => {
                          const selected = answers[String(q.id)] as number | undefined
                          const isCorrect = selected === q.correct
                          const hasAnswered = selected !== undefined

                          return (
                            <div key={q.id} className={`rounded-xl border p-3.5 ${!hasAnswered ? 'border-gray-100' : isCorrect ? 'border-green-100 bg-green-50/40' : 'border-red-100 bg-red-50/30'}`}>
                              <div className="flex items-start gap-2 mb-2.5">
                                <span className="text-xs font-bold text-gray-400 mt-0.5 flex-shrink-0">Q{q.id}</span>
                                <p className="text-sm font-medium text-gray-800">{q.question}</p>
                                {hasAnswered && (
                                  isCorrect
                                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                              <div className="space-y-1.5 ml-5">
                                {q.options.map((opt, idx) => {
                                  const isSelected = selected === idx
                                  const isGood = idx === q.correct
                                  let cls = 'text-xs px-2.5 py-1.5 rounded-lg border '
                                  if (isSelected && isCorrect) cls += 'bg-green-100 border-green-300 text-green-800 font-medium'
                                  else if (isSelected && !isCorrect) cls += 'bg-red-100 border-red-300 text-red-800 font-medium'
                                  else if (!isSelected && isGood && hasAnswered && !isCorrect) cls += 'bg-green-50 border-green-200 text-green-700 font-medium'
                                  else cls += 'bg-white border-gray-100 text-gray-600'

                                  return (
                                    <div key={idx} className={cls}>
                                      <span className="font-bold mr-1.5">{String.fromCharCode(65 + idx)}.</span>{opt}
                                      {isSelected && !isCorrect && isGood && <span className="ml-1 text-green-600">(bonne réponse)</span>}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button onClick={() => setPassation(null)} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium">Fermer</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Hidden QS template */}
      {qsDownloadTarget && (
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
          <QSReportTemplate
            ref={qsDirectRef}
            firstName={qsDownloadTarget.first_name || session.participantName.split(' ')[0] || ''}
            lastName={qsDownloadTarget.last_name || session.participantName.split(' ').slice(1).join(' ') || ''}
            answers={(qsDownloadTarget.answers || {}) as Record<number, number>}
          />
        </div>
      )}
      {/* Hidden IE template */}
      {ieDownloadTarget && (
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
          <IEReportTemplate
            ref={ieDirectRef}
            firstName={ieDownloadTarget.first_name || session.participantName.split(' ')[0] || ''}
            lastName={ieDownloadTarget.last_name || session.participantName.split(' ').slice(1).join(' ') || ''}
            scores={(ieDownloadTarget.scores || {}) as any}
          />
        </div>
      )}
      {/* Hidden Valeurs template */}
      {valDownloadTarget && (
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
          <ValeursReportTemplate
            ref={valDirectRef}
            firstName={valDownloadTarget.first_name || session.participantName.split(' ')[0] || ''}
            lastName={valDownloadTarget.last_name || session.participantName.split(' ').slice(1).join(' ') || ''}
            scores={(valDownloadTarget.scores || {}) as Record<string, number>}
          />
        </div>
      )}
    </div>
  )
}
