import { useState } from 'react'
import { Phone, MessageCircle, Mail, Send, Calendar, UserPlus, Clock, Edit2 } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate, timeAgo } from '../../lib/utils'
import type { Lead, LeadStatus } from '../../types'

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: any }> = {
  new: { label: 'Nouveau', color: 'info' },
  interested: { label: 'Intéressé', color: 'success' },
  callback: { label: 'Rappel', color: 'warning' },
  not_interested: { label: 'Pas intéressé', color: 'danger' },
  no_answer: { label: 'Pas de réponse', color: 'default' },
  registered: { label: 'Inscrit', color: 'purple' },
}

export default function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'history'>('info')
  const { updateLead, addLeadNote } = useAppStore()
  const { user } = useAuthStore()

  function handleAddNote() {
    if (!note.trim() || !user) return
    addLeadNote(lead.id, note.trim(), user.id, user.name)
    setNote('')
  }

  function handleStatusChange(status: LeadStatus) {
    updateLead(lead.id, { status })
  }

  const tabs = [
    { id: 'info', label: 'Informations' },
    { id: 'notes', label: `Notes (${lead.notes.length})` },
    { id: 'history', label: `Historique (${lead.followUps.length})` },
  ] as const

  return (
    <Modal open onClose={onClose} title="" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar name={`${lead.firstName} ${lead.lastName}`} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{lead.firstName} {lead.lastName}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <Badge variant={STATUS_CONFIG[lead.status].color} dot>{STATUS_CONFIG[lead.status].label}</Badge>
              <span className="text-xs text-gray-400">{lead.source}</span>
              {lead.campaign && <span className="text-xs text-gray-400">· {lead.campaign}</span>}
            </div>
          </div>
          {/* Quick actions */}
          <div className="flex gap-2">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                <Phone className="w-4 h-4" />
              </a>
            )}
            {lead.whatsapp && (
              <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Status Change */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Changer le statut</p>
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${lead.status === s ? 'ring-2 ring-blue-500 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
              >
                <Badge variant={STATUS_CONFIG[s].color}>{STATUS_CONFIG[s].label}</Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Téléphone', value: lead.phone },
              { label: 'WhatsApp', value: lead.whatsapp },
              { label: 'Email', value: lead.email },
              { label: 'Facebook', value: lead.facebookName },
              { label: 'Instagram', value: lead.instagram },
              { label: 'Source', value: lead.source },
              { label: 'Campagne', value: lead.campaign },
              { label: 'Ad Set', value: lead.adSet },
              { label: 'Date de réception', value: formatDate(lead.createdAt) },
              { label: 'Prochain rappel', value: lead.nextFollowUpDate ? formatDate(lead.nextFollowUpDate) : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-3">
            {/* Add note */}
            <div className="flex gap-2">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ajouter une note commerciale…"
                rows={2}
                className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <Button variant="primary" size="icon" onClick={handleAddNote} disabled={!note.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {lead.notes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Aucune note pour ce lead</p>
            ) : (
              <div className="space-y-3">
                {[...lead.notes].reverse().map(n => (
                  <div key={n.id} className="flex gap-3">
                    <Avatar name={n.authorName} size="sm" />
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{n.authorName}</span>
                        <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{n.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {lead.followUps.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Aucun historique de suivi</p>
            ) : (
              lead.followUps.map(fu => (
                <div key={fu.id} className="flex gap-3 items-start">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${fu.type === 'call' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : fu.type === 'whatsapp' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}>
                    {fu.type === 'call' ? <Phone className="w-4 h-4" /> : fu.type === 'whatsapp' ? <MessageCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{fu.type} — {fu.outcome}</span>
                      <span className="text-xs text-gray-400">{formatDate(fu.date)}</span>
                    </div>
                    {fu.notes && <p className="text-xs text-gray-500 mt-0.5">{fu.notes}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">par {fu.authorName}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
