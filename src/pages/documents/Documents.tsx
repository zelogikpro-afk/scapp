import { FileText, Upload, Download, Search, File, Image, Film } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useState } from 'react'

const MOCK_DOCS = [
  { id: 'd1', name: 'Contrat coaching - Fatima Chraibi.pdf', type: 'contract', size: '245 KB', uploadedBy: 'Sofya Benali', uploadedAt: '2026-06-05', participant: 'Fatima Chraibi' },
  { id: 'd2', name: 'Facture PAY-001.pdf', type: 'invoice', size: '78 KB', uploadedBy: 'Zineb Eddaqaqi', uploadedAt: '2026-06-05', participant: 'Fatima Chraibi' },
  { id: 'd3', name: 'Certificat Coach de Vie - Mehdi Alaoui.pdf', type: 'certificate', size: '1.2 MB', uploadedBy: 'Sofya Benali', uploadedAt: '2026-05-30', participant: 'Mehdi Alaoui' },
  { id: 'd4', name: 'Roue de la vie - exercice.pdf', type: 'pdf', size: '320 KB', uploadedBy: 'Youssef Amrani', uploadedAt: '2026-06-10', participant: 'Fatima Chraibi' },
  { id: 'd5', name: 'Rapport DISC - Fatima Chraibi.pdf', type: 'pdf', size: '890 KB', uploadedBy: 'Youssef Amrani', uploadedAt: '2026-06-08', participant: 'Fatima Chraibi' },
]

const TYPE_ICONS: Record<string, any> = {
  contract: FileText, invoice: FileText, certificate: FileText, pdf: File, image: Image, word: FileText, excel: FileText, video: Film, other: File,
}

const TYPE_COLORS: Record<string, any> = {
  contract: 'info', invoice: 'success', certificate: 'purple', pdf: 'warning', image: 'info', other: 'default',
}

const TYPE_LABELS: Record<string, string> = {
  contract: 'Contrat', invoice: 'Facture', certificate: 'Certificat', pdf: 'PDF', image: 'Image', word: 'Word', excel: 'Excel', video: 'Vidéo', other: 'Autre',
}

export default function Documents() {
  const [search, setSearch] = useState('')

  const filtered = MOCK_DOCS.filter(d =>
    search === '' || d.name.toLowerCase().includes(search.toLowerCase()) || d.participant?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Documents</h2>
          <p className="text-sm text-gray-500">{MOCK_DOCS.length} fichiers</p>
        </div>
        <Button variant="primary" icon={<Upload className="w-4 h-4" />}>Téléverser</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['contract', 'invoice', 'certificate', 'pdf', 'image'].map(type => {
          const count = MOCK_DOCS.filter(d => d.type === type).length
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
