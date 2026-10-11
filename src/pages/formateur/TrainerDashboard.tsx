import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { trainerApiCall, type TrainerSession } from '../../lib/trainerApi'
import { Users, FlaskConical, FileText, Megaphone, CheckCircle, XCircle, PlayCircle, TrendingUp } from 'lucide-react'

const TEST_LABELS: Record<string, string> = {
  mapping: 'Mapping', ie: 'IE', qs: 'QS', compass: 'Compass', valeurs: 'Valeurs',
  quiz_n1: 'Quiz N1', quiz_coach: 'Quiz Coach',
}

export default function TrainerDashboard() {
  const session = useOutletContext<TrainerSession>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trainerApiCall({ action: 'get_dashboard' }).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    </div>
  )

  const { stats, recentTests, recentAnnonces } = data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bonjour, {session.name.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Voici un aperçu de votre groupe</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => navigate('/formateur/apprenants')}
          className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-emerald-200 hover:shadow-sm transition-all">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.total ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Apprenants</p>
        </button>

        <button onClick={() => navigate('/formateur/apprenants')}
          className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-emerald-200 hover:shadow-sm transition-all">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.actifs ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Actifs</p>
        </button>

        <button onClick={() => navigate('/formateur/tests')}
          className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-emerald-200 hover:shadow-sm transition-all">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{recentTests?.length ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Tests récents</p>
        </button>

        <button onClick={() => navigate('/formateur/ressources')}
          className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-emerald-200 hover:shadow-sm transition-all">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.docs ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ressources</p>
        </button>
      </div>

      {/* Activité apprenants */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Derniers tests */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <p className="text-sm font-semibold text-gray-800">Derniers tests complétés</p>
            </div>
            <button onClick={() => navigate('/formateur/tests')} className="text-xs text-emerald-600 hover:underline">Voir tout</button>
          </div>
          {recentTests?.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentTests.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{TEST_LABELS[t.test_type] || t.test_type}</p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Aucun test complété pour l'instant</div>
          )}
        </div>

        {/* Dernières annonces */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-800">Mes dernières annonces</p>
            </div>
            <button onClick={() => navigate('/formateur/annonces')} className="text-xs text-emerald-600 hover:underline">Gérer</button>
          </div>
          {recentAnnonces?.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentAnnonces.map((a: any) => (
                <div key={a.id} className="px-4 py-3">
                  <p className="text-xs text-gray-700 line-clamp-2">{a.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${a.target === 'individual' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {a.target === 'individual' ? 'Individuel' : 'Groupe'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400 mb-2">Aucune annonce envoyée</p>
              <button onClick={() => navigate('/formateur/annonces')}
                className="text-xs text-emerald-600 hover:underline font-medium">Envoyer une annonce →</button>
            </div>
          )}
        </div>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Apprenants', icon: Users, path: '/formateur/apprenants', color: 'emerald' },
          { label: 'Tests', icon: FlaskConical, path: '/formateur/tests', color: 'purple' },
          { label: 'Enregistrements', icon: PlayCircle, path: '/formateur/enregistrements', color: 'blue' },
          { label: 'Annonces', icon: Megaphone, path: '/formateur/annonces', color: 'amber' },
        ].map(({ label, icon: Icon, path, color }) => (
          <button key={path} onClick={() => navigate(path)}
            className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 hover:border-emerald-200 hover:shadow-sm transition-all text-left">
            <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
