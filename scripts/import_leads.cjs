// Script d'import des leads depuis Excel vers Supabase
// Usage: node scripts/import_leads.js

const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SUPABASE_KEY = 'sb_publishable_rfRvn5gT0DhWxskbINmS-w_nwr--f-r'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Mapping statuts Excel → DB
const STATUS_MAP = {
  'nouveau lead':         'new',
  'a contacter':          'to_contact',
  'contacté':             'contacted',
  'contacte':             'contacted',
  'injoignable':          'no_answer',
  'en réflexion':         'callback',
  'en reflexion':         'callback',
  'rendez-vous fixé':     'appointment',
  'rendez-vous fixe':     'appointment',
  'paiement en attente':  'pending_payment',
  'refus':                'not_interested',
  'inscrit':              'registered',
}

const INTEREST_MAP = {
  'eleve': 'high',
  'élevé': 'high',
  'moyen': 'medium',
  'faible': 'low',
  'bas': 'low',
}

function normalizeStatus(val) {
  if (!val) return 'new'
  const key = val.toString().toLowerCase().trim()
  return STATUS_MAP[key] || 'new'
}

function normalizeInterest(val) {
  if (!val) return null
  const key = val.toString().toLowerCase().trim()
  return INTEREST_MAP[key] || null
}

function normalizePhone(phone) {
  if (!phone) return null
  let p = phone.toString().trim().replace(/\s+/g, '')
  if (p.startsWith('00212')) p = '0' + p.slice(5)
  if (p.startsWith('+212')) p = '0' + p.slice(4)
  return p
}

function parseDate(val) {
  if (!val) return new Date().toISOString()
  // Handle DD/MM/YYYY format
  if (typeof val === 'string' && val.includes('/')) {
    const [d, m, y] = val.split('/')
    return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`).toISOString()
  }
  // Excel serial date
  if (typeof val === 'number') {
    return new Date((val - 25569) * 86400 * 1000).toISOString()
  }
  return new Date().toISOString()
}

async function main() {
  const wb = XLSX.readFile('C:/Users/Zineb Eddaqaqi/Downloads/leads_export_2026-06-12.xlsx')
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

  console.log(`📋 ${rows.length} leads à importer`)

  const leads = rows.map(row => ({
    first_name:       (row['Prénom'] || '').toString().trim() || 'Inconnu',
    last_name:        (row['Nom'] || '').toString().trim() || 'Inconnu',
    phone:            normalizePhone(row['Téléphone']) || '0000000000',
    email:            (row['Email'] || '').toString().trim() || null,
    city:             (row['Ville'] || '').toString().trim() || null,
    profession:       (row['Profession'] || '').toString().trim() || null,
    program_interest: (row['Formation'] || '').toString().trim() || null,
    source:           (row['Source'] || 'Meta').toString().trim(),
    status:           normalizeStatus(row['Statut']),
    interest_level:   normalizeInterest(row['Niveau intérêt']),
    tags:             [],
    created_at:       parseDate(row['Date création']),
  }))

  // Supprimer les doublons par téléphone
  const seen = new Set()
  const unique = leads.filter(l => {
    if (seen.has(l.phone)) return false
    seen.add(l.phone)
    return true
  })
  console.log(`✅ ${unique.length} leads uniques (${leads.length - unique.length} doublons ignorés)`)

  // Insérer par batch de 50
  let inserted = 0
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50)
    const { error } = await supabase.from('leads').insert(batch)
    if (error) {
      console.error(`❌ Erreur batch ${i}-${i+50}:`, error.message)
    } else {
      inserted += batch.length
      console.log(`  ✓ ${inserted}/${unique.length} insérés`)
    }
  }

  console.log(`\n🎉 Import terminé: ${inserted} leads dans Supabase`)
}

main().catch(console.error)
