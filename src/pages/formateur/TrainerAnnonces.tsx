import { useEffect, useState } from 'react'
import { trainerApiCall } from '../../lib/trainerApi'
import { Megaphone, Send, Trash2, Users, User } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_OPTS = [
  { value: 'info', label: 'Information', color: 'blue' },
  { value: 'reminder', label: 'Rappel', color: 'amber' },
  { value: 'note', label: 'Note', color: 'purple' },
]

export default function TrainerAnnonces() {
  const [annonces, setAnnonces] = useState<any[]>([])
  const [learners, setLearners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [content, setContent] = useState('')
  const [type, setType] = useState('info')
  const [target, setTarget] = useState<'all' | 'individual'>('all')
  const [learnerId, setLearnerId] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const d: any = await trainerApiCall({ action: 'get_annonces' })
    setAnnonces(d?.annonces || [])
    setLearners(d?.learners || [])
    setLoading(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSending(true)
    try {
      await trainerApiCall({
        action: 'send_annonce',
        payload: { content: content.trim(), type, learnerId: target === 'individual' ? learnerId : null },
      })
      setContent('')
      setLearnerId('')
      setTarget('all')
      toast.success('Annonce envoyée')
      load()
    } catch {
      toast.error('Erreur lors de l\'envoi')
    }
    setSending(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await trainerApiCall({ action: 'delete_annonce', payload: { annonceId: id } })
      setAnnonces(prev => prev.filter(a => a.id !== id))
      toast.success('Annonce supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
    setDeleting(null)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Annonces</h1>
        <p className="text-sm text-gray-500 mt-0.5">Envoyez une note, info ou rappel à votre groupe</p>
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-semibold text-gray-800">Nouvelle annonce</p>
        </div>

        {/* Type */}
        <div className="flex gap-2">
          {TYPE_OPTS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setType(opt.value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                type === opt.value
                  ? `bg-${opt.color}-50 border-${opt.color}-200 text-${opt.color}-700`
                  : 'border-gray-100 text-gray-500 hover:border-gray-200'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Destinataire */}
        <div className="flex gap-2">
          <button type="button" onClick={() => { setTarget('all'); setLearnerId('') }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              target === 'all' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-100 text-gray-500'
            }`}>
            <Users className="w-3 h-3" />Tout le groupe
          </button>
          <button type="button" onClick={() => setTarget('individual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              target === 'individual' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-100 text-gray-500'
            }`}>
            <User className="w-3 h-3" />Individuel
          </button>
        </div>

        {target === 'individual' && (
          <select value={learnerId} onChange={e => setLearnerId(e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Choisir un apprenant…</option>
            {learners.map((l: any) => (
              <option key={l.id} value={l.id}>{l.participant_name}</option>
            ))}
          </select>
        )}

        {/* Message */}
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Écrivez votre message ici…"
          rows={3}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />

        <button type="submit" disabled={sending || !content.trim() || (target === 'individual' && !learnerId)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>

      {/* Historique */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Historique ({annonces.length})</p>
        {annonces.length === 0 && (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
            <Megaphone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucune annonce envoyée</p>
          </div>
        )}
        {annonces.map((a: any) => {
          const typeOpt = TYPE_OPTS.find(t => t.value === a.type) || TYPE_OPTS[0]
          const targetLearner = a.learner_id ? learners.find((l: any) => l.id === a.learner_id) : null
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{a.content}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium bg-${typeOpt.color}-50 text-${typeOpt.color}-600`}>
                      {typeOpt.label}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${a.target === 'individual' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {a.target === 'individual'
                        ? targetLearner ? targetLearner.participant_name : 'Individuel'
                        : 'Tout le groupe'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id}
                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
