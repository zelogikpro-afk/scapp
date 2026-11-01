import { useMemo, useState, useEffect } from 'react'
import { Users, UserCheck, TrendingUp, CreditCard, Calendar, Award, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, BookOpen, ClipboardList, Flame } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import DateRangeFilter, { type Preset, type DateRange, getRange, inRange } from '../../components/ui/DateRangeFilter'
import { PageHero } from '../../components/ui/PageHero'
import { DASHBOARD_STATS, MONTHLY_REVENUE, LEAD_SOURCES, CONVERSION_DATA } from '../../lib/mockData'
import { useAppStore } from '../../store/appStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'

const PIE_COLORS = ['#1A73E8', '#8b5cf6', '#10b981', '#f59e0b']

const LEAD_STATUS_LABELS: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'danger' | 'default' | 'purple' }> = {
  new: { label: 'Nouveau', color: 'info' },
  interested: { label: 'Intéressé', color: 'success' },
  callback: { label: 'Rappel', color: 'warning' },
  not_interested: { label: 'Pas intéressé', color: 'danger' },
  no_answer: { label: 'Pas de réponse', color: 'default' },
  registered: { label: 'Inscrit', color: 'purple' },
}

// ─── StatCard redesigné ───────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, sub, trend }: {
  label: string; value: string | number; icon: any
  gradient: string; sub?: string; trend?: number
}) {
  return (
    <Card hover className="relative overflow-hidden group">
      {/* subtle gradient bg on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(26,115,232,0.03) 0%, rgba(79,148,240,0.06) 100%)' }} />
      <div className="relative flex flex-col gap-3">
        {/* icon */}
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradient }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {/* value */}
        <div>
          <p className="text-[11px] font-semibold text-[#6B88A8] dark:text-[#6B88A8] uppercase tracking-wide leading-none mb-1.5">{label}</p>
          <p className="text-[26px] font-black text-[#0A1628] dark:text-white leading-none tabular-nums">{value}</p>
          {sub && <p className="text-xs text-[#6B88A8] mt-1">{sub}</p>}
        </div>
        {/* trend */}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0
              ? <ArrowUpRight className="w-3.5 h-3.5" />
              : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend >= 0 ? '+' : ''}{trend}% vs mois préc.
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-bold text-[#6B88A8] uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-[#E2ECF8] dark:bg-[rgba(26,115,232,0.12)]" />
    </div>
  )
}

// ─── Agenda item ───────────────────────────────────────────────────────────────
function AgendaItem({ time, title, color }: { time?: string; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#F0F7FF] dark:border-[rgba(26,115,232,0.08)] last:border-0">
      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: color || '#1A73E8' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0A1628] dark:text-white truncate">{title}</p>
        {time && <p className="text-xs text-[#6B88A8]">{time}</p>}
      </div>
    </div>
  )
}

// ─── Task item ─────────────────────────────────────────────────────────────────
function TaskItem({ title, priority }: { title: string; priority?: string }) {
  const dotColor = priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f59e0b' : priority === 'medium' ? '#1A73E8' : '#d1d5db'
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#F0F7FF] dark:border-[rgba(26,115,232,0.08)] last:border-0">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
      <p className="text-sm text-[#0A1628] dark:text-gray-300 truncate flex-1">{title}</p>
    </div>
  )
}

