import { useState } from 'react'
import { Award, Download, QrCode, Plus, CheckCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { supabase } from '../../lib/supabase'
import { useAppStore } from '../../store/appStore'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

interface Cert {
  id: string
  participantId: string
  participant: string
  program: string
  issueDate: string
  serialNumber: string
  status: 'issued' | 'pending'
}

const PROGRAMS = [
  'Coach de Vie Niveau 1',
  'Coach de Vie Niveau 2',
  'Life Coach Certification',
  'Pack Essentiel 6 séances',
  'Pack Premium 10 séances',
]

function CertificatePreview({ cert }: { cert: Cert }) {
  return (
    <div id={`cert-${cert.id}`} className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-5 mb-4 text-white text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10">
        <div className="absolute top-2 left-2 w-16 h-16 rounded-full border-4 border-white" />
        <div className="absolute bottom-2 right-2 w-24 h-24 rounded-full border-4 border-white" />
      </div>
      <Award className="w-10 h-10 mx-auto mb-2 opacity-90" />
      <p className="text-xs font-medium opacity-80 uppercase tracking-widest">Success Compass</p>
      <p className="text-base font-bold mt-1">Certificat de Réussite</p>
      <p className="text-sm opacity-90 mt-1">{cert.participant}</p>
      <p className="text-xs opacity-70 mt-1">{cert.program}</p>
      {cert.serialNumber && <p className="text-xs font-mono opacity-60 mt-2">{cert.serialNumber}</p>}
      {cert.issueDate && <p className="text-xs opacity-50 mt-1">Délivré le {formatDate(cert.issueDate)}</p>}
    </div>
  )
}

function GenerateModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: (cert: Cert) => void }) {
  const { participants } = useAppStore()
  const [form, setForm] = useState({ participantId: '', program: PROGRAMS[0], issueDate: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(false)
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.participantId) return toast.error('Sélectionnez un participant')
    setLoading(true)
    const p = participants.find(x => x.id === form.participantId)!
    const year = new Date(form.issueDate).getFullYear()
    const rand = Math.floor(Math.random() * 900) + 100
    const serialNumber = `SC-${year}-${rand}`
    const cert: Cert = {
      id: crypto.randomUUID(),
      participantId: form.participantId,
      participant: `${p.firstName} ${p.lastName}`,
      program: form.program,
      issueDate: form.issueDate,
      serialNumber,
      status: 'issued',
    }
    onGenerated(cert)
    toast.success('Certificat généré !')
    setLoading(false)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Générer un certificat" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Participant *</label>
          <select value={form.participantId} onChange={e => setF('participantId', e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Sélectionner —</option>
            {participants.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Programme *</label>
          <select value={form.program} onChange={e => setF('program', e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <Input label="Date de délivrance" type="date" value={form.issueDate} onChange={e => setF('issueDate', e.target.value)} />
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !form.participantId}>
            {loading ? 'Génération…' : 'Générer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function downloadCert(cert: Cert) {
  const win = window.open('', '_blank')!
  win.document.write(`
    <html><head><title>Certificat - ${cert.participant}</title>
    <style>
      body { margin: 0; font-family: Georgia, serif; background: linear-gradient(135deg, #1d4ed8, #7c3aed); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
      .cert { background: white; width: 800px; padding: 60px; text-align: center; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); position: relative; }
      .border-deco { position: absolute; inset: 16px; border: 3px double #c4b5fd; border-radius: 12px; pointer-events: none; }
      h1 { font-size: 14px; letter-spacing: 0.3em; color: #7c3aed; text-transform: uppercase; margin: 0 0 16px; }
      h2 { font-size: 36px; font-weight: bold; color: #1e1b4b; margin: 0 0 12px; }
      .name { font-size: 28px; color: #1d4ed8; font-style: italic; border-bottom: 2px solid #e9d5ff; display: inline-block; padding: 0 24px 8px; margin: 16px 0; }
      .program { font-size: 18px; color: #4c1d95; margin: 12px 0 8px; font-weight: bold; }
      .meta { font-size: 12px; color: #9ca3af; margin-top: 24px; }
      .serial { font-family: monospace; font-size: 11px; color: #c084fc; margin-top: 8px; }
    </style></head>
    <body><div class="cert">
      <div class="border-deco"></div>
      <h1>Success Compass</h1>
      <h2>Certificat de Réussite</h2>
      <p style="color:#6b7280;font-size:14px;">Ce certificat est décerné à</p>
      <div class="name">${cert.participant}</div>
      <p class="program">${cert.program}</p>
      <p class="meta">Délivré le ${formatDate(cert.issueDate)}</p>
      <p class="serial">${cert.serialNumber}</p>
    </div></body></html>
  `)
  win.document.close()
  setTimeout(() => { win.print() }, 500)
}

const INITIAL: Cert[] = []

export default function Certificates() {
  const [certs, setCerts] = useState<Cert[]>(INITIAL)
  const [showGenerate, setShowGenerate] = useState(false)

  function handleGenerated(cert: Cert) {
    setCerts(c => [cert, ...c])
  }

  function handleGeneratePending(cert: Cert) {
    setCerts(c => c.map(x => x.id === cert.id ? { ...x, status: 'issued', issueDate: new Date().toISOString().split('T')[0], serialNumber: `SC-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}` } : x))
    toast.success('Certificat délivré !')
  }

  const issued = certs.filter(c => c.status === 'issued')
  const pending = certs.filter(c => c.status === 'pending')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Certificats</h2>
          <p className="text-sm text-gray-500">{issued.length} certificats délivrés</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowGenerate(true)}>
          Générer un certificat
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-emerald-600">{issued.length}</p>
          <p className="text-xs text-gray-500 mt-1">Délivrés</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-500 mt-1">En attente</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-blue-600">{certs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </Card>
      </div>

      {/* Certificates */}
      {certs.length === 0 && (
        <Card className="text-center py-12">
          <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Aucun certificat généré</p>
          <Button variant="primary" className="mt-4" icon={<Plus className="w-4 h-4" />} onClick={() => setShowGenerate(true)}>
            Générer le premier
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certs.map(cert => (
          <Card key={cert.id} hover className={cert.status === 'pending' ? 'opacity-70' : ''}>
            <CertificatePreview cert={cert} />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={cert.participant} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cert.participant}</p>
                  <p className="text-xs text-gray-400">{cert.program}</p>
                </div>
              </div>
              <Badge variant={cert.status === 'issued' ? 'success' : 'warning'}>
                {cert.status === 'issued' ? 'Délivré' : 'En attente'}
              </Badge>
            </div>

            {cert.issueDate && (
              <p className="text-xs text-gray-400 mt-2">Délivré le {formatDate(cert.issueDate)}</p>
            )}

            {cert.status === 'issued' && (
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}
                  className="flex-1" onClick={() => downloadCert(cert)}>
                  Télécharger / Imprimer
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  const url = `https://successcompass.ma/verify/${cert.serialNumber}`
                  toast.success(`QR: ${cert.serialNumber}`)
                }}>
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            )}

            {cert.status === 'pending' && (
              <Button variant="primary" size="sm" className="w-full mt-3"
                icon={<Award className="w-3.5 h-3.5" />}
                onClick={() => handleGeneratePending(cert)}>
                Générer le certificat
              </Button>
            )}
          </Card>
        ))}
      </div>

      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onGenerated={handleGenerated} />}
    </div>
  )
}
