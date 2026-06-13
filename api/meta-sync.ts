import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function getSettings(): Promise<Record<string, string>> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?select=key,value`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  })
  const rows: { key: string; value: string }[] = await res.json()
  return Object.fromEntries((rows || []).map(r => [r.key, r.value]))
}

async function upsertLead(lead: Record<string, any>) {
  await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(lead),
  })
}

function parseMetaLead(entry: any, source: string, campaign: string) {
  const fields: Record<string, string> = {}
  for (const f of entry.field_data || []) {
    fields[f.name] = f.values?.[0] || ''
  }

  const nomComplet = fields['nom_complet'] || fields['full_name'] || fields['name'] || ''
  const parts = nomComplet.trim().split(/\s+/)
  const firstName = parts[0] || 'Inconnu'
  const lastName = parts.slice(1).join(' ')

  const rawPhone = fields['numéro_de_téléphone'] || fields['phone_number'] || fields['phone'] || ''
  const phone = /^\d{9}$/.test(rawPhone.replace(/\s/g, '')) ? '0' + rawPhone.replace(/\s/g, '') : rawPhone

  const delai = fields["sous_combien_de_temps_souhaitez-vous_passer_à_l'action_?"] || ''
  const interestLevel = delai.includes('imméd') ? 'high' : delai.includes('1') || delai.includes('mois') ? 'medium' : delai.includes('plus_tard') ? 'low' : null

  return {
    id: entry.id,
    firstName,
    lastName,
    phone,
    city: fields['ville'] || fields['city'] || null,
    profession: fields["quelle_est_votre_situation_professionnelle_actuelle_?"] || null,
    programInterest: fields["quel_est_votre_objectif_principal_aujourd'hui_?"] || null,
    source,
    campaign: campaign || null,
    status: 'new',
    interestLevel,
    createdAt: entry.created_time ? new Date(entry.created_time * 1000).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [],
    followUps: [],
    tags: [],
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const settings = await getSettings()
    const token = settings['meta_page_access_token']
    const formIds = (settings['meta_form_ids'] || '').split(',').map(s => s.trim()).filter(Boolean)
    const campaignName = settings['meta_campaign_name'] || 'Meta Ads'

    if (!token) return res.status(400).json({ error: 'Token Meta non configuré. Allez dans Paramètres → Intégrations.' })
    if (!formIds.length) return res.status(400).json({ error: 'Aucun Form ID configuré.' })

    let totalImported = 0
    let totalSkipped = 0
    const errors: string[] = []

    for (const formId of formIds) {
      let url = `https://graph.facebook.com/v19.0/${formId}/leads?access_token=${token}&limit=100&fields=id,created_time,field_data`

      while (url) {
        const metaRes = await fetch(url)
        const data = await metaRes.json()

        if (data.error) {
          errors.push(`Form ${formId}: ${data.error.message}`)
          break
        }

        for (const entry of data.data || []) {
          const lead = parseMetaLead(entry, 'Meta', campaignName)
          await upsertLead(lead)
          totalImported++
        }

        url = data.paging?.next || ''
      }
    }

    return res.status(200).json({ imported: totalImported, skipped: totalSkipped, errors })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
