import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { trainerApiCall, type TrainerSession } from '../../lib/trainerApi'
import { FileText, Eye, EyeOff, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const LEVEL_META: Record<string, { label: string; badge: string }> = {
  N1: { label: 'Coach de vie — Niveau 1', badge: 'bg-blue-600' },
  N2: { label: 'Master Coach Thérapeute — Niveau 2', badge: 'bg-purple-600' },
  N3: { label: 'Master Coach Consultant — Niveau 3', badge: 'bg-amber-600' },
}

export default function TrainerRessources() {
  const session = useOutletContext<TrainerSession>()
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    trainerApiCall({ action: 'get_documents' }).then(d => {
      setDocs(d || [])
      setLoading(false)
    })
  }, [])

  async function toggleVisibility(doc: any) {
    setToggling(doc.id)
    try {
      // Toggle for all trainer's promotions
      const promoIds = session.promotionIds || []
      const current: string[] = doc.excluded_promotion_ids || []
      const allExcluded = promoIds.every(id => current.includes(id))
      const newExcluded = allExcluded
        ? current.filter(id => !promoIds.includes(id))
        : [...new Set([...current, ...promoIds])]

      await trainerApiCall({
        action: 'set_doc_visibility',
        payload: { docId: doc.id, excludedPromotionIds: newExcluded, excludedLearnerIds: doc.excluded_learner_ids || [] },
      })
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, excluded_promotion_ids: newExcluded } : d))
      toast.success(allExcluded ? 'Document rendu visible' : 'Document masqué pour votre groupe')
    } catch {
      toast.error('Erreur lors de la modification')
    }
    setToggling(null)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  const LEVEL_ORDER = ['N1', 'N2', 'N3']
  const byLevel: Record<string, any[]> = {}
  for (const d of docs) {
    const k = d.level || 'N1'
    if (!byLevel[k]) byLevel[k] = []
    byLevel[k].push(d)
  }
  const sortedLevels = LEVEL_ORDER.filter(l => byLevel[l]?.length)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ressources</h1>
        <p className="text-sm text-gray-500 mt-0.5">{docs.length} document{docs.length > 1 ? 's' : ''} · Masquez ou rendez visibles pour votre groupe</p>
      </div>

      {sortedLevels.map(level => {
        const meta = LEVEL_META[level] || { label: level, badge: 'bg-gray-600' }
        const list = byLevel[level]
        return (
          <div key={level} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className={`${meta.badge} text-white text-xs font-bold px-2 py-0.5 rounded-lg`}>{level}</span>
              <p className="text-xs font-semibold text-gray-500">{meta.label}</p>
              <span className="text-xs text-gray-300 ml-auto">{list.length} doc{list.length > 1 ? 's' : ''}</span>
            </div>
            {list.map((doc: any) => {
              const promoIds = session.promotionIds || []
              const excluded: string[] = doc.excluded_promotion_ids || []
              const isHidden = promoIds.length > 0 && promoIds.every(id => excluded.includes(id))
              return (
                <div key={doc.id} className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${isHidden ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{doc.title}</p>
                        {isHidden && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">Masqué</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 pb-3 border-t border-gray-50 pt-2">
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                        <ExternalLink className="w-3 h-3" />Ouvrir
                      </a>
                    )}
                    <button onClick={() => toggleVisibility(doc)} disabled={toggling === doc.id}
                      className={`ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        isHidden ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {toggling === doc.id ? '…' : isHidden
                        ? <><Eye className="w-3 h-3" />Rendre visible</>
                        : <><EyeOff className="w-3 h-3" />Masquer</>
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {docs.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucune ressource disponible</p>
        </div>
      )}
    </div>
  )
}
