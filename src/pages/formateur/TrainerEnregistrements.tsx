import { useEffect, useState } from 'react'
import { trainerApiCall } from '../../lib/trainerApi'
import { PlayCircle, Clock, ExternalLink, X } from 'lucide-react'

interface Recording { id: string; title: string; file_url: string; duration_minutes: number; order_index: number; created_at: string; promotion_id: string }

const PROG_LEVEL: Record<string, string> = {
  'a997dec7-8989-40ba-a9d1-b4669702fe78': 'N1',
  '1782a369-0615-4b8c-920f-51772d554cb8': 'N2',
  'd11972ac-25bb-4db3-98c0-15960a835530': 'N3',
}
const LEVEL_LABEL: Record<string, string> = { N1: 'Niveau 1 — Coach de vie', N2: 'Niveau 2 — Master Coach', N3: 'Niveau 3 — Master Consultant' }
const LEVEL_COLOR: Record<string, string> = { N1: 'bg-blue-600', N2: 'bg-purple-600', N3: 'bg-amber-600' }

function getYoutubeId(url: string) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return m ? m[1] : null
}
function isNativeVideo(url: string) { return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url?.includes('supabase.co/storage') }

export default function TrainerEnregistrements() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Recording | null>(null)

  useEffect(() => {
    trainerApiCall({ action: 'get_recordings' }).then((d: any) => {
      const promos = d?.promotions || []
      const recs: Recording[] = d?.recordings || []
      const result = promos
        .map((p: any) => ({
          promoId: p.id,
          promoName: p.name || '',
          level: PROG_LEVEL[p.program_id] || 'N1',
          recordings: recs.filter(r => r.promotion_id === p.id),
        }))
        .filter((g: any) => g.recordings.length > 0)
      setGroups(result)
      setLoading(false)
    })
  }, [])

  const totalCount = groups.reduce((s, g) => s + g.recordings.length, 0)

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Enregistrements</h1>
        <p className="text-sm text-gray-500 mt-0.5">{totalCount} enregistrement{totalCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Player */}
      {selected && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Lecture en cours</p>
              <h2 className="font-semibold text-gray-900">{selected.title}</h2>
            </div>
            <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            {(() => {
              const url = selected.file_url
              const ytId = getYoutubeId(url)
              if (ytId) return (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0`} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              )
              if (isNativeVideo(url)) return (
                <div className="w-full rounded-xl overflow-hidden bg-black">
                  <video src={url} controls className="w-full max-h-[480px]" controlsList="nodownload">Votre navigateur ne supporte pas la lecture vidéo.</video>
                </div>
              )
              return (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                  <PlayCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-1">{selected.title}</p>
                  <p className="text-sm text-gray-400 mb-5">Vidéo hébergée en externe (Teams, SharePoint…)</p>
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Ouvrir la vidéo
                  </a>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {totalCount === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun enregistrement disponible</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(group => (
            <div key={group.promoId}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`${LEVEL_COLOR[group.level]} text-white text-xs font-bold px-2.5 py-1 rounded-lg`}>
                  {group.level}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{LEVEL_LABEL[group.level]}</p>
                  <p className="text-xs text-gray-400">{group.promoName} · {group.recordings.length} enregistrement{group.recordings.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {group.recordings.map((r: Recording, i: number) => (
                  <button key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)}
                    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left ${selected?.id === r.id ? 'bg-emerald-50' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${selected?.id === r.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${selected?.id === r.id ? 'text-emerald-700' : 'text-gray-900'}`}>{r.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                        {r.duration_minutes > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{r.duration_minutes} min</span>}
                      </div>
                    </div>
                    <PlayCircle className={`w-5 h-5 flex-shrink-0 ${selected?.id === r.id ? 'text-emerald-600' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
