import { useState } from 'react'
import { Phone, Mail, MapPin, Briefcase, Calendar, CreditCard, BookOpen, ClipboardList, Activity } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { Progress } from '../../components/ui/Progress'
import { Card } from '../../components/ui/Card'
import { useAppStore } from '../../store/appStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Participant } from '../../types'

const TYPE_CONFIG = {
  coaching: { label: 'Coaching', color: 'info' as const },
  training: { label: 'Formation', color: 'purple' as const },
  both: { label: 'Coaching & Formation', color: 'success' as const },
}

const PAY_STATUS = {
  paid: { label: 'Payé', color: 'success' as const },
  partial: { label: 'Partiel', color: 'warning' as const },
  pending: { label: 'En attente', color: 'default' as const },
  overdue: { label: 'En retard', color: 'danger' as const },
  cancelled: { label: 'Annulé', color: 'danger' as const },
}

const SESSION_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500',
  scheduled: 'bg-blue-500',
  cancelled: 'bg-red-400',
  missed: 'bg-gray-300',
  rescheduled: 'bg-amber-500',
}

export default function ParticipantDetail({ participant: p, onClose }: { participant: Participant; onClose: () => void }) {
  const [tab, setTab] = useState<'profile' | 'coaching' | 'payments' | 'tests' | 'journey'>('profile')
  const { coachingPacks, coachingSessions, payments, tests } = useAppStore()

  const pPacks = coachingPacks.filter(cp => cp.participantId === p.id)
  const pSessions = coachingSessions.filter(s => s.participantId === p.id).sort((a, b) => b.sessionNumber - a.sessionNumber)
  const pPayments = payments.filter(pay => pay.participantId === p.id)
  const pTests = tests.filter(t => t.participantId === p.id)

  const totalPaid = pPayments.reduce((s, pay) => s + pay.amountPaid, 0)
  const totalOwed = pPayments.reduce((s, pay) => s + pay.remainingAmount, 0)

  const tabs = [
    { id: 'profile', label: 'Profil', icon: null },
    { id: 'coaching', label: `Coaching (${pPacks.length})`, icon: null },
    { id: 'payments', label: `Paiements (${pPayments.length})`, icon: null },
    { id: 'tests', label: `Tests (${pTests.length})`, icon: null },
    { id: 'journey', label: 'Parcours', icon: null },
  ] as const

  return (
    <Modal open onClose={onClose} title="" size="xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar name={`${p.firstName} ${p.lastName}`} size="xl" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{p.firstName} {p.lastName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant={TYPE_CONFIG[p.type].color}>{TYPE_CONFIG[p.type].label}</Badge>
              {(p.tags || []).map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{t}</span>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 text-gray-400" /> {p.phone}
              </div>
              {p.email && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Mail className="w-4 h-4 text-gray-400" /> {p.email}</div>}
              {p.profession && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Briefcase className="w-4 h-4 text-gray-400" /> {p.profession}</div>}
            </div>
          </div>
          {/* Summary cards */}
          <div className="hidden sm:flex gap-3">
            <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 min-w-24">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Payé</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalPaid)}</p>
            </div>
            {totalOwed > 0 && (
              <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 min-w-24">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Restant</p>
                <p className="text-base font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totalOwed)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Prénom', value: p.firstName },
              { label: 'Nom', value: p.lastName },
              { label: 'Genre', value: p.gender === 'male' ? 'Homme' : 'Femme' },
              { label: 'Date de naissance', value: p.birthDate ? formatDate(p.birthDate) : '—' },
              { label: 'CIN', value: p.cin || '—' },
              { label: 'Téléphone', value: p.phone },
              { label: 'Email', value: p.email || '—' },
              { label: 'WhatsApp', value: p.whatsapp || '—' },
              { label: 'Adresse', value: p.address || '—' },
              { label: 'Profession', value: p.profession || '—' },
              { label: 'Entreprise', value: p.company || '—' },
              { label: 'Contact urgence', value: p.emergencyContact || '—' },
              { label: 'Inscription', value: formatDate(p.createdAt) },
              { label: 'Notes internes', value: p.notes || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Coaching Tab */}
        {tab === 'coaching' && (
          <div className="space-y-4">
            {pPacks.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun pack de coaching</p>}
            {pPacks.map(pack => (
              <Card key={pack.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{pack.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Acheté le {formatDate(pack.purchaseDate)}</p>
                  </div>
                  <Badge variant={pack.status === 'active' ? 'success' : pack.status === 'completed' ? 'info' : 'warning'}>
                    {pack.status === 'active' ? 'Actif' : pack.status === 'completed' ? 'Terminé' : pack.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div><p className="text-xs text-gray-400">Séances</p><p className="font-semibold">{pack.usedSessions}/{pack.totalSessions}</p></div>
                  <div><p className="text-xs text-gray-400">Prix</p><p className="font-semibold">{formatCurrency(pack.price)}</p></div>
                  <div><p className="text-xs text-gray-400">Payé</p><p className="font-semibold text-emerald-600">{formatCurrency(pack.amountPaid)}</p></div>
                  <div><p className="text-xs text-gray-400">Restant</p><p className={`font-semibold ${pack.price - pack.discount - pack.amountPaid > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{formatCurrency(Math.max(0, pack.price - pack.discount - pack.amountPaid))}</p></div>
                </div>
                <Progress value={pack.usedSessions} max={pack.totalSessions} showLabel color="blue" />

                {/* Sessions list */}
                {pSessions.filter(s => s.packId === pack.id).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Séances</p>
                    <div className="space-y-1.5">
                      {pSessions.filter(s => s.packId === pack.id).map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${SESSION_STATUS_COLORS[s.status] || 'bg-gray-300'}`} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Séance #{s.sessionNumber}</span>
                          <span className="text-xs text-gray-400">{formatDate(s.date)} à {s.time}</span>
                          <Badge variant={s.status === 'completed' ? 'success' : s.status === 'scheduled' ? 'info' : 'warning'} size="sm" className="ml-auto">
                            {s.status === 'completed' ? 'Complétée' : s.status === 'scheduled' ? 'Programmée' : s.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Payments Tab */}
        {tab === 'payments' && (
          <div className="space-y-3">
            {pPayments.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun paiement enregistré</p>}
            {pPayments.map(pay => (
              <Card key={pay.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{pay.programName}</p>
                    <p className="text-xs text-gray-400 capitalize">{pay.programType} · {formatDate(pay.date)}</p>
                  </div>
                  <Badge variant={PAY_STATUS[pay.status].color}>{PAY_STATUS[pay.status].label}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-xs text-gray-400">Total</p><p className="font-semibold">{formatCurrency(pay.totalAmount)}</p></div>
                  <div><p className="text-xs text-gray-400">Payé</p><p className="font-semibold text-emerald-600">{formatCurrency(pay.amountPaid)}</p></div>
                  <div><p className="text-xs text-gray-400">Reste</p><p className={`font-semibold ${pay.remainingAmount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{formatCurrency(pay.remainingAmount)}</p></div>
                </div>
                {pay.totalAmount > 0 && (
                  <div className="mt-3">
                    <Progress value={pay.amountPaid} max={pay.totalAmount} showLabel color={pay.status === 'paid' ? 'green' : pay.status === 'overdue' ? 'red' : 'amber'} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Tests Tab */}
        {tab === 'tests' && (
          <div className="space-y-3">
            {pTests.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun test réalisé</p>}
            {pTests.map(test => (
              <Card key={test.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{test.type}</p>
                    <p className="text-xs text-gray-400">{formatDate(test.date)}</p>
                  </div>
                  <Badge variant="purple">{test.type}</Badge>
                </div>
                {test.result && <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Résultat:</span> {test.result}</p>}
                {test.score && <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Score:</span> {test.score}</p>}
                {test.interpretation && <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Interprétation:</span> {test.interpretation}</p>}
              </Card>
            ))}
          </div>
        )}

        {/* Journey Tab */}
        {tab === 'journey' && (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800" />
            <div className="space-y-4">
              {[
                { icon: '🎯', title: 'Lead reçu', date: p.createdAt, desc: `Via ${p.leadId ? 'Meta Ads' : 'inscription directe'}` },
                { icon: '✅', title: 'Inscrit comme participant', date: p.createdAt, desc: TYPE_CONFIG[p.type].label },
                ...pPacks.map(pack => ({ icon: '📦', title: `Pack acheté: ${pack.name}`, date: pack.purchaseDate, desc: `${pack.totalSessions} séances · ${formatCurrency(pack.price)}` })),
                ...pSessions.filter(s => s.status === 'completed').map(s => ({ icon: '🧭', title: `Séance #${s.sessionNumber} complétée`, date: s.date, desc: s.summary || 'Séance de coaching' })),
                ...pPayments.flatMap(pay => pay.installments.filter(i => i.status === 'paid').map(i => ({ icon: '💳', title: `Paiement: ${formatCurrency(i.amount)}`, date: i.date, desc: `${pay.programName} · ${pay.method}` }))),
                ...pTests.map(t => ({ icon: '📊', title: `Test ${t.type}`, date: t.date, desc: t.result || 'Test réalisé' })),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((event, i) => (
                <div key={i} className="flex items-start gap-4 relative">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-base flex-shrink-0 z-10">
                    {event.icon}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{event.desc}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
