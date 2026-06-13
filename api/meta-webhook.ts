import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://twcqvpgpzayjxiwzzesb.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function getSetting(key: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?key=eq.${key}&select=value`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  })
  const rows = await res.json()
  return rows?.[0]?.value || ''
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // META webhook verification (GET)
  if (req.method === 'GET') {
    const verifyToken = await getSetting('meta_webhook_verify_token')
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge)
    }
    return res.status(403).json({ error: 'Forbidden' })
  }

  // META webhook events (POST)
  if (req.method === 'POST') {
    const body = req.body
    try {
      for (const entry of body?.entry || []) {
        for (const change of entry?.changes || []) {
          if (change.field !== 'leadgen') continue
          const { leadgen_id, form_id, page_id } = change.value

          // Fetch the lead data from Meta API
          const token = await getSetting('meta_page_access_token')
          if (!token) continue

          const metaRes = await fetch(
            `https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${token}&fields=id,created_time,field_data,ad_id,form_id`
          )
          const leadData = await metaRes.json()
          if (leadData.error) continue

          const fields: Record<string, string> = {}
          for (const f of leadData.field_data || []) {
            fields[f.name] = f.values?.[0] || ''
          }

          const nomComplet = fields['nom_complet'] || fields['full_name'] || fields['name'] || ''
          const parts = nomComplet.trim().split(/\s+/)
          const rawPhone = fields['numéro_de_téléphone'] || fields['phone_number'] || fields['phone'] || ''
          const phone = /^\d{9}$/.test(rawPhone.replace(/\s/g, '')) ? '0' + rawPhone.replace(/\s/g, '') : rawPhone
          const delai = fields["sous_combien_de_temps_souhaitez-vous_passer_à_l'action_?"] || ''
          const interestLevel = delai.includes('imméd') ? 'high' : delai.includes('mois') ? 'medium' : delai.includes('plus_tard') ? 'low' : null

          await upsertLead({
            id: leadgen_id,
            firstName: parts[0] || 'Inconnu',
            lastName: parts.slice(1).join(' '),
            phone,
            city: fields['ville'] || null,
            profession: fields["quelle_est_votre_situation_professionnelle_actuelle_?"] || null,
            programInterest: fields["quel_est_votre_objectif_principal_aujourd'hui_?"] || null,
            source: 'Meta',
            campaign: null,
            status: 'new',
            interestLevel,
            createdAt: leadData.created_time ? new Date(leadData.created_time * 1000).toISOString() : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: [],
            followUps: [],
            tags: [],
          })
        }
      }
      return res.status(200).send('EVENT_RECEIVED')
    } catch (err) {
      return res.status(200).send('EVENT_RECEIVED') // always 200 to Meta
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
