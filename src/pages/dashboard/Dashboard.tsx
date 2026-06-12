import { Users, UserCheck, TrendingUp, CreditCard, Calendar, Award, Activity, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { DASHBOARD_STATS, MONTHLY_REVENUE, LEAD_SOURCES, CONVERSION_DATA, ACTIVITY_LOGS } from '../../lib/mockData'
import { useAppStore } from '../../store/appStore'
import { formatCurrency, formatDate, timeAgo } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

const LEAD_STATUS_LABELS: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'danger' | 'default' | 'purple' }> = {
  new: { label: 'Nouveau', color: 'info' },
  interested: { label: 'Intéressé', color: 'success' },
  callback: { label: 'Rappel', color: 'warning' },
  not_interested: { label: 'Pas intéressé', color: 'danger' },
  no_answer: { label: 'Pas de réponse', color: 'default' },
  registered: { label: 'Inscrit', color: 'purple' },
}

function StatCard({ label, value, icon: Icon, color, sub, trend }: {
  label: string; value: string | number; icon: any; color: string; sub?: string; trend?: number
}) {
  return (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              <ArrowUpRight className={`w-3 h-3 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500 rotate-180'}`} />
              <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend >= 0 ? '+' : ''}{trend}% ce mois
              </span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { leads, appointments, tasks } = useAppStore()
  const stats = DASHBOARD_STATS

  const today = new Date().toISOString().slice(0, 10)
  const todayAppts = appointments.filter(a => a.date === today)
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')

  const leadsByStatus = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Bonjour, {user?.name.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {formatDate(new Date(), "EEEE d MMMM yyyy")} — Voici votre récapitulatif
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={leads.length} icon={Users} color="bg-blue-500" trend={12} />
        <StatCard label="Leads aujourd'hui" value={stats.leadsToday} icon={TrendingUp} color="bg-indigo-500" />
        <StatCard label="Nouvelles inscriptions" value={stats.newRegistrations} icon={UserCheck} color="bg-emerald-500" trend={8} />
        <StatCard label="Clients coaching actifs" value={stats.activeCoachingClients} icon={CheckCircle2} color="bg-purple-500" />
        <StatCard label="Participants formation" value={stats.activeTrainingParticipants} icon={Activity} color="bg-pink-500" />
        <StatCard label="Revenue ce mois" value={formatCurrency(stats.revenueThisMonth)} icon={CreditCard} color="bg-amber-500" trend={15} />
        <StatCard label="Revenue cette année" value={formatCurrency(stats.revenueThisYear)} icon={CreditCard} color="bg-orange-500" />
        <StatCard label="Paiements en attente" value={formatCurrency(stats.pendingPayments)} icon={Clock} color="bg-red-500" />
        <StatCard label="RDV à venir" value={stats.upcomingAppointments} icon={Calendar} color="bg-cyan-500" />
        <StatCard label="Séances aujourd'hui" value={stats.sessionsToday} icon={Activity} color="bg-teal-500" />
        <StatCard label="Taux de complétion" value={`${stats.completionRate}%`} icon={CheckCircle2} color="bg-green-500" />
        <StatCard label="Certificats délivrés" value={stats.certificatesIssued} icon={Award} color="bg-violet-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue mensuel</CardTitle>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />Coaching</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />Formation</span>
            </div>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[stroke:#374151]" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip
                formatter={(v: any, name: any) => [formatCurrency(Number(v)), name === 'coaching' ? 'Coaching' : 'Formation']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="coaching" stroke="#3b82f6" strokeWidth={2} fill="url(#gradBlue)" />
              <Area type="monotone" dataKey="formation" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradPurple)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader><CardTitle>Sources de leads</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={LEAD_SOURCES} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
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
                  <span className="text-xs text-gray-600 dark:text-gray-400">{s.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Conversion */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Leads vs Conversions</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CONVERSION_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[stroke:#374151]" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="leads" fill="#e0e7ff" radius={[4, 4, 0, 0]} name="Leads" />
              <Bar dataKey="converted" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Convertis" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          {/* Leads by status */}
          <Card>
            <CardTitle className="mb-3">Statuts CRM</CardTitle>
            <div className="space-y-2">
              {Object.entries(leadsByStatus).map(([status, count]) => {
                const info = LEAD_STATUS_LABELS[status] || { label: status, color: 'default' as const }
                return (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant={info.color} dot>{info.label}</Badge>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{count}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Today's schedule */}
          <Card>
            <CardTitle className="mb-3">Agenda du jour</CardTitle>
            {todayAppts.length === 0 ? (
              <p className="text-xs text-gray-400">Aucun RDV aujourd'hui</p>
            ) : (
              <div className="space-y-2">
                {todayAppts.map(apt => (
                  <div key={apt.id} className="flex items-center gap-2.5">
                    <div className="w-1 h-8 rounded-full" style={{ background: apt.color || '#3b82f6' }} />
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{apt.title}</p>
                      <p className="text-xs text-gray-400">{apt.startTime} — {apt.endTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Row: Activity + Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <Card>
          <CardHeader><CardTitle>Activité récente</CardTitle></CardHeader>
          <div className="space-y-3">
            {ACTIVITY_LOGS.slice(0, 6).map((log, i) => (
              <div key={log.id} className="flex items-start gap-3">
                <Avatar name={log.userName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{log.userName}</span> — {log.action}
                    {log.details && <span className="text-gray-500"> ({log.details})</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.createdAt)}</p>
                </div>
                {i < ACTIVITY_LOGS.length - 1 && i < 5 && (
                  <div className="absolute left-[1.375rem] mt-8 w-px h-3 bg-gray-100 dark:bg-gray-800" />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tâches en attente</CardTitle>
            <Badge variant="warning">{pendingTasks.length}</Badge>
          </CardHeader>
          <div className="space-y-2">
            {pendingTasks.slice(0, 5).map(task => {
              const priorityColors = { urgent: 'danger', high: 'warning', medium: 'info', low: 'default' } as const
              return (
                <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-amber-500' :
                    task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.assignedToName} {task.dueDate ? `· Échéance: ${formatDate(task.dueDate)}` : ''}</p>
                  </div>
                  <Badge variant={priorityColors[task.priority] || 'default'} size="sm">{task.priority}</Badge>
                </div>
              )
            })}
            {pendingTasks.length === 0 && <p className="text-xs text-gray-400 py-2">Aucune tâche en attente 🎉</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
