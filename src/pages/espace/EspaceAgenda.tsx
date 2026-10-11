import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import type { LearnerSession } from '../../lib/learnerSession'
import { Calendar, Clock, Video, Star, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScheduleEntry {
  id: string
  promotion_id: string
  date: string
  start_time: string | null
  end_time: string | null
  theme: string | null
  zoom_link: string | null
  meet_link: string | null
  location: string | null
  notes: string | null
}
interface Rating { id: string; schedule_id: string; rating: number; comment: string | null }

export default function EspaceAgenda() {
  const session = useOutletContext<LearnerSession>()
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [ratingModal, setRatingModal] = useState<ScheduleEntry | null>(null)
  const [ratingVal, setRatingVal] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const promotionIds = session.allPromotionIds?.length ? session.allPromotionIds : session.promotionId ? [session.promotionId] : []
    if (!promotionIds.length) { setLoading(false); return }

    const data = await learnerApi.getAgenda({ allPromotionIds: promotionIds }) as any
    setEntries(data.sessions || [])
    setRatings(data.ratings || [])
    setLoading(false)
  }

  async function submitRating() {
    if (!ratingModal) return
    setSaving(true)
    try {
      await learnerApi.rateSession({
        sessionId: ratingModal.id,
        rating: ratingVal,
        comment: ratingComment || null,
      })
      toast.success('Évaluation enregistrée ✅')
      setSaving(false)
      setRatingModal(null)
      setRatingComment('')
      load()
    } catch (e: any) {
      toast.error('Erreur : ' + e.message)
      setSaving(false)
    }
  }

  const now = new Date()
  const upcoming = entries.filter(e => new Date(e.date) >= now)
  const past = entries.filter(e => new Date(e.date) < now)

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  function EntryCard({ e, isPast }: { e: ScheduleEntry; isPast: boolean }) {
    const rating = ratings.find(r => r.schedule_id === e.id)
    const isExpanded = expanded === e.id
    const d = new Date(e.date)
    const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const link = e.zoom_link || e.meet_link

    return (
      <div className={`bg-white rounded-2xl border overflow-hidden ${isPast ? 'border-gray-100 opacity-90' : 'border-blue-100 shadow-sm'}`}>
        <div className="p-4 flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white ${isPast ? 'bg-gray-400' : 'bg-blue-600'}`}>
            <span className="text-xs font-medium leading-none">{d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</span>
            <span className="text-lg font-bold leading-none">{d.getDate()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm capitalize">{dateStr}</p>
            {(e.start_time || e.end_time) && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />{e.start_time}{e.end_time ? ` — ${e.end_time}` : ''}
              </p>
            )}
            {e.theme && <p className="text-sm text-blue-700 font-medium mt-1">{e.theme}</p>}
            {e.location && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {link && !isPast && (
              <a href={link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors">
                <Video className="w-3.5 h-3.5" />Rejoindre
              </a>
            )}
            {isPast && (
              <button onClick={() => setRatingModal(e)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${rating ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'}`}>
                <Star className="w-3.5 h-3.5" />{rating ? `${rating.rating}/5` : 'Évaluer'}
              </button>
            )}
            {e.notes && (
              <button onClick={() => setExpanded(isExpanded ? null : e.id)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
        {isExpanded && e.notes && (
          <div className="px-4 pb-4 pt-0 border-t border-gray-50">
            <p className="text-sm text-gray-600 mt-2">{e.notes}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mon agenda</h1>
        <p className="text-sm text-gray-500 mt-0.5">{entries.length} séance{entries.length > 1 ? 's' : ''} au total</p>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune séance planifiée</p>
          <p className="text-sm text-gray-400 mt-1">Votre formateur ajoutera les dates prochainement.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">À venir</h2>
          {upcoming.map(e => <EntryCard key={e.id} e={e} isPast={false} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Passées</h2>
          {past.map(e => <EntryCard key={e.id} e={e} isPast={true} />)}
        </div>
      )}

      {/* Rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setRatingModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Évaluer la séance</h3>
            <p className="text-sm text-gray-500 mb-4">{ratingModal.theme || new Date(ratingModal.date).toLocaleDateString('fr-FR')}</p>
            <div className="flex gap-2 justify-center mb-4">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRatingVal(n)}
                  className={`text-2xl transition-transform hover:scale-110 ${n <= ratingVal ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
              ))}
            </div>
            <p className="text-xs text-center text-gray-400 mb-4">{['','Insuffisant','Passable','Bien','Très bien','Excellent'][ratingVal]}</p>
            <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} rows={3}
              placeholder="Commentaire (facultatif)…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setRatingModal(null)} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Annuler</button>
              <button onClick={submitRating} disabled={saving} className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Envoi…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
