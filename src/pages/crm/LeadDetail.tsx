import { useState } from 'react'
import { Phone, MessageCircle, Mail, Send, Save, X, Trash2, UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate, timeAgo } from '../../lib/utils'
import type { Lead, LeadStatus } from '../../types'

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: any; bg: string; text: string }> = {
  new:             { label: 'Nouveau',          color: 'info',    bg: '#EFF6FF', text: '#1A73E8' },
  to_contact:      { label: 'À contacter',      color: 'info',    bg: '#F0F9FF', text: '#0284C7' },
  contacted:       { label: 'Contacté',         color: 'warning', bg: '#FFFBEB', text: '#D97706' },
  no_answer:       { label: 'Injoignable',      color: 'default', bg: '#F8FAFC', text: '#64748B' },
  callback:        { label: 'En réflexion',     color: 'warning', bg: '#FFF7ED', text: '#EA580C' },
  interested:      { label: 'Intéressé',        color: 'success', bg: '#F0FDF4', text: '#16A34A' },
  appointment:     { label: 'RDV fixé',         color: 'purple',  bg: '#F5F3FF', text: '#7C3AED' },
  pending_payment: { label: 'Paiement att.',    color: 'warning', bg: '#FEFCE8', text: '#CA8A04' },
  registered:      { label: 'Inscrit',          color: 'purple',  bg: '#FAF5FF', text: '#9333EA' },
  not_interested:  { label: 'Refus',            color: 'danger',  bg: '#FEF2F2', text: '#DC2626' },
}

const STATUS_GRADIENT: Partial<Record<LeadStatus, string>> = {
  new:             'linear-gradient(135deg, #0A1628 0%, #1A73E8 100%)',
  to_contact:      'linear-gradient(135deg, #0A1628 0%, #0284C7 100%)',
  contacted:       'linear-gradient(135deg, #0A1628 0%, #D97706 100%)',
  interested:      'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
  appointment:     'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
  registered:      'linear-gradient(135deg, #4a044e 0%, #9333ea 100%)',
  not_interested:  'linear-gradient(135deg, #450a0a 0%, #dc2626 100%)',
  pending_payment: 'linear-gradient(135deg, #451a03 0%, #ca8a04 100%)',
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #F0F7FF' }}>
      <p style={{ fontSize: 11, color: '#6B88A8', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</p>
      <p style={{ fontSize: 13, color: '#0A1628', fontWeight: 600, margin: '3px 0 0' }}>{value}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 4px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B88A8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: '#E2ECF8' }} />
    </div>
  )
}

