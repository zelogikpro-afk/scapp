import { useEffect, useState } from 'react'
import { useOutletContext, Link, useNavigate } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import { type LearnerSession } from '../../lib/learnerSession'
import { supabase } from '../../lib/supabase'

interface Announcement { id: string; content: string; created_at: string }
interface ScheduleItem { id: string; title: string; seance_date: string; seance_time: string; location_or_link: string }
interface RecentDoc { id: string; title: string; level: string; created_at: string }

const MESSAGES_JOUR = [
  { text: "Chaque séance est une opportunité de découvrir une nouvelle dimension de vous-même.", author: "Sofya, Coach de vie" },
  { text: "Le coaching n'est pas une destination — c'est une façon d'être avec soi-même et avec les autres.", author: "Sofya, Coach de vie" },
  { text: "Vos clients futurs ont besoin exactement de ce que vous êtes en train d'apprendre aujourd'hui.", author: "Sofya, Coach de vie" },
  { text: "L'authenticité est votre plus grand outil de coach. Plus vous vous connaissez, plus vous êtes puissante.", author: "Sofya, Coach de vie" },
  { text: "Un coach ne donne pas les réponses — il pose les questions qui permettent à l'autre de les trouver.", author: "Sofya, Coach de vie" },
  { text: "La présence totale est le don le plus précieux que vous offrirez à vos clients.", author: "Sofya, Coach de vie" },
  { text: "Chaque concept que vous apprenez aujourd'hui changera une vie demain. La vôtre, et celle de vos clients.", author: "Sofya, Coach de vie" },
]

