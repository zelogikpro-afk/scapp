import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import type { LearnerSession } from '../../lib/learnerSession'
import { CreditCard, Upload, CheckCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface RealPayment {
  id: string; program_name: string; promotion_id: string | null
  total_amount: number; amount_paid: number; remaining_amount: number
  status: string; method: string; date: string; due_date: string | null
  installments: { id: string; amount: number; date: string; method: string; status: string }[]
}

const METHOD_LABELS: Record<string, string> = {
  virement: 'Virement bancaire', especes: 'Espèces', cheque: 'Chèque',
  cash: 'Espèces', bank_transfer: 'Virement bancaire', card: 'CB/CMI',
  cmi: 'CMI / CB', paypal: 'PayPal', autre: 'Autre',
}

const PROG_LEVEL: Record<string, string> = {
  'a997dec7-8989-40ba-a9d1-b4669702fe78': 'N1',
  '1782a369-0615-4b8c-920f-51772d554cb8': 'N2',
  'd11972ac-25bb-4db3-98c0-15960a835530': 'N3',
}
const LEVEL_LABEL: Record<string, string> = { N1: 'Niveau 1', N2: 'Niveau 2', N3: 'Niveau 3' }

function statusLabel(s: string) {
  return s === 'paid' ? 'Payé' : s === 'partial' ? 'Partiel' : s === 'pending' ? 'En attente' : s === 'overdue' ? 'En retard' : s
}
function statusColor(s: string) {
  return s === 'paid' ? 'bg-green-100 text-green-700' : s === 'partial' ? 'bg-blue-100 text-blue-700' : s === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
}

export default function EspacePaiements() {
  const session = useOutletContext<LearnerSession>()
  const [realPayments, setRealPayments] = useState<RealPayment[]>([])
  const [promotions, setPromotions] = useState<Record<string, { level: string; name: string }>>({})
  const [receipts, setReceipts] = useState<Record<string, string>>({}) // paymentId -> publicUrl
  const [loading, setLoading] = useState(true)
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null) // paymentId being uploaded
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await learnerApi.getPayments({
      participantId: session.participantId || null,
      allPromotionIds: session.allPromotionIds || [],
    }) as any
    setRealPayments(data.payments || [])
    setPromotions(data.promoMap || {})
    setReceipts(data.receipts || {})
    setLoading(false)
  }

  async function uploadReceipt(paymentId: string, file: File) {
    setUploading(paymentId)
    try {
      const ext = file.name.split('.').pop()
      const path = `${session.id}/${paymentId}_${Date.now()}.${ext}`
      const { signedUrl } = await learnerApi.getUploadUrl('payment-receipts', path) as any
      const res = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      if (!res.ok) throw new Error(`Upload HTTP ${res.status}`)
      const publicUrl = `https://twcqvpgpzayjxiwzzesb.supabase.co/storage/v1/object/public/payment-receipts/${path}`
      setReceipts(prev => ({ ...prev, [paymentId]: publicUrl }))
      toast.success('Reçu joint avec succès ✅')
    } catch (e: any) {
      toast.error('Erreur upload : ' + e.message)
    }
    setUploading(null)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  const byPromo: Record<string, RealPayment[]> = {}
  for (const p of realPayments) {
    const key = p.promotion_id || 'general'
    if (!byPromo[key]) byPromo[key] = []
    byPromo[key].push(p)
  }

  const promoOrder = (session.allPromotionIds || []).filter(id => byPromo[id])
  if (byPromo['general']) promoOrder.push('general')

  const totalDu = realPayments.reduce((s, p) => s + p.total_amount, 0)
  const totalPaye = realPayments.reduce((s, p) => s + p.amount_paid, 0)
  const totalRestant = realPayments.reduce((s, p) => s + p.remaining_amount, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes paiements</h1>
        <p className="text-sm text-gray-500 mt-0.5">Suivi de vos versements par niveau</p>
      </div>

      {/* Global summary */}
      {realPayments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-medium">Total programme</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{totalDu.toLocaleString('fr-FR')} MAD</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-xs text-green-600 font-medium">Total payé</p>
            <p className="text-xl font-bold text-green-700 mt-1">{totalPaye.toLocaleString('fr-FR')} MAD</p>
          </div>
          <div className={`border rounded-2xl p-4 ${totalRestant > 0 ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
            <p className={`text-xs font-medium ${totalRestant > 0 ? 'text-amber-600' : 'text-green-600'}`}>Reste à payer</p>
            <p className={`text-xl font-bold mt-1 ${totalRestant > 0 ? 'text-amber-700' : 'text-green-700'}`}>{totalRestant.toLocaleString('fr-FR')} MAD</p>
          </div>
        </div>
      )}

      {/* Payment history by level */}
      {promoOrder.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Historique par niveau</p>
          {promoOrder.map(promoId => {
            const payments = byPromo[promoId]
            const info = promotions[promoId]
            const label = info ? `${info.name}` : 'Programme'
            const levelBadge = info?.level || ''
            const promoTotal = payments.reduce((s, p) => s + p.total_amount, 0)
            const promoPaid = payments.reduce((s, p) => s + p.amount_paid, 0)
            const promoRest = payments.reduce((s, p) => s + p.remaining_amount, 0)
            const pct = promoTotal > 0 ? Math.round(promoPaid / promoTotal * 100) : 0
            const isExpanded = expandedPromo === promoId

            return (
              <div key={promoId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedPromo(isExpanded ? null : promoId)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-bold text-xs">{levelBadge}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{label}</p>
                        <div className="flex items-center gap-2">
                          {promoRest > 0 ? (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                              Reste : {promoRest.toLocaleString('fr-FR')} MAD
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Soldé</span>
                          )}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">{promoPaid.toLocaleString('fr-FR')} / {promoTotal.toLocaleString('fr-FR')} MAD ({pct}%)</span>
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-50">
                    {payments.map(p => (
                      <div key={p.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{p.program_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(p.date).toLocaleDateString('fr-FR')} · {METHOD_LABELS[p.method] || p.method}
                            </p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-400">Total</p>
                            <p className="text-sm font-semibold text-gray-800">{p.total_amount.toLocaleString('fr-FR')}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-green-600">Payé</p>
                            <p className="text-sm font-semibold text-green-700">{p.amount_paid.toLocaleString('fr-FR')}</p>
                          </div>
                          <div className={`rounded-lg p-2 text-center ${p.remaining_amount > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                            <p className={`text-xs ${p.remaining_amount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Restant</p>
                            <p className={`text-sm font-semibold ${p.remaining_amount > 0 ? 'text-amber-700' : 'text-gray-500'}`}>{p.remaining_amount.toLocaleString('fr-FR')}</p>
                          </div>
                        </div>

                        {p.installments?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-400 font-medium">Versements</p>
                            {p.installments.map(ins => (
                              <div key={ins.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{new Date(ins.date).toLocaleDateString('fr-FR')} · {METHOD_LABELS[ins.method] || ins.method}</span>
                                <span className="font-medium text-gray-700">{ins.amount.toLocaleString('fr-FR')} MAD</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Receipt upload */}
                        <div className="mt-3 flex items-center gap-2">
                          {receipts[p.id] ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <a href={receipts[p.id]} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                                <ExternalLink className="w-3 h-3" />Voir le reçu
                              </a>
                              <label className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 underline">
                                Remplacer
                                <input type="file" accept="image/*,application/pdf" className="hidden"
                                  ref={el => { fileInputRefs.current[p.id] = el }}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadReceipt(p.id, f) }} />
                              </label>
                            </div>
                          ) : (
                            <label className={`flex items-center gap-1.5 text-xs cursor-pointer px-3 py-1.5 rounded-lg border border-dashed transition-colors
                              ${uploading === p.id ? 'border-blue-300 text-blue-400 bg-blue-50' : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                              <Upload className="w-3.5 h-3.5" />
                              {uploading === p.id ? 'Upload en cours…' : 'Joindre un reçu / facture'}
                              <input type="file" accept="image/*,application/pdf" className="hidden"
                                disabled={uploading === p.id}
                                ref={el => { fileInputRefs.current[p.id] = el }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadReceipt(p.id, f) }} />
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {realPayments.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucun historique de paiement disponible</p>
        </div>
      )}
    </div>
  )
}
