import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Download, TrendingUp, Users, CreditCard, Award } from 'lucide-react'
import { MONTHLY_REVENUE, LEAD_SOURCES, CONVERSION_DATA, DASHBOARD_STATS } from '../../lib/mockData'
import { formatCurrency } from '../../lib/utils'
import { useAppStore } from '../../store/appStore'

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

export default function Reports() {
  const { leads, participants, payments } = useAppStore()
  const stats = DASHBOARD_STATS

  const leadsByStatus = leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc }, {} as Record<string, number>)
  const paymentsByStatus = payments.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Rapports & Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>Exporter PDF</Button>
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>Exporter Excel</Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue total', value: formatCurrency(stats.revenueThisYear), icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Total participants', value: participants.length, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total leads', value: leads.length, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Certificats', value: stats.certificatesIssued, icon: Award, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Revenue mensuel (Coaching vs Formation)</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip formatter={(v: any, name: any) => [formatCurrency(Number(v)), name === 'coaching' ? 'Coaching' : 'Formation']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="coaching" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Coaching" />
              <Bar dataKey="formation" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Formation" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader><CardTitle>Taux de conversion Leads</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={CONVERSION_DATA} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e0e7ff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#e0e7ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="leads" stroke="#94a3b8" strokeWidth={1.5} fill="url(#gradL)" name="Leads" />
              <Area type="monotone" dataKey="converted" stroke="#3b82f6" strokeWidth={2} fill="url(#gradC)" name="Convertis" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sources de leads</CardTitle></CardHeader>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={LEAD_SOURCES} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                  {LEAD_SOURCES.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend formatter={(v) => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statuts des paiements</CardTitle></CardHeader>
          <div className="space-y-3 py-2">
            {[
              { label: 'Payé', count: paymentsByStatus['paid'] || 0, color: '#10b981' },
              { label: 'Partiel', count: paymentsByStatus['partial'] || 0, color: '#f59e0b' },
              { label: 'En attente', count: paymentsByStatus['pending'] || 0, color: '#94a3b8' },
              { label: 'En retard', count: paymentsByStatus['overdue'] || 0, color: '#ef4444' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{label}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(count / (payments.length || 1)) * 100}%`, background: color }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
