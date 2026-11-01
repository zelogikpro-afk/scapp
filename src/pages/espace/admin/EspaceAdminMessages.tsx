import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'

interface Msg {
  id: string
  learner_id: string
  content: string
  created_at: string
  read: boolean
  sender: string
}

interface LearnerAccount {
  id: string
  participant_name: string
}

export default function EspaceAdminMessages() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [learners, setLearners] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'paiement' | 'pack'>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: msgData }, { data: accData }] = await Promise.all([
      supabaseAdmin.from('learner_messages').select('*').eq('sender', 'learner').order('created_at', { ascending: false }).limit(200),
      supabaseAdmin.from('learner_accounts').select('id, participant_name'),
    ])
    const map: Record<string, string> = {}
    for (const a of (accData || []) as LearnerAccount[]) map[a.id] = a.participant_name
    setLearners(map)
    setMsgs(msgData || [])
    setLoading(false)
  }

  async function markRead(id: string) {
    await supabaseAdmin.from('learner_messages').update({ read: true }).eq('id', id)
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
  }

  async function markAllRead() {
    await supabaseAdmin.from('learner_messages').update({ read: true }).eq('sender', 'learner').eq('read', false)
    setMsgs(prev => prev.map(m => ({ ...m, read: true })))
  }

  const filtered = msgs.filter(m => {
    if (filter === 'unread') return !m.read
    if (filter === 'paiement') return m.content.includes('DÉCLARATION DE PAIEMENT')
    if (filter === 'pack') return m.content.includes('DEMANDE PACK COACHING')
    return true
  })

  const unreadCount = msgs.filter(m => !m.read).length

  function typeOf(content: string) {
    if (content.includes('DÉCLARATION DE PAIEMENT')) return { label: 'Paiement', color: '#10B981', bg: '#ECFDF5', emoji: '💳' }
    if (content.includes('DEMANDE PACK COACHING')) return { label: 'Pack', color: '#6C5CE7', bg: '#F0EEFF', emoji: '🎯' }
    return { label: 'Message', color: '#8B8AAA', bg: '#F5F4FF', emoji: '💬' }
  }

  function formatDate(s: string) {
    const d = new Date(s)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#6C5CE7,#8B5CF6)', borderRadius: 20, padding: '20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            Messages
            {unreadCount > 0 && <span style={{ background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '2px 8px' }}>{unreadCount}</span>}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{msgs.length} message{msgs.length !== 1 ? 's' : ''} reçu{msgs.length !== 1 ? 's' : ''}</div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '8px 12px', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            Tout lire
          </button>
        )}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {([
          { val: 'all', label: 'Tous' },
          { val: 'unread', label: `Non lus (${unreadCount})` },
          { val: 'paiement', label: '💳 Paiements' },
          { val: 'pack', label: '🎯 Packs' },
        ] as const).map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: filter === f.val ? '#6C5CE7' : '#fff',
              color: filter === f.val ? '#fff' : '#8B8AAA',
              boxShadow: '0 1px 4px rgba(108,92,231,0.08)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#8B8AAA' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 600 }}>Aucun message</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(m => {
            const type = typeOf(m.content)
            const name = learners[m.learner_id] || m.learner_id.slice(0, 8)
            const lines = m.content.split('\n').filter(Boolean)
            const preview = lines.slice(1, 4).join(' · ')
            return (
              <div key={m.id} onClick={() => !m.read && markRead(m.id)}
                style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(108,92,231,0.06)', borderLeft: m.read ? 'none' : '4px solid #6C5CE7', cursor: m.read ? 'default' : 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: type.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{type.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: 10, color: '#8B8AAA', flexShrink: 0, marginLeft: 8 }}>{formatDate(m.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: type.bg, color: type.color, borderRadius: 6, padding: '2px 7px' }}>{type.label}</span>
                      {!m.read && <span style={{ fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: '#3B82F6', borderRadius: 6, padding: '2px 7px' }}>Nouveau</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#8B8AAA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>
                    {/* Contenu détaillé */}
                    <div style={{ marginTop: 10, background: '#F5F4FF', borderRadius: 10, padding: '10px 12px' }}>
                      {lines.slice(1).map((line, i) => {
                        const [key, ...rest] = line.split(' : ')
                        const val = rest.join(' : ')
                        if (val && key.length < 30) return (
                          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: i < lines.length - 2 ? 4 : 0 }}>
                            <span style={{ fontSize: 11, color: '#8B8AAA', minWidth: 60 }}>{key}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#1E1B4B', wordBreak: 'break-all' }}>{val}</span>
                          </div>
                        )
                        return <div key={i} style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 2 }}>{line}</div>
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
