import { useState } from 'react'
import { Plus, CheckCircle2, Circle, Clock, Trash2, Pencil } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import type { TaskPriority } from '../../types'
import toast from 'react-hot-toast'

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: any }> = {
  urgent: { label: 'Urgent', color: 'danger' },
  high: { label: 'Haute', color: 'warning' },
  medium: { label: 'Normale', color: 'info' },
  low: { label: 'Basse', color: 'default' },
}

const EMPTY = {
  title: '', description: '', assignedToName: '',
  priority: 'medium' as TaskPriority, dueDate: '', tags: '',
}

export default function Tasks() {
  const { tasks, updateTask, addTask, deleteTask } = useAppStore()
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette tâche ?')) return
    await deleteTask(id)
    toast.success('Tâche supprimée')
  }

  function openEdit(task: typeof tasks[0]) {
    setEditTask(task.id)
    setForm({ title: task.title, description: task.description || '', assignedToName: task.assignedToName, priority: task.priority, dueDate: task.dueDate || '', tags: (task.tags || []).join(', ') })
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.title) return toast.error('Titre requis')
    setLoading(true)
    try {
      if (editTask) {
        await updateTask(editTask, { title: form.title, description: form.description || undefined, assignedToName: form.assignedToName, priority: form.priority, dueDate: form.dueDate || undefined, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] })
        toast.success('Tâche modifiée !')
      } else {
        await addTask({ title: form.title, description: form.description || undefined, assignedTo: user?.id ?? '', assignedToName: form.assignedToName || user?.name || '', createdBy: user?.id ?? '', priority: form.priority, status: 'todo', dueDate: form.dueDate || undefined, isRecurring: false, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [], relatedTo: undefined, relatedType: undefined })
        toast.success('Tâche créée !')
      }
      setShowModal(false)
      setEditTask(null)
      setForm({ ...EMPTY })
    } catch { toast.error('Erreur') }
    setLoading(false)
  }

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const byStatus = (s: string) => tasks.filter(t => t.status === s)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tâches</h2>
          <p className="text-sm text-gray-500">{tasks.filter(t => t.status !== 'done').length} tâches en attente</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditTask(null); setForm({ ...EMPTY }); setShowModal(true) }}>Nouvelle tâche</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'todo', label: 'À faire' },
          { id: 'in_progress', label: 'En cours' },
          { id: 'done', label: 'Terminé' },
        ].map(col => (
          <Card key={col.id}>
            <p className="text-xs text-gray-500">{col.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{byStatus(col.id).length}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <Card key={task.id} hover>
            <div className="flex items-start gap-3">
              <button
                onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                className={`mt-0.5 flex-shrink-0 ${task.status === 'done' ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-400'}`}>
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
              <div className="flex items-center gap-1 flex-shrink-0">
                {task.status !== 'done' && task.status !== 'in_progress' && (
                  <Button variant="outline" size="sm" onClick={() => updateTask(task.id, { status: 'in_progress' })}>Démarrer</Button>
                )}
                <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(task.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {tasks.length === 0 && (
          <Card className="text-center py-12"><p className="text-gray-400">Aucune tâche</p></Card>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditTask(null) }} title={editTask ? 'Modifier la tâche' : 'Nouvelle tâche'} size="md">
        <div className="space-y-4">
          <Input label="Titre *" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="ex: Appeler Houda pour suivi paiement" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Assignée à" value={form.assignedToName} onChange={e => setF('assignedToName', e.target.value)} placeholder={user?.name} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priorité</label>
              <select value={form.priority} onChange={e => setF('priority', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">Basse</option>
                <option value="medium">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date d'échéance" type="date" value={form.dueDate} onChange={e => setF('dueDate', e.target.value)} />
            <Input label="Tags (séparés par ,)" value={form.tags} onChange={e => setF('tags', e.target.value)} placeholder="ex: suivi, paiement" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditTask(null) }}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Enregistrement…' : editTask ? 'Enregistrer' : 'Créer la tâche'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
