import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabaseAdmin } from '../../lib/supabase'
import { type LearnerSession } from '../../lib/learnerSession'
import { PlayCircle, Clock, ExternalLink, X } from 'lucide-react'

interface Recording { id: string; title: string; file_url: string; duration_minutes: number; order_index: number; created_at: string }

function getYoutubeId(url: string) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return m ? m[1] : null
}
function isNativeVideo(url: string) { return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url?.includes('supabase.co/storage') }

export default function EspaceEnregistrements() {
  const session = useOutletContext<LearnerSession>()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Recording | null>(null)
  const [sessionName, setSessionName] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: learnerData } = await supabaseAdmin.from('learner_accounts').select('promotion_id').eq('id', session.id).single()
    const sessionId = learnerData?.promotion_id
    if (!sessionId) { setLoading(false); return }

    const [recRes, sessRes] = await Promise.all([
      supabaseAdmin.from('recordings').select('*').eq('promotion_id', sessionId).order('order_index'),
      supabaseAdmin.from('promotions').select('name').eq('id', sessionId).single(),
    ])
    setRecordings(recRes.data || [])
    setSessionName(sessRes.data?.name || '')
    setLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Enregistrements</h1>
        {sessionName && <p className="text-sm text-gray-500 mt-0.5">{sessionName}</p>}
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
                  <PlayCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-1">{selected.title}</p>
                  <p className="text-sm text-gray-400 mb-5">Vidéo hébergée en externe (Teams, SharePoint…)</p>
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Ouvrir la vidéo
                  </a>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {recordings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun enregistrement disponible</p>
          <p className="text-xs mt-1 text-gray-300">Les enregistrements seront ajoutés après chaque séance.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {recordings.map((r, i) => (
            <button key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)}
              className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left ${selected?.id === r.id ? 'bg-blue-50' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${selected?.id === r.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${selected?.id === r.id ? 'text-blue-700' : 'text-gray-900'}`}>{r.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  {r.duration_minutes > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{r.duration_minutes} min</span>}
                </div>
              </div>
              <PlayCircle className={`w-5 h-5 flex-shrink-0 ${selected?.id === r.id ? 'text-blue-600' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
