import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabaseAdmin } from '../../lib/supabase'
import { type LearnerSession } from '../../lib/learnerSession'
import { Plus, Pencil, Trash2, Save, X, BookOpen, Target, Check } from 'lucide-react'

interface Note { id: string; title: string; content: string; created_at: string; updated_at: string }
interface Commitment { id: string; commitment: string; seance_ref: string; created_at: string }

type SubTab = 'notes' | 'engagements'

export default function EspaceNotes() {
  const session = useOutletContext<LearnerSession>()
  const [subTab, setSubTab] = useState<SubTab>('notes')

  const [notes, setNotes] = useState<Note[]>([])
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)

  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null)
  const [savingNote, setSavingNote] = useState(false)

  const [newCommitment, setNewCommitment] = useState('')
  const [newSeance, setNewSeance] = useState('')
  const [savingC, setSavingC] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [nRes, cRes] = await Promise.all([
      supabaseAdmin.from('learner_notes').select('*').eq('learner_id', session.id).order('updated_at', { ascending: false }),
      supabaseAdmin.from('learner_commitments').select('*').eq('learner_id', session.id).order('created_at', { ascending: false }),
    ])
    setNotes(nRes.data || [])
    setCommitments(cRes.data || [])
    setLoading(false)
  }

  async function saveNote() {
    if (!editingNote?.content?.trim()) return
    setSavingNote(true)
    const now = new Date().toISOString()
    if (editingNote.id) {
      await supabaseAdmin.from('learner_notes').update({ title: editingNote.title || '', content: editingNote.content, updated_at: now }).eq('id', editingNote.id)
    } else {
      await supabaseAdmin.from('learner_notes').insert({ learner_id: session.id, title: editingNote.title || '', content: editingNote.content, created_at: now, updated_at: now })
    }
    setSavingNote(false); setEditingNote(null); await load()
  }

  async function deleteNote(id: string) {
    if (!confirm('Supprimer cette note ?')) return
    await supabaseAdmin.from('learner_notes').delete().eq('id', id); await load()
  }

  async function addCommitment() {
    if (!newCommitment.trim()) return
    setSavingC(true)
    await supabaseAdmin.from('learner_commitments').insert({ learner_id: session.id, commitment: newCommitment.trim(), seance_ref: newSeance.trim() })
    setSavingC(false); setNewCommitment(''); setNewSeance(''); await load()
  }

  async function deleteCommitment(id: string) {
    await supabaseAdmin.from('learner_commitments').delete().eq('id', id)
    setCommitments(prev => prev.filter(c => c.id !== id))
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Notes & Engagements</h1>

      {/* Sub tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setSubTab('notes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'notes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <BookOpen className="w-4 h-4" />Mes notes
        </button>
        <button onClick={() => setSubTab('engagements')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'engagements' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Target className="w-4 h-4" />Engagements
        </button>
      </div>

      {/* ── NOTES ── */}
      {subTab === 'notes' && (
        <div className="space-y-4">
          {/* Editor */}
          {editingNote ? (
            <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-sm">
              <div className="px-5 pt-4 pb-2">
                <input value={editingNote.title || ''} onChange={e => setEditingNote(f => ({ ...f!, title: e.target.value }))}
                  placeholder="Titre de la note (optionnel)" className="w-full text-base font-semibold text-gray-900 border-0 outline-none placeholder:text-gray-300 mb-2" />
                <textarea value={editingNote.content || ''} onChange={e => setEditingNote(f => ({ ...f!, content: e.target.value }))}
                  placeholder="Rédigez votre note ici…" rows={6} className="w-full text-sm text-gray-700 border-0 outline-none resize-none placeholder:text-gray-300 leading-relaxed" autoFocus />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                <button onClick={() => setEditingNote(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <X className="w-4 h-4" />Annuler
                </button>
                <button onClick={saveNote} disabled={savingNote || !editingNote.content?.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60">
                  <Save className="w-4 h-4" />{savingNote ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditingNote({ title: '', content: '' })}
              className="w-full flex items-center gap-3 px-5 py-4 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-sm">
              <Plus className="w-5 h-5" />Nouvelle note
            </button>
          )}

          {notes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Pas encore de notes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {editingNote?.id === note.id ? null : (
                    <div className="p-5">
                      {note.title && <h3 className="font-semibold text-gray-900 text-sm mb-2">{note.title}</h3>}
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">{note.content}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-gray-400">{new Date(note.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingNote({ ...note })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteNote(note.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ENGAGEMENTS ── */}
      {subTab === 'engagements' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <p className="text-sm font-medium text-gray-700">Nouvel engagement</p>
            <input value={newSeance} onChange={e => setNewSeance(e.target.value)} placeholder="Séance de référence (ex: Séance 3)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea value={newCommitment} onChange={e => setNewCommitment(e.target.value)} placeholder="Décrivez votre engagement pour la prochaine séance…" rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <button onClick={addCommitment} disabled={savingC || !newCommitment.trim()} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
              <Plus className="w-4 h-4" />{savingC ? 'Ajout…' : 'Prendre cet engagement'}
            </button>
          </div>

          {commitments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun engagement pris pour le moment</p>
              <p className="text-xs mt-1 text-gray-300">Les engagements vous aident à mettre en pratique ce que vous apprenez.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commitments.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {c.seance_ref && <p className="text-xs text-blue-600 font-medium mb-1">{c.seance_ref}</p>}
                    <p className="text-sm text-gray-700 leading-relaxed">{c.commitment}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                  </div>
                  <button onClick={() => deleteCommitment(c.id)} className="p-1.5 text-gray-300 hover:text-red-500 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
