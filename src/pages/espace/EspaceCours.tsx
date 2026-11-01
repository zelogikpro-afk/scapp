import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import { type LearnerSession } from '../../lib/learnerSession'
import {
  ChevronDown, ChevronRight, CheckCircle, PlayCircle,
  FileText, BookOpen, Clock, Menu, X, Award
} from 'lucide-react'
import VideoWatermark from '../../components/ui/VideoWatermark'

interface Module { id: string; title: string; description: string; formation_level: string; order_index: number; is_published: boolean }
interface Lesson { id: string; module_id: string; title: string; type: string; content_url: string; content_text: string; duration_minutes: number; order_index: number; is_published: boolean }

const TYPE_ICON = { video: PlayCircle, pdf: FileText, article: BookOpen }
const TYPE_LABEL = { video: 'Vidéo', pdf: 'PDF', article: 'Article' }

function getYoutubeId(url: string) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return m ? m[1] : null
}
function isSupabaseUrl(url: string) { return url?.includes('supabase.co/storage') }
function isVideoFile(url: string) { return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) }
function isPdfFile(url: string) { return /\.pdf(\?|$)/i.test(url) }

const LEVEL_LABEL: Record<string, string> = {
  N1: 'Niveau 1 — Coach de vie et Développement Personnel',
  N2: 'Niveau 2 — Master Coach Thérapeute',
  N3: 'Niveau 3 — Master Coach Consultant',
}

