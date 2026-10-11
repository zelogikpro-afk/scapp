import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, CheckCircle, AlertCircle, X, RefreshCw, Plus } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../store/appStore'
import { supabaseAdmin } from '../../lib/supabase'
import type { LeadStatus } from '../../types'

function formatPhone(raw: string): string {
  if (!raw) return ''
  // Strip Meta's "p:" prefix
  let cleaned = raw.replace(/^p:/i, '').replace(/\s/g, '')
  // Convert +212XXXXXXXXX → 0XXXXXXXXX
  if (cleaned.startsWith('+212')) cleaned = '0' + cleaned.slice(4)
  if (/^\d{9}$/.test(cleaned)) cleaned = '0' + cleaned
  return cleaned
}

function formatLabel(s: string): string {
  return (s || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatDate(raw: string | number): string {
  if (!raw) return ''
  if (typeof raw === 'number') {
    const utcDays = Math.floor(raw - 25569)
    return new Date(utcDays * 86400 * 1000).toISOString()
  }
  try { return new Date(raw).toISOString() } catch { return '' }
}

function formatDateDisplay(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function mapRow(headers: string[], vals: string[]) {
  const col = (...keywords: string[]) => colByKeyword(headers, vals, ...keywords)
  // Détecter le programme selon les colonnes présentes
  const isClassesAvenir = headers.some(h => h.toLowerCase().includes("nom_de_l'enfant") || h.toLowerCase().includes('nom_de_l_enfant') || h.toLowerCase().includes('enfant'))
  // Accès par nom exact (case-insensitive)
  const exact = (...names: string[]) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.trim().toLowerCase() === name.trim().toLowerCase())
      if (idx !== -1 && vals[idx]?.trim()) return vals[idx].trim()
    }
    return ''
  }

  const nomComplet = exact('nom_complet', 'nom complet', 'full_name')
  const metaPhone = col('téléphone', 'telephone', 'phone')
  const metaCity = exact('ville', 'city')
  const metaCampaign = exact('campaign_name')
  const metaAdName = exact('ad_name')
  const metaPlatform = exact('platform')
  const metaObjectif = col('objectif')
  const metaSituation = col('situation')
  const metaDelai = col('passer', 'sous_combien', 'action_?', 'delai')
  const metaDisponibilite = col('disponible', 'moment')
  const metaCreatedTime = exact('created_time')
  const metaLeadId = exact('id')

  const statusRaw = exact('lead_status', 'status', 'statut')
  const statusMap: Record<string, LeadStatus> = {
    'a contacter': 'to_contact', 'à contacter': 'to_contact',
    'contacté': 'contacted', 'contacte': 'contacted',
    'injoignable': 'no_answer', 'pas de réponse': 'no_answer',
    'en réflexion': 'callback', 'rappel': 'callback',
    'intéressé': 'interested', 'interesse': 'interested',
    'rendez-vous fixé': 'appointment', 'rdv': 'appointment',
    'paiement en attente': 'pending_payment',
    'inscrit': 'registered',
    'refus': 'not_interested', 'pas intéressé': 'not_interested',
    'nouveau lead': 'new', 'nouveau': 'new', 'complete': 'new', 'new': 'new',
  }
  const status: LeadStatus = statusMap[statusRaw.toLowerCase()] ?? 'new'

  const interestLevel = (() => {
    const d = metaDelai.toLowerCase()
    if (d.includes('imméd') || d.includes('immed')) return 'high'
    if (d.includes('1') || d.includes('3') || d.includes('mois')) return 'medium'
    if (d.includes('plus_tard') || d.includes('renseigne')) return 'low'
    return ''
  })()

  let firstName = ''
  let lastName = ''
  if (nomComplet) {
    const parts = nomComplet.replace(/^"/, '').replace(/"$/, '').split(/\s+/)
    firstName = parts[0] || 'Inconnu'
    lastName = parts.slice(1).join(' ')
  } else {
    firstName = exact('prénom', 'prenom', 'first_name') || 'Inconnu'
    lastName = exact('nom', 'last_name')
  }

  const sourceLabel = metaPlatform === 'ig' ? 'Instagram' : metaPlatform === 'fb' ? 'Facebook' : exact('source') || 'Meta'
  const createdAt = formatDate(metaCreatedTime)

  // Champs spécifiques Classes de l'Avenir
  const childName = isClassesAvenir ? col("nom_de_l'enfant", 'nom_de_l_enfant', 'enfant') : ''
  const childAge = isClassesAvenir ? col("age_de_l'enfant", 'age_de_l_enfant', 'age') : ''
  const childSchool = isClassesAvenir ? col('ecole_actuelle', 'ecole') : ''
  const childLevel = isClassesAvenir ? col('niveau_scolaire', 'niveau') : ''
  const besoin = isClassesAvenir ? col('besoin_principal', 'besoin') : ''

  return {
    _leadId: metaLeadId,
    _createdAt: createdAt,
    _platform: metaPlatform,
    _adName: metaAdName,
    _objectif: isClassesAvenir ? besoin : metaObjectif,
    _situation: metaSituation,
    _delai: metaDelai,
    _disponibilite: metaDisponibilite,
    _isClassesAvenir: isClassesAvenir,
    _childName: childName,
    _childAge: childAge,
    _childSchool: childSchool,
    _childLevel: childLevel,
    firstName,
    lastName,
    phone: formatPhone(metaPhone),
    email: exact('email', 'e-mail'),
    city: metaCity.replace(/^"/, '').replace(/"$/, ''),
    profession: metaSituation,
    programInterest: isClassesAvenir ? besoin : metaObjectif,
    source: sourceLabel,
    campaign: metaCampaign.replace(/^"/, '').replace(/"$/, ''),
    adSet: exact('adset_name'),
    status,
    interestLevel: interestLevel as any,
    createdAt,
    programTag: (isClassesAvenir ? 'classes_avenir' : 'coaching_adulte') as 'coaching_adulte' | 'classes_avenir',
  }
}

