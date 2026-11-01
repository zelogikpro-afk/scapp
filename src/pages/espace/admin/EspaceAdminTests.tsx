import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'

interface Learner { id: string; participant_name: string; formation_level: string }
interface TestUnlock { id: string; learner_id: string; test_type: string }

const TESTS = [
  { type: 'mapping',       label: 'Mapping',      level: 'N1' },
  { type: 'ie',            label: 'IE',           level: 'N1' },
  { type: 'qs',            label: 'QS',           level: 'N1' },
  { type: 'compass',       label: 'Compass',      level: 'N1' },
  { type: 'valeurs',       label: 'Valeurs',      level: 'N1' },
  { type: 'quiz_coach',    label: 'Quiz N1',      level: 'N1' },
  { type: 'quiz_coach_n2', label: 'Quiz N2',      level: 'N2' },
  { type: 'quiz_dev_pers', label: 'Quiz Dév.',    level: 'N2' },
]

export default function EspaceAdminTests() {
  const [learners, setLearners] = useState<Learner[]>([])
  const [unlocks, setUnlocks] = useState<TestUnlock[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null)
  const [togglingType, setTogglingType] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [learnRes, unlockRes] = await Promise.all([
      supabaseAdmin.from('learner_accounts').select('id, participant_name, formation_level').neq('formation_level', 'admin').order('participant_name'),
      supabaseAdmin.from('test_unlocks').select('*'),
    ])
    setLearners(learnRes.data || [])
    setUnlocks(unlockRes.data || [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  function isUnlocked(learnerId: string, testType: string) {
    return unlocks.some(u => u.learner_id === learnerId && u.test_type === testType)
  }

  async function toggleTest(learnerId: string, testType: string) {
    const unlocked = isUnlocked(learnerId, testType)
    setTogglingType(testType)
    if (unlocked) {
      const existing = unlocks.find(u => u.learner_id === learnerId && u.test_type === testType)
      if (existing) {
        await supabaseAdmin.from('test_unlocks').delete().eq('id', existing.id)
        setUnlocks(prev => prev.filter(u => u.id !== existing.id))
        showToast('Test verrouillé')
      }
    } else {
      const { data } = await supabaseAdmin.from('test_unlocks').insert({ learner_id: learnerId, test_type: testType }).select()
      if (data) { setUnlocks(prev => [...prev, data[0]]); showToast('Test débloqué ✓') }
    }
    setTogglingType(null)
  }

  const filtered = learners.filter(l =>
    l.participant_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  return (
    <div style={{ paddingTop: 16 }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1E1B4B', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 100 }}>{toast}</div>}

      <div style={{ background: 'linear-gradient(135deg,#10B981,#6C5CE7)', borderRadius: 20, padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Tests & Accès</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Débloquer les tests par apprenante</div>
      </div>

      {selectedLearner ? (
        <div>
          <button onClick={() => setSelectedLearner(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0EEFF', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#6C5CE7', cursor: 'pointer', marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Retour
          </button>
          <div style={{ background: '#F0EEFF', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
              {selectedLearner.participant_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1E1B4B' }}>{selectedLearner.participant_name}</div>
              <div style={{ fontSize: 12, color: '#6C5CE7' }}>{selectedLearner.formation_level}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TESTS.map(test => {
              const unlocked = isUnlocked(selectedLearner.id, test.type)
              return (
                <div key={test.type} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{test.label}</div>
                    <div style={{ fontSize: 11, color: '#8B8AAA' }}>{test.level}</div>
                  </div>
                  <button onClick={() => toggleTest(selectedLearner.id, test.type)} disabled={togglingType === test.type}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: unlocked ? '#ECFDF5' : '#F5F4FF', color: unlocked ? '#10B981' : '#8B8AAA', transition: 'all 0.15s' }}>
                    {unlocked ? '✓ Débloqué' : 'Verrouillé'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#8B8AAA' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une apprenante…" style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(l => {
              const unlockedCount = unlocks.filter(u => u.learner_id === l.id).length
              return (
                <button key={l.id} onClick={() => setSelectedLearner(l)} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(108,92,231,0.06)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#6C5CE7', flexShrink: 0 }}>
                    {l.participant_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.participant_name}</div>
                    <div style={{ fontSize: 11, color: '#8B8AAA' }}>{unlockedCount} test{unlockedCount > 1 ? 's' : ''} débloqué{unlockedCount > 1 ? 's' : ''}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4C2DD" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
