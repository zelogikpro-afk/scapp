import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { GraduationCap, ChevronRight, FileText, Star, PenLine, RotateCcw } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { supabaseAdmin } from '../../lib/supabase'

function SignaturePad({ onSave, onClear, signed }: {
  onSave: (dataUrl: string) => void
  onClear: () => void
  signed: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1d4ed8'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

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
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    lastPos.current = pos
  }, [])

  const endDraw = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    lastPos.current = null
    const canvas = canvasRef.current!
    onSave(canvas.toDataURL('image/png'))
  }, [onSave])

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onClear()
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={160}
          className="w-full cursor-crosshair block"
          style={{ height: '120px' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!signed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-gray-300 select-none">Signez ici</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {signed ? '✓ Signature enregistrée' : 'Dessinez votre signature ci-dessus'}
        </span>
        <button type="button" onClick={clear}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
          <RotateCcw className="w-3 h-3" />
          Effacer
        </button>
      </div>
    </div>
  )
}

const FRAIS_INSCRIPTION = 500   // MAD — obligatoire pour tous
const MENSUALITE_JUNIOR = 800   // MAD/mois — 12 à 18 ans
const MENSUALITE_SENIOR = 1000  // MAD/mois — 19 à 25 ans

function getMensualite(age: string) {
  const n = parseInt(age)
  if (!n) return null
  if (n >= 12 && n <= 18) return MENSUALITE_JUNIOR
  if (n >= 19 && n <= 25) return MENSUALITE_SENIOR
  return null
}

interface FormData {
  // Parent / tuteur
  nomParent: string; prenomParent: string; genre: 'female' | 'male'
  telephone: string; email: string; ville: string
  cinParent: string; adressePostale: string
  // Enfant
  nomEnfant: string; ageEnfant: string; ecoleEnfant: string
  niveauEnfant: string; besoinPrincipal: string
  // Paiement
  fraisInscriptionPaye: boolean
  premierMoisPaye: boolean
  nbresMoisPayes: string
}

const initial: FormData = {
  nomParent: '', prenomParent: '', genre: 'female',
  telephone: '', email: '', ville: '', cinParent: '', adressePostale: '',
  nomEnfant: '', ageEnfant: '', ecoleEnfant: '',
  niveauEnfant: '', besoinPrincipal: '',
  fraisInscriptionPaye: true,
  premierMoisPaye: false,
  nbresMoisPayes: '0',
}

const NIVEAUX = [
  'CE1', 'CE2', 'CM1', 'CM2',
  'Collège 1 (6ème)', 'Collège 2 (5ème)', 'Collège 3 (4ème)',
  'Tronc commun', '1ère Bac', 'Terminales',
]

const BESOINS = [
  'Confiance en soi',
  'Gestion du stress & des émotions',
  'Orientation scolaire',
  'Méthodes de travail & organisation',
  'Motivation & ambition',
  'Communication & relations sociales',
  'Autre',
]

