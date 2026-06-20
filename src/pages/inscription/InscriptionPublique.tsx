import { useState, useEffect } from 'react'
import { ChevronRight, CheckCircle, FileText } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'

type ModalitePaiement = 'complet' | 'acompte' | 'echelonne'

interface Programme { id: string; name: string; price: number; color?: string }

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

export default function InscriptionPublique() {
  const [form, setForm] = useState<FormData>(initial)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
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

  const setF = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const amountPaid = parseFloat(form.montantPaye) || 0
  const remaining = selectedPrix - amountPaid

  function validate1() {
    const e: typeof errors = {}
    if (!form.nom.trim()) e.nom = 'Champ requis'
    if (!form.prenom.trim()) e.prenom = 'Champ requis'
    if (!form.telephone.trim()) e.telephone = 'Champ requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate1()) { setStep(1); return }
    setSaving(true)
    try {
      const horaire = form.horaire === 'autre' ? form.horaireAutre : form.horaire

      // Insert inscription
      const { data: inscription, error: insError } = await supabaseAdmin
        .from('prospect_inscriptions')
        .insert({
          nom: form.nom.toUpperCase(), prenom: form.prenom,
          genre: form.genre, date_naissance: form.dateNaissance || null,
          telephone: form.telephone, email: form.email || null,
          adresse: form.adresse || null, ville: form.ville || null,
          cin: form.cin || null, programme: selectedNom,
          modalite: form.modalite, horaire,
          prix_formation: selectedPrix,
          modalite_paiement: form.modalitePaiement,
          montant_paye: amountPaid,
          date_versement_2: form.dateVersement2 || null,
          date_versement_3: form.dateVersement3 || null,
          statut: 'en_attente',
        })
        .select('id')
        .single()
      if (insError) throw new Error(insError.message)

      // Create / upsert lead in CRM with full form data
      await supabaseAdmin.from('leads').insert({
        first_name: form.prenom,
        last_name: form.nom.toUpperCase(),
        phone: form.telephone,
        whatsapp: form.telephone,
        email: form.email || null,
        city: form.ville || null,
        source: 'Formulaire inscription',
        program_interest: selectedNom,
        status: 'new',
        genre: form.genre,
        date_naissance: form.dateNaissance || null,
        adresse: form.adresse || null,
        cin: form.cin || null,
        modalite_participation: form.modalite,
        horaire_preference: horaire,
        modalite_paiement: form.modalitePaiement,
        montant_verse: amountPaid,
        prix_formation: selectedPrix,
        date_versement_2: form.dateVersement2 || null,
        date_versement_3: form.dateVersement3 || null,
        inscription_id: inscription?.id || null,
        tags: ['inscription-web'],
      })

      setDone(true)
    } catch (err: any) {
      alert('Erreur lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const inpErr = 'w-full px-3 py-2.5 rounded-lg border border-red-400 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Inscription envoyée !</h2>
          <p className="text-gray-500 text-sm mb-6">
            Votre fiche d'inscription a bien été reçue. L'équipe Success Compass vous contactera prochainement pour confirmer votre place.
          </p>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-left">
            <p className="text-xs font-semibold text-amber-700 mb-2">N'oubliez pas de préparer :</p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Copie CIN recto verso</li>
              <li>• Copie du dernier diplôme obtenu</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400 mt-6">info@successcompass.ma · 06 03 60 97 92</p>
        </div>
      </div>
    )
  }

  const steps = [{ n: 1, label: 'Informations' }, { n: 2, label: 'Formation' }, { n: 3, label: 'Paiement' }]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Success Compass" className="w-20 h-20 object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Fiche d'inscription</h1>
          <p className="text-gray-500 text-sm mt-1">Success Compass Academy</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-blue-100 rounded-full">
            <span className="text-xs font-medium text-blue-700">{selectedNom || 'Chargement...'}</span>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                step === s.n ? 'bg-blue-600 text-white'
                : step > s.n ? 'bg-blue-50 text-blue-600'
                : 'text-gray-400'}`}>
                <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${
                  step === s.n ? 'bg-white/20' : step > s.n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{s.n}</span>
                {s.label}
              </div>
              {i < 2 && <ChevronRight className="w-3 h-3 text-gray-300" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1 */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-5">Informations personnelles</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Nom <span className="text-red-500">*</span></label>
                  <input className={errors.nom ? inpErr : inp} value={form.nom} onChange={e => setF('nom', e.target.value)} placeholder="NOM" />
                  {errors.nom && <p className="text-red-500 text-xs mt-0.5">{errors.nom}</p>}
                </div>
                <div>
                  <label className={lbl}>Prénom <span className="text-red-500">*</span></label>
                  <input className={errors.prenom ? inpErr : inp} value={form.prenom} onChange={e => setF('prenom', e.target.value)} placeholder="Prénom" />
                  {errors.prenom && <p className="text-red-500 text-xs mt-0.5">{errors.prenom}</p>}
                </div>
                <div>
                  <label className={lbl}>Genre</label>
                  <div className="flex gap-4 mt-2">
                    {(['female', 'male'] as const).map(g => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                        <input type="radio" name="genre" value={g} checked={form.genre === g}
                          onChange={() => setF('genre', g)} className="accent-blue-600" />
                        {g === 'female' ? 'Femme' : 'Homme'}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Date de naissance</label>
                  <input type="date" className={inp} value={form.dateNaissance} onChange={e => setF('dateNaissance', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>N° de contact <span className="text-red-500">*</span></label>
                  <input className={errors.telephone ? inpErr : inp} value={form.telephone} onChange={e => setF('telephone', e.target.value)} placeholder="06 XX XX XX XX" />
                  {errors.telephone && <p className="text-red-500 text-xs mt-0.5">{errors.telephone}</p>}
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input type="email" className={inp} value={form.email} onChange={e => setF('email', e.target.value)} placeholder="email@exemple.ma" />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Adresse</label>
                  <input className={inp} value={form.adresse} onChange={e => setF('adresse', e.target.value)} placeholder="Adresse complète" />
                </div>
                <div>
                  <label className={lbl}>Ville</label>
                  <input className={inp} value={form.ville} onChange={e => setF('ville', e.target.value)} placeholder="Rabat" />
                </div>
                <div>
                  <label className={lbl}>CIN</label>
                  <input className={inp} value={form.cin} onChange={e => setF('cin', e.target.value)} placeholder="AB123456" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={() => { if (validate1()) setStep(2) }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">Suivant →</button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-5">Formation suivie</h2>
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
                        <label key={m} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
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
                        <label key={h} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
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

              {/* Documents */}
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-700">Documents requis</h3>
                </div>
                <ul className="text-sm text-amber-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0">1</span>
                    Copie de la CIN <span className="font-medium">(recto verso)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0">2</span>
                    Copie du <span className="font-medium">dernier diplôme obtenu</span>
                  </li>
                </ul>
                <p className="text-xs text-amber-600 mt-3">Ces documents sont à envoyer par WhatsApp ou email après soumission de ce formulaire.</p>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">← Retour</button>
                <button type="button" onClick={() => setStep(3)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">Suivant →</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-5">Tarif & paiement</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={lbl}>Prix de la formation</label>
                    <div className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 font-semibold text-gray-900 text-sm">
                      {selectedPrix.toLocaleString('fr-MA')} MAD
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Modalités de paiement</label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {([
                        { v: 'complet', l: 'Paiement complet' },
                        { v: 'acompte', l: 'Acompte + solde' },
                        { v: 'echelonne', l: 'Échelonné (3x)' },
                      ] as const).map(({ v, l }) => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                          <input type="radio" name="modalitePaiement" value={v}
                            checked={form.modalitePaiement === v}
                            onChange={() => setForm(prev => ({
                              ...prev, modalitePaiement: v,
                              montantPaye: v === 'complet' ? String(selectedPrix) : prev.montantPaye,
                            }))}
                            className="accent-blue-600" />
                          {l}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>{form.modalitePaiement === 'complet' ? 'Montant payé (MAD)' : '1er versement (MAD)'}</label>
                    <input type="number" className={inp} value={form.montantPaye}
                      onChange={e => setF('montantPaye', e.target.value)} placeholder="0" min="0" />
                  </div>
                  <div>
                    <label className={lbl}>Reste à payer</label>
                    <div className={`px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {remaining.toLocaleString('fr-MA')} MAD
                    </div>
                  </div>
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
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Récapitulatif</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Nom</span><span className="font-medium">{form.nom} {form.prenom}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Contact</span><span className="font-medium">{form.telephone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Programme</span><span className="font-medium text-blue-700">Niveau 1</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Modalité</span><span className="font-medium">{form.modalite === 'presentiel' ? 'Présentiel' : 'En ligne'}</span></div>
                  <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                    <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">{selectedPrix.toLocaleString('fr-MA')} MAD</span></div>
                    {form.dateVersement2 && <div className="flex justify-between"><span className="text-gray-500">2e versement</span><span className="font-medium">{form.dateVersement2}</span></div>}
                    {form.dateVersement3 && <div className="flex justify-between"><span className="text-gray-500">3e versement</span><span className="font-medium">{form.dateVersement3}</span></div>}
                  </div>
                </div>
              </div>

              {/* Engagement */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                <p className="text-xs font-semibold text-blue-700 mb-1.5">En soumettant ce formulaire, je m'engage à :</p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Respecter le règlement intérieur de Success Compass</li>
                  <li>Participer activement aux sessions de formation</li>
                  <li>Respecter la charte éthique et les conditions générales</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">← Retour</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                  {saving ? 'Envoi en cours...' : 'Soumettre ma fiche'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          info@successcompass.ma · www.successcompass.ma · 06 03 60 97 92
        </p>
      </div>
    </div>
  )
}
