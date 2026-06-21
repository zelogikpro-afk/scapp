import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../store/appStore'
import { COHORTS, TRAINING_PROGRAMS } from '../../lib/mockData'

export default function AddParticipantModal({ onClose }: { onClose: () => void }) {
  const { addParticipant, participants } = useAppStore()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', whatsapp: '',
    gender: 'female' as const, birthDate: '', cin: '', address: '',
    profession: '', company: '', emergencyContact: '',
    type: 'coaching' as 'coaching' | 'training' | 'both',
    notes: '', tags: [] as string[],
    promotionId: '', reference: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const year = new Date().getFullYear()
    const nextNum = (participants.length + 1).toString().padStart(3, '0')
    const ref = form.reference || `SC-${year}-${nextNum}`
    addParticipant({ ...form, isActive: true, reference: ref, promotionId: form.promotionId || undefined })
    onClose()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <Modal open onClose={onClose} title="Nouveau participant" size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit}>Créer le participant</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom *" value={form.firstName} onChange={f('firstName')} required />
          <Input label="Nom *" value={form.lastName} onChange={f('lastName')} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email" type="email" value={form.email} onChange={f('email')} />
          <Input label="Téléphone *" value={form.phone} onChange={f('phone')} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="WhatsApp" value={form.whatsapp} onChange={f('whatsapp')} />
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Genre</label>
            <select value={form.gender} onChange={f('gender')} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="female">Femme</option>
              <option value="male">Homme</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date de naissance" type="date" value={form.birthDate} onChange={f('birthDate')} />
          <Input label="CIN" value={form.cin} onChange={f('cin')} />
        </div>
        <Input label="Adresse" value={form.address} onChange={f('address')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Profession" value={form.profession} onChange={f('profession')} />
          <Input label="Entreprise" value={form.company} onChange={f('company')} />
        </div>
        <Input label="Contact d'urgence" value={form.emergencyContact} onChange={f('emergencyContact')} />
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
          <select value={form.type} onChange={f('type')} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="coaching">Coaching uniquement</option>
            <option value="training">Formation uniquement</option>
            <option value="both">Coaching & Formation</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Référence (auto si vide)" value={form.reference} onChange={f('reference')} placeholder="ex: SC-2025-001" />
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Promotion</label>
            <select value={form.promotionId} onChange={f('promotionId')} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Aucune promotion</option>
              {COHORTS.map(c => {
                const prog = TRAINING_PROGRAMS.find(p => p.id === (c as any).programId)
                return <option key={c.id} value={c.id}>{c.programName} ({(c as any).startDate?.slice(0,7)})</option>
              })}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes internes</label>
          <textarea value={form.notes} onChange={f('notes')} rows={3} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Notes internes sur ce participant…" />
        </div>
      </form>
    </Modal>
  )
}
