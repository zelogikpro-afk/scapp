import { useState, useRef, useCallback } from 'react'
import { GraduationCap, ChevronRight, FileText, CheckCircle, PenLine, RotateCcw } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'

const FRAIS_INSCRIPTION = 500
const MENSUALITE_JUNIOR = 800
const MENSUALITE_SENIOR = 1000

function getMensualite(age: number | null) {
  if (!age) return null
  if (age >= 12 && age <= 17) return MENSUALITE_JUNIOR
  if (age >= 18 && age <= 25) return MENSUALITE_SENIOR
  return null
}

function isMineur(age: number | null) {
  return age !== null && age >= 12 && age <= 17
}

function SignaturePad({ onSave, onClear, signed }: {
  onSave: (dataUrl: string) => void
  onClear: () => void
  signed: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#059669'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    drawing.current = true
    lastPos.current = getPos(e, canvas)
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    if (lastPos.current) {
      ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y); ctx.stroke()
    }
    lastPos.current = pos
  }, [])

  const endDraw = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false; lastPos.current = null
    onSave(canvasRef.current!.toDataURL('image/png'))
  }, [onSave])

  const clear = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    onClear()
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white" style={{ touchAction: 'none' }}>
        <canvas ref={canvasRef} width={640} height={160} className="w-full cursor-crosshair block" style={{ height: '120px' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        {!signed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-gray-300 select-none">Signez ici</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{signed ? '✓ Signature enregistrée' : 'Dessinez votre signature ci-dessus'}</span>
        <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
          <RotateCcw className="w-3 h-3" /> Effacer
        </button>
      </div>
    </div>
  )
}

const ATTENTES = [
  'Confiance en soi',
  'Réussite scolaire',
  'Motivation',
  'Communication',
  'Gestion des émotions',
  'Orientation',
  'Concentration / organisation',
  'Relations sociales',
  'Vision de l\'avenir',
  'Préparation au monde professionnel',
  'Développement personnel',
]

const SITUATIONS = [
  'Étudiant(e)',
  'Salarié(e)',
  'En recherche d\'emploi',
  'Entrepreneur / Auto-entrepreneur',
  'Autre',
]

const LIENS = ['Père', 'Mère', 'Tuteur légal', 'Autre']

interface FormData {
  // Section A — Le jeune
  nomJeune: string; prenomJeune: string; dateNaissance: string; ageJeune: string
  telJeune: string; emailJeune: string; ville: string
  etablissement: string; niveauEtudes: string; filiere: string
  // Section B — Représentant légal (12–17)
  nomParent: string; prenomParent: string; lienParent: string
  telParent: string; emailParent: string; adresseParent: string
  // Section C — Situation (18–25)
  situationActuelle: string
  // Attentes
  attentes: string[]; autreAttente: string
  // Autorisations
  autorisationParentale: boolean
  autorisationPhotos: 'oui' | 'non' | ''
}

const initial: FormData = {
  nomJeune: '', prenomJeune: '', dateNaissance: '', ageJeune: '',
  telJeune: '', emailJeune: '', ville: '', etablissement: '', niveauEtudes: '', filiere: '',
  nomParent: '', prenomParent: '', lienParent: '', telParent: '', emailParent: '', adresseParent: '',
  situationActuelle: '', attentes: [], autreAttente: '',
  autorisationParentale: false, autorisationPhotos: '',
}

export default function InscriptionClassesAvenirPublique() {
  const [form, setForm] = useState<FormData>(initial)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [signature, setSignature] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const ageNum = parseInt(form.ageJeune) || null
  const mineurMode = isMineur(ageNum)
  const mensualite = getMensualite(ageNum)

  const setF = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const toggleAttente = (a: string) => {
    setForm(prev => {
      const arr = prev.attentes.includes(a)
        ? prev.attentes.filter(x => x !== a)
        : [...prev.attentes, a]
      return { ...prev, attentes: arr }
    })
  }

  function validate1() {
    const e: typeof errors = {}
    if (!form.nomJeune.trim()) e.nomJeune = 'Champ requis'
    if (!form.prenomJeune.trim()) e.prenomJeune = 'Champ requis'
    if (!form.ageJeune.trim()) e.ageJeune = 'Champ requis'
    if (!form.telJeune.trim()) e.telJeune = 'Champ requis'
    if (ageNum !== null && (ageNum < 12 || ageNum > 25)) e.ageJeune = 'Le programme est ouvert aux 12–25 ans'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validate2() {
    const e: typeof errors = {}
    if (mineurMode) {
      if (!form.nomParent.trim()) e.nomParent = 'Champ requis'
      if (!form.prenomParent.trim()) e.prenomParent = 'Champ requis'
      if (!form.telParent.trim()) e.telParent = 'Champ requis'
      if (!form.lienParent) e.lienParent = 'Champ requis'
      if (!form.autorisationParentale) e.autorisationParentale = 'Vous devez cocher cette autorisation pour continuer'
    } else {
      if (!form.situationActuelle) e.situationActuelle = 'Veuillez indiquer votre situation'
    }
    if (!form.autorisationPhotos) e.autorisationPhotos = 'Veuillez indiquer votre choix concernant les photos/vidéos'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signature) { alert('Veuillez signer le formulaire avant de valider.'); return }
    setSaving(true)
    try {
      const nomContact = mineurMode ? form.nomParent.toUpperCase() : form.nomJeune.toUpperCase()
      const prenomContact = mineurMode ? form.prenomParent : form.prenomJeune
      const telContact = mineurMode ? form.telParent : form.telJeune
      const emailContact = mineurMode ? form.emailParent : form.emailJeune
      const adresse = mineurMode ? form.adresseParent : null

      const attentesList = [
        ...form.attentes,
        ...(form.autreAttente.trim() ? [`Autre : ${form.autreAttente.trim()}`] : []),
      ]

      const programme = [
        `Classes de l'Avenir`,
        `${form.prenomJeune} ${form.nomJeune}`,
        `${form.ageJeune} ans`,
        form.niveauEtudes || '',
        form.filiere || '',
      ].filter(Boolean).join(' — ')

      const autorisationStr = [
        mineurMode ? `Autorisation parentale : OUI` : null,
        `Photos/vidéos : ${form.autorisationPhotos === 'oui' ? 'Autorisé' : 'Non autorisé'}`,
      ].filter(Boolean).join(' | ')

      const { error } = await supabaseAdmin.from('prospect_inscriptions').insert({
        nom: nomContact,
        prenom: prenomContact,
        genre: '',
        telephone: telContact,
        email: emailContact || null,
        adresse: adresse || null,
        ville: form.ville || null,
        programme,
        modalite: 'presentiel',
        horaire: [attentesList.join(', '), autorisationStr].filter(Boolean).join(' | ') || '-',
        prix_formation: FRAIS_INSCRIPTION,
        modalite_paiement: 'acompte',
        montant_paye: 0,
        date_naissance: null,
        date_versement_2: null,
        date_versement_3: null,
        statut: 'en_attente',
      })
      if (error) throw new Error(error.message)
      setDone(true)
    } catch (err: any) {
      alert('Erreur : ' + (err?.message || 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  const inp = (err?: string) =>
    `w-full px-3 py-2.5 rounded-xl border ${err ? 'border-red-400' : 'border-gray-300'} bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'
  const ErrMsg = ({ k }: { k: string }) => errors[k] ? <p className="text-red-500 text-xs mt-0.5">{errors[k]}</p> : null

  // ── Success page ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Inscription envoyée !</h2>
          <p className="text-gray-500 text-sm mb-6">
            Votre fiche d'inscription pour <strong>Les Classes de l'Avenir</strong> a bien été reçue.
            L'équipe Success Compass vous contactera prochainement.
          </p>

          {/* Documents à ramener */}
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-left mb-4">
            <p className="text-xs font-semibold text-amber-700 mb-2">Documents à ramener :</p>
            {mineurMode ? (
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• Copie CIN du parent / représentant légal (recto verso)</li>
                <li>• Copie CIN du jeune (si disponible)</li>
                <li>• Dernier bulletin scolaire</li>
              </ul>
            ) : (
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• Copie de la pièce d'identité</li>
              </ul>
            )}
            <p className="text-xs text-amber-700 mt-3 font-medium">
              Envoyez-les par WhatsApp, par email ou déposez-les directement dans nos locaux.
            </p>
            <p className="text-xs text-amber-600 mt-1">📧 contact@scapp.ma</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700 font-medium mb-4">
            Frais d'inscription : {FRAIS_INSCRIPTION.toLocaleString('fr-MA')} MAD
            {mensualite ? ` · Cotisation : ${mensualite.toLocaleString('fr-MA')} MAD/mois` : ''}
          </div>

          {/* Documents téléchargeables */}
          <div className="border border-gray-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Documents à imprimer et signer</p>
            <div className="flex flex-col gap-2">
              {mineurMode && (
                <a href="/docs/autorisation-parentale.html" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 font-medium transition-colors">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Télécharger l'autorisation parentale
                </a>
              )}
              <a href="/docs/reglement-classes-avenir.html" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 font-medium transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger le règlement intérieur
              </a>
            </div>
          </div>

          <p className="text-xs text-gray-400">contact@scapp.ma · 06 03 60 97 92</p>
        </div>
      </div>
    )
  }

  const stepLabels = [
    { n: 1, label: 'Le participant' },
    { n: 2, label: mineurMode ? 'Représentant légal' : 'Situation' },
    { n: 3, label: 'Attentes' },
    { n: 4, label: 'Confirmation' },
  ]

  // ── Layout wrapper ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white py-8 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Success Compass" className="w-16 h-16 object-contain mx-auto mb-3" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 rounded-full mb-3">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Les Classes de l'Avenir</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Fiche d'inscription</h1>
          <p className="text-gray-500 text-sm mt-1">Success Compass Academy · 12–25 ans</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-1.5 mb-6 flex-wrap">
          {stepLabels.map((s, i) => (
            <div key={s.n} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                step === s.n ? 'bg-emerald-600 text-white'
                : step > s.n ? 'bg-emerald-50 text-emerald-600'
                : 'text-gray-400'}`}>
                <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${
                  step === s.n ? 'bg-white/20' : step > s.n ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{s.n}</span>
                {s.label}
              </div>
              {i < 3 && <ChevronRight className="w-3 h-3 text-gray-300" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          {/* ─── Step 1 : Le Jeune (Section A) ─── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">A</span>
                <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Identité du participant</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Nom <span className="text-red-500">*</span></label>
                  <input className={inp(errors.nomJeune)} value={form.nomJeune}
                    onChange={e => setF('nomJeune', e.target.value)} placeholder="NOM" />
                  <ErrMsg k="nomJeune" />
                </div>
                <div>
                  <label className={lbl}>Prénom <span className="text-red-500">*</span></label>
                  <input className={inp(errors.prenomJeune)} value={form.prenomJeune}
                    onChange={e => setF('prenomJeune', e.target.value)} placeholder="Prénom" />
                  <ErrMsg k="prenomJeune" />
                </div>
                <div>
                  <label className={lbl}>Date de naissance</label>
                  <input type="date" className={inp()} value={form.dateNaissance}
                    onChange={e => setF('dateNaissance', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Âge <span className="text-red-500">*</span></label>
                  <input type="number" min="12" max="25" className={inp(errors.ageJeune)} value={form.ageJeune}
                    onChange={e => setF('ageJeune', e.target.value)} placeholder="ex : 14" />
                  <ErrMsg k="ageJeune" />
                  {ageNum && (
                    <p className="text-xs mt-1 font-medium text-emerald-600">
                      {isMineur(ageNum) ? '12–17 ans : représentant légal requis' : '18–25 ans'}
                    </p>
                  )}
                </div>
                <div>
                  <label className={lbl}>Téléphone <span className="text-red-500">*</span></label>
                  <input className={inp(errors.telJeune)} value={form.telJeune}
                    onChange={e => setF('telJeune', e.target.value)} placeholder="06 XX XX XX XX" />
                  <ErrMsg k="telJeune" />
                </div>
                <div>
                  <label className={lbl}>E-mail</label>
                  <input type="email" className={inp()} value={form.emailJeune}
                    onChange={e => setF('emailJeune', e.target.value)} placeholder="email@exemple.ma" />
                </div>
                <div>
                  <label className={lbl}>Ville</label>
                  <input className={inp()} value={form.ville}
                    onChange={e => setF('ville', e.target.value)} placeholder="Rabat" />
                </div>
                <div>
                  <label className={lbl}>Établissement scolaire / universitaire</label>
                  <input className={inp()} value={form.etablissement}
                    onChange={e => setF('etablissement', e.target.value)} placeholder="Nom de l'école, lycée ou fac" />
                </div>
                <div>
                  <label className={lbl}>Niveau d'études</label>
                  <input className={inp()} value={form.niveauEtudes}
                    onChange={e => setF('niveauEtudes', e.target.value)} placeholder="Ex : Tronc commun, Licence 1…" />
                </div>
                <div>
                  <label className={lbl}>Classe / Filière</label>
                  <input className={inp()} value={form.filiere}
                    onChange={e => setF('filiere', e.target.value)} placeholder="Ex : Sciences, Lettres, Droit…" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={() => { if (validate1()) setStep(2) }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2 : Section B (mineur) ou C (majeur) + Autorisations ─── */}
          {step === 2 && (
            <div className="space-y-4">

              {/* Infos parent / situation */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {mineurMode ? (
                  <>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">B</span>
                      <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Représentant légal</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Nom <span className="text-red-500">*</span></label>
                        <input className={inp(errors.nomParent)} value={form.nomParent}
                          onChange={e => setF('nomParent', e.target.value)} placeholder="NOM" />
                        <ErrMsg k="nomParent" />
                      </div>
                      <div>
                        <label className={lbl}>Prénom <span className="text-red-500">*</span></label>
                        <input className={inp(errors.prenomParent)} value={form.prenomParent}
                          onChange={e => setF('prenomParent', e.target.value)} placeholder="Prénom" />
                        <ErrMsg k="prenomParent" />
                      </div>
                      <div>
                        <label className={lbl}>Lien avec le jeune <span className="text-red-500">*</span></label>
                        <select className={inp(errors.lienParent)} value={form.lienParent}
                          onChange={e => setF('lienParent', e.target.value)}>
                          <option value="">— Sélectionner —</option>
                          {LIENS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ErrMsg k="lienParent" />
                      </div>
                      <div>
                        <label className={lbl}>Téléphone <span className="text-red-500">*</span></label>
                        <input className={inp(errors.telParent)} value={form.telParent}
                          onChange={e => setF('telParent', e.target.value)} placeholder="06 XX XX XX XX" />
                        <ErrMsg k="telParent" />
                      </div>
                      <div>
                        <label className={lbl}>E-mail</label>
                        <input type="email" className={inp()} value={form.emailParent}
                          onChange={e => setF('emailParent', e.target.value)} placeholder="email@exemple.ma" />
                      </div>
                      <div>
                        <label className={lbl}>Adresse</label>
                        <input className={inp()} value={form.adresseParent}
                          onChange={e => setF('adresseParent', e.target.value)} placeholder="N° rue, quartier, ville" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">C</span>
                      <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Situation actuelle</h2>
                    </div>
                    <div>
                      <label className={lbl}>Votre situation <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {SITUATIONS.map(s => (
                          <label key={s} className={`flex items-center gap-3 cursor-pointer text-sm p-3 rounded-xl border transition-colors ${
                            form.situationActuelle === s ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}>
                            <input type="radio" name="situation" value={s} checked={form.situationActuelle === s}
                              onChange={() => setF('situationActuelle', s)} className="accent-emerald-600 flex-shrink-0" />
                            {s}
                          </label>
                        ))}
                      </div>
                      <ErrMsg k="situationActuelle" />
                    </div>
                  </>
                )}
              </div>

              {/* Autorisation parentale (12-17 uniquement) */}
              {mineurMode && (
                <div className={`rounded-2xl border-2 p-5 ${errors.autorisationParentale ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">✓</span>
                    Autorisation parentale <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    J'autorise mon enfant <strong>{form.prenomJeune || '…'} {form.nomJeune || ''}</strong> à participer au programme <strong>Les Classes de l'Avenir</strong>, organisé par Success Compass Academy. Je reconnais avoir pris connaissance de la nature du programme et de ses objectifs — développement personnel, confiance en soi, communication, orientation, préparation à la réussite scolaire et professionnelle. J'autorise mon enfant à participer aux activités pédagogiques, exercices, mises en situation, ateliers et projets proposés. Les activités ne constituent pas un acte médical ou une prise en charge thérapeutique.
                  </p>
                  <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${
                    form.autorisationParentale ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input type="checkbox" checked={form.autorisationParentale}
                      onChange={e => setForm(prev => ({ ...prev, autorisationParentale: e.target.checked }))}
                      className="accent-emerald-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-gray-800">
                      Je soussigné(e), {form.prenomParent || 'Prénom'} {form.nomParent || 'Nom'} ({form.lienParent || 'représentant légal'}), autorise mon enfant à participer au programme et m'engage à respecter les conditions ci-dessus.
                    </span>
                  </label>
                  <ErrMsg k="autorisationParentale" />
                </div>
              )}

              {/* Autorisation photos / vidéos (tout le monde) */}
              <div className={`rounded-2xl border-2 p-5 ${errors.autorisationPhotos ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Autorisation photos / vidéos <span className="text-red-500">*</span>
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Dans le cadre des activités de Success Compass Academy, des photos ou vidéos peuvent être réalisées à des fins de communication et de présentation. {mineurMode ? "L'autorisation est donnée par le représentant légal." : ''}
                </p>
                <div className="flex flex-col gap-2">
                  {([
                    { value: 'oui', label: "J'autorise Success Compass Academy à utiliser les photos et/ou vidéos du participant dans le cadre de sa communication institutionnelle et promotionnelle." },
                    { value: 'non', label: "Je n'autorise pas l'utilisation des photos et/ou vidéos du participant." },
                  ] as const).map(opt => (
                    <label key={opt.value} className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${
                      form.autorisationPhotos === opt.value ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name="autorisationPhotos" value={opt.value}
                        checked={form.autorisationPhotos === opt.value}
                        onChange={() => setForm(prev => ({ ...prev, autorisationPhotos: opt.value }))}
                        className="accent-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <ErrMsg k="autorisationPhotos" />
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  ← Retour
                </button>
                <button type="button" onClick={() => { if (validate2()) setStep(3) }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3 : Attentes ─── */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">Attentes & objectifs</h2>
              <p className="text-xs text-gray-400 mb-5">Cochez tout ce qui s'applique (plusieurs réponses possibles)</p>
              <div className="grid grid-cols-1 gap-2">
                {ATTENTES.map(a => (
                  <label key={a} className={`flex items-center gap-3 cursor-pointer text-sm p-3 rounded-xl border transition-colors ${
                    form.attentes.includes(a) ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}>
                    <input type="checkbox" checked={form.attentes.includes(a)}
                      onChange={() => toggleAttente(a)} className="accent-emerald-600 flex-shrink-0 w-4 h-4" />
                    {a}
                  </label>
                ))}
                <div className="mt-1">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Autre :</label>
                  <input className={inp()} value={form.autreAttente}
                    onChange={e => setForm(prev => ({ ...prev, autreAttente: e.target.value }))}
                    placeholder="Précisez si besoin…" />
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(2)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  ← Retour
                </button>
                <button type="button" onClick={() => setStep(4)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4 : Confirmation ─── */}
          {step === 4 && (
            <div className="space-y-4">

              {/* Tarif */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-4">Tarif du programme</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="text-xs text-gray-500 mb-1">Frais d'inscription</div>
                    <div className="text-2xl font-bold text-emerald-700">{FRAIS_INSCRIPTION.toLocaleString('fr-MA')} <span className="text-sm font-normal text-gray-500">MAD</span></div>
                    <div className="text-xs text-gray-400 mt-1">Unique, obligatoire</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${mensualite ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="text-xs text-gray-500 mb-1">Cotisation mensuelle</div>
                    {mensualite ? (
                      <>
                        <div className="text-2xl font-bold text-emerald-700">{mensualite.toLocaleString('fr-MA')} <span className="text-sm font-normal text-gray-500">MAD/mois</span></div>
                        <div className="text-xs text-gray-400 mt-1">{mineurMode ? '12–17 ans' : '18–25 ans'}</div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400 mt-1">—</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Récap */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Récapitulatif</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Participant</span>
                    <span className="font-medium text-gray-900">{form.prenomJeune} {form.nomJeune} · {form.ageJeune} ans</span>
                  </div>
                  {form.niveauEtudes && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Niveau</span>
                      <span className="font-medium text-gray-900">{form.niveauEtudes}{form.filiere ? ` · ${form.filiere}` : ''}</span>
                    </div>
                  )}
                  {mineurMode && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Représentant légal</span>
                      <span className="font-medium text-gray-900">{form.prenomParent} {form.nomParent}</span>
                    </div>
                  )}
                  {!mineurMode && form.situationActuelle && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Situation</span>
                      <span className="font-medium text-gray-900">{form.situationActuelle}</span>
                    </div>
                  )}
                  {form.attentes.length > 0 && (
                    <div className="pt-1 border-t border-gray-200">
                      <p className="text-gray-500 text-xs mb-1">Attentes :</p>
                      <p className="text-gray-800 text-xs">{[...form.attentes, ...(form.autreAttente ? [`Autre : ${form.autreAttente}`] : [])].join(' · ')}</p>
                    </div>
                  )}
                  <div className="pt-1 border-t border-gray-200">
                    {mineurMode && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Autorisation parentale</span>
                        <span className="font-medium text-emerald-700">✓ Accordée</span>
                      </div>
                    )}
                    {form.autorisationPhotos && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Photos / vidéos</span>
                        <span className={`font-medium ${form.autorisationPhotos === 'oui' ? 'text-emerald-700' : 'text-gray-600'}`}>
                          {form.autorisationPhotos === 'oui' ? '✓ Autorisé' : '✗ Non autorisé'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents à ramener */}
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-700">Documents à ramener</h3>
                </div>
                {mineurMode ? (
                  <ul className="text-sm text-amber-800 space-y-1.5">
                    <li className="flex items-start gap-2"><span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0">1</span>Copie CIN du parent / représentant légal <strong>(recto verso)</strong></li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0">2</span>Copie CIN du jeune <em>(si disponible)</em></li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0">3</span>Dernier bulletin scolaire</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0">4</span>Autorisation parentale signée</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0">5</span>Règlement intérieur signé + autorisation photos/vidéos</li>
                  </ul>
                ) : (
                  <ul className="text-sm text-amber-800 space-y-1.5">
                    <li className="flex items-start gap-2"><span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0">1</span>Copie de la pièce d'identité</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center flex-shrink-0">2</span>Fiche d'inscription complétée et signée</li>
                  </ul>
                )}
                <p className="text-xs text-amber-700 mt-3 font-medium">Envoyez-les par WhatsApp, par email ou déposez-les directement dans nos locaux.</p>
                <p className="text-xs text-amber-600 mt-1">📧 contact@scapp.ma</p>
              </div>

              {/* Virement */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                <h3 className="text-sm font-semibold text-blue-700 mb-3">💳 Coordonnées bancaires</h3>
                <p className="text-xs text-gray-600 mb-3">Pour finaliser votre inscription, effectuez un virement bancaire :</p>
                <div className="bg-white rounded-lg border border-blue-100 p-4 space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-sans text-xs">Banque</span>
                    <span className="font-semibold text-gray-900">CFG Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-sans text-xs">Titulaire</span>
                    <span className="font-semibold text-gray-900">SUCCESS COMPASS</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 font-sans text-xs">RIB</span>
                    <span className="font-bold text-gray-900 tracking-wide text-base">050 810 025 0117479862001 07</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 font-medium mt-3">📲 Envoyez le reçu de paiement sur WhatsApp pour confirmer votre inscription.</p>
              </div>

              {/* Signature */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <PenLine className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Signature {mineurMode ? 'du représentant légal' : 'du participant'} <span className="text-red-500">*</span>
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">En signant, vous confirmez avoir pris connaissance des conditions du programme.</p>
                <SignaturePad onSave={setSignature} onClear={() => setSignature(null)} signed={!!signature} />
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(3)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  ← Retour
                </button>
                <button type="submit" disabled={saving || !signature}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                  {saving ? 'Envoi en cours…' : 'Envoyer mon inscription'}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">contact@scapp.ma · 06 03 60 97 92</p>
            </div>
          )}

        </form>
      </div>
    </div>
  )
}
