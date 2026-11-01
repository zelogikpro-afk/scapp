import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import { type LearnerSession } from '../../lib/learnerSession'
import { FileText, Download, Eye, PlayCircle, X, BookOpen, ChevronDown, ChevronRight, FolderOpen, Folder } from 'lucide-react'
import VideoWatermark from '../../components/ui/VideoWatermark'

interface Doc { id: string; title: string; file_url: string; is_visible: boolean; order_index: number; level: string }
interface LevelGroup { level: string; label: string; accentColor: string; bgColor: string; docs: Doc[] }

const LEVEL_META: Record<string, { label: string; accentColor: string; bgColor: string }> = {
  N1: { label: 'Coach de vie', accentColor: '#3B82F6', bgColor: '#EFF6FF' },
  N2: { label: 'Master Coach Thérapeute', accentColor: '#6C5CE7', bgColor: '#F0EEFF' },
  N3: { label: 'Master Coach Consultant', accentColor: '#F59E0B', bgColor: '#FFFBEB' },
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
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const myLevels = session.allLevels?.length ? session.allLevels : [session.formationLevel]

    const LEVEL_ORDER = ['N1', 'N2', 'N3']
    const highestIdx = Math.max(...myLevels.map(l => LEVEL_ORDER.indexOf(l)).filter(i => i >= 0))
    const visibleLevels = LEVEL_ORDER.slice(0, highestIdx + 1)

    const ids = session.allPromotionIds?.length ? session.allPromotionIds : session.promotionId ? [session.promotionId] : []
    const promotionId = ids[ids.length - 1] || null
    const docs = await learnerApi.getDocuments({ allLevels: visibleLevels, promotionId }) as Doc[]

    const result: LevelGroup[] = visibleLevels.map(level => {
      const meta = LEVEL_META[level] || { label: level, accentColor: '#6C5CE7', bgColor: '#F0EEFF' }
      return { level, ...meta, docs: docs.filter(d => d.level === level) }
    }).filter(g => g.docs.length > 0)

    setGroups(result)
    // Auto-open the highest level (current learner's level)
    if (result.length > 0) setExpandedLevel(result[result.length - 1].level)
    setLoading(false)
  }

  const totalCount = groups.reduce((s, g) => s + g.docs.length, 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#6C5CE7,#8B5CF6)', borderRadius: 20, padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Documents</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{totalCount} ressource{totalCount > 1 ? 's' : ''} · {groups.length} niveau{groups.length > 1 ? 'x' : ''}</div>
      </div>

      {/* Viewer (PDF or Video) */}
      {viewing && viewing.file_url && (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 2px 12px rgba(108,92,231,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #F0EEFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              {isVideo(viewing.file_url)
                ? <PlayCircle style={{ width: 16, height: 16, color: '#6C5CE7', flexShrink: 0 }} />
                : <FileText style={{ width: 16, height: 16, color: '#EF4444', flexShrink: 0 }} />}
              <span style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewing.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <a href={viewing.file_url} target="_blank" rel="noreferrer"
                style={{ padding: 6, color: '#8B8AAA', borderRadius: 8, display: 'flex' }} title="Ouvrir dans un onglet">
                <Eye style={{ width: 16, height: 16 }} />
              </a>
              <button onClick={() => setViewing(null)}
                style={{ padding: 6, color: '#8B8AAA', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
          <div style={{ height: '70vh' }}>
            {(() => {
              const url = viewing.file_url
              const ytId = getYoutubeId(url)
              if (ytId) return (
                <VideoWatermark name={session.participantName} email={session.email}>
                  <div style={{ width: '100%', height: '70vh', background: '#000' }}>
                    <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                      style={{ width: '100%', height: '100%' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                </VideoWatermark>
              )
              if (isNativeVideo(url)) return (
                <VideoWatermark name={session.participantName} email={session.email}>
                  <div style={{ width: '100%', height: '70vh', background: '#000' }}>
                    <video src={url} controls style={{ width: '100%', height: '100%' }}
                      controlsList="nodownload nofullscreen"
                      onContextMenu={(e) => e.preventDefault()} />
                  </div>
                </VideoWatermark>
              )
              return <iframe src={url} style={{ width: '100%', height: '100%', border: 'none' }} title={viewing.title} />
            })()}
          </div>
        </div>
      )}

      {totalCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#8B8AAA' }}>
          <BookOpen style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }} />
          <p>Aucune ressource disponible pour le moment</p>
          <p style={{ fontSize: 12, marginTop: 4, color: '#C4C2DD' }}>Les ressources sont déverrouillées au fil du programme.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map(group => {
            const isOpen = expandedLevel === group.level
            return (
              <div key={group.level} style={{ borderRadius: 16, overflow: 'hidden', boxShadow: isOpen ? '0 4px 20px rgba(108,92,231,0.12)' : '0 2px 8px rgba(108,92,231,0.06)' }}>
                {/* Folder header — clickable */}
                <button
                  onClick={() => {
                    setExpandedLevel(isOpen ? null : group.level)
                    if (isOpen) setViewing(null)
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                    background: isOpen ? group.bgColor : '#fff',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: isOpen ? `1px solid ${group.accentColor}22` : 'none',
                    transition: 'background 0.2s',
                  }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: isOpen ? group.accentColor : group.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isOpen
                      ? <FolderOpen style={{ width: 22, height: 22, color: '#fff' }} />
                      : <Folder style={{ width: 22, height: 22, color: group.accentColor }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: group.accentColor, borderRadius: 6, padding: '2px 8px' }}>{group.level}</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginTop: 2, marginBottom: 1 }}>{group.label}</p>
                    <p style={{ fontSize: 11, color: '#8B8AAA' }}>{group.docs.length} ressource{group.docs.length > 1 ? 's' : ''}</p>
                  </div>
                  <div style={{ color: group.accentColor, flexShrink: 0 }}>
                    {isOpen
                      ? <ChevronDown style={{ width: 20, height: 20 }} />
                      : <ChevronRight style={{ width: 20, height: 20 }} />}
                  </div>
                </button>

                {/* Docs list — only when expanded */}
                {isOpen && (
                  <div style={{ background: '#fff' }}>
                    {group.docs.map((doc, i) => {
                      const video = isVideo(doc.file_url)
                      const isViewing = viewing?.id === doc.id
                      return (
                        <div key={doc.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                          borderTop: i === 0 ? 'none' : '1px solid #F5F4FF',
                          background: isViewing ? '#F0EEFF' : 'transparent',
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: isViewing ? group.accentColor : group.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {video
                              ? <PlayCircle style={{ width: 18, height: 18, color: isViewing ? '#fff' : group.accentColor }} />
                              : <FileText style={{ width: 18, height: 18, color: isViewing ? '#fff' : group.accentColor }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: 13, color: isViewing ? group.accentColor : '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</p>
                            <p style={{ fontSize: 11, color: '#8B8AAA', marginTop: 1 }}>{video ? 'Vidéo' : 'PDF'} · #{i + 1}</p>
                          </div>
                          {doc.file_url && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              <button
                                onClick={() => setViewing(isViewing ? null : doc)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                                  borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                                  background: isViewing ? group.accentColor : group.bgColor,
                                  color: isViewing ? '#fff' : group.accentColor,
                                }}>
                                {video ? <PlayCircle style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
                                {video ? 'Voir' : 'Lire'}
                              </button>
                              {!getYoutubeId(doc.file_url) && (
                                <a href={doc.file_url} target="_blank" rel="noreferrer" download
                                  style={{ padding: 6, color: '#8B8AAA', borderRadius: 8, display: 'flex' }} title="Télécharger">
                                  <Download style={{ width: 15, height: 15 }} />
                                </a>
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
          })}
        </div>
      )}
    </div>
  )
}
