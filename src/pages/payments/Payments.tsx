import { useState, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Plus, Search, TrendingUp, AlertTriangle, CheckCircle, Download, Trash2, Pencil, PlusCircle, Clock, Calendar, ChevronRight, Bell, Layers } from 'lucide-react'
import { PageHero, HeroBtn } from '../../components/ui/PageHero'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import type { PaymentStatus } from '../../types'
import toast from 'react-hot-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNiveau(notes: string | undefined): string {
  if (!notes) return ''
  if (notes.includes('Niveau 1')) return 'N1'
  if (notes.includes('Niveau 2')) return 'N2'
  if (notes.includes('Niveau 3')) return 'N3'
  return ''
}

function getEchelon(notes: string | undefined): number {
  if (!notes) return 0
  const m = notes.match(/(\d+) échéance/)
  return m ? parseInt(m[1]) : 0
}

function formatMAD(n: number) {
  return n.toLocaleString('fr-MA') + ' MAD'
}

function fmtDate(d: string | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

function monthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// ─── Types & config ───────────────────────────────────────────────────────────

interface Echeance {
  participantName: string
  niveau: string
  amount: number
  date: string
  paymentId: string
  echelonIndex: number
}

const STATUS_CFG = {
  paid:      { label: 'Soldé',      bg: '#F0FDF4', color: '#16A34A' },
  partial:   { label: 'Partiel',    bg: '#FFFBEB', color: '#D97706' },
  pending:   { label: 'En attente', bg: '#F8F7FF', color: '#1A73E8' },
  overdue:   { label: 'En retard',  bg: '#FEF2F2', color: '#DC2626' },
  cancelled: { label: 'Annulé',     bg: '#F1F5F9', color: '#64748B' },
}

const NIV_COLOR: Record<string, { bg: string; color: string }> = {
  N1: { bg: '#EDE9FE', color: '#7C3AED' },
  N2: { bg: '#DBEAFE', color: '#1D4ED8' },
  N3: { bg: '#DCFCE7', color: '#15803D' },
}

const cardS: React.CSSProperties = {
  background: '#fff', borderRadius: 16, border: '1px solid #D4E6FF',
  boxShadow: '0 2px 12px rgba(26,115,232,0.06)',
}

const SESSION_OPTIONS = [
  { value: '', label: '— Sélectionner —' },
  { value: 'Niveau 1 — Coach de vie et Développement Personnel', label: 'Niveau 1 — Coach de vie' },
  { value: 'Niveau 2 — Master Coach Thérapeute', label: 'Niveau 2 — Master Coach Thérapeute' },
  { value: 'Niveau 3 — Master Coach Consultant', label: 'Niveau 3 — Master Coach Consultant' },
]

const EMPTY = {
  participantId: '', participantName: '',
  programType: 'training' as 'coaching' | 'training',
  programName: 'SC Academy', session: '',
  totalAmount: 0, amountPaid: 0,
  status: 'partial' as PaymentStatus,
  method: 'bank_transfer' as any,
  reference: '', date: new Date().toISOString().split('T')[0], dueDate: '', notes: '',
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Payments() {
  const { payments, participants, addPayment, updatePayment, deletePayment } = useAppStore()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [niveauFilter, setNiveauFilter] = useState<'all' | 'N1' | 'N2' | 'N3'>('all')
  const [view, setView] = useState<'table' | 'timeline'>('table')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const [editingPayment, setEditingPayment] = useState<typeof EMPTY & { id: string } | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [versementPayment, setVersementPayment] = useState<{ id: string; participantName: string; totalAmount: number; amountPaid: number; status: PaymentStatus } | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const [versementAmount, setVersementAmount] = useState('')
  const [versementDate, setVersementDate] = useState(new Date().toISOString().split('T')[0])
  const [versementLoading, setVersementLoading] = useState(false)

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // ── Projections d'échéances ──────────────────────────────────────────────────
  const echeances: Echeance[] = useMemo(() => {
    const list: Echeance[] = []
    payments.forEach(p => {
      if (p.remainingAmount <= 0 || !p.dueDate) return
      const nbEch = getEchelon(p.notes ?? undefined) || 1
      const amountParEch = Math.round(p.remainingAmount / nbEch)
      for (let i = 0; i < nbEch; i++) {
        list.push({
          participantName: p.participantName,
          niveau: getNiveau(p.notes ?? undefined),
          amount: i < nbEch - 1 ? amountParEch : p.remainingAmount - amountParEch * (nbEch - 1),
          date: addMonths(p.dueDate!, i),
          paymentId: p.id,
          echelonIndex: i,
        })
      }
    })
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }, [payments])

  // ── Projection mensuelle ─────────────────────────────────────────────────────
  const monthlyProjection = useMemo(() => {
    const map: Record<string, { expected: number; names: string[] }> = {}
    echeances.forEach(e => {
      const k = monthKey(e.date)
      if (!map[k]) map[k] = { expected: 0, names: [] }
      map[k].expected += e.amount
      if (!map[k].names.includes(e.participantName)) map[k].names.push(e.participantName)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [echeances])

  const today = new Date().toISOString().slice(0, 10)
  const in7 = new Date(); in7.setDate(in7.getDate() + 7)
  const in30 = new Date(); in30.setDate(in30.getDate() + 30)

  const urgentEch = echeances.filter(e => e.date <= in7.toISOString().slice(0, 10))
  const thisMonthEch = echeances.filter(e => monthKey(e.date) === monthKey(today))
  const thisMonthTotal = thisMonthEch.reduce((s, e) => s + e.amount, 0)
  const nextMonthKey = monthKey(addMonths(today, 1))
  const nextMonthTotal = echeances.filter(e => monthKey(e.date) === nextMonthKey).reduce((s, e) => s + e.amount, 0)

  // ── Stats globales ───────────────────────────────────────────────────────────
  const totalEncaisse = payments.reduce((s, p) => s + p.amountPaid, 0)
  const totalReste = payments.reduce((s, p) => s + p.remainingAmount, 0)
  const soldedCount = payments.filter(p => p.status === 'paid').length
  const partialCount = payments.filter(p => p.status === 'partial' || p.status === 'pending').length

  // ── Table filtrée ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => payments.filter(p => {
    const matchSearch = search === '' || p.participantName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const niv = getNiveau(p.notes ?? undefined)
    const matchNiveau = niveauFilter === 'all' || niv === niveauFilter
    return matchSearch && matchStatus && matchNiveau
  }), [payments, search, statusFilter, niveauFilter])

  // ── Export ───────────────────────────────────────────────────────────────────
  function exportPayments() {
    const ws = XLSX.utils.json_to_sheet(filtered.map(p => ({
      Nom: p.participantName, Niveau: getNiveau(p.notes ?? undefined),
      'Total (MAD)': p.totalAmount, 'Payé (MAD)': p.amountPaid, 'Reste (MAD)': p.remainingAmount,
      Statut: STATUS_CFG[p.status]?.label, 'Prochain paiement': p.dueDate ?? '',
      'Échéances restantes': getEchelon(p.notes ?? undefined),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Paiements')
    XLSX.writeFile(wb, `paiements-${today}.xlsx`)
  }

  // ── Modals ───────────────────────────────────────────────────────────────────
  function openEdit(pay: any) {
    setEditingPayment({
      id: pay.id, participantId: pay.participantId ?? '', participantName: pay.participantName,
      programType: pay.programType, programName: pay.programName, session: pay.session ?? '',
      totalAmount: pay.totalAmount, amountPaid: pay.amountPaid, status: pay.status,
      method: pay.method, reference: pay.reference ?? '', date: pay.date,
      dueDate: pay.dueDate ?? '', notes: pay.notes ?? '',
    })
  }

  const handleEditSubmit = async () => {
    if (!editingPayment) return
    setEditLoading(true)
    try {
      const paid = Number(editingPayment.amountPaid), total = Number(editingPayment.totalAmount)
      const autoStatus: PaymentStatus = paid >= total ? 'paid' : paid > 0 ? 'partial' : editingPayment.status
      await updatePayment(editingPayment.id, {
        participantName: editingPayment.participantName, programType: editingPayment.programType as any,
        programName: editingPayment.programName, totalAmount: total, amountPaid: paid,
        status: autoStatus, method: editingPayment.method as any, date: editingPayment.date,
        dueDate: editingPayment.dueDate || undefined, notes: editingPayment.notes || undefined,
      })
      toast.success('Paiement modifié !')
      setEditingPayment(null)
    } catch { toast.error('Erreur') }
    setEditLoading(false)
  }

  const handleVersementSubmit = async () => {
    if (!versementPayment) return
    const amount = parseFloat(versementAmount)
    if (!amount || amount <= 0) return toast.error('Montant invalide')
    setVersementLoading(true)
    try {
      const newPaid = versementPayment.amountPaid + amount
      await updatePayment(versementPayment.id, {
        amountPaid: newPaid, status: newPaid >= versementPayment.totalAmount ? 'paid' : 'partial', date: versementDate,
      })
      toast.success('Versement enregistré !')
      setVersementPayment(null); setVersementAmount('')
    } catch { toast.error('Erreur') }
    setVersementLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.participantName || !form.totalAmount) return toast.error('Nom et montant requis')
    setLoading(true)
    try {
      const total = Number(form.totalAmount), paid = Number(form.amountPaid)
      const niveauLabel = SESSION_OPTIONS.find(o => o.value === form.session)?.value ?? ''
      await addPayment({
        participantId: form.participantId ?? '', participantName: form.participantName,
        programType: form.programType, programName: form.programName,
        totalAmount: total, amountPaid: paid, remainingAmount: total - paid,
        status: paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending',
        method: form.method, date: form.date, dueDate: form.dueDate || undefined,
        notes: niveauLabel || undefined, installments: [],
      })
      toast.success('Paiement créé !')
      setShowModal(false); setForm({ ...EMPTY })
    } catch { toast.error('Erreur') }
    setLoading(false)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <PageHero
        emoji="💰"
        title="Paiements"
        sub={`${payments.length} apprenantes · ${partialCount} en attente`}
        gradient="linear-gradient(135deg, #064e3b 0%, #f59e0b 60%, #fbbf24 100%)"
        actions={<>
          {!isMobile && <HeroBtn outlined onClick={exportPayments}>↓ Exporter</HeroBtn>}
          <HeroBtn onClick={() => setShowModal(true)}>+ Nouveau</HeroBtn>
        </>}
        stats={[
          { label: 'Encaissé', value: (totalEncaisse / 1000).toFixed(0) + 'k MAD' },
          { label: 'Reste', value: (totalReste / 1000).toFixed(0) + 'k MAD' },
          { label: 'Soldées', value: `${soldedCount}/${payments.length}` },
        ]}
      />

      {/* ── Stats : 2 colonnes sur mobile, 3 sur tablet, 6 sur desktop ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 14 }}>
        {[
          { label: 'Total encaissé', value: formatMAD(totalEncaisse), icon: TrendingUp, bg: 'linear-gradient(135deg,#00B894,#00CEC9)', sub: `${soldedCount} soldées` },
          { label: 'Reste à encaisser', value: formatMAD(totalReste), icon: Clock, bg: 'linear-gradient(135deg,#F59E0B,#FBBF24)', sub: `${partialCount} en cours` },
          { label: 'Ce mois-ci', value: formatMAD(thisMonthTotal), icon: Calendar, bg: 'linear-gradient(135deg,#1A73E8,#8B5CF6)', sub: `${thisMonthEch.length} versements attendus` },
          { label: 'Mois prochain', value: formatMAD(nextMonthTotal), icon: Layers, bg: 'linear-gradient(135deg,#3B82F6,#6366F1)', sub: `${echeances.filter(e => monthKey(e.date) === nextMonthKey).length} versements prévus` },
          { label: 'Cette semaine', value: formatMAD(urgentEch.reduce((s, e) => s + e.amount, 0)), icon: Bell, bg: 'linear-gradient(135deg,#EF4444,#F87171)', sub: `${urgentEch.length} échéances imminentes` },
          { label: 'Soldées', value: `${soldedCount} / ${payments.length}`, icon: CheckCircle, bg: 'linear-gradient(135deg,#16A34A,#22C55E)', sub: `${Math.round(soldedCount / Math.max(payments.length, 1) * 100)}% du total` },
        ].map(s => (
          <div key={s.label} style={{ ...cardS, padding: isMobile ? '12px 14px' : '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon style={{ width: 14, height: 14, color: '#fff' }} />
              </div>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, margin: 0, lineHeight: 1.2 }}>{s.label}</p>
            </div>
            <p style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: '#0A1628', margin: 0, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '3px 0 0' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Alertes échéances imminentes ── */}
      {urgentEch.length > 0 && (
        <div style={{ ...cardS, padding: '16px 20px', borderColor: '#FED7AA', background: '#FFFBEB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Bell style={{ width: 16, height: 16, color: '#D97706' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Échéances cette semaine</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 20 }}>{urgentEch.length}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {urgentEch.map((e, i) => {
              const nc = NIV_COLOR[e.niveau] || { bg: '#F1F5F9', color: '#64748B' }
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #FED7AA', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1A73E8,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {e.participantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#0A1628', margin: 0 }}>{e.participantName}</p>
                    <p style={{ fontSize: 11, color: '#D97706', margin: 0 }}>{fmtDate(e.date)} · {formatMAD(e.amount)}</p>
                  </div>
                  {e.niveau && <span style={{ fontSize: 10, fontWeight: 700, background: nc.bg, color: nc.color, padding: '2px 6px', borderRadius: 5 }}>{e.niveau}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Projection mensuelle ── */}
      {monthlyProjection.length > 0 && (
        <div style={{ ...cardS, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Calendar style={{ width: 16, height: 16, color: '#1A73E8' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Projection des encaissements</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>— basée sur les {echeances.length} échéances restantes</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 4 : 0 }}>
            {monthlyProjection.map(([k, data]) => {
              const isCurrentMonth = k === monthKey(today)
              const isSelected = selectedMonth === k
              const maxAmount = Math.max(...monthlyProjection.map(([, d]) => d.expected))
              const pct = Math.round(data.expected / maxAmount * 100)
              return (
                <div key={k} onClick={() => setSelectedMonth(isSelected ? null : k)}
                  style={{ flex: isMobile ? '0 0 130px' : '1 1 140px', minWidth: isMobile ? 130 : 120, background: isSelected ? '#1A73E8' : isCurrentMonth ? '#E8F1FF' : '#F8F7FF', borderRadius: 12, padding: '14px 16px', border: isSelected ? '2px solid #4F46E5' : isCurrentMonth ? '2px solid #1A73E8' : '1px solid #D4E6FF', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.18s' }}>
                  {isCurrentMonth && !isSelected && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, background: '#1A73E8', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>EN COURS</div>}
                  {isSelected && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>DÉTAIL ▼</div>}
                  <p style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.75)' : '#94A3B8', textTransform: 'capitalize', margin: '0 0 6px' }}>{monthLabel(k)}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: isSelected ? '#fff' : isCurrentMonth ? '#1A73E8' : '#0A1628', margin: '0 0 4px', lineHeight: 1 }}>
                    {(data.expected / 1000).toFixed(1)}k
                  </p>
                  <p style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : '#94A3B8', margin: '0 0 8px' }}>{data.names.length} versement{data.names.length > 1 ? 's' : ''}</p>
                  <div style={{ height: 4, background: isSelected ? 'rgba(255,255,255,0.25)' : '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: isSelected ? '#fff' : isCurrentMonth ? '#1A73E8' : '#60A5FA', borderRadius: 999 }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Détail du mois sélectionné */}
          {selectedMonth && (() => {
            const monthEch = echeances.filter(e => monthKey(e.date) === selectedMonth)
            return (
              <div style={{ marginTop: 12, background: '#E8F1FF', borderRadius: 12, border: '1.5px solid #C4B5FD', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #C4B5FD' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4C1D95' }}>Versements attendus — {monthLabel(selectedMonth)}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1A73E8' }}>{formatMAD(monthEch.reduce((s, e) => s + e.amount, 0))}</span>
                </div>
                {monthEch.map((e, i) => {
                  const nc = NIV_COLOR[e.niveau] || { bg: '#EDE9FE', color: '#7C3AED' }
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < monthEch.length - 1 ? '1px solid #DDD6FE' : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'transparent' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#1A73E8,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {e.participantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', margin: 0 }}>{e.participantName}</p>
                        <p style={{ fontSize: 11, color: '#7C3AED', margin: '1px 0 0' }}>{fmtDate(e.date)} · Versement {e.echelonIndex + 1}</p>
                      </div>
                      {e.niveau && <span style={{ fontSize: 10, fontWeight: 700, background: nc.bg, color: nc.color, padding: '2px 7px', borderRadius: 5 }}>{e.niveau}</span>}
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#1A73E8', whiteSpace: 'nowrap' }}>{formatMAD(e.amount)}</span>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Recherche */}
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une apprenante…"
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1.5px solid #D4E6FF', background: '#fff', fontSize: 13, color: '#0A1628', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {/* Filtres + vue sur la même ligne */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <div style={{ display: 'flex', borderRadius: 10, border: '1.5px solid #D4E6FF', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
            {(['all', 'N1', 'N2', 'N3'] as const).map(n => (
              <button key={n} onClick={() => setNiveauFilter(n)}
                style={{ padding: isMobile ? '7px 10px' : '8px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: niveauFilter === n ? '#1A73E8' : 'transparent', color: niveauFilter === n ? '#fff' : '#64748B', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {n === 'all' ? 'Tous' : n}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', borderRadius: 10, border: '1.5px solid #D4E6FF', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
            {(['all', 'paid', 'partial', 'pending'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: isMobile ? '7px 10px' : '8px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: statusFilter === s ? '#1A73E8' : 'transparent', color: statusFilter === s ? '#fff' : '#64748B', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {s === 'all' ? 'Tous' : isMobile ? (s === 'paid' ? 'Soldé' : s === 'partial' ? 'Partiel' : 'Attente') : STATUS_CFG[s]?.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', borderRadius: 10, border: '1.5px solid #D4E6FF', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
            <button onClick={() => setView('table')} style={{ padding: isMobile ? '7px 12px' : '8px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: view === 'table' ? '#1A73E8' : 'transparent', color: view === 'table' ? '#fff' : '#64748B' }}>
              {isMobile ? '≡' : 'Tableau'}
            </button>
            <button onClick={() => setView('timeline')} style={{ padding: isMobile ? '7px 12px' : '8px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: view === 'timeline' ? '#1A73E8' : 'transparent', color: view === 'timeline' ? '#fff' : '#64748B' }}>
              {isMobile ? '📅' : 'Échéancier'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</p>
      </div>

      {/* ── Vue tableau / cartes ── */}
      {view === 'table' && (
        isMobile ? (
          /* ── Vue cartes mobile ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(pay => {
              const niv = getNiveau(pay.notes ?? undefined)
              const ech = getEchelon(pay.notes ?? undefined)
              const pct = Math.min(100, Math.round((pay.amountPaid / pay.totalAmount) * 100))
              const sc = STATUS_CFG[pay.status]
              const nc = NIV_COLOR[niv] || { bg: '#F1F5F9', color: '#64748B' }
              const isOverdue = pay.dueDate && pay.dueDate < today && pay.remainingAmount > 0
              return (
                <div key={pay.id} style={{ ...cardS, padding: '14px 16px', borderLeft: isOverdue ? '3px solid #EF4444' : '3px solid transparent' }}>
                  {/* Ligne 1 : avatar + nom + niveau + statut */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#1A73E8,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {pay.participantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pay.participantName}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        {niv && <span style={{ fontSize: 10, fontWeight: 700, background: nc.bg, color: nc.color, padding: '2px 6px', borderRadius: 5 }}>{niv}</span>}
                        {ech > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#E8F1FF', color: '#1A73E8', padding: '2px 6px', borderRadius: 5 }}>{ech} éch.</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: sc?.bg, color: sc?.color, padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {sc?.label}
                    </span>
                  </div>

                  {/* Ligne 2 : barre de progression */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>Progression</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#1A73E8' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#E8F1FF', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pay.status === 'paid' ? '#16A34A' : '#1A73E8', borderRadius: 999 }} />
                    </div>
                  </div>

                  {/* Ligne 3 : montants */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {[
                      { label: 'Total', value: `${pay.totalAmount.toLocaleString('fr-MA')}`, color: '#0A1628' },
                      { label: 'Payé', value: `${pay.amountPaid.toLocaleString('fr-MA')}`, color: '#16A34A' },
                      { label: 'Reste', value: pay.remainingAmount > 0 ? `${pay.remainingAmount.toLocaleString('fr-MA')}` : '—', color: pay.remainingAmount > 0 ? '#D97706' : '#CBD5E1' },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: 'center', background: '#F8F7FF', borderRadius: 8, padding: '6px 4px' }}>
                        <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 2px', textTransform: 'uppercase' }}>{m.label}</p>
                        <p style={{ fontSize: 12, fontWeight: 800, color: m.color, margin: 0 }}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Ligne 4 : date + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      {pay.dueDate
                        ? <span style={{ fontSize: 11, fontWeight: 600, color: isOverdue ? '#DC2626' : '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isOverdue && <AlertTriangle style={{ width: 11, height: 11 }} />}
                            Prochain : {fmtDate(pay.dueDate)}
                          </span>
                        : pay.status !== 'paid' ? <span style={{ fontSize: 11, color: '#CBD5E1', fontStyle: 'italic' }}>Date à valider</span> : null}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {pay.status !== 'paid' && (
                        <button onClick={() => setVersementPayment({ id: pay.id, participantName: pay.participantName, totalAmount: pay.totalAmount, amountPaid: pay.amountPaid, status: pay.status })}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: 'none', background: '#1A73E8', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          <PlusCircle style={{ width: 12, height: 12 }} />Versement
                        </button>
                      )}
                      <button onClick={() => openEdit(pay)}
                        style={{ padding: 7, borderRadius: 8, border: '1px solid #D4E6FF', background: '#fff', color: '#1A73E8', cursor: 'pointer' }}>
                        <Pencil style={{ width: 13, height: 13 }} />
                      </button>
                      <button onClick={async () => { if (!confirm(`Supprimer ${pay.participantName} ?`)) return; await deletePayment(pay.id); toast.success('Supprimé') }}
                        style={{ padding: 7, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ ...cardS, padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucune apprenante trouvée</div>
            )}
          </div>
        ) : (
          /* ── Vue tableau desktop ── */
          <div style={{ ...cardS, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E8F1FF' }}>
                    {['Apprenante', 'Niv.', 'Total', 'Payé', 'Reste', 'Progression', 'Éch. rest.', 'Prochain paiement', 'Statut', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((pay, idx) => {
                    const niv = getNiveau(pay.notes ?? undefined)
                    const ech = getEchelon(pay.notes ?? undefined)
                    const pct = Math.min(100, Math.round((pay.amountPaid / pay.totalAmount) * 100))
                    const sc = STATUS_CFG[pay.status]
                    const nc = NIV_COLOR[niv] || { bg: '#F1F5F9', color: '#64748B' }
                    const isOverdue = pay.dueDate && pay.dueDate < today && pay.remainingAmount > 0
                    return (
                      <tr key={pay.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F8F7FF' : 'none', background: isOverdue ? '#FFF8F8' : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = isOverdue ? '#FFF0F0' : '#FAFAFE')}
                        onMouseLeave={e => (e.currentTarget.style.background = isOverdue ? '#FFF8F8' : 'transparent')}>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#1A73E8,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {pay.participantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0A1628' }}>{pay.participantName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          {niv && <span style={{ fontSize: 11, fontWeight: 700, background: nc.bg, color: nc.color, padding: '3px 7px', borderRadius: 6 }}>{niv}</span>}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#0A1628', whiteSpace: 'nowrap' }}>{pay.totalAmount.toLocaleString('fr-MA')}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#16A34A', whiteSpace: 'nowrap' }}>{pay.amountPaid.toLocaleString('fr-MA')}</td>
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          {pay.remainingAmount > 0
                            ? <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706' }}>{pay.remainingAmount.toLocaleString('fr-MA')}</span>
                            : <span style={{ color: '#CBD5E1' }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ width: 90 }}>
                            <div style={{ height: 6, background: '#E8F1FF', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pay.status === 'paid' ? '#16A34A' : '#1A73E8', borderRadius: 999 }} />
                            </div>
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          {ech > 0
                            ? <span style={{ fontSize: 12, fontWeight: 700, background: '#E8F1FF', color: '#1A73E8', padding: '3px 9px', borderRadius: 20 }}>{ech}×</span>
                            : pay.status === 'paid' ? <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span> : null}
                        </td>
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          {pay.dueDate
                            ? <span style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? '#DC2626' : '#0A1628', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {isOverdue && <AlertTriangle style={{ width: 12, height: 12 }} />}
                                {fmtDate(pay.dueDate)}
                              </span>
                            : pay.status !== 'paid' ? <span style={{ fontSize: 11, color: '#CBD5E1', fontStyle: 'italic' }}>À valider</span> : <span style={{ color: '#CBD5E1' }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: sc?.bg, color: sc?.color, padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>
                            {sc?.label}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[
                              { Icon: PlusCircle, title: 'Versement', hbg: '#E8F1FF', hc: '#1A73E8', action: () => setVersementPayment({ id: pay.id, participantName: pay.participantName, totalAmount: pay.totalAmount, amountPaid: pay.amountPaid, status: pay.status }) },
                              { Icon: Pencil,     title: 'Modifier',  hbg: '#EFF6FF', hc: '#3B82F6', action: () => openEdit(pay) },
                              { Icon: Trash2,     title: 'Supprimer', hbg: '#FEF2F2', hc: '#DC2626', action: async () => { if (!confirm(`Supprimer ${pay.participantName} ?`)) return; await deletePayment(pay.id); toast.success('Supprimé') } },
                            ].map(({ Icon, title, hbg, hc, action }) => (
                              <button key={title} onClick={action} title={title}
                                style={{ padding: 5, borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', transition: 'all 0.15s' }}
                                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = hbg; b.style.color = hc }}
                                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'none'; b.style.color = '#94A3B8' }}>
                                <Icon style={{ width: 15, height: 15 }} />
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 48, color: '#94A3B8', fontSize: 13 }}>Aucune apprenante trouvée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Vue échéancier ── */}
      {view === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {echeances.length === 0 && (
            <div style={{ ...cardS, padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucune échéance à venir</div>
          )}
          {/* Grouper par mois */}
          {monthlyProjection.map(([k, data]) => {
            const monthEch = echeances.filter(e => monthKey(e.date) === k)
            const isCurrent = k === monthKey(today)
            return (
              <div key={k} style={{ ...cardS, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', background: isCurrent ? '#E8F1FF' : '#F8F7FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D4E6FF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, background: '#1A73E8', color: '#fff', padding: '2px 8px', borderRadius: 10 }}>CE MOIS</span>}
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0A1628', textTransform: 'capitalize' }}>{monthLabel(k)}</span>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>· {monthEch.length} versement{monthEch.length > 1 ? 's' : ''}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1A73E8' }}>{formatMAD(data.expected)}</span>
                </div>
                <div>
                  {monthEch.map((e, i) => {
                    const nc = NIV_COLOR[e.niveau] || { bg: '#F1F5F9', color: '#64748B' }
                    const isLast = i === monthEch.length - 1
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: isLast ? 'none' : '1px solid #F8F7FF' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 44, flexShrink: 0 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#0A1628', lineHeight: 1 }}>{new Date(e.date).getDate()}</span>
                          <span style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase' }}>{new Date(e.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                        </div>
                        <div style={{ width: 1, height: 36, background: '#D4E6FF', flexShrink: 0 }} />
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#1A73E8,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {e.participantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', margin: 0 }}>{e.participantName}</p>
                          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Versement {e.echelonIndex + 1}</p>
                        </div>
                        {e.niveau && <span style={{ fontSize: 11, fontWeight: 700, background: nc.bg, color: nc.color, padding: '3px 8px', borderRadius: 6 }}>{e.niveau}</span>}
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0A1628', whiteSpace: 'nowrap' }}>{formatMAD(e.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <Modal open={!!versementPayment} onClose={() => setVersementPayment(null)} title="Enregistrer un versement" size="sm">
        {versementPayment && (
          <div className="space-y-4">
            <div style={{ background: '#F8F7FF', borderRadius: 12, padding: 16, fontSize: 13 }}>
              <p style={{ fontWeight: 700, color: '#0A1628', margin: 0 }}>{versementPayment.participantName}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, color: '#64748B' }}>
                <span>Déjà payé</span><span style={{ fontWeight: 700, color: '#16A34A' }}>{formatMAD(versementPayment.amountPaid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Reste</span><span style={{ fontWeight: 700, color: '#D97706' }}>{formatMAD(versementPayment.totalAmount - versementPayment.amountPaid)}</span>
              </div>
            </div>
            <Input label="Montant du versement (MAD) *" type="number" value={versementAmount} onChange={e => setVersementAmount(e.target.value)} placeholder="ex: 2000" autoFocus />
            <Input label="Date du versement" type="date" value={versementDate} onChange={e => setVersementDate(e.target.value)} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setVersementPayment(null)}>Annuler</Button>
              <Button variant="primary" onClick={handleVersementSubmit} disabled={versementLoading}>{versementLoading ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editingPayment} onClose={() => setEditingPayment(null)} title="Modifier le paiement" size="md">
        {editingPayment && (
          <div className="space-y-4">
            <Input label="Nom" value={editingPayment.participantName} onChange={e => setEditingPayment(f => f ? { ...f, participantName: e.target.value } : f)} />
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>Niveau</label>
              <select value={editingPayment.notes?.split(' — ')[0] ?? ''} onChange={e => setEditingPayment(f => f ? { ...f, notes: e.target.value } : f)}
                style={{ width: '100%', borderRadius: 10, border: '1.5px solid #D4E6FF', padding: '9px 12px', fontSize: 13, color: '#0A1628', background: '#fff', outline: 'none' }}>
                {SESSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Total (MAD)" type="number" value={String(editingPayment.totalAmount)} onChange={e => setEditingPayment(f => f ? { ...f, totalAmount: Number(e.target.value) } : f)} />
              <Input label="Payé (MAD)" type="number" value={String(editingPayment.amountPaid)} onChange={e => setEditingPayment(f => f ? { ...f, amountPaid: Number(e.target.value) } : f)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={editingPayment.date} onChange={e => setEditingPayment(f => f ? { ...f, date: e.target.value } : f)} />
              <Input label="Prochain paiement" type="date" value={editingPayment.dueDate} onChange={e => setEditingPayment(f => f ? { ...f, dueDate: e.target.value } : f)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditingPayment(null)}>Annuler</Button>
              <Button variant="primary" onClick={handleEditSubmit} disabled={editLoading}>{editLoading ? '…' : 'Enregistrer'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouveau paiement" size="md">
        <div className="space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>Participant</label>
            <select value={form.participantId} onChange={e => { const p = participants.find(x => x.id === e.target.value); setForm(f => ({ ...f, participantId: e.target.value, participantName: p ? `${p.firstName} ${p.lastName}` : f.participantName })) }}
              style={{ width: '100%', borderRadius: 10, border: '1.5px solid #D4E6FF', padding: '9px 12px', fontSize: 13, color: '#0A1628', background: '#fff', outline: 'none' }}>
              <option value="">Sélectionner ou saisir ci-dessous</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <Input label="Nom *" value={form.participantName} onChange={e => setF('participantName', e.target.value)} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>Niveau</label>
            <select value={form.session} onChange={e => setF('session', e.target.value)}
              style={{ width: '100%', borderRadius: 10, border: '1.5px solid #D4E6FF', padding: '9px 12px', fontSize: 13, color: '#0A1628', background: '#fff', outline: 'none' }}>
              {SESSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total (MAD) *" type="number" value={String(form.totalAmount)} onChange={e => setF('totalAmount', e.target.value)} />
            <Input label="Acompte versé (MAD)" type="number" value={String(form.amountPaid)} onChange={e => setF('amountPaid', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            <Input label="Prochain paiement" type="date" value={form.dueDate} onChange={e => setF('dueDate', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? '…' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
