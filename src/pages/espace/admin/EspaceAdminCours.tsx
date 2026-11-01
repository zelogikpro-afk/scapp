import { useEffect, useRef, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'
import { ChevronDown, ChevronRight, Plus, Trash2, Upload, X, PlayCircle, FileText, BookOpen, GripVertical } from 'lucide-react'

interface Module { id: string; title: string; description: string; formation_level: string; order_index: number; is_published: boolean }
interface Lesson { id: string; module_id: string; title: string; type: string; content_url: string; content_text: string; duration_minutes: number; order_index: number; is_published: boolean }

const LEVELS = [
  { value: 'N1', label: 'Niveau 1' },
  { value: 'N2', label: 'Niveau 2' },
  { value: 'N3', label: 'Niveau 3' },
]

const LESSON_TYPES = [
  { value: 'video', label: 'Vidéo', Icon: PlayCircle, color: '#3b82f6' },
  { value: 'pdf',   label: 'PDF',   Icon: FileText,   color: '#ef4444' },
  { value: 'article', label: 'Article', Icon: BookOpen, color: '#10b981' },
]

const BUCKET = 'course-videos'

export default function EspaceAdminCours() {
  const [modules, setModules]   = useState<Module[]>([])
  const [lessons, setLessons]   = useState<Lesson[]>([])
  const [loading, setLoading]   = useState(true)
  const [levelFilter, setLevelFilter] = useState('N1')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toast, setToast]       = useState('')

  // New module form
  const [showModForm, setShowModForm] = useState(false)
  const [modForm, setModForm] = useState({ title: '', description: '', formation_level: 'N1' })
  const [savingMod, setSavingMod] = useState(false)

  // New lesson form
  const [addingTo, setAddingTo] = useState<string | null>(null) // module_id
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'video', content_url: '', content_text: '', duration_minutes: 0 })
  const [savingLesson, setSavingLesson] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [levelFilter])

  async function load() {
    setLoading(true)
    const [modRes, lsnRes] = await Promise.all([
      supabaseAdmin.from('modules').select('*').eq('formation_level', levelFilter).order('order_index'),
      supabaseAdmin.from('lessons').select('*').order('order_index'),
    ])
    const mods: Module[] = modRes.data || []
    setModules(mods)
    setLessons(lsnRes.data || [])
    if (mods.length) setExpanded(new Set([mods[0].id]))
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const toggle = (id: string) => setExpanded(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })

  /* ── Module CRUD ── */
  async function addModule(e: React.FormEvent) {
    e.preventDefault()
    setSavingMod(true)
    const next = modules.length + 1
    const { error } = await supabaseAdmin.from('modules').insert({
      ...modForm, order_index: next, is_published: true,
    })
    if (!error) { setModForm({ title: '', description: '', formation_level: levelFilter }); setShowModForm(false); showToast('Module ajouté ✓'); load() }
    else showToast('Erreur : ' + error.message)
    setSavingMod(false)
  }

  async function deleteModule(id: string) {
    if (!confirm('Supprimer ce module et toutes ses leçons ?')) return
    await supabaseAdmin.from('lessons').delete().eq('module_id', id)
    await supabaseAdmin.from('modules').delete().eq('id', id)
    showToast('Module supprimé')
    load()
  }

  /* ── Lesson CRUD ── */
  async function uploadVideo(file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    setUploadProgress(0)

    // Try to create bucket if not exists (ignore error if already exists)
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true }).catch(() => null)

    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600', upsert: false,
    })
    setUploadProgress(null)
    if (error) throw error

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadProgress(0)
      const url = await uploadVideo(file)
      setLessonForm(f => ({ ...f, content_url: url }))
      showToast('Vidéo uploadée ✓')
    } catch (err: any) {
      showToast('Erreur upload : ' + err.message)
    }
  }

  async function addLesson(e: React.FormEvent) {
    e.preventDefault()
    if (!addingTo) return
    setSavingLesson(true)
    const modLessons = lessons.filter(l => l.module_id === addingTo)
    const { error } = await supabaseAdmin.from('lessons').insert({
      module_id: addingTo,
      title: lessonForm.title,
      type: lessonForm.type,
      content_url: lessonForm.content_url || null,
      content_text: lessonForm.content_text || null,
      duration_minutes: lessonForm.duration_minutes || 0,
      order_index: modLessons.length + 1,
      is_published: true,
    })
    if (!error) {
      setLessonForm({ title: '', type: 'video', content_url: '', content_text: '', duration_minutes: 0 })
      setAddingTo(null)
      showToast('Leçon ajoutée ✓')
      load()
    } else showToast('Erreur : ' + error.message)
    setSavingLesson(false)
  }

  async function deleteLesson(id: string) {
    if (!confirm('Supprimer cette leçon ?')) return
    await supabaseAdmin.from('lessons').delete().eq('id', id)
    setLessons(p => p.filter(l => l.id !== id))
    showToast('Leçon supprimée')
  }

  async function togglePublished(mod: Module) {
    await supabaseAdmin.from('modules').update({ is_published: !mod.is_published }).eq('id', mod.id)
    load()
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: 16, paddingBottom: 80 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1E1B4B', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 200, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0D1F3C,#1A3360)', borderRadius: 20, padding: '20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Cours & Leçons</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{modules.length} module{modules.length > 1 ? 's' : ''} · {lessons.filter(l => modules.some(m => m.id === l.module_id)).length} leçons</div>
        </div>
        <button onClick={() => setShowModForm(v => !v)} style={{ background: '#1ABCAB', border: 'none', borderRadius: 12, padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus style={{ width: 16, height: 16 }} /> Module
        </button>
      </div>

      {/* Level tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {LEVELS.map(l => (
          <button key={l.value} onClick={() => setLevelFilter(l.value)} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: levelFilter === l.value ? '#0D1F3C' : '#f3f4f6', color: levelFilter === l.value ? '#fff' : '#6b7280', transition: 'all 0.15s' }}>
            {l.label}
          </button>
        ))}
      </div>

      {/* New module form */}
      {showModForm && (
        <form onSubmit={addModule} style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, border: '1.5px solid #e0e7ff', boxShadow: '0 2px 12px rgba(13,31,60,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0D1F3C', marginBottom: 14 }}>Nouveau module</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select value={modForm.formation_level} onChange={e => setModForm(f => ({ ...f, formation_level: e.target.value }))} style={inputStyle}>
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <input value={modForm.title} onChange={e => setModForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre du module" required style={inputStyle} />
            <input value={modForm.description} onChange={e => setModForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optionnel)" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowModForm(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Annuler</button>
              <button type="submit" disabled={savingMod} style={{ flex: 2, padding: 12, borderRadius: 12, background: '#0D1F3C', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: savingMod ? 0.6 : 1 }}>
                {savingMod ? 'Enregistrement…' : 'Créer le module'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Modules list */}
      {modules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
          <BookOpen style={{ width: 40, height: 40, opacity: 0.3, margin: '0 auto 12px' }} />
          <p>Aucun module pour ce niveau</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Clique sur "+ Module" pour commencer</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modules.map(mod => {
            const modLessons = lessons.filter(l => l.module_id === mod.id).sort((a, b) => a.order_index - b.order_index)
            const isOpen = expanded.has(mod.id)
            return (
              <div key={mod.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {/* Module header */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10 }}>
                  <GripVertical style={{ width: 16, height: 16, color: '#d1d5db', flexShrink: 0 }} />
                  <button onClick={() => toggle(mod.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{mod.order_index}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' }}>{mod.title}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{modLessons.length} leçon{modLessons.length > 1 ? 's' : ''}</p>
                    </div>
                    {isOpen ? <ChevronDown style={{ width: 16, height: 16, color: '#9ca3af' }} /> : <ChevronRight style={{ width: 16, height: 16, color: '#9ca3af' }} />}
                  </button>
                  {/* Published toggle */}
                  <button onClick={() => togglePublished(mod)} title={mod.is_published ? 'Publié' : 'Brouillon'} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: mod.is_published ? '#dcfce7' : '#f3f4f6', color: mod.is_published ? '#16a34a' : '#9ca3af', flexShrink: 0 }}>
                    {mod.is_published ? 'Publié' : 'Brouillon'}
                  </button>
                  <button onClick={() => deleteModule(mod.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}>
                    <Trash2 style={{ width: 15, height: 15 }} />
                  </button>
                </div>

                {/* Lessons */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f3f4f6' }}>
                    {modLessons.map((lesson, idx) => {
                      const t = LESSON_TYPES.find(t => t.value === lesson.type) || LESSON_TYPES[0]
                      return (
                        <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 10px 44px', borderBottom: idx < modLessons.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                          <t.Icon style={{ width: 15, height: 15, color: t.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#374151' }}>{lesson.title}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                              {t.label}{lesson.duration_minutes > 0 ? ` · ${lesson.duration_minutes} min` : ''}
                            </p>
                          </div>
                          <button onClick={() => deleteLesson(lesson.id)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', flexShrink: 0 }}>
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      )
                    })}

                    {/* Add lesson button */}
                    {addingTo === mod.id ? (
                      <AddLessonForm
                        form={lessonForm}
                        setForm={setLessonForm}
                        onSubmit={addLesson}
                        onCancel={() => { setAddingTo(null); setLessonForm({ title: '', type: 'video', content_url: '', content_text: '', duration_minutes: 0 }) }}
                        saving={savingLesson}
                        uploadProgress={uploadProgress}
                        fileRef={fileRef}
                        onFileChange={handleFileChange}
                      />
                    ) : (
                      <button
                        onClick={() => { setAddingTo(mod.id); setExpanded(p => new Set([...p, mod.id])) }}
                        style={{ width: '100%', padding: '12px 16px', background: '#f9fafb', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 13, fontWeight: 600 }}
                      >
                        <Plus style={{ width: 15, height: 15 }} /> Ajouter une leçon
                      </button>
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

/* ── Add lesson inline form ─────────────────────────────────────── */
function AddLessonForm({ form, setForm, onSubmit, onCancel, saving, uploadProgress, fileRef, onFileChange }: {
  form: any; setForm: any; onSubmit: any; onCancel: any; saving: boolean
  uploadProgress: number | null; fileRef: React.RefObject<HTMLInputElement>; onFileChange: any
}) {
  const selectedType = LESSON_TYPES.find(t => t.value === form.type) || LESSON_TYPES[0]

  return (
    <form onSubmit={onSubmit} style={{ padding: '16px', borderTop: '1px solid #f3f4f6', background: '#fafbff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#0D1F3C' }}>Nouvelle leçon</p>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {LESSON_TYPES.map(t => (
          <button key={t.value} type="button" onClick={() => setForm((f: any) => ({ ...f, type: t.value, content_url: '', content_text: '' }))}
            style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: form.type === t.value ? `2px solid ${t.color}` : '2px solid #e5e7eb', background: form.type === t.value ? `${t.color}12` : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <t.Icon style={{ width: 16, height: 16, color: t.color }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: form.type === t.value ? t.color : '#9ca3af' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="Titre de la leçon" required style={inputStyle} />

        {form.type === 'video' && (
          <div>
            {/* Upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed #d1d5db', borderRadius: 12, padding: '16px', textAlign: 'center', cursor: 'pointer', background: '#fff', marginBottom: 8 }}
            >
              {uploadProgress !== null ? (
                <div>
                  <div style={{ width: '100%', height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#1ABCAB', transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Upload en cours…</p>
                </div>
              ) : form.content_url && form.content_url.includes('supabase') ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <PlayCircle style={{ width: 20, height: 20, color: '#1ABCAB' }} />
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Vidéo uploadée ✓</span>
                </div>
              ) : (
                <div>
                  <Upload style={{ width: 24, height: 24, color: '#9ca3af', margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontWeight: 600 }}>Cliquer pour uploader</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>MP4, MOV, WebM · max 500 MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="video/*" onChange={onFileChange} style={{ display: 'none' }} />

            {/* OR YouTube URL */}
            <input
              value={form.content_url.includes('supabase') ? '' : form.content_url}
              onChange={e => setForm((f: any) => ({ ...f, content_url: e.target.value }))}
              placeholder="… ou coller une URL YouTube / externe"
              style={{ ...inputStyle, fontSize: 12 }}
            />
          </div>
        )}

        {form.type === 'pdf' && (
          <input value={form.content_url} onChange={e => setForm((f: any) => ({ ...f, content_url: e.target.value }))} placeholder="URL du PDF (Supabase Storage ou externe)" style={inputStyle} />
        )}

        {form.type === 'article' && (
          <textarea value={form.content_text} onChange={e => setForm((f: any) => ({ ...f, content_text: e.target.value }))} placeholder="Contenu de l'article…" rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
        )}

        <input type="number" value={form.duration_minutes || ''} onChange={e => setForm((f: any) => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} placeholder="Durée (minutes)" style={inputStyle} />

        <button type="submit" disabled={saving} style={{ padding: '12px', borderRadius: 12, background: '#0D1F3C', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {saving ? 'Enregistrement…' : <><Plus style={{ width: 16, height: 16 }} /> Ajouter la leçon</>}
        </button>
      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb',
  fontSize: 13, color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fff',
}
