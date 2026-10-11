import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import { type LearnerSession } from '../../lib/learnerSession'
import { FileText, Download, Eye, PlayCircle, X, BookOpen } from 'lucide-react'
import VideoWatermark from '../../components/ui/VideoWatermark'

interface Doc { id: string; title: string; file_url: string; is_visible: boolean; order_index: number; level: string }
interface LevelGroup { level: string; label: string; color: string; badge: string; docs: Doc[] }

const LEVEL_META: Record<string, { label: string; color: string; badge: string }> = {
  N1: { label: 'Coach de vie — Niveau 1', color: 'bg-blue-50 border-blue-100', badge: 'bg-blue-600' },
  N2: { label: 'Master Coach Thérapeute — Niveau 2', color: 'bg-purple-50 border-purple-100', badge: 'bg-purple-600' },
  N3: { label: 'Master Coach Consultant — Niveau 3', color: 'bg-amber-50 border-amber-100', badge: 'bg-amber-600' },
}

function getYoutubeId(url: string) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return m ? m[1] : null
}
function isNativeVideo(url: string) {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) || (url?.includes('supabase.co/storage') && !/\.pdf(\?|$)/i.test(url))
}
function isVideo(url: string) {
  return !!getYoutubeId(url) || isNativeVideo(url)
}

export default function EspaceDocuments() {
  const session = useOutletContext<LearnerSession>()
  const [groups, setGroups] = useState<LevelGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Doc | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const myLevels = session.allLevels?.length ? session.allLevels : [session.formationLevel]

    // A learner sees docs from their level AND all lower levels
    // N1 sees: N1 | N2 sees: N1+N2 | N3 sees: N1+N2+N3
    const LEVEL_ORDER = ['N1', 'N2', 'N3']
    const highestIdx = Math.max(...myLevels.map(l => LEVEL_ORDER.indexOf(l)).filter(i => i >= 0))
    const visibleLevels = LEVEL_ORDER.slice(0, highestIdx + 1)

    const ids = session.allPromotionIds?.length ? session.allPromotionIds : session.promotionId ? [session.promotionId] : []
    const promotionId = ids[ids.length - 1] || null
    const docs = await learnerApi.getDocuments({ allLevels: visibleLevels, promotionId }) as Doc[]

    // Group by their own level (N1 docs stay in N1 group, etc.)
    const result: LevelGroup[] = visibleLevels.map(level => {
      const meta = LEVEL_META[level] || { label: level, color: 'bg-gray-50 border-gray-100', badge: 'bg-gray-600' }
      return { level, ...meta, docs: docs.filter(d => d.level === level) }
    }).filter(g => g.docs.length > 0)

    setGroups(result)
    setLoading(false)
  }

  const totalCount = groups.reduce((s, g) => s + g.docs.length, 0)

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Ressources</h1>
        </div>
        <p className="text-sm text-gray-500">{totalCount} ressource{totalCount > 1 ? 's' : ''} disponible{totalCount > 1 ? 's' : ''}</p>
      </div>

      {/* Viewer (PDF or Video) */}
      {viewing && viewing.file_url && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {isVideo(viewing.file_url)
                ? <PlayCircle className="w-4 h-4 text-blue-500" />
                : <FileText className="w-4 h-4 text-red-500" />}
              <h2 className="font-semibold text-gray-900 text-sm">{viewing.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <a href={viewing.file_url} target="_blank" rel="noreferrer"
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ouvrir dans un nouvel onglet">
                <Eye className="w-4 h-4" />
              </a>
              <button onClick={() => setViewing(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div style={{ height: '70vh' }}>
            {(() => {
              const url = viewing.file_url
              const ytId = getYoutubeId(url)
              if (ytId) return (
                <VideoWatermark name={session.participantName} email={session.email}>
                  <div className="aspect-video w-full rounded-b-2xl overflow-hidden bg-black" style={{ height: '70vh' }}>
                    <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                </VideoWatermark>
              )
              if (isNativeVideo(url)) return (
                <VideoWatermark name={session.participantName} email={session.email}>
                  <div className="w-full bg-black" style={{ height: '70vh' }}>
                    <video src={url} controls className="w-full h-full"
                      controlsList="nodownload nofullscreen"
                      onContextMenu={(e) => e.preventDefault()} />
                  </div>
                </VideoWatermark>
              )
              return <iframe src={url} className="w-full h-full" title={viewing.title} />
            })()}
          </div>
        </div>
      )}

      {totalCount === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune ressource disponible pour le moment</p>
          <p className="text-xs mt-1 text-gray-300">Les ressources sont déverrouillées au fil du programme.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.level}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`${group.badge} text-white text-xs font-bold px-2.5 py-1 rounded-lg`}>
                  {group.level}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{group.label}</p>
                  <p className="text-xs text-gray-400">{group.docs.length} ressource{group.docs.length > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {group.docs.map((doc, i) => {
                  const video = isVideo(doc.file_url)
                  const isOpen = viewing?.id === doc.id
                  return (
                    <div key={doc.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${isOpen ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${video ? 'bg-blue-50' : 'bg-red-50'}`}>
                        {video
                          ? <PlayCircle className="w-5 h-5 text-blue-500" />
                          : <FileText className="w-5 h-5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{video ? 'Vidéo' : 'Document PDF'} · #{i + 1}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {doc.file_url && (
                          <>
                            <button onClick={() => setViewing(isOpen ? null : doc)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                              {video ? <PlayCircle className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              {video ? 'Voir' : 'Lire'}
                            </button>
                            {!getYoutubeId(doc.file_url) && (
                              <a href={doc.file_url} target="_blank" rel="noreferrer" download
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Télécharger">
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
