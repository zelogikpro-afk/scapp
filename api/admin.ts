import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getDb() {
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function verifyAdmin(authHeader: string | undefined): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  // Verify token against Supabase auth (anon key is enough for verification)
  const anonKey = process.env.SUPABASE_ANON_KEY!
  const client = createClient(supabaseUrl, anonKey)
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return false
  // Check user exists in profiles table and is active
  const db = getDb()
  const { data } = await db.from('profiles').select('role,is_active').eq('id', user.id).single()
  return !!(data && data.is_active)
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const isAdmin = await verifyAdmin(req.headers.authorization)
    if (!isAdmin) return res.status(401).json({ error: 'Non autorisé' })

    const { action, id, status, adminNote, payload = {} } = req.body || {}
    const db = getDb()
    let data: any

    switch (action) {
      case 'get_requests': {
        const [{ data: coaching }, { data: upgrades }] = await Promise.all([
          db.from('coaching_requests').select('*').order('created_at', { ascending: false }),
          db.from('level_upgrade_requests').select('*').order('created_at', { ascending: false }),
        ])
        data = { coaching: coaching || [], upgrades: upgrades || [] }
        break
      }
      case 'update_coaching_status': {
        const update: any = { status }
        if (adminNote !== undefined) update.admin_note = adminNote
        const { error } = await db.from('coaching_requests').update(update).eq('id', id)
        if (error) throw error
        data = { ok: true }
        break
      }
      case 'delete_coaching': {
        const { error } = await db.from('coaching_requests').delete().eq('id', id)
        if (error) throw error
        data = { ok: true }
        break
      }
      case 'update_upgrade_status': {
        const update: any = { status }
        if (payload.adminNote !== undefined) update.admin_note = payload.adminNote
        const { error } = await db.from('level_upgrade_requests').update(update).eq('id', id)
        if (error) throw error
        data = { ok: true }
        break
      }
      case 'delete_upgrade': {
        const { error } = await db.from('level_upgrade_requests').delete().eq('id', id)
        if (error) throw error
        data = { ok: true }
        break
      }
      default:
        return res.status(400).json({ error: 'Action inconnue' })
    }

    return res.status(200).json({ data })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erreur serveur' })
  }
}
