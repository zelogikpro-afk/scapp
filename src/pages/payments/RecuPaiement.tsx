import { useState, useCallback, useRef } from 'react'
import { FileText, RefreshCw, Download, Trash2, History, Plus, Eye, Image } from 'lucide-react'
import html2canvas from 'html2canvas'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { LOGO_B64 as logo } from '../../assets/logoB64'
import toast from 'react-hot-toast'

// ── helpers ─────────────────────────────────────────────────────────────────

const UNITES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
const DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

function centToText(n: number): string {
  if (n === 0) return ''
  if (n < 20) return UNITES[n]
  const d = Math.floor(n / 10), u = n % 10
  if (d === 7) return u === 1 ? 'soixante et onze' : 'soixante-' + UNITES[10 + u]
  if (d === 9) return u === 0 ? 'quatre-vingt' : 'quatre-vingt-' + UNITES[u]
  if (u === 0) return DIZAINES[d] + (d === 8 ? 's' : '')
  if (u === 1 && d !== 8) return DIZAINES[d] + ' et un'
  return DIZAINES[d] + '-' + UNITES[u]
}

function numToText(n: number): string {
  n = Math.floor(n)
  if (n === 0) return 'zéro'
  let result = ''
  const k = Math.floor((n % 1_000_000) / 1000)
  const c = n % 1000
  if (k) {
    const kc = Math.floor(k / 100), kr = k % 100
    if (kc === 1 && kr === 0) result += 'mille '
    else if (kc > 1 && kr === 0) result += centToText(kc) + ' cents mille '
    else if (kc === 1) result += 'mille ' + centToText(kr) + ' '
    else if (kc > 1) result += centToText(kc) + ' cent ' + centToText(kr) + ' mille '
    else result += centToText(kr) + ' mille '
  }
  if (c) {
    const cc = Math.floor(c / 100), cr = c % 100
    if (cc === 1) result += 'cent ' + centToText(cr)
    else if (cc > 1 && cr === 0) result += centToText(cc) + ' cents'
    else if (cc > 1) result += centToText(cc) + ' cent ' + centToText(cr)
    else result += centToText(cr)
  }
  return result.trim()
}

function montantEnLettres(n: number): string {
  const entier = Math.floor(n)
  const cents = Math.round((n - entier) * 100)
  let txt = numToText(entier) + ' dirham' + (entier > 1 ? 's' : '')
  if (cents > 0) txt += ' et ' + numToText(cents) + ' centime' + (cents > 1 ? 's' : '')
  return txt.charAt(0).toUpperCase() + txt.slice(1)
}

function formatDate(val: string): string {
  if (!val) return '—'
  const [y, m, d] = val.split('-')
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  return parseInt(d) + ' ' + months[parseInt(m) - 1] + ' ' + y
}

function autoNum(): string {
  const now = new Date()
  return 'SCA-' + now.getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100)
}

// ── types ─────────────────────────────────────────────────────────────────────

interface ReceiptData {
  id: string
  num: string
  date: string
  nom: string
  programme: string
  montant: string
  resteAPayer: string
  mode: string
  objet: string
  createdAt: string
}

const MODES = ['Virement bancaire', 'Espèces', 'Chèque', 'Carte bancaire', 'Mobile payment']
const STORAGE_KEY = 'sc-recus'