// Parse a UTF-16 tab-separated file (Meta Ads export format)
// Retourne { headers, rows } avec accès positional fiable
function parseMetaTSV(buffer: ArrayBuffer): { headers: string[]; rows: string[][] } | null {
  // Essaie UTF-16 LE d'abord (export Meta standard)
  for (const enc of ['utf-16', 'utf-16le', 'utf-8'] as const) {
    try {
      const decoder = new TextDecoder(enc)
      let text = decoder.decode(buffer)
      // Supprimer BOM (U+FEFF) s'il est présent au début
      text = text.replace(/^﻿/, '')
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) continue
      const headers = lines[0].split('\t').map(h => h.trim())
      // Vérifier qu'on a bien un export Meta (doit avoir 'id' et 'platform')
      const hasId = headers.some(h => h === 'id' || h.endsWith('id'))
      const hasPlatform = headers.some(h => h.toLowerCase() === 'platform')
      if (!hasId || !hasPlatform) continue
      const rows: string[][] = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split('\t').map(v => v.trim())
        if (vals.every(v => !v)) continue
        rows.push(vals)
      }
      if (rows.length > 0) return { headers, rows }
    } catch { continue }
  }
  return null
}

// Cherche la valeur d'une colonne par mot-clé dans le nom du header
function colByKeyword(headers: string[], vals: string[], ...keywords: string[]): string {
  for (const kw of keywords) {
    const idx = headers.findIndex(h => h.toLowerCase().includes(kw.toLowerCase()))
    if (idx !== -1 && vals[idx]?.trim()) return vals[idx].trim()
  }
  return ''
}

type SortKey = 'date' | 'name' | 'city' | 'objectif' | 'delai' | 'platform'

