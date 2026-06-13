import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../store/appStore'
import type { LeadStatus } from '../../types'

// Convert Excel serial date to ISO string
function excelDateToISO(serial: number): string {
  if (!serial || typeof serial !== 'number') return new Date().toISOString()
  const utcDays = Math.floor(serial - 25569)
  return new Date(utcDays * 86400 * 1000).toISOString()
}

// Format phone: if numeric and 9 digits (Moroccan), prefix with 0
function formatPhone(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/\s/g, '')
  if (/^\d{9}$/.test(cleaned)) return '0' + cleaned
  return cleaned
}

// Map Meta/Excel column names → our fields
function mapRow(row: Record<string, any>) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const val = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()]
      if (val !== undefined && val !== null && val !== '') return String(val).trim()
    }
    return ''
  }

  // — Meta Ads export (Arabic/French form fields) —
  const nomComplet = get('nom_complet', 'Nom complet', 'nom complet', 'full_name', 'Full Name')
  const metaPhone = get('numéro_de_téléphone', 'numero_de_telephone', 'Numéro de téléphone', 'phone_number')
  const metaCity = get('ville', 'Ville', 'city', 'City', 'Localisation')
  const metaCampaign = get('campaign_name', 'Campagne', 'Campaign', 'campaign')
  const metaAdSet = get('adset_name', 'ad_name', 'Ad Set', 'Ensemble pub')
  const metaPlatform = get('platform', 'Platform') // ig / fb
  const metaObjectif = get("quel_est_votre_objectif_principal_aujourd'hui_?", 'objectif', 'programme', 'Programme')
  const metaSituation = get("quelle_est_votre_situation_professionnelle_actuelle_?", 'situation', 'Profession', 'Métier')
  const metaDelai = get("sous_combien_de_temps_souhaitez-vous_passer_à_l'action_?", 'delai', 'délai')
  const metaCreatedTime = row['created_time']

  // — Generic column names (manual imports) —
  const statusRaw = get('Statut', 'Status', 'statut', 'status', 'État', 'lead_status')
  const statusMap: Record<string, LeadStatus> = {
    'a contacter': 'to_contact', 'à contacter': 'to_contact',
    'contacté': 'contacted', 'contacte': 'contacted',
    'injoignable': 'no_answer', 'pas de réponse': 'no_answer',
    'en réflexion': 'callback', 'rappel': 'callback',
    'intéressé': 'interested', 'interesse': 'interested',
    'rendez-vous fixé': 'appointment', 'rdv fixé': 'appointment', 'rdv': 'appointment',
    'paiement en attente': 'pending_payment',
    'inscrit': 'registered',
    'refus': 'not_interested', 'pas intéressé': 'not_interested',
    'nouveau lead': 'new', 'nouveau': 'new', 'complete': 'new', 'new': 'new',
  }
  const status: LeadStatus = statusMap[statusRaw.toLowerCase()] ?? 'new'

  // Interest level from Meta "délai" field
  const interestLevelFromDelai = (d: string): 'low' | 'medium' | 'high' | '' => {
    if (!d) return ''
    if (d.includes('imméd')) return 'high'
    if (d.includes('1') || d.includes('3') || d.includes('mois')) return 'medium'
    if (d.includes('plus_tard') || d.includes('renseigne')) return 'low'
    return ''
  }

  // Build name: prefer nom_complet, fallback to Prénom + Nom columns
  let firstName = ''
  let lastName = ''
  if (nomComplet) {
    const parts = nomComplet.split(/\s+/)
    firstName = parts[0] || 'Inconnu'
    lastName = parts.slice(1).join(' ')
  } else {
    firstName = get('Prénom', 'prenom', 'First Name', 'first_name').split(' ')[0] || 'Inconnu'
    lastName = get('Nom', 'Last Name', 'last_name')
    if (!lastName) lastName = get('Prénom', 'prenom', 'First Name', 'first_name').split(' ').slice(1).join(' ')
  }

  // Source label
  const sourceLabel = metaPlatform === 'ig' ? 'Instagram' : metaPlatform === 'fb' ? 'Facebook' : get('Source', 'source') || 'Meta'

  // createdAt from Excel serial date if available
  const createdAt = typeof metaCreatedTime === 'number' ? excelDateToISO(metaCreatedTime) : new Date().toISOString()

  return {
    firstName,
    lastName,
    phone: formatPhone(metaPhone || get('Téléphone', 'Tel', 'Phone', 'phone', 'Numéro', 'numero', 'Phone Number')),
    email: get('Email', 'email', 'E-mail'),
    city: metaCity,
    profession: metaSituation || get('Profession', 'Métier', 'Activité', 'metier'),
    programInterest: metaObjectif || get('Programme', 'Intérêt', 'program_interest', 'Formation'),
    source: sourceLabel,
    campaign: metaCampaign,
    adSet: metaAdSet,
    status,
    interestLevel: (interestLevelFromDelai(metaDelai) || get('Niveau', 'interest_level') || '') as any,
    createdAt,
  }
}