function loadHistory(): ReceiptData[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveHistory(list: ReceiptData[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

// ── receipt HTML (print window) ───────────────────────────────────────────────

function buildReceiptHTML(r: ReceiptData, logoSrc: string): string {
  const montantNum = parseFloat(r.montant) || 0
  const montantFormatted = montantNum > 0
    ? montantNum.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD'
    : '—'
  const lettres = montantNum > 0 ? montantEnLettres(montantNum) : ''

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Reçu ${r.num} — ${r.nom}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; display: flex; justify-content: center; padding: 40px 20px; color: #1a2d4e; }
  .receipt { background: #fff; width: 620px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border: 1px solid #c8d8ec; }
  .hdr { background: #1a3a6b; padding: 24px 32px; display: flex; align-items: center; gap: 20px; }
  .hdr img { width: 72px; height: 72px; object-fit: contain; }
  .hdr-text { flex: 1; }
  .academy-name { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: 0.5px; line-height: 1.2; }
  .academy-tagline { font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
  .receipt-no { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 6px; font-family: monospace; }
  .badge { background: #fff; color: #1a3a6b; font-weight: 800; font-size: 12px; padding: 6px 16px; border-radius: 4px; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; }
  .blue-bar { height: 4px; background: linear-gradient(90deg, #1a3a6b, #2a9bd4, #1a3a6b); }
  .body { padding: 28px 32px; }
  .montant-box { background: #eaf4fb; border: 1.5px solid #2a9bd4; border-radius: 8px; padding: 18px 20px; text-align: center; margin-bottom: 22px; }
  .montant-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #2a9bd4; margin-bottom: 6px; }
  .montant-value { font-size: 30px; font-weight: 800; color: #1a3a6b; letter-spacing: 0.01em; font-variant-numeric: tabular-nums; }
  .montant-lettres { font-size: 12px; color: #6b8cae; margin-top: 5px; font-style: italic; }
  .rows { }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 9px 0; border-bottom: 1px dashed #d0dcea; }
  .row:last-child { border-bottom: none; }
  .row-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #6b8cae; white-space: nowrap; flex-shrink: 0; }
  .row-value { font-size: 13px; font-weight: 600; color: #1a2d4e; text-align: right; }
  .footer { border-top: 2px solid #eaf0f8; padding: 18px 32px 22px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; background: #f8fafc; }
  .footer-info { font-size: 11px; color: #8aa4be; line-height: 1.9; }
  .sig-area { text-align: right; }
  .sig-line { width: 130px; height: 1px; background: #b0c4d8; margin-bottom: 6px; margin-left: auto; }
  .sig-label { font-size: 10px; color: #8aa4be; text-transform: uppercase; letter-spacing: 0.06em; }
  @media print {
    body { background: #fff; padding: 0; }
    .receipt { box-shadow: none; border-radius: 0; width: 100%; border: none; }
  }
</style></head><body>
<div class="receipt">
  <div class="hdr">
    <img src="${logoSrc}" alt="Success Compass Academy" />
    <div class="hdr-text">
      <div class="academy-name">Success Compass<br>Academy</div>
      <div class="academy-tagline">Coaching · Formation · Consulting</div>
      <div class="receipt-no">N° ${r.num}</div>
    </div>
    <div class="badge">REÇU</div>
  </div>
  <div class="blue-bar"></div>
  <div class="body">
    <div class="montant-box">
      <div class="montant-label">Montant reçu</div>
      <div class="montant-value">${montantFormatted}</div>
      ${lettres ? `<div class="montant-lettres">${lettres}</div>` : ''}
    </div>
    <div class="rows">
      <div class="row"><span class="row-label">Date</span><span class="row-value">${formatDate(r.date)}</span></div>
      <div class="row"><span class="row-label">Client</span><span class="row-value">${r.nom || '—'}</span></div>
      <div class="row"><span class="row-label">Programme</span><span class="row-value">${r.programme || '—'}</span></div>
      <div class="row"><span class="row-label">Mode de paiement</span><span class="row-value">${r.mode}</span></div>
      ${r.objet ? `<div class="row"><span class="row-label">Objet</span><span class="row-value">${r.objet}</span></div>` : ''}
      ${parseFloat(r.resteAPayer) > 0 ? `<div class="row" style="border-top:2px solid #1a3a6b;margin-top:4px;padding-top:12px"><span class="row-label" style="color:#1a3a6b">Reste à payer</span><span class="row-value" style="font-size:15px">${parseFloat(r.resteAPayer).toLocaleString('fr-MA',{minimumFractionDigits:2,maximumFractionDigits:2})} MAD</span></div>` : ''}
    </div>
  </div>
  <div class="footer">
    <div class="footer-info">
      <strong style="color:#1a3a6b">Success Compass Academy</strong><br>
      Rabat, Maroc<br>
      contact@successcompass.ma
    </div>
  </div>
</div>
<script>window.onload = () => window.print()<\/script>
</body></html>`
}

function downloadReceipt(r: ReceiptData) {
  const w = window.open('', '_blank')
  if (w) { w.document.write(buildReceiptHTML(r, logo)); w.document.close() }
  else toast.error('Autorisez les pop-ups pour télécharger le reçu.')
}

// ── component ─────────────────────────────────────────────────────────────────

const EMPTY = { num: '', date: '', nom: '', programme: '', montant: '', resteAPayer: '', mode: 'Virement bancaire', objet: '' }

export default function RecuPaiement() {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ ...EMPTY, num: autoNum(), date: today })
  const [history, setHistory] = useState<ReceiptData[]>(loadHistory)
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptData | null>(null)
  const [tab, setTab] = useState<'create' | 'history'>('create')
  const previewRef = useRef<HTMLDivElement>(null)
  const modalPreviewRef = useRef<HTMLDivElement>(null)

  async function downloadImage(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
    if (!ref.current) return
    try {
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = filename + '.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch { toast.error('Erreur lors de la génération de l\'image') }
  }

  const set = useCallback((key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })), [])

  const montantNum = parseFloat(form.montant) || 0
  const montantFormatted = montantNum > 0
    ? montantNum.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD'
    : '—'
  const lettres = montantNum > 0 ? montantEnLettres(montantNum) : ''

  function saveReceipt() {
    if (!form.nom.trim()) { toast.error('Le nom du bénéficiaire est requis'); return }
    if (!form.montant || montantNum <= 0) { toast.error('Le montant doit être supérieur à 0'); return }
    const r: ReceiptData = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }
    const updated = [r, ...history]
    setHistory(updated)
    saveHistory(updated)
    toast.success('Reçu enregistré')
    downloadReceipt(r)
    setForm({ ...EMPTY, num: autoNum(), date: today })
  }

  function deleteReceipt(id: string) {
    const updated = history.filter(r => r.id !== id)
    setHistory(updated)
    saveHistory(updated)
    toast.success('Reçu supprimé')
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {([['create', 'Nouveau reçu'], ['history', `Historique (${history.length})`]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >{label}</button>
        ))}
      </div>

      {tab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* FORM */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Informations</h2>
              <button
                onClick={() => setForm(f => ({ ...f, num: autoNum() }))}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Nouveau N°
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">N° Reçu</label>
                <Input value={form.num} onChange={set('num')} placeholder="SCA-2026-001" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</label>
                <Input type="date" value={form.date} onChange={set('date')} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nom du client</label>
              <Input value={form.nom} onChange={set('nom')} placeholder="Prénom NOM" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Formation / Programme</label>
              <Input value={form.programme} onChange={set('programme')} placeholder="Coaching de groupe — N1 Oct 2026" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Montant (MAD)</label>
                <Input type="number" value={form.montant} onChange={set('montant')} placeholder="2500" min={0} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mode de paiement</label>
                <select
                  value={form.mode}
                  onChange={set('mode')}
                  className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reste à payer (MAD)</label>
              <Input type="number" value={form.resteAPayer} onChange={set('resteAPayer')} placeholder="0" min={0} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Objet / Description</label>
              <textarea
                value={form.objet}
                onChange={set('objet')}
                placeholder="Acompte inscription — Session octobre 2026"
                rows={2}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <Button onClick={saveReceipt} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Enregistrer &amp; Télécharger
            </Button>
          </Card>

          {/* PREVIEW */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aperçu</p>
              <button
                onClick={() => downloadImage(previewRef, `recu-${form.num || 'SCA'}`)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
              >
                <Image className="w-3.5 h-3.5" /> Télécharger image
              </button>
            </div>
            <div ref={previewRef}>
              <ReceiptPreview
                num={form.num} date={form.date} nom={form.nom}
                programme={form.programme} montantFormatted={montantFormatted}
                lettres={lettres} mode={form.mode} objet={form.objet}
                resteAPayer={form.resteAPayer}
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 space-y-2">
              <History className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm">Aucun reçu enregistré.</p>
              <button onClick={() => setTab('create')} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mx-auto">
                <Plus className="w-3.5 h-3.5" /> Créer un premier reçu
              </button>
            </div>
          ) : (
            history.map(r => {
              const mNum = parseFloat(r.montant) || 0
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.nom || '—'}</span>
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{r.num}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.programme || '—'} · {formatDate(r.date)}</div>
                        <div className="text-sm font-bold text-blue-800 dark:text-blue-300 mt-1 tabular-nums">
                          {mNum > 0 ? mNum.toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD' : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setPreviewReceipt(r)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="Aperçu">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => downloadReceipt(r)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors" title="Télécharger">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteReceipt(r.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {previewReceipt && (
        <Modal open={!!previewReceipt} onClose={() => setPreviewReceipt(null)} title={`Reçu ${previewReceipt.num}`} size="lg">
          <div className="space-y-3">
            <div ref={modalPreviewRef}>
              <ReceiptPreview
                num={previewReceipt.num} date={previewReceipt.date} nom={previewReceipt.nom}
                programme={previewReceipt.programme}
                montantFormatted={parseFloat(previewReceipt.montant) > 0
                  ? parseFloat(previewReceipt.montant).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD' : '—'}
                lettres={parseFloat(previewReceipt.montant) > 0 ? montantEnLettres(parseFloat(previewReceipt.montant)) : ''}
                mode={previewReceipt.mode} objet={previewReceipt.objet}
                resteAPayer={previewReceipt.resteAPayer}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => downloadReceipt(previewReceipt)} className="flex-1 gap-2" variant="outline">
                <Download className="w-4 h-4" /> Imprimer / PDF
              </Button>
              <Button onClick={() => downloadImage(modalPreviewRef, `recu-${previewReceipt.num}`)} className="flex-1 gap-2" variant="outline">
                <Image className="w-4 h-4" /> Image PNG
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── ReceiptPreview ────────────────────────────────────────────────────────────

interface PreviewProps {
  num: string; date: string; nom: string; programme: string
  montantFormatted: string; lettres: string; mode: string; objet: string; resteAPayer?: string
}

function ReceiptPreview({ num, date, nom, programme, montantFormatted, lettres, mode, objet, resteAPayer }: PreviewProps) {
  const resteNum = parseFloat(resteAPayer || '') || 0
  return (
    <div className="bg-white dark:bg-gray-50 border border-gray-300 rounded-lg overflow-hidden shadow-md text-gray-900">
      {/* Header */}
      <div className="bg-[#1a3a6b] px-6 py-5 flex items-center gap-4">
        <img src={logo} alt="Success Compass Academy" className="w-16 h-16 object-contain flex-shrink-0" />
        <div className="flex-1">
          <div className="text-white font-bold text-base leading-tight">Success Compass<br />Academy</div>
          <div className="text-white/50 text-xs uppercase tracking-widest mt-1">Coaching · Formation · Consulting</div>
          {num && <div className="text-white/35 text-xs font-mono mt-1.5">N° {num}</div>}
        </div>
        <div className="bg-white text-[#1a3a6b] font-black text-xs px-3 py-1.5 rounded tracking-widest uppercase flex-shrink-0">
          REÇU
        </div>
      </div>

      {/* Blue bar */}
      <div className="h-1 bg-gradient-to-r from-[#1a3a6b] via-[#2a9bd4] to-[#1a3a6b]" />

      <div className="p-5 space-y-4">
        {/* Amount */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-blue-500 mb-1.5">Montant reçu</div>
          <div className="text-2xl font-extrabold text-[#1a3a6b] tabular-nums">{montantFormatted}</div>
          {lettres && <div className="text-xs text-blue-400 mt-1.5 italic">{lettres}</div>}
        </div>

        {/* Rows */}
        <div className="divide-y divide-dashed divide-gray-200">
          {([['Date', formatDate(date)], ['Client', nom || '—'], ['Programme', programme || '—'], ['Mode de paiement', mode], ...(objet ? [['Objet', objet]] : [])] as [string,string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between items-baseline gap-3 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">{label}</span>
              <span className="text-sm font-semibold text-gray-800 text-right">{value}</span>
            </div>
          ))}
          {resteNum > 0 && (
            <div className="flex justify-between items-baseline gap-3 py-2 border-t-2 border-[#1a3a6b] mt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a3a6b] whitespace-nowrap">Reste à payer</span>
              <span className="text-sm font-bold text-gray-800 text-right tabular-nums">
                {resteNum.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
        <div className="text-xs text-gray-400 leading-relaxed">
          <span className="font-semibold text-[#1a3a6b]">Success Compass Academy</span><br />
          Rabat, Maroc · contact@successcompass.ma
        </div>
      </div>
    </div>
  )
}
