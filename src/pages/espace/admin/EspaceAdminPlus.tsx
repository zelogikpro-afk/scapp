import { Link } from 'react-router-dom'
import { clearLearnerSession } from '../../../lib/learnerSession'
import { useNavigate } from 'react-router-dom'

const LINKS = [
  { label: 'Messages & notifications', sub: 'Déclarations paiement, demandes packs', icon: '💬', color: '#EF4444', bg: '#FEF2F2', path: '/espace/admin/messages' },
  { label: 'Coaching individuel',      sub: 'Planifier les séances, suivre les packs', icon: '🎯', color: '#10B981', bg: '#ECFDF5', path: '/espace/admin/coaching' },
  { label: 'Vidéos & enregistrements', sub: 'Ajouter et organiser les séances vidéo', icon: '🎬', color: '#6C5CE7', bg: '#F0EEFF', path: '/espace/admin/videos' },
  { label: 'Documents & ressources',   sub: 'PDFs, supports de cours par niveau',    icon: '📄', color: '#3B82F6', bg: '#EFF6FF', path: '/espace/admin/documents' },
  { label: 'Tests & accès',            sub: 'Débloquer les tests par apprenante',     icon: '🧪', color: '#6C5CE7', bg: '#F0EEFF', path: '/espace/admin/tests' },
  { label: 'Promotions & sessions',    sub: 'Gérer les promotions et sessions',       icon: '🏫', color: '#F59E0B', bg: '#FFFBEB', path: '/espace/admin/promotions' },
]

export default function EspaceAdminPlus() {
  const navigate = useNavigate()

  function logout() {
    clearLearnerSession()
    navigate('/espace/login', { replace: true })
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1E1B4B', marginBottom: 4 }}>Gestion avancée</div>
        <div style={{ fontSize: 13, color: '#8B8AAA' }}>Contenu, tests et structure du programme</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {LINKS.map((item, i) => (
          <Link key={i} to={item.path}
            style={{ background: '#fff', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#8B8AAA', marginTop: 2 }}>{item.sub}</div>
            </div>
            {i > 1 && <div style={{ fontSize: 11, fontWeight: 600, color: '#C4C2DD', background: '#F5F4FF', padding: '3px 8px', borderRadius: 6 }}>Bientôt</div>}
          </Link>
        ))}
      </div>

      {/* Compte */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Compte admin</div>
        <button onClick={logout}
          style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#FEF2F2', color: '#EF4444', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