export default function InscriptionClassesAvenir() {
  const navigate = useNavigate()
  const { addParticipant, addPayment } = useAppStore()
  const [form, setForm] = useState<FormData>(initial)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [signature, setSignature] = useState<string | null>(null)

  const setF = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))
  const setB = (field: keyof FormData, value: boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const mensualite = getMensualite(form.ageEnfant)
  const nMois = parseInt(form.nbresMoisPayes) || 0
  const amountPaid =
    (form.fraisInscriptionPaye ? FRAIS_INSCRIPTION : 0) +
    (mensualite ? nMois * mensualite : 0)

  function getStatus() {
    if (amountPaid <= 0) return 'pending' as const
    if (!form.fraisInscriptionPaye) return 'pending' as const
    return 'partial' as const  // mensuel = toujours partiel
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nomParent || !form.prenomParent || !form.telephone) {
      toast.error('Veuillez remplir les champs obligatoires')
      return
    }
    if (!form.nomEnfant || !form.ageEnfant) {
      toast.error('Veuillez renseigner les infos de l\'enfant')
      return
    }
    if (!signature) {
      toast.error('La signature du parent / tuteur est requise')
      return
    }
    setSaving(true)
    try {
      const signedAt = new Date().toLocaleString('fr-MA', { dateStyle: 'short', timeStyle: 'short' })
      const tranche = mensualite ? `${mensualite} MAD/mois` : 'N/A'
      const childNotes = [
        `🏫 CLASSES DE L'AVENIR`,
        `Enfant : ${form.nomEnfant} | Âge : ${form.ageEnfant} ans`,
        `École : ${form.ecoleEnfant} | Niveau : ${form.niveauEnfant}`,
        `Besoin : ${form.besoinPrincipal}`,
        form.cinParent ? `CIN parent : ${form.cinParent}` : '',
        form.adressePostale ? `Adresse : ${form.adressePostale}` : '',
        `💳 Frais inscription : ${FRAIS_INSCRIPTION} MAD${form.fraisInscriptionPaye ? ' (payé)' : ' (en attente)'}`,
        `📅 Cotisation mensuelle : ${tranche}`,
        nMois > 0 ? `Mois payés à l'inscription : ${nMois}` : '',
        `✍️ Signature électronique parent le ${signedAt}`,
        signature ? `[SIGNATURE_DATA:${signature}]` : '',
      ].filter(Boolean).join('\n')

      // Save participant (parent/tuteur)
      const { data: pRow, error: pErr } = await supabaseAdmin
        .from('participants')
        .insert({
          first_name: form.prenomParent,
          last_name: form.nomParent,
          email: form.email || null,
          phone: form.telephone,
          whatsapp: form.telephone,
          gender: form.genre,
          type: 'training',
          notes: childNotes,
          tags: ['classes_avenir'],
          is_active: true,
          address: form.ville || null,
        })
        .select()
        .single()

      if (pErr) throw pErr

      // Update store
      await addParticipant({
        firstName: form.prenomParent, lastName: form.nomParent,
        email: form.email, phone: form.telephone, gender: form.genre,
        address: form.ville || undefined, type: 'training',
        notes: childNotes, tags: ['classes_avenir'], isActive: true,
        whatsapp: form.telephone,
      })

      // Save payment — frais d'inscription initiaux
      await supabaseAdmin.from('payments').insert({
        participant_id: pRow.id,
        participant_name: `${form.nomParent} ${form.prenomParent}`,
        program_type: 'training',
        program_name: 'Les Classes de l\'Avenir',
        total_amount: amountPaid,
        amount_paid: amountPaid,
        remaining_amount: 0,
        status: amountPaid > 0 ? 'paid' : 'pending',
        method: 'cash',
        date: new Date().toISOString().split('T')[0],
        due_date: null,
        notes: [
          `Frais inscription : ${FRAIS_INSCRIPTION} MAD`,
          mensualite ? `Cotisation mensuelle : ${mensualite} MAD/mois` : '',
          nMois > 0 ? `${nMois} mois payé(s) à l'inscription` : '',
        ].filter(Boolean).join(' — '),
        installments: [],
        created_at: new Date().toISOString(),
      })

      toast.success('Inscription Classes de l\'Avenir enregistrée ✓')
      setForm(initial)
      setSignature(null)
      setStep(1)
      navigate('/participants')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
  const lbl = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
  const card = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6'
  const steps = [
    { n: 1, label: 'Parent / Tuteur' },
    { n: 2, label: 'L\'enfant' },
    { n: 3, label: 'Paiement' },
  ]

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Inscription — Les Classes de l'Avenir</h1>
          <p className="text-sm text-gray-500">Success Compass Academy</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <button type="button" onClick={() => setStep(s.n as 1 | 2 | 3)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                step === s.n
                  ? 'bg-emerald-600 text-white'
                  : step > s.n
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                step === s.n ? 'bg-white/20' : step > s.n ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>{s.n}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ─── Step 1 : Parent / Tuteur ─── */}
        {step === 1 && (
          <div className={card}>
            <h2 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-5">Informations du parent / tuteur</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Nom <span className="text-red-500">*</span></label>
                <input className={inp} value={form.nomParent} onChange={e => setF('nomParent', e.target.value)} placeholder="NOM" required />
              </div>
              <div>
                <label className={lbl}>Prénom <span className="text-red-500">*</span></label>
                <input className={inp} value={form.prenomParent} onChange={e => setF('prenomParent', e.target.value)} placeholder="Prénom" required />
              </div>
              <div>
                <label className={lbl}>Genre</label>
                <div className="flex gap-4 mt-2">
                  {(['female', 'male'] as const).map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input type="radio" name="genre" value={g} checked={form.genre === g}
                        onChange={() => setF('genre', g)} className="accent-emerald-600" />
                      {g === 'female' ? 'Femme' : 'Homme'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>N° de contact <span className="text-red-500">*</span></label>
                <input className={inp} value={form.telephone} onChange={e => setF('telephone', e.target.value)} placeholder="06 XX XX XX XX" required />
              </div>
              <div>
                <label className={lbl}>Email</label>
                <input type="email" className={inp} value={form.email} onChange={e => setF('email', e.target.value)} placeholder="email@exemple.ma" />
              </div>
              <div>
                <label className={lbl}>Ville</label>
                <input className={inp} value={form.ville} onChange={e => setF('ville', e.target.value)} placeholder="Rabat" />
              </div>
              <div>
                <label className={lbl}>CIN du parent <span className="text-red-500">*</span></label>
                <input className={inp} value={form.cinParent} onChange={e => setF('cinParent', e.target.value)} placeholder="AB123456" required />
              </div>
              <div>
                <label className={lbl}>Adresse postale</label>
                <input className={inp} value={form.adressePostale} onChange={e => setF('adressePostale', e.target.value)} placeholder="N° rue, quartier, ville" />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button type="button" onClick={() => setStep(2)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2 : L'enfant ─── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className={card}>
              <h2 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-5">Informations de l'enfant / jeune</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Nom complet de l'enfant <span className="text-red-500">*</span></label>
                  <input className={inp} value={form.nomEnfant} onChange={e => setF('nomEnfant', e.target.value)} placeholder="Prénom et Nom" required />
                </div>
                <div>
                  <label className={lbl}>Âge <span className="text-red-500">*</span></label>
                  <input type="number" min="6" max="25" className={inp} value={form.ageEnfant}
                    onChange={e => setF('ageEnfant', e.target.value)} placeholder="ex: 14" required />
                </div>
                <div>
                  <label className={lbl}>École / Établissement actuel</label>
                  <input className={inp} value={form.ecoleEnfant} onChange={e => setF('ecoleEnfant', e.target.value)} placeholder="Nom de l'école ou lycée" />
                </div>
                <div>
                  <label className={lbl}>Niveau scolaire</label>
                  <select className={inp} value={form.niveauEnfant} onChange={e => setF('niveauEnfant', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Besoin principal</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {BESOINS.map(b => (
                      <label key={b} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 p-2 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <input type="radio" name="besoin" value={b} checked={form.besoinPrincipal === b}
                          onChange={() => setF('besoinPrincipal', b)} className="accent-emerald-600 flex-shrink-0" />
                        {b}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Documents requis</h3>
              </div>
              <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-center flex-shrink-0">1</span>
                  Copie de la CIN du parent <span className="font-medium">(recto verso)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-center flex-shrink-0">2</span>
                  Dernier bulletin scolaire de l'enfant
                </li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)}
                className="px-5 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                ← Retour
              </button>
              <button type="button" onClick={() => setStep(3)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3 : Paiement ─── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Grille tarifaire */}
            <div className={card}>
              <h2 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-4">Tarif & paiement</h2>

              {/* Frais d'inscription */}
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Frais d'inscription</h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Frais d'inscription</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Obligatoire pour tous — à régler à l'inscription</div>
                  </div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{FRAIS_INSCRIPTION.toLocaleString('fr-MA')} MAD</div>
                </div>
                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={form.fraisInscriptionPaye}
                      onChange={e => setB('fraisInscriptionPaye', e.target.checked)}
                      className="accent-emerald-600 w-4 h-4" />
                    Frais d'inscription réglés aujourd'hui
                  </label>
                </div>
              </div>

              {/* Cotisation mensuelle */}
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Cotisation mensuelle</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg border-2 transition-colors ${form.ageEnfant && parseInt(form.ageEnfant) >= 12 && parseInt(form.ageEnfant) <= 18 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">12 à 18 ans</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{MENSUALITE_JUNIOR.toLocaleString('fr-MA')} <span className="text-sm font-normal text-gray-500">MAD/mois</span></div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 transition-colors ${form.ageEnfant && parseInt(form.ageEnfant) >= 19 && parseInt(form.ageEnfant) <= 25 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">19 à 25 ans</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{MENSUALITE_SENIOR.toLocaleString('fr-MA')} <span className="text-sm font-normal text-gray-500">MAD/mois</span></div>
                  </div>
                </div>
                {mensualite && (
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Cotisation applicable : {mensualite.toLocaleString('fr-MA')} MAD/mois ({form.ageEnfant} ans)
                  </div>
                )}
                {form.ageEnfant && !mensualite && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Âge hors tranche programme (12–25 ans) — tarif à définir manuellement
                  </div>
                )}
              </div>

              {/* Mois payés à l'inscription + date début */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Mois payés à l'inscription</label>
                  <input type="number" min="0" max="12" className={inp}
                    value={form.nbresMoisPayes}
                    onChange={e => setF('nbresMoisPayes', e.target.value)}
                    placeholder="0" />
                  {mensualite && nMois > 0 && (
                    <div className="text-xs text-gray-400 mt-1">{nMois} × {mensualite} = {(nMois * mensualite).toLocaleString('fr-MA')} MAD</div>
                  )}
                </div>
              </div>
            </div>

            {/* Récap */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Parent / Tuteur</span>
                  <span className="font-medium text-gray-900 dark:text-white">{form.nomParent} {form.prenomParent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Enfant</span>
                  <span className="font-medium text-gray-900 dark:text-white">{form.nomEnfant} · {form.ageEnfant} ans</span>
                </div>
                {form.niveauEnfant && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Niveau</span>
                    <span className="font-medium text-gray-900 dark:text-white">{form.niveauEnfant}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Frais d'inscription</span>
                    <span className={`font-semibold ${form.fraisInscriptionPaye ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {FRAIS_INSCRIPTION.toLocaleString('fr-MA')} MAD {form.fraisInscriptionPaye ? '✓' : '(en attente)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cotisation mensuelle</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {mensualite ? `${mensualite.toLocaleString('fr-MA')} MAD/mois` : '—'}
                    </span>
                  </div>
                  {nMois > 0 && mensualite && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mois payés aujourd'hui</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{nMois} × {mensualite.toLocaleString('fr-MA')} = {(nMois * mensualite).toLocaleString('fr-MA')} MAD</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1.5">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Total encaissé aujourd'hui</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{amountPaid.toLocaleString('fr-MA')} MAD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Engagement du parent / tuteur</h3>
              </div>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>Accompagner l'enfant dans son parcours de développement</li>
                <li>Respecter le calendrier des séances et les horaires convenus</li>
                <li>Respecter la charte éthique et les conditions générales de Success Compass</li>
              </ul>
            </div>

            {/* Signature */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-4">
                <PenLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Signature du parent / tuteur <span className="text-red-500">*</span>
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                En signant, vous confirmez avoir pris connaissance des conditions du programme et vous engagez à respecter votre accord.
              </p>
              <SignaturePad
                onSave={setSignature}
                onClear={() => setSignature(null)}
                signed={!!signature}
              />
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)}
                className="px-5 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                ← Retour
              </button>
              <button type="submit" disabled={saving || !signature}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? 'Enregistrement...' : 'Valider l\'inscription'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
