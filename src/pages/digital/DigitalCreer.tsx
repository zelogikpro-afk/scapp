import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, ChevronLeft, Check, ExternalLink, Loader2 } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface DigitalTask { id: string; title: string }
interface Caption { caption: string; hashtags: string }

const PLATFORMS = [
  {
    key: 'instagram', label: 'Instagram', icon: '📸',
    accounts: [
      { key: 'sofya_coaching', label: 'Sofya Coaching' },
      { key: 'success_compass', label: 'Success Compass' },
    ],
    types: ['Post', 'Carousel', 'Reel', 'Story'],
  },
  {
    key: 'tiktok', label: 'TikTok', icon: '🎵',
    accounts: null,
    types: ['Vidéo'],
  },
  {
    key: 'linkedin', label: 'LinkedIn', icon: '💼',
    accounts: null,
    types: ['Post', 'Article'],
  },
  {
    key: 'site', label: 'Site Internet', icon: '🌐',
    accounts: null,
    types: ['Article', 'Page'],
  },
  {
    key: 'youtube', label: 'YouTube', icon: '▶️',
    accounts: null,
    types: ['Vidéo', 'Short'],
  },
]

function stripMarkdown(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` code fences
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
}

export default function DigitalCreer() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [tasks, setTasks] = useState<DigitalTask[]>([])

  // Step 1 fields
  const [platformKey, setPlatformKey] = useState('instagram')
  const [account, setAccount] = useState('sofya_coaching')
  const [contentType, setContentType] = useState('Post')
  const [taskId, setTaskId] = useState('')
  const [brief, setBrief] = useState('')

  // Step 2 - AI
  const [generating, setGenerating] = useState(false)
  const [captions, setCaptions] = useState<Caption[]>([])
  const [genError, setGenError] = useState('')

  // Step 3 - Choose
  const [chosenIndex, setChosenIndex] = useState<number | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editHashtags, setEditHashtags] = useState('')

  // Step 4 - Canva
  const [canvaUrl, setCanvaUrl] = useState('')

  // Step 5 - Submit
  const [submitting, setSubmitting] = useState(false)

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  useEffect(() => {
    supabaseAdmin.from('digital_tasks').select('id, title').order('created_at', { ascending: false })
      .then(({ data }) => setTasks(data || []))
  }, [])

  const platformObj = PLATFORMS.find(p => p.key === platformKey)!

  function handlePlatformChange(key: string) {
    setPlatformKey(key)
    const p = PLATFORMS.find(x => x.key === key)!
    setContentType(p.types[0])
    setAccount(p.accounts?.[0]?.key || '')
  }

  async function generate() {
    if (!brief.trim()) { toast.error('Collez ou décrivez le brief du post'); return }
    setGenerating(true)
    setGenError('')

    const cleanKey = (apiKey || '').replace(/[^\x20-\x7E]/g, '').trim()
    if (!cleanKey) {
      setGenError('Clé API non configurée.')
      setGenerating(false)
      return
    }

    const accountLabel = platformObj.accounts?.find(a => a.key === account)?.label || ''
    const platformLabel = `${platformObj.label}${accountLabel ? ` (${accountLabel})` : ''} — ${contentType}`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `Tu es un expert en marketing digital pour Success Compass Academy, une académie de coaching au Maroc (fondatrice : Sofya El Qouassi).

Plateforme cible : ${platformLabel}

Brief de la responsable :
${brief}

Génère 3 variantes de caption adaptées à cette plateforme et ce brief.
Pour chaque variante : une caption complète avec emojis + les hashtags (10-15 hashtags pertinents en français/arabe/anglais selon le contexte).

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans bloc de code markdown :
[
  {"caption": "...", "hashtags": "#coaching #..."},
  {"caption": "...", "hashtags": "#coaching #..."},
  {"caption": "...", "hashtags": "#coaching #..."}
]`
          }]
        })
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`API error ${response.status}: ${err}`)
      }

      const data = await response.json()
      const rawText = data.content?.[0]?.text || ''
      const cleanText = stripMarkdown(rawText)

      let parsed: Caption[]
      try {
        parsed = JSON.parse(cleanText)
      } catch {
        throw new Error(`Réponse IA invalide: ${cleanText.slice(0, 120)}`)
      }

      setCaptions(parsed)
      setStep(3)
    } catch (err: any) {
      setGenError(err.message || 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  function chooseCaption(i: number) {
    setChosenIndex(i)
    setEditCaption(captions[i].caption)
    setEditHashtags(captions[i].hashtags)
  }

  async function submit() {
    if (chosenIndex === null) { toast.error('Choisissez une caption'); return }
    setSubmitting(true)
    const platform = platformKey + (account ? `_${account}` : '') + `_${contentType.toLowerCase()}`
    const { error } = await supabaseAdmin.from('digital_posts').insert({
      task_id: taskId || null,
      platform,
      subject: brief.slice(0, 200),
      generated_captions: captions,
      chosen_caption: editCaption,
      chosen_hashtags: editHashtags,
      canva_url: canvaUrl || null,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    })
    setSubmitting(false)
    if (error) { toast.error('Erreur lors de la soumission'); return }
    toast.success('Post soumis pour validation ✅')
    navigate('/digital/posts')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un post</h1>
          <p className="text-sm text-gray-500">Générez du contenu avec l'IA</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`flex items-center gap-2 ${s < 5 ? 'flex-1' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? 'bg-purple-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {step > s ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            {s < 5 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Brief ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Brief du post</h2>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Application / Plateforme</label>
            <div className="grid grid-cols-5 gap-2">
              {PLATFORMS.map(p => (
                <button key={p.key} onClick={() => handlePlatformChange(p.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-colors ${platformKey === p.key ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200 text-gray-600'}`}>
                  <span className="text-2xl">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instagram: account selector */}
          {platformObj.accounts && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Compte Instagram</label>
              <div className="flex gap-2">
                {platformObj.accounts.map(a => (
                  <button key={a.key} onClick={() => setAccount(a.key)}
                    className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-colors ${account === a.key ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200 text-gray-600'}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de contenu</label>
            <div className="flex flex-wrap gap-2">
              {platformObj.types.map(t => (
                <button key={t} onClick={() => setContentType(t)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${contentType === t ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200 text-gray-600'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Task link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lier à une tâche (optionnel)</label>
            <select value={taskId} onChange={e => setTaskId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="">— Aucune tâche —</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          {/* Brief complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brief de la responsable *
              <span className="ml-2 text-xs font-normal text-gray-400">Collez le texte tel quel</span>
            </label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={7}
              placeholder={`Collez ici la demande complète de Sofya…\n\nEx: "Pour cette semaine, je veux un post inspirant sur la confiance en soi pour notre compte Success Compass. Ton motivant, en français. Public : femmes 25-45 ans en reconversion professionnelle. On peut mentionner notre formation Master Coach Thérapeute."`}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
          </div>

          <button onClick={() => { setStep(2); generate() }}
            disabled={!brief.trim()}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:opacity-60 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Générer avec l'IA ✨
          </button>
        </div>
      )}

      {/* ── STEP 2: Generating ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center">
          {generating ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="font-semibold text-gray-900">L'IA génère vos captions…</h2>
              <p className="text-sm text-gray-500">{platformObj.label} · {contentType}</p>
            </div>
          ) : genError ? (
            <div className="space-y-4">
              <p className="text-4xl">⚠️</p>
              <h2 className="font-semibold text-red-600">Erreur de génération</h2>
              <p className="text-sm text-gray-500 bg-red-50 rounded-xl p-3 text-left font-mono">{genError}</p>
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                ← Retour au brief
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* ── STEP 3: Choose caption ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-purple-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Choisissez une variante</h2>
            <div className="space-y-3">
              {captions.map((c, i) => (
                <div key={i} onClick={() => chooseCaption(i)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${chosenIndex === i ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-gray-400 flex-shrink-0">Variante #{i + 1}</span>
                    {chosenIndex === i && <Check className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{c.caption}</p>
                  <p className="text-xs text-purple-500 mt-2">{c.hashtags}</p>
                </div>
              ))}
            </div>
          </div>

          {chosenIndex !== null && (
            <div className="bg-white rounded-2xl border border-purple-100 p-5 space-y-4">
              <h3 className="font-medium text-gray-900">Modifier votre sélection</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Caption</label>
                <textarea value={editCaption} onChange={e => setEditCaption(e.target.value)} rows={6}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hashtags</label>
                <textarea value={editHashtags} onChange={e => setEditHashtags(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none font-mono text-purple-600" />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />Retour
            </button>
            <button onClick={() => setStep(4)} disabled={chosenIndex === null}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Canva ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-purple-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Design Canva</h2>
            <p className="text-sm text-gray-500">Créez votre visuel sur Canva et collez le lien ici.</p>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Lien de votre design Canva</label>
              <input value={canvaUrl} onChange={e => setCanvaUrl(e.target.value)}
                placeholder="https://www.canva.com/design/..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            {canvaUrl && (
              <a href={canvaUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors">
                <span className="text-2xl">🎨</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-800">Ouvrir dans Canva</p>
                  <p className="text-xs text-purple-500 truncate">{canvaUrl}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-purple-400 flex-shrink-0" />
              </a>
            )}
            <a href="https://canva.com" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
              Ouvrir Canva <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />Retour
            </button>
            <button onClick={() => setStep(5)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Submit ── */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-purple-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Récapitulatif</h2>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <span className="text-2xl">{platformObj.icon}</span>
                <div>
                  <p className="text-xs text-gray-400">Plateforme</p>
                  <p className="font-medium text-gray-900">
                    {platformObj.label}
                    {platformObj.accounts && account && ` · ${platformObj.accounts.find(a => a.key === account)?.label}`}
                    {` · ${contentType}`}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Caption</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{editCaption}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Hashtags</p>
                <p className="text-sm text-purple-600 font-mono bg-purple-50 rounded-xl p-3">{editHashtags}</p>
              </div>
              {canvaUrl && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Design Canva</p>
                  <a href={canvaUrl} target="_blank" rel="noreferrer" className="text-sm text-purple-600 hover:underline break-all">{canvaUrl}</a>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />Retour
            </button>
            <button onClick={submit} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Soumettre pour validation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
