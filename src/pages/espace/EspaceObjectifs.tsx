import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import type { LearnerSession } from '../../lib/learnerSession'
import { Target, Plus, CheckCircle, Circle, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Objective { id: string; title: string; description: string | null; target_date: string | null; status: 'active' | 'completed' | 'abandoned'; created_at: string }

export default function EspaceObjectifs() {
  const session = useOutletContext<LearnerSession>()
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', target_date: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await learnerApi.getObjectives() as any
    setObjectives(data || [])
    setLoading(false)
  }

  async function addObjective() {
    if (!form.title.trim()) { toast.error('Titre requis'); return }
    setSaving(true)
    try {
      await learnerApi.addObjective({
        title: form.title.trim(),
        description: form.description.trim() || null,
        targetDate: form.target_date || null,
      })
      toast.success('Objectif ajouté ✅')
      setForm({ title: '', description: '', target_date: '' })
      setShowAdd(false)
      load()
    } catch (e: any) {
      toast.error('Erreur : ' + e.message)
    }
    setSaving(false)
  }

  async function toggleStatus(obj: Objective) {
    const next = obj.status === 'active' ? 'completed' : 'active'
    await learnerApi.updateObjective(obj.id, next)
    setObjectives(prev => prev.map(o => o.id === obj.id ? { ...o, status: next } : o))
    if (next === 'completed') toast.success('Objectif accompli ! 🎉')
  }

  async function deleteObjective(id: string) {
    if (!confirm('Supprimer cet objectif ?')) return
    await learnerApi.deleteObjective(id)
    setObjectives(prev => prev.filter(o => o.id !== id))
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  const active = objectives.filter(o => o.status === 'active')
  const completed = objectives.filter(o => o.status === 'completed')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes objectifs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{completed.length}/{objectives.length} accompli{completed.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />Nouvel objectif
        </button>
      </div>

      {objectives.length === 0 && !showAdd && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun objectif défini</p>
          <p className="text-sm text-gray-400 mt-1">Définissez vos objectifs personnels pour votre coaching.</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
            Ajouter un objectif
          </button>
        </div>
      )}

      {showAdd && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900">Nouvel objectif</p>
            <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Mon objectif *"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (facultatif)" rows={2}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Date cible :</label>
            <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Annuler</button>
            <button onClick={addObjective} disabled={saving} className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">En cours</p>
          {active.map(o => (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
              <button onClick={() => toggleStatus(o)} className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-green-500 transition-colors">
                <Circle className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{o.title}</p>
                {o.description && <p className="text-sm text-gray-500 mt-0.5">{o.description}</p>}
                {o.target_date && <p className="text-xs text-blue-600 mt-1">🗓 {new Date(o.target_date).toLocaleDateString('fr-FR')}</p>}
              </div>
              <button onClick={() => deleteObjective(o.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Accomplis 🎉</p>
          {completed.map(o => (
            <div key={o.id} className="bg-green-50 rounded-2xl border border-green-100 p-4 flex items-start gap-3 opacity-80">
              <button onClick={() => toggleStatus(o)} className="mt-0.5 flex-shrink-0 text-green-500">
                <CheckCircle className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-700 line-through">{o.title}</p>
                {o.description && <p className="text-sm text-gray-400 mt-0.5">{o.description}</p>}
              </div>
              <button onClick={() => deleteObjective(o.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
