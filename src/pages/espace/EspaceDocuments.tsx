import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabaseAdmin } from '../../lib/supabase'
import { type LearnerSession } from '../../lib/learnerSession'
import { FileText, Download, Eye } from 'lucide-react'

interface Doc { id: string; title: string; file_url: string; is_visible: boolean; order_index: number }

export default function EspaceDocuments() {
  const session = useOutletContext<LearnerSession>()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Doc | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabaseAdmin
      .from('elearning_docs')
      .select('*')
      .eq('level', session.formationLevel)
      .eq('is_visible', true)
      .order('order_index')
    setDocs(data || [])
    setLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Documents de cours</h1>
        <p className="text-sm text-gray-500 mt-0.5">{session.formationLevel === 'N1' ? 'Niveau 1' : session.formationLevel === 'N2' ? 'Niveau 2' : 'Niveau 3'} · {docs.length} document(s) disponible(s)</p>
      </div>

      {/* PDF viewer */}
      {viewing && viewing.file_url && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-gray-900">{viewing.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <a href={viewing.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ouvrir dans un nouvel onglet">
                <Eye className="w-4 h-4" />
              </a>
              <button onClick={() => setViewing(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
          </div>
          <div style={{ height: '70vh' }}>
            <iframe src={viewing.file_url} className="w-full h-full" title={viewing.title} />
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun document disponible pour le moment</p>
          <p className="text-xs mt-1 text-gray-300">Les documents sont déverrouillés au fil du programme.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {docs.map((doc, i) => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">Document {i + 1}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {doc.file_url && (
                  <>
                    <button onClick={() => setViewing(viewing?.id === doc.id ? null : doc)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewing?.id === doc.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                      <Eye className="w-3.5 h-3.5" />Lire
                    </button>
                    <a href={doc.file_url} target="_blank" rel="noreferrer" download
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Télécharger">
                      <Download className="w-4 h-4" />
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
