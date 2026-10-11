import { useEffect, useRef, useState } from 'react'
import { trainerApiCall } from '../../lib/trainerApi'
import { FlaskConical, ChevronDown, ChevronUp, Download, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import QSReportTemplate, { PAGE_W as QS_W, PAGE_H as QS_H } from '../test/QSReportTemplate'
import IEReportTemplate, { PAGE_W as IE_W, PAGE_H as IE_H } from '../test/IEReportTemplate'
import ValeursReportTemplate, { PAGE_W as VAL_W, PAGE_H as VAL_H } from '../test/ValeursReportTemplate'
import { COMPASS_PROFILES } from '../../data/testCompassData'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'

const TEST_LABELS: Record<string, string> = {
  mapping: 'Mapping', ie: 'Intelligence Émotionnelle', qs: 'Quotient de Succès',
  compass: 'Test Compass', valeurs: 'Test des Valeurs',
  quiz_coach: 'Quiz Final N1', quiz_coach_n2: 'Quiz Final N2',
  quiz_dev_pers: 'Quiz Développement Personnel',
}

const MAPPING_PDF: Record<string, string> = {
  sentinelle: 'sentinelle.pdf', gardien: 'gardien.pdf', alchimiste: 'alchimiste.pdf',
  explorateur: 'explorateur.pdf', architecte: 'architecte.pdf', marcheur: 'marcheur.pdf',
}
const MAPPING_NAMES: Record<string, string> = {
  sentinelle: 'La Sentinelle des Cimes', gardien: 'Le Gardien des Racines',
  alchimiste: "L'Alchimiste des Émotions", navigateur: 'Le Navigateur des Profondeurs',
  explorateur: "L'Explorateur des Horizons", architecte: "L'Architecte des Ponts",
  marcheur: 'Le Marcheur des Tempêtes',
}

type DownloadTarget = { result: any; learnerName: string }

export default function TrainerTests() {
  const [results, setResults] = useState<any[]>([])
  const [learners, setLearners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Download state — same pattern as EspaceTests
  const [qsTarget, setQsTarget] = useState<DownloadTarget | null>(null)
  const [qsLoading, setQsLoading] = useState(false)
  const qsRef = useRef<HTMLDivElement>(null)

  const [ieTarget, setIeTarget] = useState<DownloadTarget | null>(null)
  const [ieLoading, setIeLoading] = useState(false)
  const ieRef = useRef<HTMLDivElement>(null)

  const [valTarget, setValTarget] = useState<DownloadTarget | null>(null)
  const [valLoading, setValLoading] = useState(false)
  const valRef = useRef<HTMLDivElement>(null)

  const [mappingLoading, setMappingLoading] = useState<string | null>(null)

  useEffect(() => {
    trainerApiCall({ action: 'get_tests' }).then(d => {
      setResults(d.results || [])
      setLearners(d.learners || [])
      setLoading(false)
    })
  }, [])

  // QS download
  useEffect(() => {
    if (!qsTarget) return
    const timer = setTimeout(async () => {
      if (!qsRef.current) return
      setQsLoading(true)
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
        const pages = Array.from(qsRef.current.children) as HTMLElement[]
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [QS_W, QS_H] })
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: QS_W, height: QS_H })
          if (i > 0) pdf.addPage([QS_W, QS_H], 'portrait')
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, QS_W, QS_H)
        }
        pdf.save(`TEST QS_${qsTarget.learnerName}.pdf`)
      } catch (e: any) { toast.error('Erreur PDF QS : ' + (e?.message || 'inconnue')) }
      setQsLoading(false)
      setQsTarget(null)
    }, 800)
    return () => clearTimeout(timer)
  }, [qsTarget])

  // IE download
  useEffect(() => {
    if (!ieTarget) return
    const timer = setTimeout(async () => {
      if (!ieRef.current) return
      setIeLoading(true)
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
        const pages = Array.from(ieRef.current.children) as HTMLElement[]
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [IE_W, IE_H] })
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: IE_W, height: IE_H })
          if (i > 0) pdf.addPage([IE_W, IE_H], 'portrait')
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, IE_W, IE_H)
        }
        pdf.save(`Test IE - ${ieTarget.learnerName}.pdf`)
      } catch (e: any) { toast.error('Erreur PDF IE : ' + (e?.message || 'inconnue')) }
      setIeLoading(false)
      setIeTarget(null)
    }, 800)
    return () => clearTimeout(timer)
  }, [ieTarget])

  // Valeurs download
  useEffect(() => {
    if (!valTarget) return
    const timer = setTimeout(async () => {
      if (!valRef.current) return
      setValLoading(true)
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
        const pages = Array.from(valRef.current.children) as HTMLElement[]
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [VAL_W, VAL_H] })
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: VAL_W, height: VAL_H })
          if (i > 0) pdf.addPage([VAL_W, VAL_H], 'portrait')
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, VAL_W, VAL_H)
        }
        pdf.save(`Test Valeurs - ${valTarget.learnerName}.pdf`)
      } catch (e: any) { toast.error('Erreur PDF Valeurs : ' + (e?.message || 'inconnue')) }
      setValLoading(false)
      setValTarget(null)
    }, 800)
    return () => clearTimeout(timer)
  }, [valTarget])

  async function downloadMapping(result: any, learnerName: string) {
    const profile = (result.dominant_profile || '').toLowerCase().trim()
    const filename = MAPPING_PDF[profile]
    if (!filename) { toast.error('Profil Mapping non reconnu'); return }
    setMappingLoading(result.id)
    const url = `${SUPABASE_URL}/storage/v1/object/public/test-profiles/${filename}`
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${learnerName} - ${MAPPING_NAMES[profile] || profile}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch { window.open(url, '_blank') }
    setMappingLoading(null)
  }

  function downloadCompass(result: any, learnerName: string) {
    const profile = result.dominant_profile || ''
    const prof = COMPASS_PROFILES[profile as keyof typeof COMPASS_PROFILES]
    if (!prof?.pdfFile) { toast.error('PDF Compass non disponible'); return }
    const a = document.createElement('a')
    a.href = `/pdfs/compass/${encodeURIComponent(prof.pdfFile)}`
    a.download = `${learnerName} - ${prof.pdfFile}`
    a.target = '_blank'; a.click()
  }

  function handleDownload(result: any, learnerName: string) {
    const type = result.test_type
    if (type === 'qs') setQsTarget({ result, learnerName })
    else if (type === 'ie') setIeTarget({ result, learnerName })
    else if (type === 'valeurs') setValTarget({ result, learnerName })
    else if (type === 'mapping') downloadMapping(result, learnerName)
    else if (type === 'compass') downloadCompass(result, learnerName)
    else {
      // Quiz / autres : HTML imprimable
      const scores = result.scores || {}
      const pct = scores.percentage ?? 0
      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${TEST_LABELS[type] || type} — ${learnerName}</title>
<style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#1a1a2e;padding:0 20px}.header{border-bottom:2px solid #e5e7eb;padding-bottom:20px;margin-bottom:24px}.participant{background:#f9fafb;border-radius:8px;padding:14px 18px;margin-bottom:24px}.big-score{font-size:64px;font-weight:800;color:#1d4ed8;text-align:center;line-height:1}.badge{display:inline-block;padding:6px 18px;border-radius:20px;font-weight:700;font-size:15px;margin:10px auto;display:block;width:fit-content}.badge.pass{background:#dcfce7;color:#166534}.badge.fail{background:#fee2e2;color:#991b1b}.footer{margin-top:40px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px}@media print{.no-print{display:none}}</style>
</head><body>
<div class="header"><h1>${TEST_LABELS[type] || type}</h1></div>
<div class="participant"><strong>${learnerName}</strong><span style="display:block;font-size:13px;color:#6b7280">Passé le ${new Date(result.created_at).toLocaleDateString('fr-FR')}</span></div>
<div class="big-score">${pct}%</div>
<div class="badge ${pct >= 70 ? 'pass' : 'fail'}">${pct >= 70 ? 'Validé' : 'À retravailler'} · ${scores.correct ?? 0}/${scores.total ?? 0}</div>
<div class="footer">Success Compass Academy</div>
<br><button class="no-print" onclick="window.print()" style="display:block;margin:0 auto;padding:10px 30px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;cursor:pointer">Imprimer / Enregistrer PDF</button>
</body></html>`
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.target = '_blank'; a.rel = 'noopener'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    }
  }

  function isLoading(result: any) {
    const type = result.test_type
    if (type === 'qs') return qsLoading
    if (type === 'ie') return ieLoading
    if (type === 'valeurs') return valLoading
    if (type === 'mapping') return mappingLoading === result.id
    return false
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  const byLearner: Record<string, any[]> = {}
  for (const r of results) {
    const lid = r._learner_id
    if (!lid) continue
    if (!byLearner[lid]) byLearner[lid] = []
    byLearner[lid].push(r)
  }

  const sortedLearners = learners
    .filter(l => byLearner[l.id]?.length > 0)
    .sort((a, b) => a.participant_name.localeCompare(b.participant_name))

  const noResults = learners.filter(l => !byLearner[l.id]?.length)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tests des apprenants</h1>
        <p className="text-sm text-gray-500 mt-0.5">{results.length} résultat{results.length > 1 ? 's' : ''} · {sortedLearners.length} apprenant{sortedLearners.length > 1 ? 's' : ''} ont complété au moins un test</p>
      </div>

      {sortedLearners.map(l => {
        const res = byLearner[l.id] || []
        const isOpen = expanded === l.id
        return (
          <div key={l.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setExpanded(isOpen ? null : l.id)}>
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700 font-bold text-sm">
                {l.participant_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{l.participant_name}</p>
                <p className="text-xs text-gray-400">{res.length} test{res.length > 1 ? 's' : ''} complété{res.length > 1 ? 's' : ''}</p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-50 divide-y divide-gray-50">
                {res.map((r: any) => (
                  <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{TEST_LABELS[r.test_type] || r.test_type}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                      {r.scores && (
                        <p className="text-xs text-gray-500 mt-1">
                          {typeof r.scores === 'object'
                            ? Object.entries(r.scores as Record<string, any>).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')
                            : JSON.stringify(r.scores)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownload(r, l.participant_name)}
                      disabled={isLoading(r)}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50">
                      {isLoading(r)
                        ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Génération…</>
                        : <><Download className="w-3.5 h-3.5" /> Télécharger</>
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {noResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Aucun test complété</p>
          <div className="space-y-2">
            {noResults.map(l => (
              <div key={l.id} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-bold">
                  {l.participant_name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-gray-500">{l.participant_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {learners.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucun résultat disponible</p>
        </div>
      )}

      {/* Hidden render targets — même logique que EspaceTests */}
      {qsTarget && (
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
          <QSReportTemplate
            ref={qsRef}
            firstName={qsTarget.result.first_name || qsTarget.learnerName.split(' ')[0] || ''}
            lastName={qsTarget.result.last_name || qsTarget.learnerName.split(' ').slice(1).join(' ') || ''}
            answers={(qsTarget.result.answers || {}) as Record<number, number>}
          />
        </div>
      )}
      {ieTarget && (
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
          <IEReportTemplate
            ref={ieRef}
            firstName={ieTarget.result.first_name || ieTarget.learnerName.split(' ')[0] || ''}
            lastName={ieTarget.result.last_name || ieTarget.learnerName.split(' ').slice(1).join(' ') || ''}
            scores={(ieTarget.result.scores || {}) as any}
          />
        </div>
      )}
      {valTarget && (
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
          <ValeursReportTemplate
            ref={valRef}
            firstName={valTarget.result.first_name || valTarget.learnerName.split(' ')[0] || ''}
            lastName={valTarget.result.last_name || valTarget.learnerName.split(' ').slice(1).join(' ') || ''}
            scores={(valTarget.result.scores || {}) as Record<string, number>}
          />
        </div>
      )}
    </div>
  )
}