export default function ImportLeadsModal({ onClose }: { onClose: () => void }) {
  const { addLead } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ReturnType<typeof mapRow>[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const data = ev.target?.result
      const wb = XLSX.read(data, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      const mapped = json.map(mapRow).filter(r => r.phone || r.firstName !== 'Inconnu')
      setRows(mapped)
      setSelected(new Set(mapped.map((_, i) => i)))
      setStep('preview')
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    setImporting(true)
    const errs: string[] = []
    let count = 0
    const toImport = rows.filter((_, i) => selected.has(i))
    for (const row of toImport) {
      try {
        await addLead({
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          email: row.email || undefined,
          city: row.city || undefined,
          profession: row.profession || undefined,
          programInterest: row.programInterest || undefined,
          source: row.source,
          campaign: row.campaign || undefined,
          adSet: row.adSet || undefined,
          status: row.status,
          interestLevel: row.interestLevel || undefined,
          whatsapp: undefined, facebookName: undefined, instagram: undefined,
          assignedTo: undefined, tags: [], nextFollowUpDate: undefined,
        })
        count++
        setDone(count)
      } catch (err: any) {
        errs.push(`${row.firstName} ${row.lastName}: ${err.message || 'Erreur'}`)
      }
    }
    setErrors(errs)
    setImporting(false)
    setStep('done')
  }

  return (
    <Modal open onClose={onClose} title="Importer des leads" size="lg">
      <div className="space-y-5">
        {step === 'upload' && (
          <div>
            <div
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">Cliquer pour sélectionner le fichier</p>
              <p className="text-sm text-gray-400 mt-1">Fichier Excel (.xlsx) ou CSV exporté depuis Meta Ads / autre source</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-semibold">Colonnes reconnues automatiquement :</p>
              <p>Prénom, Nom, Téléphone, Email, Ville, Profession, Programme, Source, Statut, Campagne</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{rows.length} leads détectés — <span className="text-blue-600">{selected.size} sélectionnés</span></p>
                <p className="text-xs text-gray-400 mt-0.5">{fileName}</p>
              </div>
              <Button variant="outline" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => { setStep('upload'); setRows([]); setSelected(new Set()) }}>
                Changer de fichier
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2">
                      <input type="checkbox" checked={selected.size === rows.length} onChange={e => setSelected(e.target.checked ? new Set(rows.map((_, i) => i)) : new Set())} className="rounded" />
                    </th>
                    {['Nom complet', 'Téléphone', 'Ville', 'Objectif', 'Situation', 'Niveau', 'Source', 'Campagne'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-t border-gray-50 dark:border-gray-800 ${selected.has(i) ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'opacity-50'}`}>
                      <td className="px-3 py-1.5">
                        <input type="checkbox" checked={selected.has(i)} onChange={e => { const s = new Set(selected); e.target.checked ? s.add(i) : s.delete(i); setSelected(s) }} className="rounded" />
                      </td>
                      <td className="px-3 py-1.5 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">{r.firstName} {r.lastName}</td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{r.phone}</td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{r.city}</td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 max-w-[120px] truncate" title={r.programInterest}>{r.programInterest?.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 max-w-[120px] truncate" title={r.profession}>{r.profession?.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-1.5">
                        {r.interestLevel && <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${r.interestLevel === 'high' ? 'bg-red-100 text-red-700' : r.interestLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{r.interestLevel === 'high' ? 'Urgent' : r.interestLevel === 'medium' ? 'Moyen' : 'Bas'}</span>}
                      </td>
                      <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{r.source}</td>
                      <td className="px-3 py-1.5 text-gray-500 dark:text-gray-500 max-w-[100px] truncate" title={r.campaign}>{r.campaign}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button variant="primary" onClick={handleImport} disabled={importing || selected.size === 0}>
                {importing ? `Import en cours… (${done}/${selected.size})` : `Importer ${selected.size} leads`}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{done} leads importés !</p>
              {errors.length > 0 && (
                <div className="mt-3 text-left max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-600 mb-1">{errors.length} erreurs :</p>
                  {errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-500 flex gap-1.5 items-start"><AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{e}</p>
                  ))}
                </div>
              )}
            </div>
            <Button variant="primary" onClick={onClose}>Fermer</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
