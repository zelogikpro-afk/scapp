import { useState, useEffect } from 'react'
import { Save, Building, Palette, Shield, CreditCard, BookOpen, Sun, Moon, Plus, CheckCircle, Zap, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import type { Role } from '../../types'
import toast from 'react-hot-toast'

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
  { id: 'integrations', label: "Intégrations", icon: Zap },
  { id: 'appearance', label: "Apparence", icon: Palette },
]

interface ProfileUser {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
}

interface UserForm { name: string; email: string; role: Role; password: string }

async function createUserAdmin(email: string, password: string, name: string, role: Role): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_user_admin', {
    p_email: email, p_password: password, p_name: name, p_role: role,
  })
  if (error) throw new Error(error.message)
  return data
}

function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<UserForm>({ name: '', email: '', role: 'sales_agent', password: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.email || !form.name || !form.password) return
    if (form.password.length < 8) { setError('Mot de passe trop court (min. 8 caractères)'); return }
    setLoading(true)
    setError('')
    try {
      await createUserAdmin(form.email, form.password, form.name, form.role)
      setDone(true)
      onCreated()
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue')
    }
    setLoading(false)
  }

  if (done) return (
    <Modal open onClose={onClose} title="Utilisateur créé" size="sm">
      <div className="text-center space-y-4 py-4">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Compte <strong>{form.name}</strong> créé et opérationnel immédiatement.<br />
          <span className="text-xs text-gray-400 mt-1 block">Email: {form.email}</span>
        </p>
        <Button variant="primary" onClick={onClose}>Fermer</Button>
      </div>
    </Modal>
  )

  return (
    <Modal open onClose={onClose} title="Créer un compte utilisateur" size="sm">
      <div className="space-y-4">
        <Input label="Nom complet *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Prénom Nom" />
        <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
        <Input label="Mot de passe *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 caractères" />
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rôle</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="sales_agent">Agent Commercial</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
        <p className="text-xs text-gray-400">Le compte sera actif immédiatement, sans confirmation email.</p>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !form.email || !form.name || !form.password}>
            {loading ? 'Création…' : 'Créer le compte'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function EditUserModal({ user, onClose, onSaved }: { user: ProfileUser; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role, isActive: user.isActive })
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name: form.name, role: form.role, is_active: form.isActive })
      .eq('id', user.id)
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Utilisateur mis à jour')
    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Modifier — ${user.name}`} size="sm">
      <div className="space-y-4">
        <Input label="Nom complet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <Input label="Email" type="email" value={form.email} disabled
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rôle</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="sales_agent">Agent Commercial</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
          <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Compte actif</label>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function MetaIntegrationPanel() {
  const [settings, setSettings] = useState({ meta_page_access_token: '', meta_form_ids: '', meta_campaign_name: 'Meta Ads', meta_webhook_verify_token: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    supabase.from('app_settings').select('key,value').then(({ data }) => {
      if (data) {
        const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]))
        setSettings(s => ({ ...s, ...map }))
      }
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() })
    }
    toast.success('Paramètres Meta sauvegardés !')
    setSaving(false)
  }

  async function syncNow() {
    setSyncing(true)
    try {
      const res = await fetch('/api/meta-sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) toast.error(data.error)
      else toast.success(`${data.imported} leads synchronisés depuis Meta !`)
    } catch { toast.error('Erreur de connexion') }
    setSyncing(false)
  }

  if (loading) return <Card><p className="text-sm text-gray-400">Chargement…</p></Card>

  const webhookUrl = `https://success-compass.vercel.app/api/meta-webhook`

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Meta Lead Ads</h3>
            <p className="text-xs text-gray-500">Synchronisation automatique des formulaires Facebook / Instagram</p>
          </div>
        </div>

        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Page Access Token *</label>
            <div className="flex gap-2">
              <input
                type={showToken ? 'text' : 'password'}
                value={settings.meta_page_access_token}
                onChange={e => setSettings(s => ({ ...s, meta_page_access_token: e.target.value }))}
                placeholder="EAAxxxxxxxxxxxxxxx…"
                className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button onClick={() => setShowToken(v => !v)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Token de ta page Facebook Business (voir guide ci-dessous)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Form IDs * <span className="font-normal text-gray-400">(séparés par des virgules)</span></label>
            <input
              type="text"
              value={settings.meta_form_ids}
              onChange={e => setSettings(s => ({ ...s, meta_form_ids: e.target.value }))}
              placeholder="2164509827659924, 1234567890"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">IDs des formulaires Lead Ads (depuis Meta Business Suite → Formulaires)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom de la campagne</label>
            <input
              type="text"
              value={settings.meta_campaign_name}
              onChange={e => setSettings(s => ({ ...s, meta_campaign_name: e.target.value }))}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={save} disabled={saving}>
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </Button>
            <Button variant="outline" icon={<RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />} onClick={syncNow} disabled={syncing || !settings.meta_page_access_token}>
              {syncing ? 'Synchronisation…' : 'Tester la sync'}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Webhook temps réel <span className="text-xs font-normal text-gray-400 ml-1">(leads instantanés)</span></h4>
        <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">URL du webhook à coller dans Meta :</p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 font-mono text-xs border border-gray-100 dark:border-gray-700 truncate">{webhookUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Copié !') }} className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap">Copier</button>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Verify Token (à coller dans Meta) :</p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 font-mono text-xs border border-gray-100 dark:border-gray-700">{settings.meta_webhook_verify_token}</code>
              <button onClick={() => { navigator.clipboard.writeText(settings.meta_webhook_verify_token); toast.success('Copié !') }} className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap">Copier</button>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Guide rapide — obtenir le Page Access Token :</p>
            <ol className="list-decimal list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
              <li>Va sur <strong>developers.facebook.com</strong> → Mes applications</li>
              <li>Crée une app (type : Business) si pas encore fait</li>
              <li>Ajoute le produit <strong>Lead Ads</strong></li>
              <li>Outils → <strong>Explorateur de l'API Graph</strong></li>
              <li>Sélectionne ta Page → génère un token avec <strong>leads_retrieval</strong> + <strong>pages_read_engagement</strong></li>
              <li>Convertis en token longue durée : <strong>Outils → Débogueur de tokens</strong> → Étendre</li>
              <li>Colle le token ici et sauvegarde</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('company')
  const { isDark, toggleDark } = useAuthStore()
  const [showInvite, setShowInvite] = useState(false)
  const [editUser, setEditUser] = useState<ProfileUser | null>(null)
  const [users, setUsers] = useState<ProfileUser[]>([])

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, role, is_active')
      .order('name')
    if (data) setUsers(data.map((u: any) => ({
      id: u.id, name: u.name || u.email, email: u.email,
      role: u.role as Role, isActive: u.is_active ?? true,
    })))
  }

  useEffect(() => { if (tab === 'users') fetchUsers() }, [tab])

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
                <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={() => toast.success('Paramètres sauvegardés')}>
                  Enregistrer
                </Button>
              </div>
            </Card>
          )}

          {tab === 'users' && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Gestion des utilisateurs</h3>
              <div className="space-y-3">
                {users.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Chargement…</p>}
                {users.map(user => (
                  <div key={user.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <Avatar name={user.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <Badge variant={ROLE_COLORS[user.role] || 'default'}>{ROLE_LABELS[user.role] || user.role}</Badge>
                    <Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Actif' : 'Inactif'}</Badge>
                    <Button variant="outline" size="sm" onClick={() => setEditUser(user)}>Modifier</Button>
                  </div>
                ))}
              </div>
              <Button variant="primary" className="mt-4" icon={<Plus className="w-4 h-4" />} onClick={() => setShowInvite(true)}>
                Inviter un utilisateur
              </Button>
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
              <Button variant="primary" className="mt-4" icon={<Plus className="w-4 h-4" />}>Ajouter un programme</Button>
            </Card>
          )}

          {tab === 'integrations' && <MetaIntegrationPanel />}

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

      {/* Modals */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onCreated={fetchUsers} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />}
    </div>
  )
}
