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

    const { data: unlocks } = await supabase
      .from('test_unlocks')
      .select('id')
      .eq('learner_id', learnerId)
      .eq('test_type', 'quiz_coach')
      .limit(1)

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

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const quote = QUOTES[dayOfYear % QUOTES.length]
  const tip = TIPS[dayOfYear % TIPS.length]

  const levelLabel = (session.allLevels?.length > 1 ? session.allLevels : [session.formationLevel])
    .map(l => l === 'N1' ? 'N1 — Coach de vie' : l === 'N2' ? 'N2 — Master Coach Thérapeute' : 'N3 — Master Coach Consultant')
    .join(' · ')

  const totalTests = stats.testUnlocks || 1
  const testPct = Math.min(100, Math.round((stats.testsDone / totalTests) * 100))
  const recPct = stats.recordings > 0 ? 100 : 0

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1D3462] to-[#2B4A8C] rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium mb-1">{greeting} 👋</p>
        <h1 className="text-2xl font-bold">{session.participantName}</h1>
        <p className="text-blue-200 text-sm mt-0.5">{levelLabel}</p>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/50 text-xs mb-1 italic">Citation du jour</p>
          <p className="text-white/85 text-sm leading-relaxed italic">"{quote.text}"</p>
          <p className="text-white/45 text-xs mt-1.5">— {quote.author}</p>
        </div>
      </div>

      {/* Bandeau Quiz Final N1 */}
      {quizUnlocked && !quizDone && (
        <button
          onClick={() => navigate('/test/quiz-coach')}
          className="w-full text-left rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm hover:shadow-md transition-shadow"
          style={{ background: 'linear-gradient(135deg, #1D3462 0%, #2a4a8a 100%)' }}
        >
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0 text-2xl">
              📝
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide mb-0.5">À compléter</p>
              <p className="text-base font-bold text-white">Quiz Final — Niveau 1</p>
              <p className="text-xs text-blue-200 mt-0.5">40 questions · Dév. Personnel & Coaching de Vie</p>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-400 text-amber-900 font-bold text-sm px-4 py-2 rounded-xl flex-shrink-0">
              Commencer <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </button>
      )}

      {quizUnlocked && quizDone && (
        <button
          onClick={() => navigate('/espace/tests')}
          className="w-full text-left rounded-2xl overflow-hidden border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
        >
          <div className="px-5 py-3.5 flex items-center gap-3">
            <span className="text-xl">✅</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">Quiz Final N1 — Complété</p>
              <p className="text-xs text-green-600 mt-0.5">Voir votre résultat et la correction →</p>
            </div>
          </div>
        </button>
      )}

      {/* Progression */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm">Ma progression</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { label: 'Tests passés', done: stats.testsDone, total: totalTests, pct: testPct, color: 'bg-purple-500' },
            { label: 'Enregistrements', done: stats.recordings, total: stats.recordings, pct: recPct, color: 'bg-blue-500' },
            { label: 'Documents', done: stats.docs, total: stats.docs, pct: stats.docs > 0 ? 100 : 0, color: 'bg-green-500' },
          ].map(({ label, done, total, pct, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-32 flex-shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">{done}/{total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accès rapide */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Enregistrements', sub: `${stats.recordings} vidéo${stats.recordings !== 1 ? 's' : ''}`, icon: PlayCircle, to: '/espace/enregistrements', iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
          { label: 'Tests', sub: `${stats.testsDone} complété${stats.testsDone !== 1 ? 's' : ''}`, icon: FlaskConical, to: '/espace/tests', iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
          { label: 'Ressources', sub: `${stats.docs} document${stats.docs !== 1 ? 's' : ''}`, icon: FileText, to: '/espace/documents', iconColor: 'text-green-600', bgColor: 'bg-green-50' },
          { label: 'Certificats', sub: `${stats.certifs} obtenu${stats.certifs !== 1 ? 's' : ''}`, icon: Award, to: '/espace/certificat', iconColor: 'text-amber-600', bgColor: 'bg-amber-50' },
        ].map(({ label, sub, icon: Icon, to, iconColor, bgColor }) => (
          <Link key={to} to={to} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Nouvelles ressources */}
      {recentDocs.length > 0 && (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-green-50 bg-green-50/50">
            <Sparkles className="w-4 h-4 text-green-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Nouvelles ressources</h2>
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
              {recentDocs.length} nouveau{recentDocs.length > 1 ? 'x' : ''}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentDocs.map(doc => (
              <Link key={doc.id} to="/espace/documents" className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <span className="text-xs text-green-600 font-medium flex-shrink-0">Voir →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Conseil du jour */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Conseil du jour</h2>
          <span className="ml-auto text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">Jour {dayOfYear % TIPS.length + 1}/{TIPS.length}</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">{tip.title}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{tip.body}</p>
        </div>
      </div>

      {/* Prochaines séances */}
      {nextSessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Prochaines séances</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {nextSessions.map(s => (
              <div key={s.id} className="px-5 py-3.5 flex items-start gap-4">
                <div className="bg-blue-50 rounded-xl px-3 py-2 text-center min-w-[48px]">
                  <p className="text-xs text-blue-400 font-medium leading-none">{new Date(s.seance_date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</p>
                  <p className="text-lg font-bold text-blue-700 leading-tight">{new Date(s.seance_date + 'T00:00:00').getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                  {s.seance_time && <p className="text-xs text-gray-400 mt-0.5">{s.seance_time}</p>}
                  {s.location_or_link && (
                    s.location_or_link.startsWith('http') ? (
                      <a href={s.location_or_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-0.5 block truncate">Rejoindre →</a>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">{s.location_or_link}</p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annonces */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Annonces</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {announcements.map(a => (
              <div key={a.id} className="px-5 py-4 flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