export default function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'notes' | 'history'>('info')
  const [converting, setConverting] = useState(false)
  const [convertDone, setConvertDone] = useState(false)
  const { updateLead, deleteLead, addLeadNote, convertLeadToParticipant, profiles } = useAppStore()
  const { user } = useAuthStore()

  const [editForm, setEditForm] = useState({
    firstName: lead.firstName, lastName: lead.lastName,
    phone: lead.phone, whatsapp: lead.whatsapp ?? '',
    email: lead.email ?? '', city: lead.city ?? '',
    profession: lead.profession ?? '', programInterest: lead.programInterest ?? '',
    interestLevel: (lead.interestLevel ?? '') as '' | 'low' | 'medium' | 'high',
    nextFollowUpDate: lead.nextFollowUpDate ?? '',
  })
  const [saving, setSaving] = useState(false)

  function handleAddNote() {
    if (!note.trim() || !user) return
    addLeadNote(lead.id, note.trim(), user.id, user.name)
    setNote('')
  }

  function handleStatusChange(status: LeadStatus) {
    updateLead(lead.id, { status, lastTouchedBy: user?.name, lastTouchedAt: new Date().toISOString() })
  }

  async function handleSaveEdit() {
    setSaving(true)
    await updateLead(lead.id, {
      firstName: editForm.firstName, lastName: editForm.lastName,
      phone: editForm.phone, whatsapp: editForm.whatsapp || undefined,
      email: editForm.email || undefined, nextFollowUpDate: editForm.nextFollowUpDate || undefined,
    })
    setSaving(false)
    setActiveTab('info')
  }

  async function handleConvert() {
    if (!window.confirm(`Convertir ${lead.firstName} ${lead.lastName} en participant ?`)) return
    setConverting(true)
    await convertLeadToParticipant(lead)
    setConverting(false)
    setConvertDone(true)
  }

  const sc = STATUS_CONFIG[lead.status]
  const heroGradient = STATUS_GRADIENT[lead.status] || 'linear-gradient(135deg, #0A1628 0%, #1A73E8 100%)'

  const tabs = [
    { id: 'info' as const,    label: 'Infos' },
    { id: 'edit' as const,    label: 'Modifier' },
    { id: 'notes' as const,   label: `Notes${lead.notes.length > 0 ? ` (${lead.notes.length})` : ''}` },
    { id: 'history' as const, label: `Suivi${lead.followUps.length > 0 ? ` (${lead.followUps.length})` : ''}` },
  ]

  return (
    <Modal open onClose={onClose} title="" size="lg">
      {/* ── Profile Hero ── */}
      <div style={{ margin: '-24px -24px 0', borderRadius: '16px 16px 0 0', overflow: 'hidden', background: heroGradient, padding: '24px 24px 20px', position: 'relative' }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -10, right: 60, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Avatar */}
            <div style={{ width: 60, height: 60, borderRadius: 20, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }}>
              {lead.firstName.charAt(0).toUpperCase()}{lead.lastName.charAt(0).toUpperCase()}
            </div>
            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
                {lead.firstName} {lead.lastName}
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '3px 0 0' }}>
                {lead.source}{lead.campaign ? ` · ${lead.campaign}` : ''}
                {lead.city ? ` · ${lead.city}` : ''}
              </p>
              {/* Status + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  {sc.label}
                </span>
                {lead.nextFollowUpDate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
                    <Clock className="w-3 h-3" /> Rappel {formatDate(lead.nextFollowUpDate)}
                  </span>
                )}
                {lead.createdAt && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    Reçu {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {lead.phone && (
              <a href={`tel:${lead.phone}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Phone className="w-3.5 h-3.5" /> Appeler
              </a>
            )}
            {lead.whatsapp && (
              <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            )}
            {!convertDone && lead.status !== 'registered' && (
              <button onClick={handleConvert} disabled={converting}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: '#fff', color: '#1A73E8', fontSize: 12, fontWeight: 700, border: 'none', cursor: converting ? 'not-allowed' : 'pointer' }}>
                <UserPlus className="w-3.5 h-3.5" /> {converting ? 'En cours…' : '→ Participant'}
              </button>
            )}
            {convertDone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 700 }}>
                <CheckCircle className="w-3.5 h-3.5" /> Converti !
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Status changer ── */}
      <div style={{ padding: '14px 0 4px', overflowX: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#6B88A8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Changer le statut</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(s => {
            const c = STATUS_CONFIG[s]
            const isActive = lead.status === s
            return (
              <button key={s} onClick={() => handleStatusChange(s)}
                style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', border: isActive ? 'none' : `1.5px solid ${c.bg}`, background: isActive ? c.text : c.bg, color: isActive ? '#fff' : c.text, flexShrink: 0 }}>
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Assigné + Dernière action ── */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#F8FAFF', borderRadius: 14, border: '1px solid #E2ECF8', margin: '8px 0' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#6B88A8', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 6px' }}>Assigné à</p>
          <select value={lead.assignedTo ?? ''} onChange={e => {
            const profile = profiles.find(p => p.id === e.target.value)
            updateLead(lead.id, { assignedTo: e.target.value || undefined, assignedToName: profile?.name || undefined })
          }}
            style={{ width: '100%', fontSize: 13, fontWeight: 600, color: '#0A1628', border: '1px solid #E2ECF8', borderRadius: 10, padding: '6px 10px', background: '#fff', outline: 'none' }}>
            <option value="">— Non assigné</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {lead.lastTouchedBy && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#6B88A8', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>Dernière action</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#0A1628', margin: 0 }}>{lead.lastTouchedBy}</p>
            <p style={{ fontSize: 11, color: '#6B88A8', margin: '2px 0 0' }}>{timeAgo(lead.lastTouchedAt ?? '')}</p>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: '2px solid #F0F7FF', display: 'flex', gap: 0, margin: '8px 0 0' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'none',
              color: activeTab === tab.id ? '#1A73E8' : '#6B88A8',
              borderBottom: activeTab === tab.id ? '2px solid #1A73E8' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Informations ── */}
      {activeTab === 'info' && (
        <div style={{ paddingTop: 4 }}>
          <SectionTitle>Contact</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <InfoField label="Téléphone" value={lead.phone} />
            <InfoField label="WhatsApp" value={lead.whatsapp} />
            <InfoField label="Email" value={lead.email} />
            <InfoField label="Ville" value={lead.city} />
            <InfoField label="Genre" value={lead.genre === 'female' ? 'Femme' : lead.genre === 'male' ? 'Homme' : undefined} />
            <InfoField label="Date de naissance" value={lead.dateNaissance ? formatDate(lead.dateNaissance) : undefined} />
            <InfoField label="CIN" value={lead.cin} />
            <InfoField label="Adresse" value={lead.adresse} />
          </div>

          <SectionTitle>Qualification</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <InfoField label="Objectif" value={lead.programInterest} />
            <InfoField label="Profession" value={lead.profession} />
            <InfoField label="Délai d'action" value={lead.delaiAction} />
            <InfoField label="Disponibilité" value={lead.horairePreference} />
            <InfoField label="Modalité" value={lead.modaliteParticipation === 'presentiel' ? 'Présentiel' : lead.modaliteParticipation === 'enligne' ? 'En ligne' : lead.modaliteParticipation} />
            <InfoField label="Urgence" value={lead.interestLevel === 'high' ? '🔴 Urgent' : lead.interestLevel === 'medium' ? '🟠 Moyen terme' : lead.interestLevel === 'low' ? '🟢 Plus tard' : undefined} />
          </div>

          <SectionTitle>Source & CRM</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <InfoField label="Source" value={lead.source} />
            <InfoField label="Campagne" value={lead.campaign} />
            <InfoField label="Publicité" value={lead.adSet} />
            <InfoField label="Réception" value={lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined} />
            <InfoField label="Prochain rappel" value={lead.nextFollowUpDate ? formatDate(lead.nextFollowUpDate) : undefined} />
          </div>

          {lead.programTag === 'classes_avenir' && (lead.childName || lead.childAge || lead.childSchool) && (
            <>
              <SectionTitle>🏫 Infos enfant</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <InfoField label="Nom de l'enfant" value={lead.childName} />
                <InfoField label="Âge" value={lead.childAge} />
                <InfoField label="École" value={lead.childSchool} />
                <InfoField label="Niveau scolaire" value={lead.childLevel} />
              </div>
            </>
          )}

          {(lead.prixFormation || lead.montantVerse) ? (
            <>
              <SectionTitle>💰 Paiement</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <InfoField label="Prix formation" value={lead.prixFormation ? `${lead.prixFormation.toLocaleString('fr-MA')} MAD` : undefined} />
                <InfoField label="Montant versé" value={lead.montantVerse ? `${lead.montantVerse.toLocaleString('fr-MA')} MAD` : undefined} />
                <InfoField label="Reste à payer" value={lead.prixFormation != null ? `${((lead.prixFormation ?? 0) - (lead.montantVerse ?? 0)).toLocaleString('fr-MA')} MAD` : undefined} />
                <InfoField label="Modalité" value={lead.modalitePaiement === 'complet' ? 'Paiement complet' : lead.modalitePaiement === 'acompte' ? 'Acompte + solde' : lead.modalitePaiement === 'echelonne' ? 'Échelonné (3x)' : lead.modalitePaiement} />
                {lead.dateVersement2 && <InfoField label="2e versement" value={formatDate(lead.dateVersement2)} />}
                {lead.dateVersement3 && <InfoField label="3e versement" value={formatDate(lead.dateVersement3)} />}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Tab: Modifier ── */}
      {activeTab === 'edit' && (
        <div style={{ paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Prénom" value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input label="Nom" value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
            <Input label="Téléphone" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="WhatsApp" value={editForm.whatsapp} onChange={e => setEditForm(f => ({ ...f, whatsapp: e.target.value }))} />
            <div style={{ gridColumn: 'span 2' }}>
              <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <Input label="Ville" value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="Profession" value={editForm.profession} onChange={e => setEditForm(f => ({ ...f, profession: e.target.value }))} />
            <div style={{ gridColumn: 'span 2' }}>
              <Input label="Programme intéressé" value={editForm.programInterest} onChange={e => setEditForm(f => ({ ...f, programInterest: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B88A8', marginBottom: 6 }}>Niveau d'urgence</label>
              <select value={editForm.interestLevel} onChange={e => setEditForm(f => ({ ...f, interestLevel: e.target.value as any }))}
                style={{ width: '100%', fontSize: 13, border: '1.5px solid #E2ECF8', borderRadius: 10, padding: '8px 12px', background: '#fff', color: '#0A1628', outline: 'none' }}>
                <option value="">— Non défini</option>
                <option value="low">🟢 Plus tard</option>
                <option value="medium">🟠 Moyen terme</option>
                <option value="high">🔴 Urgent</option>
              </select>
            </div>
            <Input label="Prochain rappel" type="date" value={editForm.nextFollowUpDate} onChange={e => setEditForm(f => ({ ...f, nextFollowUpDate: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setActiveTab('info')}
              style={{ padding: '9px 18px', borderRadius: 12, border: '1.5px solid #E2ECF8', background: '#fff', color: '#6B88A8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Annuler
            </button>
            <button onClick={handleSaveEdit} disabled={saving}
              style={{ padding: '9px 18px', borderRadius: 12, border: 'none', background: '#1A73E8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Notes ── */}
      {activeTab === 'notes' && (
        <div style={{ paddingTop: 12 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ajouter une note commerciale…" rows={2}
              style={{ flex: 1, fontSize: 13, border: '1.5px solid #E2ECF8', borderRadius: 12, padding: '10px 14px', background: '#F8FAFF', color: '#0A1628', resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={handleAddNote} disabled={!note.trim()}
              style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#1A73E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: note.trim() ? 'pointer' : 'not-allowed', opacity: note.trim() ? 1 : 0.5, flexShrink: 0, alignSelf: 'flex-start' }}>
              <Send className="w-4 h-4" />
            </button>
          </div>
          {lead.notes.length === 0
            ? <p style={{ textAlign: 'center', color: '#6B88A8', fontSize: 13, padding: '32px 0' }}>Aucune note pour ce lead</p>
            : [...lead.notes].reverse().map(n => (
                <div key={n.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #1A73E8, #4F94F0)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                    {n.authorName.charAt(0)}
                  </div>
                  <div style={{ flex: 1, background: '#F8FAFF', borderRadius: 14, padding: '10px 14px', border: '1px solid #E2ECF8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0A1628' }}>{n.authorName}</span>
                      <span style={{ fontSize: 11, color: '#6B88A8' }}>{timeAgo(n.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>{n.content}</p>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* ── Tab: Historique ── */}
      {activeTab === 'history' && (
        <div style={{ paddingTop: 12 }}>
          {lead.followUps.length === 0
            ? <p style={{ textAlign: 'center', color: '#6B88A8', fontSize: 13, padding: '32px 0' }}>Aucun historique de suivi</p>
            : lead.followUps.map(fu => {
                const iconBg = fu.type === 'call' ? 'linear-gradient(135deg,#1A73E8,#4F94F0)' : fu.type === 'whatsapp' ? 'linear-gradient(135deg,#059669,#34d399)' : 'linear-gradient(135deg,#6B88A8,#94a3b8)'
                const Icon = fu.type === 'call' ? Phone : fu.type === 'whatsapp' ? MessageCircle : Mail
                return (
                  <div key={fu.id} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div style={{ flex: 1, background: '#F8FAFF', borderRadius: 14, padding: '10px 14px', border: '1px solid #E2ECF8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0A1628', textTransform: 'capitalize' }}>{fu.type} — {fu.outcome}</span>
                        <span style={{ fontSize: 11, color: '#6B88A8' }}>{formatDate(fu.date)}</span>
                      </div>
                      {fu.notes && <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{fu.notes}</p>}
                      <p style={{ fontSize: 11, color: '#6B88A8', margin: '3px 0 0' }}>par {fu.authorName}</p>
                    </div>
                  </div>
                )
              })
          }
        </div>
      )}

      {/* ── Bottom action bar ── */}
      <div style={{ margin: '16px -24px -24px', padding: '14px 20px', background: '#F8FAFF', borderTop: '1px solid #E2ECF8', borderRadius: '0 0 16px 16px', display: 'flex', gap: 10 }}>
        <button onClick={() => setActiveTab('notes')}
          style={{ flex: 1, padding: '11px 0', borderRadius: 14, border: '1.5px solid #E2ECF8', background: '#fff', color: '#1A73E8', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Send className="w-4 h-4" /> Ajouter une note
        </button>
        {lead.phone && (
          <a href={`tel:${lead.phone}`}
            style={{ flex: 1, padding: '11px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #1A73E8, #4F94F0)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
            <Phone className="w-4 h-4" /> Appeler
          </a>
        )}
        <button onClick={async () => { if (!confirm(`Supprimer ${lead.firstName} ?`)) return; await deleteLead(lead.id); onClose() }}
          style={{ width: 44, height: 44, borderRadius: 14, border: '1.5px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Modal>
  )
}
