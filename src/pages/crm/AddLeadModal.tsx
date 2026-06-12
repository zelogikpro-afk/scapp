import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'

export default function AddLeadModal({ onClose }: { onClose: () => void }) {
  const { addLead } = useAppStore()
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', whatsapp: '', email: '',
    facebookName: '', source: 'Meta Ads', campaign: '', adSet: '', status: 'new' as const
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addLead({ ...form, assignedTo: user?.id, tags: [] })
    onClose()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <Modal open onClose={onClose} title="Nouveau lead" size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit}>Créer le lead</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom *" value={form.firstName} onChange={f('firstName')} required placeholder="Houda" />
          <Input label="Nom *" value={form.lastName} onChange={f('lastName')} required placeholder="Mansouri" />
        </div>
        <Input label="Téléphone *" value={form.phone} onChange={f('phone')} required placeholder="+212 6XX XXX XXX" />
        <Input label="WhatsApp" value={form.whatsapp} onChange={f('whatsapp')} placeholder="+212 6XX XXX XXX" />
        <Input label="Email" type="email" value={form.email} onChange={f('email')} placeholder="email@exemple.com" />
        <Input label="Nom Facebook" value={form.facebookName} onChange={f('facebookName')} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Source</label>
            <select value={form.source} onChange={f('source')} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {['Meta Ads', 'Instagram', 'Site Web', 'Référence', 'WhatsApp', 'Autre'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Campagne" value={form.campaign} onChange={f('campaign')} placeholder="Nom de la campagne" />
        </div>
        <Input label="Ad Set" value={form.adSet} onChange={f('adSet')} placeholder="Nom du Ad Set" />
      </form>
    </Modal>
  )
}
