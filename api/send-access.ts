import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { learnerId } = req.body || {}
    if (!learnerId) return res.status(400).json({ error: 'learnerId requis' })

    // Fetch learner account
    const { data: learner, error: e1 } = await db
      .from('learner_accounts')
      .select('participant_name, username, password, participant_id')
      .eq('id', learnerId)
      .single()
    if (e1 || !learner) return res.status(404).json({ error: 'Apprenant introuvable' })

    // Get email: from request body, participant_id link, or name match
    let email: string | null = req.body.email || null

    if (!email && learner.participant_id) {
      const { data: p } = await db.from('participants').select('email').eq('id', learner.participant_id).single()
      email = p?.email || null
    }

    if (!email) {
      // Try matching by name
      const nameParts = learner.participant_name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')
      const { data: ps } = await db.from('participants').select('email').ilike('first_name', firstName).ilike('last_name', lastName).limit(1)
      email = ps?.[0]?.email || null
    }

    if (!email) return res.status(400).json({ error: 'Aucun email trouvé pour cet apprenant' })

    const firstName = learner.participant_name.split(' ')[0]
    const loginUrl = 'https://success-compass.vercel.app/espace'

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">

    <div style="background:#1B2A4A;padding:32px 40px;text-align:center">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700">Success Compass</h1>
      <p style="color:#93c5fd;margin:6px 0 0;font-size:14px">Coaching & Formation</p>
    </div>

    <div style="padding:40px">
      <p style="color:#374151;font-size:16px;margin:0 0 24px">Bonjour <strong>${firstName}</strong>,</p>

      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 28px">
        Bienvenue chez Success Compass ! 🎉<br>
        Votre espace personnel est prêt. Voici vos identifiants de connexion :
      </p>

      <div style="background:#f0f4ff;border-radius:12px;padding:24px;margin:0 0 28px;border-left:4px solid #1B2A4A">
        <div style="margin-bottom:16px">
          <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px">Identifiant</p>
          <p style="color:#1B2A4A;font-size:18px;font-weight:700;font-family:monospace;margin:0">${learner.username}</p>
        </div>
        <div>
          <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px">Mot de passe</p>
          <p style="color:#1B2A4A;font-size:18px;font-weight:700;font-family:monospace;margin:0">${learner.password}</p>
        </div>
      </div>

      <div style="text-align:center;margin:0 0 32px">
        <a href="${loginUrl}" style="display:inline-block;background:#1B2A4A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600">
          Accéder à mon espace →
        </a>
      </div>

      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;text-align:center">
        Pour toute question, contactez-nous à <a href="mailto:contact@successcompass.ma" style="color:#1B2A4A">contact@successcompass.ma</a><br>
        Lien direct : <a href="${loginUrl}" style="color:#1B2A4A">${loginUrl}</a>
      </p>
    </div>

    <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:12px;margin:0">© ${new Date().getFullYear()} Success Compass Academy — Tous droits réservés</p>
    </div>
  </div>
</body>
</html>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Success Compass <onboarding@resend.dev>',
        to: [email],
        subject: '🎓 Vos accès à votre espace Success Compass',
        html,
      }),
    })

    if (!r.ok) {
      const err = await r.json()
      throw new Error(err.message || 'Erreur Resend')
    }

    return res.status(200).json({ ok: true, email })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erreur serveur' })
  }
}
