import { useEffect, useState } from 'react'
import { useOutletContext, Link, useNavigate } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import { type LearnerSession } from '../../lib/learnerSession'
import { Megaphone, Calendar, PlayCircle, FileText, FlaskConical, Award, Lightbulb, Sparkles, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Announcement { id: string; content: string; created_at: string }
interface ScheduleItem { id: string; title: string; seance_date: string; seance_time: string; location_or_link: string }
interface RecentDoc { id: string; title: string; level: string; created_at: string }

const QUOTES = [
  { text: "Le coaching, c'est l'art d'aider quelqu'un à réaliser ce qu'il est capable de faire.", author: "John Whitmore" },
  { text: "Ce n'est pas ce qui vous arrive qui compte, mais comment vous réagissez à ce qui vous arrive.", author: "Épictète" },
  { text: "Le seul moyen de faire du bon travail est d'aimer ce que vous faites.", author: "Steve Jobs" },
  { text: "La connaissance s'acquiert par l'expérience, tout le reste n'est qu'information.", author: "Albert Einstein" },
  { text: "Chaque expert a un jour été un débutant.", author: "Helen Hayes" },
  { text: "Le succès, c'est aller d'échec en échec sans perdre son enthousiasme.", author: "Winston Churchill" },
  { text: "Ce que nous pensons, nous le devenons.", author: "Bouddha" },
  { text: "Le plus grand secret du bonheur, c'est d'être bien avec soi-même.", author: "Bernard de Fontenelle" },
  { text: "Les questions puissantes créent un espace dans lequel de nouvelles idées peuvent émerger.", author: "Marcia Reynolds" },
  { text: "Un coach vous aide à voir ce que vous ne voyez pas encore en vous.", author: "Anonymous" },
  { text: "Le changement commence au moment où vous décidez que votre vie peut être différente.", author: "Brian Tracy" },
  { text: "La conscience de soi est le début de toute transformation.", author: "Anonymous" },
  { text: "Vos croyances deviennent vos pensées, vos pensées deviennent vos actions.", author: "Gandhi" },
  { text: "Le voyage de mille kilomètres commence toujours par un premier pas.", author: "Lao-Tseu" },
  { text: "L'intelligence émotionnelle est la capacité à percevoir ses propres émotions et celles des autres.", author: "Daniel Goleman" },
  { text: "Ce n'est pas la montagne que nous conquérons, mais nous-mêmes.", author: "Edmund Hillary" },
  { text: "Chaque jour est une nouvelle opportunité de choisir qui vous voulez être.", author: "Anonymous" },
  { text: "La résilience, c'est la capacité à rebondir après les épreuves.", author: "Boris Cyrulnik" },
  { text: "Un objectif sans plan n'est qu'un souhait.", author: "Antoine de Saint-Exupéry" },
  { text: "La plus grande découverte de tous les temps est qu'un être humain peut changer son avenir en changeant son attitude.", author: "William James" },
]

const TIPS = [
  { title: "La question puissante", body: "Préférez « Comment ? » à « Pourquoi ? » — elle ouvre des possibilités au lieu de chercher des justifications." },
  { title: "L'écoute active", body: "Reformulez ce que dit votre client avant de répondre. Il se sentira vraiment entendu." },
  { title: "Le silence en coaching", body: "Le silence de 3 à 5 secondes après une question crée l'espace nécessaire à la réflexion profonde." },
  { title: "L'ancrage positif", body: "Associez un geste ou un mot à un état émotionnel positif pour pouvoir le rappeler à la demande." },
  { title: "La roue de la vie", body: "Outil clé pour évaluer l'équilibre global d'un client sur 8 domaines de vie en une seule session." },
  { title: "Le reframing", body: "Recadrer une situation négative sous un angle positif libère souvent de nouvelles ressources chez le client." },
  { title: "Les croyances limitantes", body: "Repérez les formules « je ne peux pas », « c'est impossible », « je ne suis pas... » — ce sont des portes d'entrée." },
  { title: "L'objectif SMART", body: "Spécifique, Mesurable, Atteignable, Réaliste, Temporel — la base de tout accompagnement structuré." },
  { title: "La respiration 4-2-6", body: "Inspirez 4 secondes, retenez 2, expirez 6. Active le système parasympathique en 3 cycles." },
  { title: "Le rapport de coaching", body: "Documentez chaque séance : objectif, insights du client, engagements pris et prochaine étape." },
  { title: "La visualisation guidée", body: "Faites imaginer l'état désiré avec tous les sens — ce que le client voit, entend, ressent dans sa vie idéale." },
  { title: "Le triangle dramatique", body: "Victim, Persécuteur, Sauveur — identifier le rôle joué par le client est souvent un tournant dans l'accompagnement." },
  { title: "La congruence", body: "Un coach efficace aligne ses mots, sa voix et son langage corporel. La congruence crée la confiance." },
  { title: "Le contrat de coaching", body: "Définissez dès le départ le périmètre, les règles de confidentialité et les critères de succès de l'accompagnement." },
  { title: "L'auto-sabotage", body: "Repérez les comportements répétitifs qui empêchent le client d'avancer — souvent liés à une croyance profonde." },
]

function RingProgress({ pct, color, size = 64, stroke = 6 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-100" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  )
}

export default function EspaceAccueil() {
  const session = useOutletContext<LearnerSession>()
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [nextSessions, setNextSessions] = useState<ScheduleItem[]>([])
  const [stats, setStats] = useState({ recordings: 0, docs: 0, testUnlocks: 0, testsDone: 0, certifs: 0 })
  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [quizUnlocked, setQuizUnlocked] = useState(false)
  const [quizDone, setQuizDone] = useState(false)

  useEffect(() => { load(); loadQuizStatus() }, [])

  async function load() {
    setLoading(true)
    const ids = session.allPromotionIds?.length ? session.allPromotionIds : []
    const currentId = ids[ids.length - 1]
    const data = await learnerApi.getAccueil({
      promotionId: currentId || null,
      allPromotionIds: ids,
      allLevels: session.allLevels?.length ? session.allLevels : [session.formationLevel],
      participantId: session.participantId || null,
      participantName: session.participantName,
    }) as any
    setAnnouncements(data.announcements || [])
    setNextSessions(data.upcomingSessions || [])
    setRecentDocs(data.recentDocs || [])
    setStats({
      recordings: data.recordingCount || 0,
      docs: data.docCount || 0,
      testUnlocks: data.testUnlockCount || 0,
      testsDone: data.testCount || 0,
      certifs: (data.quizTypes || []).length,
    })
    setLoading(false)
  }

  async function loadQuizStatus() {
    const learnerId = session.id
    const pid = session.participantId
    const parts = session.participantName.trim().split(' ')
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''
    const { data: unlocks } = await supabase.from('test_unlocks').select('id').eq('learner_id', learnerId).eq('test_type', 'quiz_coach').limit(1)
    if (!unlocks?.length) return
    setQuizUnlocked(true)
    let done = false
    if (pid) {
      const { data } = await supabase.from('test_results').select('id').eq('test_type', 'quiz_coach').eq('participant_id', pid).limit(1)
      done = !!(data?.length)
    }
    if (!done && firstName) {
      const { data } = await supabase.from('test_results').select('id').eq('test_type', 'quiz_coach').ilike('first_name', `%${firstName}%`).ilike('last_name', `%${lastName}%`).limit(1)
      done = !!(data?.length)
    }
    setQuizDone(done)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-[#1D3462]/20 border-t-[#1D3462] animate-spin" />
      <p className="text-sm text-gray-400">Chargement…</p>
    </div>
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const greetingEmoji = hour < 12 ? '🌤️' : hour < 18 ? '☀️' : '🌙'

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const quote = QUOTES[dayOfYear % QUOTES.length]
  const tip = TIPS[dayOfYear % TIPS.length]

  const levelLabel = (session.allLevels?.length > 1 ? session.allLevels : [session.formationLevel])
    .map(l => l === 'N1' ? 'N1 — Coach de vie' : l === 'N2' ? 'N2 — Master Coach Thérapeute' : 'N3 — Master Coach Consultant')
    .join(' · ')

  const totalTests = stats.testUnlocks || 1
  const testPct = Math.min(100, Math.round((stats.testsDone / totalTests) * 100))
  const recPct = stats.recordings > 0 ? 100 : 0
  const docPct = stats.docs > 0 ? 100 : 0

  const initials = session.participantName.trim().split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  return (
    <div className="space-y-4 pb-4">

      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f2347 0%, #1D3462 50%, #2a4a8a 100%)' }}>
        {/* Cercles décoratifs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7eb0ff, transparent)' }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        <div className="absolute top-1/2 right-4 w-20 h-20 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />

        <div className="relative px-5 pt-5 pb-4">
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-300 text-xs font-medium flex items-center gap-1.5 mb-1">
                <span>{greetingEmoji}</span> {greeting}
              </p>
              <h1 className="text-xl font-bold text-white leading-tight">{session.participantName}</h1>
              <span className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: '#93c5fd' }}>
                {levelLabel}
              </span>
            </div>
            {/* Avatar */}
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ml-3"
              style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', color: '#fff' }}>
              {initials}
            </div>
          </div>

          {/* Citation */}
          <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="text-3xl leading-none text-blue-300/40 font-serif mb-1">"</div>
            <p className="text-white/80 text-xs leading-relaxed italic -mt-2">{quote.text}</p>
            <p className="text-blue-300/60 text-xs mt-1.5">— {quote.author}</p>
          </div>
        </div>
      </div>

      {/* ── Quiz Final N1 ── */}
      {quizUnlocked && !quizDone && (
        <button onClick={() => navigate('/test/quiz-coach')}
          className="w-full text-left rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">📝</div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-100 text-xs font-semibold uppercase tracking-wide">À compléter</p>
              <p className="text-white font-bold text-sm mt-0.5">Quiz Final — Niveau 1</p>
              <p className="text-amber-100/70 text-xs">40 questions · Coaching de Vie</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 flex-shrink-0">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>
      )}

      {quizUnlocked && quizDone && (
        <button onClick={() => navigate('/espace/tests')}
          className="w-full text-left rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 px-4 py-3.5 flex items-center gap-3 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">✅</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">Quiz Final N1 — Complété</p>
            <p className="text-xs text-emerald-600 mt-0.5">Voir votre résultat →</p>
          </div>
        </button>
      )}

      {/* ── Progression en anneaux ── */}
      <div className="bg-white rounded-3xl border border-gray-100 px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Ma progression</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Tests', done: stats.testsDone, total: totalTests, pct: testPct, color: '#8b5cf6' },
            { label: 'Vidéos', done: stats.recordings, total: stats.recordings || 1, pct: recPct, color: '#3b82f6' },
            { label: 'Documents', done: stats.docs, total: stats.docs || 1, pct: docPct, color: '#10b981' },
          ].map(({ label, done, total, pct, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <RingProgress pct={pct} color={color} size={60} stroke={5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700">{done}<span className="text-gray-400 font-normal">/{total}</span></span>
                </div>
              </div>
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Accès rapide ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: 'Enregistrements', sub: `${stats.recordings} vidéo${stats.recordings !== 1 ? 's' : ''}`,
            icon: PlayCircle, to: '/espace/enregistrements',
            gradient: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            iconBg: 'rgba(255,255,255,0.15)',
          },
          {
            label: 'Tests', sub: `${stats.testsDone} complété${stats.testsDone !== 1 ? 's' : ''}`,
            icon: FlaskConical, to: '/espace/tests',
            gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            iconBg: 'rgba(255,255,255,0.15)',
          },
          {
            label: 'Ressources', sub: `${stats.docs} document${stats.docs !== 1 ? 's' : ''}`,
            icon: FileText, to: '/espace/documents',
            gradient: 'linear-gradient(135deg, #065f46, #10b981)',
            iconBg: 'rgba(255,255,255,0.15)',
          },
          {
            label: 'Certificats', sub: `${stats.certifs} obtenu${stats.certifs !== 1 ? 's' : ''}`,
            icon: Award, to: '/espace/certificat',
            gradient: 'linear-gradient(135deg, #92400e, #f59e0b)',
            iconBg: 'rgba(255,255,255,0.15)',
          },
        ].map(({ label, sub, icon: Icon, to, gradient, iconBg }) => (
          <Link key={to} to={to}
            className="rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
            style={{ background: gradient }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Nouvelles ressources ── */}
      {recentDocs.length > 0 && (
        <div className="rounded-3xl border border-emerald-100 overflow-hidden bg-white shadow-sm">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Nouvelles ressources</h2>
            <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
              {recentDocs.length} nouveau{recentDocs.length > 1 ? 'x' : ''}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentDocs.map(doc => (
              <Link key={doc.id} to="/espace/documents"
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Conseil du jour ── */}
      <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-amber-900">Conseil du jour</span>
            <span className="ml-auto text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
              {dayOfYear % TIPS.length + 1}/{TIPS.length}
            </span>
          </div>
          <div className="rounded-2xl px-4 py-3 border border-amber-200/60" style={{ background: 'rgba(255,255,255,0.6)' }}>
            <p className="text-sm font-bold text-amber-900 mb-1">{tip.title}</p>
            <p className="text-sm text-amber-800/80 leading-relaxed">{tip.body}</p>
          </div>
        </div>
      </div>

      {/* ── Prochaines séances ── */}
      {nextSessions.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-sm">Prochaines séances</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {nextSessions.map(s => {
              const d = new Date(s.seance_date + 'T00:00:00')
              return (
                <div key={s.id} className="px-5 py-3.5 flex items-start gap-4">
                  <div className="rounded-2xl overflow-hidden flex-shrink-0 text-center w-12" style={{ background: 'linear-gradient(135deg, #1D3462, #2a4a8a)' }}>
                    <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider py-1 border-b border-white/10">
                      {d.toLocaleDateString('fr-FR', { month: 'short' })}
                    </p>
                    <p className="text-white text-lg font-bold py-1">{d.getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                    {s.seance_time && <p className="text-xs text-gray-400 mt-0.5">🕐 {s.seance_time}</p>}
                    {s.location_or_link && (
                      s.location_or_link.startsWith('http') ? (
                        <a href={s.location_or_link} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium mt-1 hover:underline">
                          Rejoindre <ChevronRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">📍 {s.location_or_link}</p>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Annonces ── */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Megaphone className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <h2 className="font-semibold text-gray-900 text-sm">Annonces</h2>
            <span className="ml-auto w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
              {announcements.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {announcements.map(a => (
              <div key={a.id} className="px-5 py-4 flex gap-3">
                <div className="w-1.5 rounded-full bg-gradient-to-b from-amber-400 to-orange-400 flex-shrink-0 mt-1.5 self-stretch" style={{ minHeight: 16 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
