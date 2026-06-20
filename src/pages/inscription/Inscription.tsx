import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { UserPlus, ChevronRight, FileText } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { supabaseAdmin } from '../../lib/supabase'

interface Programme { id: string; name: string; price: number; color?: string }

type ModalitePaiement = 'complet' | 'acompte' | 'echelonne'

interface FormData {
  nom: string; prenom: string; genre: 'female' | 'male'
  dateNaissance: string; telephone: string; email: string
  adresse: string; ville: string; cin: string
  modalite: 'presentiel' | 'enligne'; horaire: '10h-14h' | '14h30-18h30' | 'autre'
  horaireAutre: string; modalitePaiement: ModalitePaiement
  montantPaye: string; dateVersement2: string; dateVersement3: string
}

const initial: FormData = {
  nom: '', prenom: '', genre: 'female', dateNaissance: '', telephone: '',
  email: '', adresse: '', ville: '', cin: '',
  modalite: 'presentiel', horaire: '10h-14h', horaireAutre: '',
  modalitePaiement: 'complet', montantPaye: '',
  dateVersement2: '', dateVersement3: '',
}

export default function Inscription() {
  const navigate = useNavigate()
  const { addParticipant, addPayment } = useAppStore()
  const [form, setForm] = useState<FormData>(initial)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')

  useEffect(() => {
    supabaseAdmin.from('training_programs').select('id, name, price, color').eq('is_active', true).then(({ data }) => {
      if (data && data.length > 0) {
        const progs = data.map(r => ({ id: r.id, name: r.name, price: r.price, color: r.color }))
        setProgrammes(progs)
        setSelectedProgramId(progs[0].id)
        setForm(prev => ({ ...prev, montantPaye: String(progs[0].price) }))
      }
    })
  }, [])

  const selectedProg = programmes.find(p => p.id === selectedProgramId)
  const selectedNom = selectedProg?.name ?? ''
  const selectedPrix = selectedProg?.price ?? 0

  const setF = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const amountPaid = parseFloat(form.montantPaye) || 0
  const remaining = selectedPrix - amountPaid

  function getStatus() {
    if (amountPaid <= 0) return 'pending' as const
    if (amountPaid >= selectedPrix) return 'paid' as const
    return 'partial' as const
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.prenom || !form.telephone) {
      toast.error('Veuillez remplir les champs obligatoires')
      return
    }
    setSaving(true)
    try {
      await addParticipant({
        firstName: form.prenom, lastName: form.nom, email: form.email,
        phone: form.telephone, gender: form.genre,
        birthDate: form.dateNaissance || undefined, cin: form.cin || undefined,
        address: form.adresse || undefined, type: 'training',
        notes: `Ville: ${form.ville}`, tags: [], isActive: true, whatsapp: form.telephone,
      })
      const participants = useAppStore.getState().participants
      const newP = participants[0]
      if (selectedPrix > 0) {
        await addPayment({
          participantId: newP?.id, participantName: `${form.nom} ${form.prenom}`,
          programName: selectedNom, programType: 'training',
          totalAmount: selectedPrix, amountPaid, status: getStatus(),
          method: 'cash', date: new Date().toISOString().split('T')[0], notes: 'Niveau 1',
        } as any)
      }
      toast.success('Inscription enregistrée avec succès')
      setForm(initial)
      setStep(1)
      navigate('/participants')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const lbl = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
  const card = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6'
  const steps = [
    { n: 1, label: 'Informations' },
    { n: 2, label: 'Formation' },
    { n: 3, label: 'Paiement' },
  ]

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Contrat de formation</h1>
          <p className="text-sm text-gray-500">Success Compass Academy</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <button type="button" onClick={() => setStep(s.n as 1 | 2 | 3)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                step === s.n ? 'bg-blue-600 text-white'
                : step > s.n ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'}`}>
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                step === s.n ? 'bg-white/20' : step > s.n ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>{s.n}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1 */}
        {step === 1 && (
          <div className={card}>
            <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-5">Informations personnelles</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Nom <span className="text-red-500">*</span></label>
                <input className={inp} value={form.nom} onChange={e => setF('nom', e.target.value)} placeholder="NOM" required /></div>
              <div><label className={lbl}>Prénom <span className="text-red-500">*</span></label>
                <input className={inp} value={form.prenom} onChange={e => setF('prenom', e.target.value)} placeholder="Prénom" required /></div>
              <div><label className={lbl}>Genre</label>
                <div className="flex gap-4 mt-2">
                  {(['female', 'male'] as const).map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input type="radio" name="genre" value={g} checked={form.genre === g}
                        onChange={() => setF('genre', g)} className="accent-blue-600" />
                      {g === 'female' ? 'Femme' : 'Homme'}
                    </label>
                  ))}
                </div>
              </div>
              <div><label className={lbl}>Date de naissance</label>
                <input type="date" className={inp} value={form.dateNaissance} onChange={e => setF('dateNaissance', e.target.value)} /></div>
              <div><label className={lbl}>N° de contact <span className="text-red-500">*</span></label>
                <input className={inp} value={form.telephone} onChange={e => setF('telephone', e.target.value)} placeholder="06 XX XX XX XX" required /></div>
              <div><label className={lbl}>Email</label>
                <input type="email" className={inp} value={form.email} onChange={e => setF('email', e.target.value)} placeholder="email@exemple.ma" /></div>
              <div className="col-span-2"><label className={lbl}>Adresse</label>
                <input className={inp} value={form.adresse} onChange={e => setF('adresse', e.target.value)} placeholder="Adresse complète" /></div>
              <div><label className={lbl}>Ville</label>
                <input className={inp} value={form.ville} onChange={e => setF('ville', e.target.value)} placeholder="Rabat" /></div>
              <div><label className={lbl}>CIN</label>
                <input className={inp} value={form.cin} onChange={e => setF('cin', e.target.value)} placeholder="AB123456" /></div>
            </div>
            <div className="flex justify-end mt-6">
              <button type="button" onClick={() => setStep(2)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">Suivant →</button>
            </div>
          </div>
        )}

        {/* Step 2 — Formation */}
        {step === 2 && (
          <div className="space-y-4">
            <div className={card}>
              <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-5">Formation suivie</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={lbl}>Programme <span className="text-red-500">*</span></label>
                  <select className={inp} value={selectedProgramId}
                    onChange={e => {
                      const prog = programmes.find(p => p.id === e.target.value)
                      setSelectedProgramId(e.target.value)
                      setForm(prev => ({ ...prev, montantPaye: prog ? String(prog.price) : prev.montantPaye }))
                    }}>
                    {programmes.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString('fr-MA')} MAD</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Modalité</label>
                  <div className="flex gap-4 mt-2">
                    {(['presentiel', 'enligne'] as const).map(m => (
                      <label key={m} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input type="radio" name="modalite" value={m} checked={form.modalite === m}
                          onChange={() => setF('modalite', m)} className="accent-blue-600" />
                        {m === 'presentiel' ? 'Présentiel' : 'En ligne'}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Horaires</label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {(['10h-14h', '14h30-18h30', 'autre'] as const).map(h => (
                      <label key={h} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input type="radio" name="horaire" value={h} checked={form.horaire === h}
                          onChange={() => setF('horaire', h)} className="accent-blue-600" />
                        {h === 'autre' ? 'Autre' : h}
                      </label>
                    ))}
                  </div>
                </div>
                {form.horaire === 'autre' && (
                  <div className="col-span-2">
                    <label className={lbl}>Préciser l'horaire</label>
                    <input className={inp} value={form.horaireAutre} onChange={e => setF('horaireAutre', e.target.value)} placeholder="Horaire personnalisé" />
                  </div>
                )}
              </div>
            </div>

            {/* Documents requis */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Documents requis</h3>
              </div>
              <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-center flex-shrink-0">1</span>
                  Copie de la CIN <span className="font-medium">(recto verso)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-center flex-shrink-0">2</span>
                  Copie du <span className="font-medium">dernier diplôme obtenu</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="px-5 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">← Retour</button>
              <button type="button" onClick={() => setStep(3)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">Suivant →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Paiement */}
        {step === 3 && (
          <div className="space-y-4">
            <div className={card}>
              <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-5">Tarif & paiement</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={lbl}>Prix de la formation</label>
                  <div className={`${inp} bg-gray-50 dark:bg-gray-700/50 font-semibold text-gray-900 dark:text-white`}>
                    {selectedPrix.toLocaleString('fr-MA')} MAD
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Modalités de paiement</label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {([
                      { v: 'complet', l: 'Paiement complet' },
                      { v: 'acompte', l: 'Acompte + solde' },
                      { v: 'echelonne', l: 'Paiement échelonné (3x)' },
                    ] as const).map(({ v, l }) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input type="radio" name="modalitePaiement" value={v}
                          checked={form.modalitePaiement === v}
                          onChange={() => {
                            setForm(prev => ({
                              ...prev, modalitePaiement: v,
                              montantPaye: v === 'complet' ? String(selectedPrix) : prev.montantPaye,
                            }))
                          }}
                          className="accent-blue-600" />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={lbl}>{form.modalitePaiement === 'complet' ? 'Montant payé' : '1er versement (MAD)'}</label>
                  <input type="number" className={inp} value={form.montantPaye}
                    onChange={e => setF('montantPaye', e.target.value)} placeholder="0" min="0" />
                </div>
                <div>
                  <label className={lbl}>Reste à payer</label>
                  <div className={`${inp} ${remaining > 0 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-green-600 dark:text-green-400 font-medium'}`}>
                    {remaining.toLocaleString('fr-MA')} MAD
                  </div>
                </div>

                {/* Dates versements suivants */}
                {(form.modalitePaiement === 'acompte' || form.modalitePaiement === 'echelonne') && (
                  <>
                    <div>
                      <label className={lbl}>Date 2e versement prévu</label>
                      <input type="date" className={inp} value={form.dateVersement2}
                        onChange={e => setF('dateVersement2', e.target.value)} />
                    </div>
                    {form.modalitePaiement === 'echelonne' && (
                      <div>
                        <label className={lbl}>Date 3e versement prévu</label>
                        <input type="date" className={inp} value={form.dateVersement3}
                          onChange={e => setF('dateVersement3', e.target.value)} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Récap */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Participant</span><span className="font-medium text-gray-900 dark:text-white">{form.nom} {form.prenom}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Programme</span><span className="font-medium text-gray-900 dark:text-white">{selectedNom}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Modalité</span><span className="font-medium text-gray-900 dark:text-white">{form.modalite === 'presentiel' ? 'Présentiel' : 'En ligne'} · {form.horaire === 'autre' ? form.horaireAutre : form.horaire}</span></div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold text-gray-900 dark:text-white">{selectedPrix.toLocaleString('fr-MA')} MAD</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Payé</span><span className="font-semibold text-green-600 dark:text-green-400">{amountPaid.toLocaleString('fr-MA')} MAD</span></div>
                  {remaining > 0 && <div className="flex justify-between"><span className="text-gray-500">Reste</span><span className="font-semibold text-amber-600 dark:text-amber-400">{remaining.toLocaleString('fr-MA')} MAD</span></div>}
                  {form.dateVersement2 && <div className="flex justify-between"><span className="text-gray-500">2e versement prévu</span><span className="font-medium text-gray-900 dark:text-white">{form.dateVersement2}</span></div>}
                  {form.dateVersement3 && <div className="flex justify-between"><span className="text-gray-500">3e versement prévu</span><span className="font-medium text-gray-900 dark:text-white">{form.dateVersement3}</span></div>}
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Le paiement complet doit être effectué avant la fin de la formation.</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 p-5">
              <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Engagement du participant</h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>Respecter le règlement intérieur</li>
                <li>Participer activement aux sessions</li>
                <li>Respecter la charte éthique et les conditions générales de Success Compass</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="px-5 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">← Retour</button>
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? 'Enregistrement...' : 'Valider l\'inscription'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
