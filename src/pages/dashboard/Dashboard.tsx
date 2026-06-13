import { Users, UserCheck, TrendingUp, CreditCard, Calendar, Award, Activity, ArrowUpRight, Clock, CheckCircle2, BookOpen, ClipboardList } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
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

// ─── Vue Admin/Super Admin ──────────────────────────────────────────────────
function AdminDashboard() {
  const { leads, appointments, tasks, payments, participants, coachingSessions } = useAppStore()
  const stats = DASHBOARD_STATS
  const today = new Date().toISOString().slice(0, 10)
  const todayAppts = appointments.filter(a => a.date === today)
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const totalRevenue = payments.reduce((s, p) => s + p.amountPaid, 0)
  const pendingPayments = payments.filter(p => p.status !== 'paid' && p.status !== 'cancelled').reduce((s, p) => s + p.remainingAmount, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total Leads"           value={leads.length}               icon={Users}        color="bg-blue-500"   trend={12} />
        <StatCard label="Participants actifs"    value={participants.length}         icon={UserCheck}    color="bg-emerald-500" trend={8} />
        <StatCard label="Revenue encaissé"       value={formatCurrency(totalRevenue)}icon={CreditCard}   color="bg-amber-500"  trend={15} />
        <StatCard label="En attente paiement"    value={formatCurrency(pendingPayments)} icon={Clock}   color="bg-red-500" />
        <StatCard label="Séances ce mois"        value={coachingSessions.filter(s => s.date?.startsWith(today.slice(0,7))).length} icon={BookOpen} color="bg-purple-500" />
        <StatCard label="RDV aujourd'hui"        value={todayAppts.length}          icon={Calendar}     color="bg-cyan-500" />
        <StatCard label="Tâches en attente"      value={pendingTasks.length}        icon={CheckCircle2} color="bg-orange-500" />
        <StatCard label="Certificats délivrés"   value={stats.certificatesIssued}   icon={Award}        color="bg-violet-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
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
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip formatter={(v: any, name: any) => [formatCurrency(Number(v)), name === 'coaching' ? 'Coaching' : 'Formation']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="coaching" stroke="#3b82f6" strokeWidth={2} fill="url(#gB)" />
              <Area type="monotone" dataKey="formation" stroke="#8b5cf6" strokeWidth={2} fill="url(#gP)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Leads vs Conversions</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CONVERSION_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="leads" fill="#e0e7ff" radius={[4, 4, 0, 0]} name="Leads" />
              <Bar dataKey="converted" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Convertis" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tâches en attente</CardTitle><Badge variant="warning">{pendingTasks.length}</Badge></CardHeader>
          <div className="space-y-2">
            {pendingTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-amber-500' : task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.assignedToName}</p>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && <p className="text-xs text-gray-400 py-2">Aucune tâche en attente 🎉</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Vue Commercial (sales_agent) ──────────────────────────────────────────
function SalesDashboard() {
  const { leads, tasks, appointments } = useAppStore()
  const { user } = useAuthStore()
  const today = new Date().toISOString().slice(0, 10)

  const myLeads = leads.filter(l => !l.assignedTo || l.assignedTo === user?.id)
  const todayAppts = appointments.filter(a => a.date === today)
  const myTasks = tasks.filter(t => (t.assignedTo === user?.id || !t.assignedTo) && t.status !== 'done')
  const newLeads = myLeads.filter(l => l.status === 'new' || l.status === 'to_contact')
  const toFollowUp = myLeads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate <= today)
  const converted = myLeads.filter(l => l.status === 'registered')

  const leadsByStatus = myLeads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Mes leads"         value={myLeads.length}       icon={Users}       color="bg-blue-500" />
        <StatCard label="À contacter"       value={newLeads.length}      icon={TrendingUp}  color="bg-indigo-500" />
        <StatCard label="Relances du jour"  value={toFollowUp.length}    icon={Clock}       color="bg-amber-500" />
        <StatCard label="Inscrits"          value={converted.length}     icon={UserCheck}   color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Statuts de mes leads</CardTitle></CardHeader>
          <div className="space-y-2 py-1">
            {Object.entries(leadsByStatus).map(([status, count]) => {
              const info = LEAD_STATUS_LABELS[status] || { label: status, color: 'default' as const }
              const pct = Math.round((count / (myLeads.length || 1)) * 100)
              return (
                <div key={status} className="flex items-center gap-3">
                  <Badge variant={info.color} dot className="w-32 flex-shrink-0">{info.label}</Badge>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="space-y-4">
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

          <Card>
            <CardTitle className="mb-3">Mes tâches</CardTitle>
            {myTasks.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune tâche en cours 🎉</p>
            ) : (
              <div className="space-y-2">
                {myTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{task.title}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Leads à relancer */}
      {toFollowUp.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Relances du jour</CardTitle><Badge variant="warning">{toFollowUp.length}</Badge></CardHeader>
          <div className="space-y-2">
            {toFollowUp.slice(0, 6).map(lead => (
              <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-gray-400">{lead.phone} · {lead.source}</p>
                </div>
                <Badge variant={LEAD_STATUS_LABELS[lead.status]?.color || 'default'} dot>
                  {LEAD_STATUS_LABELS[lead.status]?.label || lead.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Vue Responsable Relation Client ─────────────────────────────────────────
function CRMManagerDashboard() {
  const { leads, appointments, tasks, participants, coachingSessions } = useAppStore()
  const { user } = useAuthStore()
  const today = new Date().toISOString().slice(0, 10)
  const todayAppts = appointments.filter(a => a.date === today)
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const toFollowUp = leads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate <= today)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total Leads"        value={leads.length}               icon={Users}        color="bg-blue-500"   trend={12} />
        <StatCard label="Participants actifs" value={participants.length}         icon={UserCheck}    color="bg-emerald-500" trend={8} />
        <StatCard label="Séances ce mois"    value={coachingSessions.filter(s => s.date?.startsWith(today.slice(0,7))).length} icon={BookOpen} color="bg-purple-500" />
        <StatCard label="RDV aujourd'hui"    value={todayAppts.length}           icon={Calendar}     color="bg-cyan-500" />
        <StatCard label="Tâches en attente"  value={pendingTasks.length}         icon={CheckCircle2} color="bg-orange-500" />
        <StatCard label="Relances du jour"   value={toFollowUp.length}           icon={Clock}        color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Leads vs Conversions</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CONVERSION_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="leads" fill="#e0e7ff" radius={[4, 4, 0, 0]} name="Leads" />
              <Bar dataKey="converted" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Convertis" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Tâches en attente</CardTitle><Badge variant="warning">{pendingTasks.length}</Badge></CardHeader>
          <div className="space-y-2">
            {pendingTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-amber-500' : task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.assignedToName}</p>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && <p className="text-xs text-gray-400 py-2">Aucune tâche en attente 🎉</p>}
          </div>
        </Card>

        {toFollowUp.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Relances du jour</CardTitle><Badge variant="warning">{toFollowUp.length}</Badge></CardHeader>
            <div className="space-y-2">
              {toFollowUp.slice(0, 6).map(lead => (
                <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{lead.firstName} {lead.lastName}</p>
                    <p className="text-xs text-gray-400">{lead.phone} · {lead.source}</p>
                  </div>
                  <Badge variant="warning" dot>Relance</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Vue Coach ──────────────────────────────────────────────────────────────
function CoachDashboard() {
  const { participants, coachingSessions, appointments, tasks, tests } = useAppStore()
  const { user } = useAuthStore()
  const today = new Date().toISOString().slice(0, 10)

  const mySessions = coachingSessions.filter(s => s.coachId === user?.id || !s.coachId)
  const todaySessions = mySessions.filter(s => s.date === today)
  const upcomingSessions = mySessions.filter(s => s.date >= today && s.status === 'scheduled').slice(0, 5)
  const todayAppts = appointments.filter(a => a.date === today)
  const myTasks = tasks.filter(t => (t.assignedTo === user?.id || !t.assignedTo) && t.status !== 'done')
  const recentTests = tests.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Mes participants"    value={participants.length}     icon={UserCheck}    color="bg-emerald-500" />
        <StatCard label="Séances aujourd'hui" value={todaySessions.length}    icon={BookOpen}     color="bg-blue-500" />
        <StatCard label="Séances à venir"     value={upcomingSessions.length} icon={Calendar}     color="bg-purple-500" />
        <StatCard label="Tests réalisés"      value={tests.length}            icon={ClipboardList} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Prochaines séances</CardTitle></CardHeader>
          {upcomingSessions.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Aucune séance planifiée</p>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.map(s => {
                const p = participants.find(x => x.id === s.participantId)
                return (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {p && <Avatar name={`${p.firstName} ${p.lastName}`} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p ? `${p.firstName} ${p.lastName}` : '—'}</p>
                      <p className="text-xs text-gray-400">{formatDate(s.date)} {s.time ? `· ${s.time}` : ''}</p>
                    </div>
                    <Badge variant="info">Séance {s.sessionNumber}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle className="mb-3">Agenda du jour</CardTitle>
            {todayAppts.length === 0 && todaySessions.length === 0 ? (
              <p className="text-xs text-gray-400">Aucun événement aujourd'hui</p>
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

          <Card>
            <CardTitle className="mb-3">Mes tâches</CardTitle>
            {myTasks.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune tâche en cours 🎉</p>
            ) : (
              <div className="space-y-2">
                {myTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{task.title}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {recentTests.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Derniers tests réalisés</CardTitle></CardHeader>
          <div className="space-y-2">
            {recentTests.map(t => {
              const p = participants.find(x => x.id === t.participantId)
              return (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {p && <Avatar name={`${p.firstName} ${p.lastName}`} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p ? `${p.firstName} ${p.lastName}` : '—'}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                  </div>
                  <Badge variant="info">{t.type}</Badge>
                  {t.result && <span className="text-xs text-gray-500 truncate max-w-32">{t.result}</span>}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Entry point ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore()
  const role = user?.role

  const greeting = `Bonjour, ${user?.name?.split(' ')[0] ?? ''} 👋`
  const subtitle = formatDate(new Date(), "EEEE d MMMM yyyy")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{greeting}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      {(role === 'super_admin' || role === 'admin') && <AdminDashboard />}
      {role === 'crm_manager' && <CRMManagerDashboard />}
      {role === 'sales_agent' && <SalesDashboard />}
      {role === 'coach' && <CoachDashboard />}
    </div>
  )
}
