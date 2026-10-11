import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'

interface DigitalTask {
  id: string
  title: string
  description: string | null
  platform: string | null
  deadline: string | null
  status: string
  priority: string
  notes: string | null
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

const STATUS_NEXT: Record<string, string> = {
  todo: 'in_progress',
  in_progress: 'pending',
  pending: 'published',
}

const STATUS_NEXT_LABEL: Record<string, string> = {
  todo: '▶ Démarrer',
  in_progress: '⏳ Soumettre',
  pending: '✅ Publier',
}

const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-500',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-red-100 text-red-600',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Faible',
  normal: 'Normal',
  high: 'Urgent',
}

type FilterTab = 'all' | 'todo' | 'in_progress' | 'approved'

export default function DigitalTaches() {
  const [tasks, setTasks] = useState<DigitalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabaseAdmin
      .from('digital_tasks')
      .select('*')
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabaseAdmin.from('digital_tasks').update({ status }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true
    if (filter === 'todo') return t.status === 'todo'
    if (filter === 'in_progress') return t.status === 'in_progress'
    if (filter === 'approved') return t.status === 'approved' || t.status === 'published'
    return true
  })

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'todo', label: 'À faire' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'approved', label: 'Validé' },
  ]

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Mes tâches</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-purple-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === t.key ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-purple-100">
          <p className="text-4xl mb-3">📋</p>
          <p>Aucune tâche dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const isOpen = expanded.has(task.id)
            return (
              <div key={task.id} className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{PLATFORM_ICON[task.platform || ''] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 flex-1 min-w-0">{task.title}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${PRIORITY_COLOR[task.priority] || 'bg-gray-100 text-gray-500'}`}>
                          {PRIORITY_LABEL[task.priority] || task.priority}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                          task.status === 'todo' ? 'bg-gray-100 text-gray-600' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          task.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          task.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {STATUS_LABEL[task.status] || task.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {task.deadline && (
                          <p className="text-xs text-gray-400">
                            📅 {new Date(task.deadline).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        {task.platform && (
                          <p className="text-xs text-gray-400 capitalize">{task.platform}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setExpanded(prev => {
                      const s = new Set(prev)
                      s.has(task.id) ? s.delete(task.id) : s.add(task.id)
                      return s
                    })} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Actions */}
                  {STATUS_NEXT[task.status] && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => updateStatus(task.id, STATUS_NEXT[task.status])}
                        className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
                        {STATUS_NEXT_LABEL[task.status]}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded */}
                {isOpen && (task.description || task.notes) && (
                  <div className="border-t border-purple-50 px-4 py-3 space-y-2 bg-purple-50/30">
                    {task.description && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-700">{task.description}</p>
                      </div>
                    )}
                    {task.notes && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-gray-600 italic">{task.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
