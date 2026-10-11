import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import type { LearnerSession } from '../../lib/learnerSession'
import { BookOpen, Upload, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface Assignment {
  id: string; title: string; description: string | null; due_date: string | null; file_url: string | null; created_at: string
}
interface Submission {
  id: string; assignment_id: string; content: string | null; file_url: string | null; grade: string | null; feedback: string | null; submitted_at: string
}

export default function EspaceDevoirs() {
  const session = useOutletContext<LearnerSession>()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const promotionIds = session.allPromotionIds?.length ? session.allPromotionIds : session.promotionId ? [session.promotionId] : []
    const data = await learnerApi.getDevoirs({ allPromotionIds: promotionIds }) as any
    setAssignments(data.assignments || [])
    setSubmissions(data.submissions || [])
    setLoading(false)
  }

  async function submit(assignmentId: string) {
    if (!content.trim() && !file) { toast.error('Ajoutez un texte ou un fichier'); return }
    setSaving(true)
    let fileUrl: string | null = null

    if (file) {
      try {
        const ext = file.name.split('.').pop()
        const path = `${session.id}/${assignmentId}.${ext}`
        const { signedUrl } = await learnerApi.getUploadUrl('payment-receipts', path) as any
        const res = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
        if (!res.ok) throw new Error(`Upload HTTP ${res.status}`)
        // Construct public URL
        fileUrl = `https://twcqvpgpzayjxiwzzesb.supabase.co/storage/v1/object/public/payment-receipts/${path}`
      } catch (e: any) {
        toast.error('Erreur upload : ' + e.message)
        setSaving(false)
        return
      }
    }

    try {
      await learnerApi.submitAssignment({ assignmentId, content: content.trim() || null, fileUrl })
      toast.success('Devoir soumis ✅')
      setActiveId(null)
      setContent('')
      setFile(null)
      load()
    } catch (e: any) {
      toast.error('Erreur : ' + e.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes devoirs</h1>
        <p className="text-sm text-gray-500 mt-0.5">{assignments.length} devoir{assignments.length > 1 ? 's' : ''} assigné{assignments.length > 1 ? 's' : ''}</p>
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun devoir pour l'instant</p>
          <p className="text-sm text-gray-400 mt-1">Votre formateur vous assignera des exercices ici.</p>
        </div>
      )}

      {assignments.map(a => {
        const sub = submissions.find(s => s.assignment_id === a.id)
        const isOverdue = a.due_date && new Date(a.due_date) < new Date() && !sub
        const isActive = activeId === a.id

        return (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sub ? 'bg-green-100' : isOverdue ? 'bg-red-100' : 'bg-amber-100'}`}>
                {sub ? <CheckCircle className="w-5 h-5 text-green-600" /> : isOverdue ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Clock className="w-5 h-5 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{a.title}</p>
                {a.description && <p className="text-sm text-gray-500 mt-0.5">{a.description}</p>}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {a.due_date && (
                    <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      Rendu : {new Date(a.due_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {a.file_url && (
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                      <ExternalLink className="w-3 h-3" />Consigne
                    </a>
                  )}
                  {sub && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />Soumis le {new Date(sub.submitted_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
                {sub?.grade && <p className="text-sm mt-1 text-purple-700 font-medium">Note : {sub.grade}</p>}
                {sub?.feedback && <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg p-2">{sub.feedback}</p>}
              </div>
              <button onClick={() => setActiveId(isActive ? null : a.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${sub ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {sub ? 'Modifier' : 'Soumettre'}
              </button>
            </div>

            {isActive && (
              <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
                  placeholder="Votre réponse…"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    {file ? file.name : 'Joindre un fichier'}
                    <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </label>
                  <button onClick={() => submit(a.id)} disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                    {saving ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