export default function ImportLeadsModal({ onClose }: { onClose: () => void }) {
  const { addLead, fetchLeads } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ReturnType<typeof mapRow>[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(0)
  const [updated, setUpdated] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function sortedRows() {
    return [...rows].map((r, i) => ({ ...r, _origIdx: i })).sort((a, b) => {
      let va = '', vb = ''
      if (sortKey === 'date') { va = a._createdAt; vb = b._createdAt }
      else if (sortKey === 'name') { va = `${a.firstName} ${a.lastName}`; vb = `${b.firstName} ${b.lastName}` }
      else if (sortKey === 'city') { va = a.city; vb = b.city }
      else if (sortKey === 'objectif') { va = a._objectif; vb = b._objectif }
      else if (sortKey === 'delai') { va = a.interestLevel; vb = b.interestLevel }
      else if (sortKey === 'platform') { va = a._platform; vb = b._platform }
      const cmp = va.localeCompare(vb, 'fr', { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-blue-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const buffer = ev.target?.result as ArrayBuffer
      let mapped: ReturnType<typeof mapRow>[] = []

      // Essai export Meta (UTF-16 TSV)
      const tsv = parseMetaTSV(buffer)
      if (tsv) {
        mapped = tsv.rows
          .map(vals => mapRow(tsv.headers, vals))
          .filter(r => r.phone || r.firstName !== 'Inconnu')
      } else {
        // Fallback: XLSX/CSV standard
        const wb = XLSX.read(buffer, { type: 'array', codepage: 65001 })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })
        if (json.length > 0) {
          const headers = Object.keys(json[0])
          mapped = json
            .map(row => mapRow(headers, headers.map(h => String(row[h] ?? ''))))
            .filter(r => r.phone || r.firstName !== 'Inconnu')
        }
      }

      setRows(mapped)
      setSelected(new Set(mapped.map((_, i) => i)))
      setStep('preview')
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    setImporting(true)
    const errs: string[] = []
    let inserted = 0
    let updatedCount = 0
    const toImport = rows.filter((_, i) => selected.has(i))

    for (const row of toImport) {
      const payload = {
        first_name: row.firstName,
        last_name: row.lastName,
        phone: row.phone,
        whatsapp: row.phone || null,
        email: row.email || null,
        city: row.city || null,
        profession: row.profession || null,
        program_interest: row.programInterest || null,
        source: row.source,
        campaign: row.campaign || null,
        ad_set: row.adSet || null,
        status: row.status,
        interest_level: row.interestLevel || null,
        horaire_preference: row._disponibilite || null,
        delai_action: row._delai || null,
        meta_lead_id: row._leadId || null,
        created_at: row._createdAt || undefined,
        program_tag: row.programTag || null,
        child_name: (row as any)._childName || null,
        child_age: (row as any)._childAge || null,
        child_school: (row as any)._childSchool || null,
        child_level: (row as any)._childLevel || null,
      }

      try {
        // 1) Try to match by meta_lead_id
        let existingId: string | null = null
        if (row._leadId) {
          const { data: byId } = await supabaseAdmin
            .from('leads').select('id').eq('meta_lead_id', row._leadId).maybeSingle()
          if (byId) existingId = byId.id
        }
        // 2) Fallback: match by phone
        if (!existingId && row.phone) {
          const { data: byPhone } = await supabaseAdmin
            .from('leads').select('id').eq('phone', row.phone).maybeSingle()
          if (byPhone) existingId = byPhone.id
        }

        if (existingId) {
          // UPDATE existing lead — on écrase created_at avec la vraie date Meta
          const updatePayload: Record<string, any> = { ...payload }
          if (!updatePayload.created_at) delete updatePayload.created_at
          const { error } = await supabaseAdmin.from('leads').update(updatePayload).eq('id', existingId)
          if (error) throw error
          updatedCount++
          setUpdated(updatedCount)
        } else {
          // INSERT new lead
          const { error } = await supabaseAdmin.from('leads').insert(payload)
          if (error) throw error
          inserted++
          setDone(inserted)
        }
      } catch (err: any) {
        errs.push(`${row.firstName} ${row.lastName}: ${err.message || 'Erreur'}`)
      }
    }

    await fetchLeads()
    setErrors(errs)
    setImporting(false)
    setStep('done')
  }

  const URGENCY_LABEL: Record<string, string> = { high: 'Urgent', medium: 'Moyen', low: 'Plus tard' }
  const URGENCY_COLOR: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-500' }

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
              <p className="text-sm text-gray-400 mt-1">Fichier CSV exporté depuis Meta Ads (.csv)</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-semibold">Format Meta Ads reconnu automatiquement :</p>
              <p>id · created_time · ad_name · campaign_name · platform · nom_complet · numéro_de_téléphone · ville · objectif · situation · délai · disponibilité</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {rows.length} leads détectés — <span className="text-blue-600">{selected.size} sélectionnés</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{fileName}</p>
              </div>
              <Button variant="outline" size="sm" icon={<X className="w-3.5 h-3.5" />}
                onClick={() => { setStep('upload'); setRows([]); setSelected(new Set()) }}>
                Changer de fichier
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-xs min-w-[900px]">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2">
                      <input type="checkbox"
                        checked={selected.size === rows.length}
                        onChange={e => setSelected(e.target.checked ? new Set(rows.map((_, i) => i)) : new Set())}
                        className="rounded" />
                    </th>
                    {([
                      { label: 'Date réception', k: 'date' },
                      { label: 'Plateforme',     k: 'platform' },
                      { label: 'Nom complet',    k: 'name' },
                      { label: 'Téléphone',      k: null },
                      { label: 'Ville',          k: 'city' },
                      { label: 'Objectif / Besoin', k: 'objectif' },
                      { label: 'Enfant',         k: null },
                      { label: 'Âge',            k: null },
                      { label: 'École',          k: null },
                      { label: 'Niveau',         k: null },
                      { label: 'Délai',          k: 'delai' },
                      { label: 'Pub',            k: null },
                    ] as { label: string; k: SortKey | null }[]).map(({ label, k }) => (
                      <th key={label}
                        className={`text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap select-none ${k ? 'cursor-pointer hover:text-blue-600' : ''}`}
                        onClick={() => k && handleSort(k)}>
                        {label}{k && <SortIcon k={k} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows().map((r) => {
                    const i = (r as any)._origIdx
                    return (
                    <tr key={i} className={`border-t border-gray-50 dark:border-gray-800 ${selected.has(i) ? '' : 'opacity-40'}`}>
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={selected.has(i)}
                          onChange={e => { const s = new Set(selected); e.target.checked ? s.add(i) : s.delete(i); setSelected(s) }}
                          className="rounded" />
                      </td>
                      {/* Date */}
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDateDisplay(r._createdAt)}</td>
                      {/* Platform */}
                      <td className="px-3 py-2">
                        {r._platform === 'ig' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-50 text-pink-600 font-medium text-xs">
                            📸 IG
                          </span>
                        ) : r._platform === 'fb' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium text-xs">
                            👤 FB
                          </span>
                        ) : <span className="text-gray-400">{r._platform}</span>}
                      </td>
                      {/* Name */}
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {r.firstName} {r.lastName}
                      </td>
                      {/* Phone */}
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap font-mono">{r.phone}</td>
                      {/* City */}
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{r.city}</td>
                      {/* Objectif / Besoin */}
                      <td className="px-3 py-2 text-gray-600 max-w-[130px] truncate" title={formatLabel(r._objectif)}>
                        {formatLabel(r._objectif)}
                      </td>
                      {/* Enfant */}
                      <td className="px-3 py-2 text-gray-600 max-w-[100px] truncate" title={(r as any)._childName}>
                        {(r as any)._childName || <span className="text-gray-300">—</span>}
                      </td>
                      {/* Âge */}
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {(r as any)._childAge || <span className="text-gray-300">—</span>}
                      </td>
                      {/* École */}
                      <td className="px-3 py-2 text-gray-600 max-w-[100px] truncate" title={(r as any)._childSchool}>
                        {(r as any)._childSchool || <span className="text-gray-300">—</span>}
                      </td>
                      {/* Niveau */}
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {(r as any)._childLevel || <span className="text-gray-300">—</span>}
                      </td>
                      {/* Délai */}
                      <td className="px-3 py-2">
                        {r.interestLevel ? (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${URGENCY_COLOR[r.interestLevel] || 'bg-gray-100 text-gray-500'}`}>
                            {URGENCY_LABEL[r.interestLevel] || r.interestLevel}
                          </span>
                        ) : <span className="text-gray-400">{formatLabel(r._delai)}</span>}
                      </td>
                      {/* Pub */}
                      <td className="px-3 py-2 text-gray-400 max-w-[90px] truncate" title={r._adName}>
                        {r._adName}
                      </td>
                    </tr>
                  )})}
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
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Import terminé !</p>
              <div className="flex gap-4 justify-center mt-3">
                {done > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                    <Plus className="w-4 h-4" />
                    {done} nouveau{done > 1 ? 'x' : ''}
                  </div>
                )}
                {updated > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    <RefreshCw className="w-4 h-4" />
                    {updated} mis à jour
                  </div>
                )}
              </div>
              {errors.length > 0 && (
                <div className="mt-3 text-left max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-600 mb-1">{errors.length} erreurs :</p>
                  {errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-500 flex gap-1.5 items-start">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{e}
                    </p>
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
