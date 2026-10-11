import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import { type LearnerSession } from '../../lib/learnerSession'
import { ChevronDown, ChevronRight, CheckCircle, PlayCircle, FileText, BookOpen, Clock, Lock } from 'lucide-react'
import VideoWatermark from '../../components/ui/VideoWatermark'

interface Module { id: string; title: string; description: string; formation_level: string; order_index: number; is_published: boolean }
interface Lesson { id: string; module_id: string; title: string; type: string; content_url: string; content_text: string; duration_minutes: number; order_index: number; is_published: boolean }

const TYPE_ICON = { video: PlayCircle, pdf: FileText, article: BookOpen }
const TYPE_LABEL = { video: 'Vidéo', pdf: 'PDF', article: 'Article' }
const TYPE_COLOR = { video: 'text-blue-600 bg-blue-50', pdf: 'text-red-600 bg-red-50', article: 'text-green-600 bg-green-50' }

function getYoutubeId(url: string) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return m ? m[1] : null
}
function isSupabaseUrl(url: string) { return url?.includes('supabase.co/storage') }
function isVideoFile(url: string) { return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) }
function isPdfFile(url: string) { return /\.pdf(\?|$)/i.test(url) }

export default function EspaceCours() {
  const session = useOutletContext<LearnerSession>()
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [marking, setMarking] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await learnerApi.getCours({ formationLevel: session.formationLevel }) as any
    const mods = data.modules || []
    setModules(mods)
    setLessons(data.lessons || [])
    setProgress(new Set((data.progress || []).map((r: any) => r.lesson_id)))
    if (mods.length) setExpanded(new Set([mods[0].id]))
    setLoading(false)
  }

  async function markComplete(lesson: Lesson) {
    if (progress.has(lesson.id)) return
    setMarking(true)
    await learnerApi.completeLesson(lesson.id)
    setProgress(prev => new Set([...prev, lesson.id]))
    setMarking(false)
  }

  const toggle = (id: string) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const totalLessons = lessons.filter(l => modules.some(m => m.id === l.module_id)).length
  const completedLessons = lessons.filter(l => modules.some(m => m.id === l.module_id) && progress.has(l.id)).length
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement de vos cours…</div>

  return (
    <div className="space-y-6">
      {/* Header progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-6">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Mes cours</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {session.formationLevel === 'N1' ? 'Niveau 1 — Coach de vie et Développement Personnel'
              : session.formationLevel === 'N2' ? 'Niveau 2 — Master Coach Thérapeute'
              : 'Niveau 3 — Master Coach Consultant'}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">{pct}%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{completedLessons} / {totalLessons} leçons terminées</p>
        </div>
        {pct === 100 && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-xs font-medium text-green-600 mt-1">Formation complète !</p>
          </div>
        )}
      </div>

      {/* Lesson viewer */}
      {selectedLesson && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{TYPE_LABEL[selectedLesson.type as keyof typeof TYPE_LABEL] || selectedLesson.type}</p>
              <h2 className="font-semibold text-gray-900">{selectedLesson.title}</h2>
            </div>
            <button onClick={() => setSelectedLesson(null)} className="text-gray-400 hover:text-gray-600 text-xl font-light w-8 h-8 flex items-center justify-center">✕</button>
          </div>

          <div className="p-4">
            {selectedLesson.type === 'video' && selectedLesson.content_url && (() => {
              const url = selectedLesson.content_url
              const ytId = getYoutubeId(url)
              const isNative = isSupabaseUrl(url) || isVideoFile(url)
              return (
                <div>
                  {ytId ? (
                    <VideoWatermark name={session.participantName} email={session.email}>
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                        <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                      </div>
                    </VideoWatermark>
                  ) : isNative ? (
                    <VideoWatermark name={session.participantName} email={session.email}>
                      <div className="w-full rounded-xl overflow-hidden bg-black">
                        <video src={url} controls className="w-full max-h-[480px]"
                          controlsList="nodownload nofullscreen"
                          onContextMenu={(e) => e.preventDefault()}>
                          Votre navigateur ne supporte pas la lecture vidéo.
                        </video>
                      </div>
                    </VideoWatermark>
                  ) : (
                    /* Teams / other external link */
                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                      <PlayCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-700 font-medium mb-1">{selectedLesson.title}</p>
                      <p className="text-sm text-gray-400 mb-5">Vidéo hébergée en externe (Teams, SharePoint…)</p>
                      <a href={url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                        <PlayCircle className="w-4 h-4" /> Ouvrir la vidéo
                      </a>
                    </div>
                  )}
                </div>
              )
            })()}
            {selectedLesson.type === 'pdf' && selectedLesson.content_url && (() => {
              const url = selectedLesson.content_url
              const canEmbed = isSupabaseUrl(url) || isPdfFile(url)
              return canEmbed ? (
                <div className="w-full rounded-xl overflow-hidden border border-gray-100" style={{ height: '70vh' }}>
                  <iframe src={url} className="w-full h-full" title={selectedLesson.title} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-4">{selectedLesson.title}</p>
                  <a href={url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
                    <FileText className="w-4 h-4" /> Ouvrir le PDF
                  </a>
                </div>
              )
            })()}
            {selectedLesson.type === 'article' && (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap p-2">
                {selectedLesson.content_text || 'Contenu en cours de rédaction…'}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-50 flex justify-end">
            {progress.has(selectedLesson.id) ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Leçon terminée
              </div>
            ) : (
              <button onClick={() => markComplete(selectedLesson)} disabled={marking}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                {marking ? 'Enregistrement…' : '✓ Marquer comme terminé'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modules list */}
      {modules.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun cours disponible pour le moment</p>
          <p className="text-xs mt-1">Revenez bientôt !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map(mod => {
            const modLessons = lessons.filter(l => l.module_id === mod.id).sort((a, b) => a.order_index - b.order_index)
            const modDone = modLessons.filter(l => progress.has(l.id)).length
            const isOpen = expanded.has(mod.id)
            return (
              <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => toggle(mod.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {mod.order_index}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{mod.title}</p>
                    {mod.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{mod.description}</p>}
                    <p className="text-xs text-blue-600 font-medium mt-1">{modDone}/{modLessons.length} leçons</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {modDone === modLessons.length && modLessons.length > 0 && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-50">
                    {modLessons.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Aucune leçon dans ce module</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {modLessons.map((lesson, idx) => {
                          const done = progress.has(lesson.id)
                          const Icon = TYPE_ICON[lesson.type as keyof typeof TYPE_ICON] || BookOpen
                          const colorCls = TYPE_COLOR[lesson.type as keyof typeof TYPE_COLOR] || 'text-gray-600 bg-gray-50'
                          return (
                            <button key={lesson.id} onClick={() => setSelectedLesson(lesson)}
                              className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left ${selectedLesson?.id === lesson.id ? 'bg-blue-50/50' : ''}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${done ? 'text-gray-500' : 'text-gray-900'}`}>{lesson.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                  <span>{TYPE_LABEL[lesson.type as keyof typeof TYPE_LABEL] || lesson.type}</span>
                                  {lesson.duration_minutes > 0 && <><span>·</span><Clock className="w-3 h-3" /><span>{lesson.duration_minutes} min</span></>}
                                </p>
                              </div>
                              {done && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
