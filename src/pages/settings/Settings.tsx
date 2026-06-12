import { useState } from 'react'
import { Save, Building, Palette, Shield, CreditCard, BookOpen, Award, Sun, Moon } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { USERS } from '../../lib/mockData'
import { useAuthStore } from '../../store/authStore'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', sales_agent: 'Agent Commercial', coach: 'Coach',
}
const ROLE_COLORS: Record<string, any> = {
  super_admin: 'danger', admin: 'warning', sales_agent: 'info', coach: 'success',
}

const TABS = [
  { id: 'company', label: "Entreprise", icon: Building },
  { id: 'users', label: "Utilisateurs", icon: Shield },
  { id: 'programs', label: "Programmes", icon: BookOpen },
  { id: 'payments', label: "Paiements", icon: CreditCard },
  { id: 'appearance', label: "Apparence", icon: Palette },
]

export default function Settings() {
  const [tab, setTab] = useState('company')
  const { isDark, toggleDark } = useAuthStore()

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Paramètres</h2>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-52 flex-shrink-0 space-y-0.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${tab === t.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <t.icon className="w-4 h-4 flex-shrink-0" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'company' && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Informations de l'entreprise</h3>
              <div className="space-y-4 max-w-md">
                <Input label="Nom de l'entreprise" defaultValue="Success Compass SARL" />
                <Input label="Email" defaultValue="contact@successcompass.ma" />
                <Input label="Téléphone" defaultValue="+212 5XX XX XX XX" />
                <Input label="Site web" defaultValue="www.successcompass.ma" />
                <Input label="Adresse" defaultValue="Casablanca, Maroc" />
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    defaultValue="Entreprise spécialisée dans le coaching de vie et la formation professionnelle."
                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <Button variant="primary" icon={<Save className="w-4 h-4" />}>Enregistrer</Button>
              </div>
            </Card>
          )}

          {tab === 'users' && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Gestion des utilisateurs</h3>
              <div className="space-y-3">
                {USERS.map(user => (
                  <div key={user.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <Avatar name={user.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <Badge variant={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                    <Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Actif' : 'Inactif'}</Badge>
                    <Button variant="outline" size="sm">Modifier</Button>
                  </div>
                ))}
              </div>
              <Button variant="primary" className="mt-4">Inviter un utilisateur</Button>
            </Card>
          )}

          {tab === 'appearance' && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Apparence</h3>
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Mode sombre</p>
                    <p className="text-xs text-gray-400 mt-0.5">Basculer entre clair et sombre</p>
                  </div>
                  <button
                    onClick={toggleDark}
                    className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}>
                      {isDark ? <Moon className="w-3 h-3 text-gray-500" /> : <Sun className="w-3 h-3 text-amber-500" />}
                    </span>
                  </button>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur principale</p>
                  <div className="flex gap-2">
                    {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'].map(color => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-gray-400 transition-all"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {tab === 'programs' && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Programmes</h3>
              <div className="space-y-3">
                {[
                  { name: 'Coach de Vie Niveau 1', price: '12 000 MAD', sessions: '30 jours' },
                  { name: 'Coach de Vie Niveau 2', price: '15 000 MAD', sessions: '45 jours' },
                  { name: 'Life Coach Certification', price: '25 000 MAD', sessions: '60 jours' },
                  { name: 'Pack Essentiel 6 séances', price: '5 400 MAD', sessions: '6 séances' },
                  { name: 'Pack Premium 10 séances', price: '8 000 MAD', sessions: '10 séances' },
                ].map(prog => (
                  <div key={prog.name} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{prog.name}</p>
                      <p className="text-xs text-gray-400">{prog.sessions}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{prog.price}</p>
                    <Button variant="outline" size="sm">Modifier</Button>
                  </div>
                ))}
              </div>
              <Button variant="primary" className="mt-4">Ajouter un programme</Button>
            </Card>
          )}

          {tab === 'payments' && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Méthodes de paiement</h3>
              <div className="space-y-3 max-w-md">
                {['Espèces', 'Virement bancaire', 'Carte bancaire', 'Chèque'].map(method => (
                  <div key={method} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{method}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Actif</Badge>
                      <Button variant="ghost" size="sm">Désactiver</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
