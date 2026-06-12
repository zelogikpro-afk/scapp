import { Award, Download, QrCode, Plus } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { formatDate } from '../../lib/utils'

const MOCK_CERTS = [
  { id: 'cert1', participant: 'Mehdi Alaoui', program: 'Coach de Vie Niveau 1', issueDate: '2026-05-30', serialNumber: 'SC-2026-001', status: 'issued' },
  { id: 'cert2', participant: 'Omar Bennis', program: 'Life Coach Certification', issueDate: '2026-05-30', serialNumber: 'SC-2026-002', status: 'issued' },
  { id: 'cert3', participant: 'Yasmine Ouali', program: 'Coach de Vie Niveau 1', issueDate: '2026-05-30', serialNumber: 'SC-2026-003', status: 'issued' },
  { id: 'cert4', participant: 'Fatima Chraibi', program: 'Life Coach Certification', issueDate: '', serialNumber: '', status: 'pending' },
]

export default function Certificates() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Certificats</h2>
          <p className="text-sm text-gray-500">{MOCK_CERTS.filter(c => c.status === 'issued').length} certificats délivrés</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Générer un certificat</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-emerald-600">{MOCK_CERTS.filter(c => c.status === 'issued').length}</p>
          <p className="text-xs text-gray-500 mt-1">Délivrés</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-amber-600">{MOCK_CERTS.filter(c => c.status === 'pending').length}</p>
          <p className="text-xs text-gray-500 mt-1">En attente</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-blue-600">{MOCK_CERTS.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </Card>
      </div>

      {/* Certificates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_CERTS.map(cert => (
          <Card key={cert.id} hover className={cert.status === 'pending' ? 'opacity-70' : ''}>
            {/* Certificate preview */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-5 mb-4 text-white text-center relative overflow-hidden">
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
            </div>

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
                <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} className="flex-1">
                  Télécharger
                </Button>
                <Button variant="ghost" size="icon">
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            )}

            {cert.status === 'pending' && (
              <Button variant="primary" size="sm" className="w-full mt-3" icon={<Award className="w-3.5 h-3.5" />}>
                Générer le certificat
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
