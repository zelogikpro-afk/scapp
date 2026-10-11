import { useState, useEffect } from 'react'
import { useOutletContext, Navigate } from 'react-router-dom'
import { type LearnerSession } from '../../lib/learnerSession'
import { learnerApiCall } from '../../lib/learnerApi'
import { CheckCircle, X, ChevronRight, Phone, Clock, Calendar, ExternalLink, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

const OFFERS = [
  {
    type: 'pack_bienetre',
    label: 'Pack Bien-être',
    subtitle: '4 séances hebdomadaires',
    price: '2 200 MAD',
    priceBefore: '2 800 MAD',
    duration: '4 semaines',
    description: 'Plan de développement personnel, suivi des objectifs, rapports de progression mensuels, programmation prioritaire, support téléphonique direct.',
    gradient: 'from-emerald-500 to-teal-600',
    icon: '🌿',
    badge: 'Économisez 600 MAD',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    type: 'pack_transformation',
    label: 'Pack Transformation',
    subtitle: '10 séances + sessions incluses',
    price: '4 800 MAD',
    duration: '3 mois',
    description: 'Support téléphonique prioritaire, planification stratégique de vie, accompagnement continu, ressources de développement leadership, feedback personnalisé.',
    gradient: 'from-amber-500 to-orange-600',
    icon: '🚀',
    badge: 'Le plus complet',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
]

const BETA_USERNAMES = ['a.successcompass']

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: 'En attente de confirmation', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-100' },
  confirmed: { label: 'Confirmé',                   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  cancelled: { label: 'Annulé',                     color: 'text-gray-500',   bg: 'bg-gray-50',   border: 'border-gray-100' },
}

export default function EspaceCoaching() {
  const session = useOutletContext<LearnerSession>()
  const [selected, setSelected] = useState<typeof OFFERS[0] | null>(null)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [myRequests, setMyRequests] = useState<any[]>([])

  const allLevels = session.allLevels?.length ? session.allLevels : [session.formationLevel || 'N1']
  const hasDiscount = allLevels.some(l => l === 'N2' || l === 'N3')

  useEffect(() => {
    learnerApiCall<any>({ action: 'get_coaching_requests' })
      .then(d => setMyRequests(d.requests || []))
      .catch(() => {})
  }, [done])

  if (!BETA_USERNAMES.includes(session.username)) return <Navigate to="/espace/accueil" replace />

  async function submit() {
    if (!selected) return
    setSubmitting(true)
    try {
      await learnerApiCall({
        action: 'submit_coaching_request',
        payload: { offerType: selected.type, offerLabel: selected.label, phone, message },
      })
      setDone(true)
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'envoi')
    }
    setSubmitting(false)
  }

  function parseAdminNote(note: string | null): { slots: string; url: string } {
    if (!note) return { slots: '', url: '' }
    try {
      const parsed = JSON.parse(note)
      return { slots: parsed.slots || '', url: parsed.url || '' }
    } catch {
      return { slots: note, url: '' }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Coaching</h1>
        <p className="text-sm text-gray-500 mt-0.5">Réservez un pack avec nos coachs certifiés</p>
      </div>

      {/* Réduction N2/N3 */}
      {hasDiscount && (
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <Tag className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-800">Réduction spéciale -20% pour les niveaux N2 et N3</p>
            <p className="text-xs text-purple-600 mt-0.5">En tant qu'apprenant{allLevels.includes('N2') ? ' N2' : ''}{allLevels.includes('N3') ? ' N3' : ''}, vous bénéficiez d'une réduction exclusive. Mentionnez-le dans votre message.</p>
          </div>
        </div>
      )}

      {/* Mes demandes */}
      {myRequests.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Mes demandes</h2>
          {myRequests.map(r => {
            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
            const { slots, url } = parseAdminNote(r.admin_note)
            return (
              <div key={r.id} className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{r.offer_label}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {r.status === 'confirmed' && slots && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-800 whitespace-pre-line">{slots}</p>
                    </div>
                    {url && (
                      <a href={url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors">
                        <ExternalLink className="w-3 h-3" /> Réserver mon créneau
                      </a>
                    )}
                  </div>
                )}
                {r.status === 'pending' && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <p className="text-xs text-amber-700">Nous vous contacterons dans les 24h</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Offres */}
      <div className="grid gap-4 sm:grid-cols-2">
        {OFFERS.map(offer => (
          <div key={offer.type} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
            <div className={`bg-gradient-to-br ${offer.gradient} p-5 text-white`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-3xl">{offer.icon}</span>
                {offer.badge && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${offer.badgeColor}`}>
                    {offer.badge}
                  </span>
                )}
              </div>
              <h2 className="font-bold text-base">{offer.label}</h2>
              <p className="text-white/80 text-xs mt-0.5">{offer.subtitle}</p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">{offer.description}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">{offer.price}</span>
                {'priceBefore' in offer && offer.priceBefore && (
                  <span className="text-sm text-gray-400 line-through">{offer.priceBefore}</span>
                )}
              </div>
              <p className="text-xs text-gray-400">{offer.duration}</p>
              {hasDiscount && (
                <p className="text-xs text-purple-600 font-medium">→ -20% pour vous : contactez-nous pour le tarif réduit</p>
              )}
              <button onClick={() => { setSelected(offer); setDone(false); setPhone(''); setMessage('') }}
                className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-br ${offer.gradient} hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}>
                Réserver <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-500">Questions ? WhatsApp : <a href="https://wa.me/212603609792" target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline">+212 603-609792</a></p>
      </div>

      {/* Modal réservation */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            {done ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Demande envoyée !</h3>
                <p className="text-sm text-gray-500 mb-6">Nous vous contacterons dans les 24h pour confirmer votre réservation.</p>
                <button onClick={() => setSelected(null)}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-colors">
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900">Réserver — {selected.label}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{selected.price} · {selected.duration}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                    <p className="font-medium text-gray-800 mb-0.5">{session.participantName}</p>
                    <p className="text-xs text-gray-400">Votre nom sera transmis avec la demande</p>
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <Tag className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                      <p className="text-xs text-purple-700 font-medium">Réduction -20% N2/N3 — mentionnez-le dans votre message</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone *</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+212 6XX XXX XXX"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)}
                      rows={3} placeholder="Précisez vos disponibilités, objectifs ou questions…"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
                  </div>
                  <button onClick={submit} disabled={submitting || !phone.trim()}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40">
                    {submitting ? 'Envoi en cours…' : 'Confirmer ma demande'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
