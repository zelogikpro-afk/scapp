import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Clock, ThumbsUp, Sparkles, ArrowRight } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface DigitalTask {
  id: string
  title: string
  platform: string
  deadline: string | null
  status: string
  priority: string
  created_at: string
}

const PLATFORM_ICON: Record<string, string> = {
  instagram: '📸',
  linkedin: '💼',
  story: '📱',
  facebook: '📘',
  autre: '📌',
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  pending: 'En attente',
  approved: 'Approuvé',
  published: 'Publié',
}

export default function DigitalAccueil() {
  const { user: session } = useAuthStore()
  const [tasks, setTasks] = useState<DigitalTask[]>([])
  const [postStats, setPostStats] = useState({ pending: 0, approvedThisMonth: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([
      supabaseAdmin.from('digital_tasks').select('*').order('created_at', { ascending: false }).limit(3),
      supabaseAdmin.from('digital_posts').select('status, created_at'),
    ])
    setTasks(tRes.data || [])

    const posts = pRes.data || []
    const now = new Date()
    const thisMonth = posts.filter(p => {
      const d = new Date(p.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === 'approved'
    })
    setPostStats({
      pending: posts.filter(p => p.status === 'pending').length,
      approvedThisMonth: thisMonth.length,
    })
    setLoading(false)
  }

  const todoCount = tasks.filter(t => t.status === 'todo').length

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white">
        <p className="text-purple-200 text-sm mb-1">Bonjour 👋</p>
        <h1 className="text-2xl font-bold">{session?.name}</h1>
        <p className="text-purple-200 text-sm mt-1">Bienvenue dans votre Digital Studio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-purple-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-gray-500">Tâches à faire</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '…' : todoCount}</p>
        </div>

        <div className="bg-white rounded-2xl border border-purple-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-500">Posts en attente</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '…' : postStats.pending}</p>
        </div>

        <div className="bg-white rounded-2xl border border-purple-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Approuvés ce mois</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '…' : postStats.approvedThisMonth}</p>
        </div>
      </div>

      {/* Quick action */}
      <Link to="/digital/creer" className="flex items-center gap-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-purple-200 rounded-2xl p-5 hover:from-violet-100 hover:to-purple-100 transition-colors group">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">Créer un post avec l'IA</p>
          <p className="text-sm text-gray-500">Générez des captions Instagram, LinkedIn et plus encore</p>
        </div>
        <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
      </Link>

      {/* Recent tasks */}
      <div className="bg-white rounded-2xl border border-purple-100">
        <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Tâches récentes</h2>
          <Link to="/digital/taches" className="text-sm text-purple-600 hover:underline">Voir tout</Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune tâche pour l'instant</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tasks.map(task => (
              <div key={task.id} className="px-5 py-3.5 flex items-center gap-3">
                <span className="text-xl">{PLATFORM_ICON[task.platform] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  {task.deadline && (
                    <p className="text-xs text-gray-400">Deadline : {new Date(task.deadline).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  task.status === 'todo' ? 'bg-gray-100 text-gray-600' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  task.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  task.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {STATUS_LABEL[task.status] || task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