export default function EspaceCours() {
  const session = useOutletContext<LearnerSession>()
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [marking, setMarking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await learnerApi.getCours({ formationLevel: session.formationLevel }) as any
    const mods: Module[] = data.modules || []
    const lsns: Lesson[] = data.lessons || []
    setModules(mods)
    setLessons(lsns)
    setProgress(new Set((data.progress || []).map((r: any) => r.lesson_id)))
    if (mods.length) setExpanded(new Set([mods[0].id]))
    // auto-select first lesson
    const first = lsns.filter(l => mods.some(m => m.id === l.module_id)).sort((a, b) => {
      const ma = mods.find(m => m.id === a.module_id)!
      const mb = mods.find(m => m.id === b.module_id)!
      return ma.order_index - mb.order_index || a.order_index - b.order_index
    })[0]
    if (first) setSelectedLesson(first)
    setLoading(false)
  }

  async function markComplete(lesson: Lesson) {
    if (progress.has(lesson.id)) return
    setMarking(true)
    await learnerApi.completeLesson(lesson.id)
    setProgress(prev => new Set([...prev, lesson.id]))
    setMarking(false)
  }

  function selectLesson(lesson: Lesson) {
    setSelectedLesson(lesson)
    setSidebarOpen(false)
    // expand the lesson's module
    setExpanded(prev => new Set([...prev, lesson.module_id]))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goNext() {
    if (!selectedLesson) return
    const all = lessons.filter(l => modules.some(m => m.id === l.module_id)).sort((a, b) => {
      const ma = modules.find(m => m.id === a.module_id)!
      const mb = modules.find(m => m.id === b.module_id)!
      return ma.order_index - mb.order_index || a.order_index - b.order_index
    })
    const idx = all.findIndex(l => l.id === selectedLesson.id)
    if (idx < all.length - 1) selectLesson(all[idx + 1])
  }

  function goPrev() {
    if (!selectedLesson) return
    const all = lessons.filter(l => modules.some(m => m.id === l.module_id)).sort((a, b) => {
      const ma = modules.find(m => m.id === a.module_id)!
      const mb = modules.find(m => m.id === b.module_id)!
      return ma.order_index - mb.order_index || a.order_index - b.order_index
    })
    const idx = all.findIndex(l => l.id === selectedLesson.id)
    if (idx > 0) selectLesson(all[idx - 1])
  }

  const toggle = (id: string) => setExpanded(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
  })

  const allLessons = lessons.filter(l => modules.some(m => m.id === l.module_id))
  const totalLessons = allLessons.length
  const completedLessons = allLessons.filter(l => progress.has(l.id)).length
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const sortedAll = allLessons.sort((a, b) => {
    const ma = modules.find(m => m.id === a.module_id)!
    const mb = modules.find(m => m.id === b.module_id)!
    return ma.order_index - mb.order_index || a.order_index - b.order_index
  })
  const currentIdx = selectedLesson ? sortedAll.findIndex(l => l.id === selectedLesson.id) : -1
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < sortedAll.length - 1

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Chargement de vos cours…</p>
      </div>
    </div>
  )

  if (modules.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <BookOpen className="w-14 h-14 mb-4 opacity-25" />
      <p className="font-medium">Aucun cours disponible</p>
      <p className="text-sm mt-1">Revenez bientôt !</p>
    </div>
  )

  return (
    <div style={{ margin: '-24px -20px 0', minHeight: '100vh', background: '#f8f9fb' }}>

      {/* Top bar */}
      <div style={{
        background: '#0D1F3C',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {LEVEL_LABEL[session.formationLevel] || session.formationLevel}
          </p>
          {selectedLesson && (
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedLesson.title}
            </p>
          )}
        </div>
        {/* Progress pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#1ABCAB', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
          <span style={{ color: '#1ABCAB', fontSize: 12, fontWeight: 700 }}>{pct}%</span>
        </div>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          style={{ color: '#fff', padding: 4, display: 'flex', alignItems: 'center' }}
          className="lg-hide-btn"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>

        {/* Player area */}
        <div style={{ flex: 1, minWidth: 0, padding: '0 0 40px' }}>

          {/* Video / content */}
          <div style={{ background: '#000', width: '100%' }}>
            {selectedLesson ? (
              <LessonPlayer lesson={selectedLesson} session={session} />
            ) : (
              <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayCircle style={{ width: 64, height: 64, color: 'rgba(255,255,255,0.2)' }} />
              </div>
            )}
          </div>

          {/* Controls bar */}
          {selectedLesson && (
            <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: hasPrev ? '#f3f4f6' : 'transparent',
                  color: hasPrev ? '#374151' : '#d1d5db',
                  border: 'none', cursor: hasPrev ? 'pointer' : 'default',
                }}
              >← Précédent</button>

              <div style={{ flex: 1, textAlign: 'center' }}>
                {progress.has(selectedLesson.id) ? (
                  <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CheckCircle style={{ width: 16, height: 16 }} /> Terminé
                  </span>
                ) : (
                  <button
                    onClick={() => markComplete(selectedLesson)}
                    disabled={marking}
                    style={{
                      padding: '8px 20px', borderRadius: 8, background: '#1ABCAB', color: '#fff',
                      fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                      opacity: marking ? 0.6 : 1,
                    }}
                  >
                    {marking ? 'Enregistrement…' : '✓ Marquer comme terminé'}
                  </button>
                )}
              </div>

              <button
                onClick={goNext}
                disabled={!hasNext}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: hasNext ? '#0D1F3C' : 'transparent',
                  color: hasNext ? '#fff' : '#d1d5db',
                  border: 'none', cursor: hasNext ? 'pointer' : 'default',
                }}
              >Suivant →</button>
            </div>
          )}

          {/* Lesson info */}
          {selectedLesson && (
            <div style={{ padding: '24px 20px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <LessonTypeBadge type={selectedLesson.type} />
                {selectedLesson.duration_minutes > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9ca3af', fontSize: 12 }}>
                    <Clock style={{ width: 13, height: 13 }} />{selectedLesson.duration_minutes} min
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{selectedLesson.title}</h2>
              {selectedLesson.type === 'article' && selectedLesson.content_text && (
                <div style={{ marginTop: 16, color: '#374151', lineHeight: 1.7, fontSize: 15, whiteSpace: 'pre-wrap' }}>
                  {selectedLesson.content_text}
                </div>
              )}
            </div>
          )}

          {/* Completion banner */}
          {pct === 100 && (
            <div style={{ margin: 20, background: 'linear-gradient(135deg,#0D1F3C,#1A3360)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', color: '#fff' }}>
              <Award style={{ width: 48, height: 48, color: '#1ABCAB', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>Formation complète !</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Félicitations pour avoir terminé tous les cours.</p>
            </div>
          )}
        </div>

        {/* Curriculum sidebar — desktop always visible, mobile overlay */}
        <div
          style={{
            width: 340,
            flexShrink: 0,
            background: '#fff',
            borderLeft: '1px solid #e5e7eb',
            minHeight: 'calc(100vh - 60px)',
            position: 'sticky',
            top: 60,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 60px)',
          }}
          className="course-sidebar"
        >
          <SidebarContent
            modules={modules}
            lessons={lessons}
            progress={progress}
            expanded={expanded}
            toggle={toggle}
            selectedLesson={selectedLesson}
            onSelect={selectLesson}
            completedLessons={completedLessons}
            totalLessons={totalLessons}
          />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
            <div style={{ background: '#fff', maxHeight: '75vh', overflowY: 'auto', borderRadius: '16px 16px 0 0' }}>
              <SidebarContent
                modules={modules}
                lessons={lessons}
                progress={progress}
                expanded={expanded}
                toggle={toggle}
                selectedLesson={selectedLesson}
                onSelect={selectLesson}
                completedLessons={completedLessons}
                totalLessons={totalLessons}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 900px) {
          .lg-hide-btn { display: none !important; }
        }
        @media (max-width: 899px) {
          .course-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Sidebar content ─────────────────────────────────────────────── */
function SidebarContent({ modules, lessons, progress, expanded, toggle, selectedLesson, onSelect, completedLessons, totalLessons }: {
  modules: Module[]; lessons: Lesson[]; progress: Set<string>; expanded: Set<string>
  toggle: (id: string) => void; selectedLesson: Lesson | null; onSelect: (l: Lesson) => void
  completedLessons: number; totalLessons: number
}) {
  return (
    <div>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 8px' }}>Contenu du cours</p>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{completedLessons}/{totalLessons} leçons terminées</p>
      </div>
      {modules.map(mod => {
        const modLessons = lessons.filter(l => l.module_id === mod.id).sort((a, b) => a.order_index - b.order_index)
        const modDone = modLessons.filter(l => progress.has(l.id)).length
        const allDone = modDone === modLessons.length && modLessons.length > 0
        const isOpen = expanded.has(mod.id)
        return (
          <div key={mod.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <button
              onClick={() => toggle(mod.id)}
              style={{
                width: '100%', padding: '14px 16px', background: '#f9fafb',
                display: 'flex', alignItems: 'flex-start', gap: 10,
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: 6,
                background: allDone ? '#dcfce7' : '#e0e7ff',
                color: allDone ? '#16a34a' : '#4f46e5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {allDone ? '✓' : mod.order_index}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px', lineHeight: 1.4 }}>{mod.title}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{modDone}/{modLessons.length} leçons</p>
              </div>
              {isOpen
                ? <ChevronDown style={{ width: 16, height: 16, color: '#9ca3af', flexShrink: 0, marginTop: 3 }} />
                : <ChevronRight style={{ width: 16, height: 16, color: '#9ca3af', flexShrink: 0, marginTop: 3 }} />
              }
            </button>

            {isOpen && modLessons.map(lesson => {
              const done = progress.has(lesson.id)
              const active = selectedLesson?.id === lesson.id
              const Icon = TYPE_ICON[lesson.type as keyof typeof TYPE_ICON] || BookOpen
              return (
                <button
                  key={lesson.id}
                  onClick={() => onSelect(lesson)}
                  style={{
                    width: '100%', padding: '11px 16px 11px 50px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: active ? '#eff6ff' : 'transparent',
                    borderLeft: active ? '3px solid #1ABCAB' : '3px solid transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: '1px solid #f9fafb',
                  }}
                >
                  <Icon style={{ width: 15, height: 15, flexShrink: 0, color: done ? '#16a34a' : active ? '#1ABCAB' : '#9ca3af' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, margin: 0,
                      fontWeight: active ? 600 : 400,
                      color: done ? '#6b7280' : active ? '#1d4ed8' : '#374151',
                      lineHeight: 1.4,
                    }}>{lesson.title}</p>
                    {lesson.duration_minutes > 0 && (
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock style={{ width: 11, height: 11 }} />{lesson.duration_minutes} min
                      </p>
                    )}
                  </div>
                  {done && <CheckCircle style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/* ── Lesson player ───────────────────────────────────────────────── */
function LessonPlayer({ lesson, session }: { lesson: Lesson; session: LearnerSession }) {
  const url = lesson.content_url

  if (lesson.type === 'video' && url) {
    const ytId = getYoutubeId(url)
    const isNative = isSupabaseUrl(url) || isVideoFile(url)

    if (ytId) return (
      <VideoWatermark name={session.participantName} email={session.email}>
        <div style={{ aspectRatio: '16/9', width: '100%' }}>
          <iframe
            key={lesson.id}
            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=0`}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </VideoWatermark>
    )

    if (isNative) return (
      <VideoWatermark name={session.participantName} email={session.email}>
        <video
          key={lesson.id}
          src={url}
          controls
          style={{ width: '100%', maxHeight: 520, display: 'block', background: '#000' }}
          controlsList="nodownload"
          onContextMenu={e => e.preventDefault()}
        >
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      </VideoWatermark>
    )

    return (
      <div style={{ aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <PlayCircle style={{ width: 64, height: 64, color: 'rgba(255,255,255,0.3)' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Vidéo hébergée en externe</p>
        <a
          href={url} target="_blank" rel="noreferrer"
          style={{ padding: '10px 24px', background: '#1ABCAB', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
        >
          Ouvrir la vidéo ↗
        </a>
      </div>
    )
  }

  if (lesson.type === 'pdf' && url) {
    const canEmbed = isSupabaseUrl(url) || isPdfFile(url)
    if (canEmbed) return (
      <iframe
        key={lesson.id}
        src={url}
        style={{ width: '100%', height: '75vh', display: 'block', border: 'none' }}
        title={lesson.title}
      />
    )
    return (
      <div style={{ aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <FileText style={{ width: 64, height: 64, color: 'rgba(255,255,255,0.3)' }} />
        <a
          href={url} target="_blank" rel="noreferrer"
          style={{ padding: '10px 24px', background: '#ef4444', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
        >
          Ouvrir le PDF ↗
        </a>
      </div>
    )
  }

  // article — rendered below the bar, not in the black area
  return (
    <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BookOpen style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.15)' }} />
    </div>
  )
}

/* ── Type badge ──────────────────────────────────────────────────── */
function LessonTypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    video: { bg: '#dbeafe', color: '#1d4ed8' },
    pdf:   { bg: '#fee2e2', color: '#dc2626' },
    article: { bg: '#dcfce7', color: '#16a34a' },
  }
  const c = colors[type] || { bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>
      {TYPE_LABEL[type as keyof typeof TYPE_LABEL] || type}
    </span>
  )
}
