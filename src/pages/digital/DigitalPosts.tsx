import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Loader2 } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface DigitalPost {
  id: string
  platform: string
  subject: string
  chosen_caption: string | null
  chosen_hashtags: string | null
  canva_url: string | null
  status: string
  admin_comment: string | null
  created_at: string
  submitted_at: string | null
}

const PLATFORM_ICON: Record<string, string> = {
  instagram: '📸',
  linkedin: '💼',
  story: '📱',
  facebook: '📘',
  autre: '📌',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:    { label: 'Brouillon',   color: 'bg-gray-100 text-gray-600' },
  pending:  { label: 'En attente',  color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approuvé',    color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Refusé',      color: 'bg-red-100 text-red-700' },
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected'

export default function DigitalPosts() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<DigitalPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabaseAdmin
      .from('digital_posts')
      .select('*')
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  async function submitPost(id: string) {
    setSubmitting(id)
    const { error } = await supabaseAdmin
      .from('digital_posts')
      .update({ status: 'pending', submitted_at: new Date().toISOString() })
      .eq('id', id)
    setSubmitting(null)
    if (error) { toast.error('Erreur'); return }
    toast.success('Post soumis pour validation')
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'pending', submitted_at: new Date().toISOString() } : p))
  }

  const filtered = posts.filter(p => {
    if (filter === 'all') return true
    if (filter === 'pending') return p.status === 'pending'
    if (filter === 'approved') return p.status === 'approved'
    if (filter === 'rejected') return p.status === 'rejected'
    return true
  })

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',      label: 'Tous' },
    { key: 'pending',  label: 'En attente' },
    { key: 'approved', label: 'Approuvés' },
    { key: 'rejected', label: 'Refusés' },
  ]

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Mes posts</h1>

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
          <p className="text-4xl mb-3">📝</p>
          <p>Aucun post dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => {
            const sc = STATUS_CONFIG[post.status] || { label: post.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <div key={post.id} className="bg-white rounded-2xl border border-purple-100 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{PLATFORM_ICON[post.platform] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 capitalize">{post.platform}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{post.subject}</p>
                    <p className="text-xs text-gray-400">
                      {post.submitted_at
                        ? `Soumis le ${new Date(post.submitted_at).toLocaleDateString('fr-FR')}`
                        : `Créé le ${new Date(post.created_at).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                </div>

                {post.chosen_caption && (
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 line-clamp-3">
                    {post.chosen_caption}
                  </p>
                )}

                {post.chosen_hashtags && (
                  <p className="text-xs text-purple-500 font-mono truncate">{post.chosen_hashtags}</p>
                )}

                {/* Rejected: show admin comment */}
                {post.status === 'rejected' && post.admin_comment && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-600 mb-1">Commentaire de l'admin :</p>
                    <p className="text-sm text-red-700">{post.admin_comment}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {post.status === 'approved' && post.canva_url && (
                    <a href={post.canva_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-xl text-xs font-medium transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />Ouvrir Canva →
                    </a>
                  )}

                  {post.status === 'draft' && (
                    <>
                      <button
                        onClick={() => navigate('/digital/creer')}
                        className="px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors">
                        Continuer l'édition
                      </button>
                      <button
                        onClick={() => submitPost(post.id)}
                        disabled={submitting === post.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-60">
                        {submitting === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Soumettre
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