const PURPLE = '#6C5CE7'
const PURPLE_LIGHT = '#F0EEFF'
const DARK = '#1E1B4B'
const MUTED = '#8B8AAA'

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 80, background: '#F5F4FF', minHeight: '100vh' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${PURPLE_LIGHT}`, borderTopColor: PURPLE, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const msgJour = MESSAGES_JOUR[dayOfYear % MESSAGES_JOUR.length]
  const firstName = session.participantName.trim().split(' ')[0]
  const initials = session.participantName.trim().split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
  const totalTests = stats.testUnlocks || 1

  const quickLinks = [
    { label: 'Cours & Leçons', sub: 'Modules & vidéos', emoji: '🎓', to: '/espace/cours', color: '#1ABCAB', bg: '#f0fdfb' },
    { label: 'Séances vidéo', sub: `${stats.recordings} vidéo${stats.recordings !== 1 ? 's' : ''}`, emoji: '🎬', to: '/espace/enregistrements', color: '#6C5CE7', bg: '#F0EEFF' },
    { label: 'Tests & Quiz', sub: `${stats.testsDone}/${totalTests} fait${stats.testsDone !== 1 ? 's' : ''}`, emoji: '🧪', to: '/espace/tests', color: '#0EA5E9', bg: '#E0F2FE' },
    { label: 'Documents', sub: `${stats.docs} ressource${stats.docs !== 1 ? 's' : ''}`, emoji: '📚', to: '/espace/documents', color: '#10B981', bg: '#ECFDF5' },
    { label: 'Certificats', sub: stats.certifs > 0 ? `${stats.certifs} obtenu${stats.certifs !== 1 ? 's' : ''}` : 'En cours…', emoji: '🏆', to: '/espace/certificat', color: '#F59E0B', bg: '#FEF3C7' },
  ]

  const S: Record<string, React.CSSProperties> = {
    page: { background: '#F5F4FF', minHeight: '100vh', marginLeft: -16, marginRight: -16, paddingBottom: 32 },
    /* TOP BAR */
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 10px' },
    greeting: { fontSize: 12, color: MUTED, fontWeight: 500 },
    name: { fontSize: 17, fontWeight: 800, color: DARK },
    avatar: { width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${PURPLE},#A78BFA)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' },
    /* HERO */
    hero: { background: `linear-gradient(135deg,${PURPLE} 0%,#8B5CF6 55%,#A78BFA 100%)`, margin: '0 16px', borderRadius: 20, padding: '20px 20px 22px', position: 'relative', overflow: 'hidden' },
    heroDeco1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' },
    heroDeco2: { position: 'absolute', bottom: -30, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' },
    heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500, marginBottom: 4 },
    heroTitle: { fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 4 },
    heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 16 },
    heroCta: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: PURPLE, padding: '8px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer' },
    /* STATS */
    statsRow: { display: 'flex', gap: 8, padding: '12px 16px' },
    statCard: { flex: 1, background: '#fff', borderRadius: 13, padding: '10px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(108,92,231,0.08)' },
    statN: { fontSize: 20, fontWeight: 800, color: PURPLE, lineHeight: 1 },
    statL: { fontSize: 9, color: MUTED, fontWeight: 500, marginTop: 3 },
    /* SECTION HEAD */
    secHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 10, marginTop: 16 },
    secTitle: { fontSize: 14, fontWeight: 700, color: DARK },
    secLink: { fontSize: 11, fontWeight: 600, color: PURPLE },
    /* MSG */
    msgCard: { margin: '0 16px', background: `linear-gradient(135deg,${DARK},#312E81)`, borderRadius: 16, padding: '16px 18px', position: 'relative', overflow: 'hidden' },
    msgLabel: { fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 },
    msgText: { fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.6, fontStyle: 'italic' as const },
    msgAuthor: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 10 },
    /* QUIZ */
    quizCard: { margin: '0 16px', background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)', border: '1.5px solid #FDE68A', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 },
    quizBtn: { background: '#F59E0B', borderRadius: 50, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 },
    /* QUICK LINKS */
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' },
    qlCard: { borderRadius: 14, padding: '14px 12px', display: 'flex', flexDirection: 'column' as const, gap: 8, textDecoration: 'none' },
    qlEmoji: { fontSize: 22 },
    qlLabel: { fontSize: 12, fontWeight: 700, color: DARK },
    qlSub: { fontSize: 10, fontWeight: 500 },
    /* RECENT DOCS */
    whiteCard: { margin: '0 16px', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(108,92,231,0.07)' },
    docRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid #F5F4FF', textDecoration: 'none' },
    docIcon: { fontSize: 16, flexShrink: 0 },
    docName: { flex: 1, fontSize: 12, fontWeight: 600, color: DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    docArrow: { fontSize: 14, color: '#C4C2DD', flexShrink: 0 },
    /* SESSIONS */
    seanceCard: { margin: '0 16px 8px', background: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(108,92,231,0.07)' },
    seanceDate: { background: `linear-gradient(135deg,${PURPLE},#8B5CF6)`, borderRadius: 10, width: 42, height: 48, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    seanceD: { fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1 },
    seanceM: { fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const },
    seanceTitle: { fontSize: 12, fontWeight: 700, color: DARK },
    seanceTime: { fontSize: 10, color: MUTED, marginTop: 1 },
    joinBtn: { background: PURPLE_LIGHT, borderRadius: 50, padding: '4px 11px', fontSize: 10, fontWeight: 700, color: PURPLE, textDecoration: 'none', flexShrink: 0, border: 'none' },
    /* ANNONCES */
    annoCard: { margin: '0 16px 8px', background: '#fff', borderRadius: 14, padding: '14px', boxShadow: '0 2px 8px rgba(108,92,231,0.07)' },
    annoText: { fontSize: 13, color: '#374151', lineHeight: 1.55 },
    annoDate: { fontSize: 10, color: '#D1D5DB', marginTop: 6 },
  }

  return (
    <div style={S.page}>

      {/* TOP BAR */}
      <div style={S.topBar}>
        <div>
          <div style={S.greeting}>{greeting}</div>
          <div style={S.name}>{firstName}</div>
        </div>
        <div style={S.avatar}>{initials}</div>
      </div>

      {/* HERO */}
      <div style={S.hero}>
        <div style={S.heroDeco1} />
        <div style={S.heroDeco2} />
        <div style={{ position: 'relative' }}>
          <div style={S.heroLabel}>Continue ton apprentissage</div>
          <div style={S.heroTitle}>Success<br />Compass</div>
          <div style={S.heroSub}>Formation Coach Certifié · {session.formationLevel || 'Niveau 1'}</div>
          <button style={S.heroCta} onClick={() => navigate('/espace/enregistrements')}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#6C5CE7"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Reprendre
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={S.statsRow}>
        <div style={S.statCard}><div style={S.statN}>{stats.recordings}</div><div style={S.statL}>Séances</div></div>
        <div style={S.statCard}><div style={S.statN}>{stats.docs}</div><div style={S.statL}>Docs</div></div>
        <div style={S.statCard}><div style={S.statN}>{stats.testsDone}</div><div style={S.statL}>Tests</div></div>
        <div style={S.statCard}><div style={{ ...S.statN, color: stats.certifs > 0 ? '#10B981' : PURPLE }}>{stats.certifs}</div><div style={S.statL}>Certif.</div></div>
      </div>

      {/* MESSAGE DU JOUR */}
      <div style={{ ...S.secHead, marginTop: 8 }}><span style={S.secTitle}>Message du jour</span></div>
      <div style={S.msgCard}>
        <div style={{ position: 'absolute', top: -8, right: 14, fontSize: 90, fontWeight: 900, color: 'rgba(255,255,255,0.05)', lineHeight: 1, fontFamily: 'Georgia,serif', pointerEvents: 'none' }}>"</div>
        <div style={S.msgLabel}>Inspiration · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div style={S.msgText}>{msgJour.text}</div>
        <div style={S.msgAuthor}>— {msgJour.author}</div>
      </div>

      {/* QUIZ BANNER */}
      {quizUnlocked && !quizDone && (
        <>
          <div style={{ ...S.secHead, marginTop: 16 }}><span style={S.secTitle}>À faire</span></div>
          <div style={S.quizCard}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>⚡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Quiz débloqué !</div>
              <div style={{ fontSize: 10, color: '#B45309', marginTop: 1 }}>Quiz Final — Coach Certifié</div>
            </div>
            <button style={S.quizBtn} onClick={() => navigate('/test/quiz-coach')}>Démarrer</button>
          </div>
        </>
      )}

      {/* MON PROGRAMME */}
      <div style={S.secHead}><span style={S.secTitle}>Mon programme</span></div>
      <div style={S.grid2}>
        {quickLinks.map(({ label, sub, emoji, to, color, bg }) => (
          <Link key={to} to={to} style={{ ...S.qlCard, background: bg, textDecoration: 'none', boxShadow: '0 2px 8px rgba(108,92,231,0.07)' }}>
            <span style={S.qlEmoji}>{emoji}</span>
            <div style={S.qlLabel}>{label}</div>
            <div style={{ ...S.qlSub, color }}>{sub}</div>
          </Link>
        ))}
      </div>

      {/* ANNONCES */}
      {announcements.length > 0 && (
        <>
          <div style={S.secHead}><span style={S.secTitle}>Annonces</span></div>
          {announcements.map(a => (
            <div key={a.id} style={S.annoCard}>
              <div style={S.annoText}>{a.content}</div>
              <div style={S.annoDate}>{new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
            </div>
          ))}
        </>
      )}

      {/* NOUVELLES RESSOURCES */}
      {recentDocs.length > 0 && (
        <>
          <div style={S.secHead}><span style={S.secTitle}>Nouvelles ressources</span><span style={S.secLink}>Voir tout</span></div>
          <div style={S.whiteCard}>
            {recentDocs.map((doc, i) => (
              <Link key={doc.id} to="/espace/documents" style={{ ...S.docRow, borderBottom: i < recentDocs.length - 1 ? '1px solid #F5F4FF' : 'none' }}>
                <span style={S.docIcon}>📄</span>
                <span style={S.docName}>{doc.title}</span>
                <span style={S.docArrow}>›</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* PROCHAINES SÉANCES */}
      {nextSessions.length > 0 && (
        <>
          <div style={S.secHead}><span style={S.secTitle}>Prochaines séances</span><span style={S.secLink}>Agenda</span></div>
          {nextSessions.map(s => {
            const d = new Date(s.seance_date + 'T00:00:00')
            return (
              <div key={s.id} style={S.seanceCard}>
                <div style={S.seanceDate}>
                  <div style={S.seanceD}>{d.getDate()}</div>
                  <div style={S.seanceM}>{d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.seanceTitle}>{s.title}</div>
                  {s.seance_time && <div style={S.seanceTime}>{s.seance_time}</div>}
                </div>
                {s.location_or_link?.startsWith('http') ? (
                  <a href={s.location_or_link} target="_blank" rel="noreferrer" style={S.joinBtn}>Rejoindre</a>
                ) : (
                  <span style={{ ...S.joinBtn, background: '#F5F4FF', color: MUTED }}>{s.location_or_link || 'Présentiel'}</span>
                )}
              </div>
            )
          })}
        </>
      )}

    </div>
  )
}