// ─── Vue Admin/Super Admin ──────────────────────────────────────────────────
function AdminDashboard({ range }: { range: DateRange }) {
  const { leads, appointments, tasks, payments, participants, coachingSessions } = useAppStore()
  const stats = DASHBOARD_STATS
  const today = new Date().toISOString().slice(0, 10)

  const fLeads        = useMemo(() => leads.filter(l => inRange(l.createdAt, range)), [leads, range])
  const fParticipants = useMemo(() => participants.filter(p => inRange(p.createdAt, range)), [participants, range])
  const fPayments     = useMemo(() => payments.filter(p => inRange(p.date, range)), [payments, range])
  const fSessions     = useMemo(() => coachingSessions.filter(s => inRange(s.date, range)), [coachingSessions, range])
  const todayAppts    = appointments.filter(a => a.date === today)
  const pendingTasks  = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const totalRevenue  = fPayments.reduce((s, p) => s + p.amountPaid, 0)
  const pendingPay    = fPayments.filter(p => p.status !== 'paid' && p.status !== 'cancelled').reduce((s, p) => s + p.remainingAmount, 0)

  const revenueByMonth = useMemo(() => {
    const map: Record<string, { coaching: number; formation: number }> = {}
    fPayments.forEach(p => {
      const month = (p.date || '').slice(0, 7)
      if (!map[month]) map[month] = { coaching: 0, formation: 0 }
      if (p.programType === 'coaching') map[month].coaching += p.amountPaid
      else map[month].formation += p.amountPaid
    })
    const months = Object.keys(map).sort()
    if (months.length === 0) return MONTHLY_REVENUE
    return months.map(m => ({
      month: new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
      coaching: map[m].coaching,
      formation: map[m].formation,
    }))
  }, [fPayments])

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div>
        <SectionLabel>Vue d'ensemble</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Leads"              value={fLeads.length}               icon={Users}        gradient="linear-gradient(135deg,#1A73E8,#4F94F0)" trend={12} />
          <StatCard label="Nouveaux inscrits"  value={fParticipants.length}        icon={UserCheck}    gradient="linear-gradient(135deg,#10b981,#34d399)" trend={8} />
          <StatCard label="Revenu encaissé"    value={formatCurrency(totalRevenue)} icon={CreditCard}   gradient="linear-gradient(135deg,#f59e0b,#fbbf24)" trend={15} />
          <StatCard label="En attente"         value={formatCurrency(pendingPay)}   icon={Clock}        gradient="linear-gradient(135deg,#ef4444,#f87171)" />
          <StatCard label="Séances période"    value={fSessions.length}            icon={BookOpen}     gradient="linear-gradient(135deg,#8b5cf6,#a78bfa)" />
          <StatCard label="RDV aujourd'hui"    value={todayAppts.length}           icon={Calendar}     gradient="linear-gradient(135deg,#00b4d8,#48cae4)" />
          <StatCard label="Tâches en attente"  value={pendingTasks.length}         icon={CheckCircle2} gradient="linear-gradient(135deg,#f97316,#fb923c)" />
          <StatCard label="Certificats"        value={stats.certificatesIssued}    icon={Award}        gradient="linear-gradient(135deg,#7c3aed,#a855f7)" />
        </div>
      </div>

      {/* Revenus + sources */}
      <div>
        <SectionLabel>Revenus & acquisition</SectionLabel>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Revenu mensuel</CardTitle>
              <div className="flex items-center gap-4 text-xs text-[#6B88A8]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1A73E8] inline-block" />Coaching</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />Formation</span>
              </div>
            </CardHeader>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueByMonth} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1A73E8" stopOpacity={0.18}/><stop offset="95%" stopColor="#1A73E8" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2ECF8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B88A8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B88A8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip formatter={(v: any, name: any) => [formatCurrency(Number(v)), name === 'coaching' ? 'Coaching' : 'Formation']} contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E2ECF8' }} />
                <Area type="monotone" dataKey="coaching" stroke="#1A73E8" strokeWidth={2.5} fill="url(#gB)" />
                <Area type="monotone" dataKey="formation" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gP)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sources de leads</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={LEAD_SOURCES} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {LEAD_SOURCES.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-1">
              {LEAD_SOURCES.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-xs text-[#6B88A8]">{s.name}</span>
                  </div>
                  <span className="text-xs font-bold text-[#0A1628] dark:text-white">{s.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Conversions + tâches */}
      <div>
        <SectionLabel>Pipeline & suivi</SectionLabel>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card>
            <CardHeader><CardTitle>Leads vs Conversions</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CONVERSION_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2ECF8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B88A8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B88A8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E2ECF8' }} />
                <Bar dataKey="leads" fill="#D4E6FF" radius={[6, 6, 0, 0]} name="Leads" />
                <Bar dataKey="converted" fill="#1A73E8" radius={[6, 6, 0, 0]} name="Convertis" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tâches en attente</CardTitle>
              {pendingTasks.length > 0 && <Badge variant="warning">{pendingTasks.length}</Badge>}
            </CardHeader>
            {pendingTasks.length === 0
              ? <p className="text-sm text-[#6B88A8] py-2">Aucune tâche en attente 🎉</p>
              : pendingTasks.slice(0, 6).map(t => <TaskItem key={t.id} title={t.title} priority={t.priority} />)
            }
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Vue CRM Manager ─────────────────────────────────────────────────────────
function CRMManagerDashboard({ range }: { range: DateRange }) {
  const { leads, appointments, tasks, participants, coachingSessions } = useAppStore()
  const today = new Date().toISOString().slice(0, 10)

  const fLeads        = useMemo(() => leads.filter(l => inRange(l.createdAt, range)), [leads, range])
  const fParticipants = useMemo(() => participants.filter(p => inRange(p.createdAt, range)), [participants, range])
  const fSessions     = useMemo(() => coachingSessions.filter(s => inRange(s.date, range)), [coachingSessions, range])
  const todayAppts    = appointments.filter(a => a.date === today)
  const pendingTasks  = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const toFollowUp    = leads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate <= today)

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Vue d'ensemble</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
          <StatCard label="Leads période"       value={fLeads.length}          icon={Users}        gradient="linear-gradient(135deg,#1A73E8,#4F94F0)" trend={12} />
          <StatCard label="Participants"         value={fParticipants.length}   icon={UserCheck}    gradient="linear-gradient(135deg,#10b981,#34d399)" trend={8} />
          <StatCard label="Séances période"      value={fSessions.length}       icon={BookOpen}     gradient="linear-gradient(135deg,#8b5cf6,#a78bfa)" />
          <StatCard label="RDV aujourd'hui"      value={todayAppts.length}      icon={Calendar}     gradient="linear-gradient(135deg,#00b4d8,#48cae4)" />
          <StatCard label="Tâches en attente"    value={pendingTasks.length}    icon={CheckCircle2} gradient="linear-gradient(135deg,#f97316,#fb923c)" />
          <StatCard label="Relances du jour"     value={toFollowUp.length}      icon={Flame}        gradient="linear-gradient(135deg,#f59e0b,#fbbf24)" />
        </div>
      </div>

      <div>
        <SectionLabel>Acquisition</SectionLabel>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle>Leads vs Conversions</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CONVERSION_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2ECF8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B88A8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B88A8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E2ECF8' }} />
                <Bar dataKey="leads" fill="#D4E6FF" radius={[6, 6, 0, 0]} name="Leads" />
                <Bar dataKey="converted" fill="#1A73E8" radius={[6, 6, 0, 0]} name="Convertis" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sources de leads</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={LEAD_SOURCES} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {LEAD_SOURCES.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-1">
              {LEAD_SOURCES.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-[#6B88A8]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />{s.name}</span>
                  <span className="text-xs font-bold text-[#0A1628] dark:text-white">{s.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div>
        <SectionLabel>Suivi & alertes</SectionLabel>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Tâches en attente</CardTitle>
              {pendingTasks.length > 0 && <Badge variant="warning">{pendingTasks.length}</Badge>}
            </CardHeader>
            {pendingTasks.length === 0
              ? <p className="text-sm text-[#6B88A8] py-2">Aucune tâche 🎉</p>
              : pendingTasks.slice(0, 5).map(t => <TaskItem key={t.id} title={t.title} priority={t.priority} />)
            }
          </Card>
          {toFollowUp.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Relances du jour</CardTitle><Badge variant="warning">{toFollowUp.length}</Badge></CardHeader>
              <div className="space-y-2">
                {toFollowUp.slice(0, 6).map(lead => (
                  <div key={lead.id} className="flex items-center gap-3 py-2 border-b border-[#F0F7FF] dark:border-[rgba(26,115,232,0.08)] last:border-0">
                    <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0A1628] dark:text-white">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-[#6B88A8]">{lead.phone} · {lead.source}</p>
                    </div>
                    <Badge variant="warning" dot>Relance</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Vue Commercial ──────────────────────────────────────────────────────────
function SalesDashboard({ range }: { range: DateRange }) {
  const { leads, tasks, appointments } = useAppStore()
  const { user } = useAuthStore()
  const today = new Date().toISOString().slice(0, 10)

  const myLeads    = useMemo(() => leads.filter(l => (!l.assignedTo || l.assignedTo === user?.id) && inRange(l.createdAt, range)), [leads, user, range])
  const todayAppts = appointments.filter(a => a.date === today)
  const myTasks    = tasks.filter(t => (t.assignedTo === user?.id || !t.assignedTo) && t.status !== 'done')
  const newLeads   = myLeads.filter(l => l.status === 'new' || l.status === 'to_contact')
  const toFollowUp = myLeads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate <= today)
  const converted  = myLeads.filter(l => l.status === 'registered')
  const conversionRate = myLeads.length ? Math.round((converted.length / myLeads.length) * 100) : 0
  const leadsByStatus = myLeads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Mon activité</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Mes leads"        value={myLeads.length}      icon={Users}      gradient="linear-gradient(135deg,#1A73E8,#4F94F0)" />
          <StatCard label="À contacter"      value={newLeads.length}     icon={TrendingUp} gradient="linear-gradient(135deg,#6366f1,#818cf8)" />
          <StatCard label="Relances du jour" value={toFollowUp.length}   icon={Flame}      gradient="linear-gradient(135deg,#f59e0b,#fbbf24)" />
          <StatCard label="Inscrits"         value={converted.length}    icon={UserCheck}  gradient="linear-gradient(135deg,#10b981,#34d399)" />
        </div>
      </div>

      <div>
        <SectionLabel>Pipeline & agenda</SectionLabel>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Statuts de mes leads</CardTitle>
              <span className="text-xs font-bold text-[#1A73E8]">Taux conv. {conversionRate}%</span>
            </CardHeader>
            <div className="space-y-3 py-1">
              {Object.entries(leadsByStatus).map(([status, count]) => {
                const info = LEAD_STATUS_LABELS[status] || { label: status, color: 'default' as const }
                const pct = Math.round((count / (myLeads.length || 1)) * 100)
                return (
                  <div key={status} className="flex items-center gap-3">
                    <Badge variant={info.color} dot className="w-32 flex-shrink-0">{info.label}</Badge>
                    <div className="flex-1 h-2 bg-[#F0F7FF] dark:bg-[rgba(26,115,232,0.08)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1A73E8, #4F94F0)' }} />
                    </div>
                    <span className="text-sm font-bold text-[#0A1628] dark:text-white w-6 text-right">{count}</span>
                  </div>
                )
              })}
              {Object.keys(leadsByStatus).length === 0 && <p className="text-sm text-[#6B88A8]">Aucun lead sur cette période</p>}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardTitle className="mb-3">Agenda du jour</CardTitle>
              {todayAppts.length === 0
                ? <p className="text-xs text-[#6B88A8]">Aucun RDV aujourd'hui</p>
                : todayAppts.map(apt => (
                    <AgendaItem key={apt.id} title={apt.title} time={apt.startTime ? `${apt.startTime} — ${apt.endTime}` : undefined} color={apt.color} />
                  ))
              }
            </Card>
            <Card>
              <CardTitle className="mb-3">Mes tâches</CardTitle>
              {myTasks.length === 0
                ? <p className="text-xs text-[#6B88A8]">Aucune tâche en cours 🎉</p>
                : myTasks.slice(0, 4).map(t => <TaskItem key={t.id} title={t.title} priority={t.priority} />)
              }
            </Card>
          </div>
        </div>
      </div>

      {toFollowUp.length > 0 && (
        <div>
          <SectionLabel>Relances du jour</SectionLabel>
          <Card>
            <div className="space-y-0">
              {toFollowUp.slice(0, 6).map(lead => (
                <div key={lead.id} className="flex items-center gap-3 py-2.5 border-b border-[#F0F7FF] dark:border-[rgba(26,115,232,0.08)] last:border-0">
                  <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0A1628] dark:text-white">{lead.firstName} {lead.lastName}</p>
                    <p className="text-xs text-[#6B88A8]">{lead.phone} · {lead.source}</p>
                  </div>
                  <Badge variant={LEAD_STATUS_LABELS[lead.status]?.color || 'default'} dot>
                    {LEAD_STATUS_LABELS[lead.status]?.label || lead.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── Vue Coach ───────────────────────────────────────────────────────────────
function CoachDashboard({ range }: { range: DateRange }) {
  const { participants, coachingSessions, appointments, tasks, tests } = useAppStore()
  const { user } = useAuthStore()
  const today = new Date().toISOString().slice(0, 10)

  const mySessions       = useMemo(() => coachingSessions.filter(s => (s.coachId === user?.id || !s.coachId) && inRange(s.date, range)), [coachingSessions, user, range])
  const todaySessions    = coachingSessions.filter(s => s.date === today && (s.coachId === user?.id || !s.coachId))
  const upcomingSessions = mySessions.filter(s => s.date >= today && s.status === 'scheduled').slice(0, 5)
  const todayAppts       = appointments.filter(a => a.date === today)
  const myTasks          = tasks.filter(t => (t.assignedTo === user?.id || !t.assignedTo) && t.status !== 'done')
  const fTests           = useMemo(() => tests.filter(t => inRange(t.date, range)), [tests, range])

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Mon activité</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Participants"        value={participants.length}     icon={UserCheck}    gradient="linear-gradient(135deg,#10b981,#34d399)" />
          <StatCard label="Séances période"     value={mySessions.length}      icon={BookOpen}     gradient="linear-gradient(135deg,#1A73E8,#4F94F0)" />
          <StatCard label="Séances aujourd'hui" value={todaySessions.length}   icon={Calendar}     gradient="linear-gradient(135deg,#8b5cf6,#a78bfa)" />
          <StatCard label="Tests réalisés"      value={fTests.length}          icon={ClipboardList} gradient="linear-gradient(135deg,#f59e0b,#fbbf24)" />
        </div>
      </div>

      <div>
        <SectionLabel>Planning & suivi</SectionLabel>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card>
            <CardHeader><CardTitle>Prochaines séances</CardTitle></CardHeader>
            {upcomingSessions.length === 0
              ? <p className="text-sm text-[#6B88A8] py-2">Aucune séance planifiée</p>
              : upcomingSessions.map(s => {
                  const p = participants.find(x => x.id === s.participantId)
                  return (
                    <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-[#F0F7FF] dark:border-[rgba(26,115,232,0.08)] last:border-0">
                      {p && <Avatar name={`${p.firstName} ${p.lastName}`} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0A1628] dark:text-white truncate">{p ? `${p.firstName} ${p.lastName}` : '—'}</p>
                        <p className="text-xs text-[#6B88A8]">{formatDate(s.date)}{s.time ? ` · ${s.time}` : ''}</p>
                      </div>
                      <Badge variant="info">Séance {s.sessionNumber}</Badge>
                    </div>
                  )
                })
            }
          </Card>

          <div className="space-y-4">
            <Card>
              <CardTitle className="mb-3">Agenda du jour</CardTitle>
              {todayAppts.length === 0 && todaySessions.length === 0
                ? <p className="text-xs text-[#6B88A8]">Aucun événement aujourd'hui</p>
                : todayAppts.map(apt => (
                    <AgendaItem key={apt.id} title={apt.title} time={apt.startTime ? `${apt.startTime} — ${apt.endTime}` : undefined} color={apt.color} />
                  ))
              }
            </Card>
            <Card>
              <CardTitle className="mb-3">Mes tâches</CardTitle>
              {myTasks.length === 0
                ? <p className="text-xs text-[#6B88A8]">Aucune tâche en cours 🎉</p>
                : myTasks.slice(0, 4).map(t => <TaskItem key={t.id} title={t.title} priority={t.priority} />)
              }
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Entry point ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore()
  const role = user?.role
  const [preset, setPreset] = useState<Preset>('month')
  const [range, setRange] = useState<DateRange>(getRange('month'))
  const handleDateChange = (p: Preset, r: DateRange) => { setPreset(p); setRange(r) }

  const heroGradients: Record<string, string> = {
    super_admin: 'linear-gradient(135deg, #0A1628 0%, #1A73E8 60%, #00B4D8 100%)',
    admin:       'linear-gradient(135deg, #0A1628 0%, #1A73E8 60%, #00B4D8 100%)',
    crm_manager: 'linear-gradient(135deg, #1A1060 0%, #6C5CE7 60%, #a78bfa 100%)',
    sales_agent: 'linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)',
    coach:       'linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)',
  }
  const heroEmojis: Record<string, string> = {
    super_admin: '🏢', admin: '🏢', crm_manager: '📊', sales_agent: '🎯', coach: '🎓',
  }
  const heroTitles: Record<string, string> = {
    super_admin: 'Tableau de bord', admin: 'Tableau de bord',
    crm_manager: 'CRM Manager', sales_agent: 'Mon espace commercial', coach: 'Espace coach',
  }

  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div className="space-y-6">
      <PageHero
        emoji={heroEmojis[role ?? ''] ?? '📊'}
        title={`Bonjour, ${firstName} 👋`}
        sub={`${heroTitles[role ?? ''] ?? 'Tableau de bord'} · ${todayStr}`}
        gradient={heroGradients[role ?? ''] ?? heroGradients.admin}
        actions={<DateRangeFilter value={preset} onChange={handleDateChange} />}
      />

      {(role === 'super_admin' || role === 'admin') && <AdminDashboard range={range} />}
      {role === 'crm_manager' && <CRMManagerDashboard range={range} />}
      {role === 'sales_agent' && <SalesDashboard range={range} />}
      {role === 'coach' && <CoachDashboard range={range} />}
    </div>
  )
}
