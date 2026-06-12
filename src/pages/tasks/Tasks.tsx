import { useState } from 'react'
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { useAppStore } from '../../store/appStore'
import { formatDate } from '../../lib/utils'
import type { TaskStatus, TaskPriority } from '../../types'

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: any }> = {
  urgent: { label: 'Urgent', color: 'danger' },
  high: { label: 'Haute', color: 'warning' },
  medium: { label: 'Normale', color: 'info' },
  low: { label: 'Basse', color: 'default' },
}

const STATUS_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'À faire', color: 'bg-gray-100 dark:bg-gray-800/60' },
  { id: 'in_progress', label: 'En cours', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'done', label: 'Terminé', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
]

export default function Tasks() {
  const { tasks, updateTask } = useAppStore()
  const [view, setView] = useState<'kanban' | 'list'>('list')

  const byStatus = (status: TaskStatus) => tasks.filter(t => t.status === status)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tâches</h2>
          <p className="text-sm text-gray-500">{tasks.filter(t => t.status !== 'done').length} tâches en attente</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Nouvelle tâche</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {STATUS_COLUMNS.map(col => (
          <Card key={col.id}>
            <p className="text-xs text-gray-500">{col.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{byStatus(col.id).length}</p>
          </Card>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {tasks.map(task => (
          <Card key={task.id} hover>
            <div className="flex items-start gap-3">
              <button
                onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                className={`mt-0.5 flex-shrink-0 ${task.status === 'done' ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-400'}`}
              >
                {task.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {task.title}
                  </p>
                  <Badge variant={PRIORITY_CONFIG[task.priority].color} size="sm">{PRIORITY_CONFIG[task.priority].label}</Badge>
                  {task.status === 'in_progress' && <Badge variant="info" size="sm">En cours</Badge>}
                </div>
                {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={task.assignedToName} size="xs" />
                    <span className="text-xs text-gray-500">{task.assignedToName}</span>
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className={`${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-gray-400'}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                  {(task.tags || []).map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {task.status !== 'done' && task.status !== 'in_progress' && (
                  <Button variant="outline" size="sm" onClick={() => updateTask(task.id, { status: 'in_progress' })}>
                    Démarrer
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
