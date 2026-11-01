import { FileText, Upload, Download, Search, File, Image, Film, Trash2, RefreshCw } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHero, HeroBtn } from '../../components/ui/PageHero'
import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAppStore } from '../../store/appStore'
import toast from 'react-hot-toast'

interface DocEntry {
  id: string
  name: string
  path: string
  participant: string
  participantId: string
  size: string
  type: string
  uploadedAt: string
  publicUrl: string
}

function guessType(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('contrat') || lower.includes('contract')) return 'contract'
  if (lower.includes('facture') || lower.includes('recu') || lower.includes('recus') || lower.includes('paiement')) return 'invoice'
  if (lower.includes('certificat') || lower.includes('diplome')) return 'certificate'
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image'
  if (lower.match(/\.(mp4|mov|avi|webm)$/)) return 'video'
  return 'pdf'
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TYPE_ICONS: Record<string, any> = {
  contract: FileText, invoice: FileText, certificate: FileText, pdf: File, image: Image, video: Film, other: File,
}
const TYPE_COLORS: Record<string, any> = {
  contract: 'info', invoice: 'success', certificate: 'purple', pdf: 'warning', image: 'info', video: 'default', other: 'default',
}
const TYPE_LABELS: Record<string, string> = {
  contract: 'Contrat', invoice: 'Facture', certificate: 'Certificat', pdf: 'PDF', image: 'Image', video: 'Vidéo', other: 'Autre',
}

export default function Documents() {
  const { participants } = useAppStore()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const [docs, setDocs] = useState<DocEntry[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedPart, setSelectedPart] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchDocs() {
    setLoading(true)
    const all: DocEntry[] = []
    for (const p of participants) {
      const { data } = await supabase.storage.from('participant-docs').list(p.id, { limit: 100 })
      if (data) {
        for (const f of data) {
          if (f.name === '.emptyFolderPlaceholder') continue
          const path = `${p.id}/${f.name}`
          const { data: urlData } = supabase.storage.from('participant-docs').getPublicUrl(path)
          all.push({
            id: f.id || path,
            name: f.name.replace(/^\d+_/, ''),
            path,
            participant: `${p.firstName} ${p.lastName}`,
            participantId: p.id,
            size: fmtSize(f.metadata?.size || 0),
            type: guessType(f.name),
            uploadedAt: f.created_at?.split('T')[0] || '',
            publicUrl: urlData.publicUrl,
          })
        }
      }
    }
    all.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    setDocs(all)
    setLoading(false)
  }

  useEffect(() => { if (participants.length > 0) fetchDocs() }, [participants.length])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (!selectedPart) return toast.error('Sélectionnez un participant avant de téléverser')
    setUploading(true)
    for (const file of Array.from(files)) {
      const path = `${selectedPart}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('participant-docs').upload(path, file)
      if (error) toast.error(`Erreur: ${error.message}`)
      else toast.success(`${file.name} téléversé`)
    }
    setUploading(false)
    e.target.value = ''
    fetchDocs()
  }

  async function handleDelete(doc: DocEntry) {
    if (!confirm(`Supprimer "${doc.name}" ?`)) return
    const { error } = await supabase.storage.from('participant-docs').remove([doc.path])
    if (error) toast.error(error.message)
    else { toast.success('Fichier supprimé'); setDocs(d => d.filter(x => x.path !== doc.path)) }
  }

  const filtered = docs.filter(d =>
    search === '' ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.participant.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
      <PageHero
        emoji="📁"
        title="Documents"
        sub={`${docs.length} fichiers · ${participants.length} participants`}
        gradient="linear-gradient(135deg, #0c4a6e 0%, #0284c7 60%, #38bdf8 100%)"
        actions={
          <>
            <select value={selectedPart} onChange={e => setSelectedPart(e.target.value)}
              style={{ fontSize: 13, fontWeight: 600, border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}>
              <option value="" style={{ color: '#0A1628' }}>— Participant —</option>
              {participants.map(p => <option key={p.id} value={p.id} style={{ color: '#0A1628' }}>{p.firstName} {p.lastName}</option>)}
            </select>
            <HeroBtn onClick={() => { if (!selectedPart) { toast.error('Sélectionnez un participant'); return }; fileRef.current?.click() }} disabled={uploading}>
              <Upload className="w-3.5 h-3.5" /> {uploading ? 'Envoi…' : 'Téléverser'}
            </HeroBtn>
            <HeroBtn onClick={fetchDocs} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </HeroBtn>
          </>
        }
        stats={[
          { label: 'Contrats', value: docs.filter(d => d.type === 'contract').length },
          { label: 'Factures', value: docs.filter(d => d.type === 'invoice').length },
          { label: 'Certificats', value: docs.filter(d => d.type === 'certificate').length },
          { label: 'PDFs', value: docs.filter(d => d.type === 'pdf').length },
        ]}
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: isMobile ? 8 : 12 }}>
        {['contract', 'invoice', 'certificate', 'pdf', 'image'].map(type => {
          const count = docs.filter(d => d.type === type).length
          return (
            <Card key={type} className="text-center p-3">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
              <Badge variant={TYPE_COLORS[type]} className="mt-1 text-xs">{TYPE_LABELS[type]}</Badge>
            </Card>
          )
        })}
      </div>

      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un document…" icon={<Search className="w-4 h-4" />} className="max-w-sm" />

      {/* Files grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(doc => {
            const Icon = TYPE_ICONS[doc.type] || File
            return (
              <Card key={doc.id} hover className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{doc.participant} · {doc.size}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={TYPE_COLORS[doc.type]} size="sm">{TYPE_LABELS[doc.type]}</Badge>
                    <div className="flex items-center gap-1">
                      <a href={doc.publicUrl} target="_blank" rel="noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                        <Download className="w-4 h-4" />
                      </a>
                      <button onClick={() => handleDelete(doc)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
          {filtered.length === 0 && !loading && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <File className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Aucun document trouvé</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
