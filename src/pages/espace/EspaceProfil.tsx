import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { learnerApi, learnerApiCall } from '../../lib/learnerApi'
import { type LearnerSession, clearLearnerSession } from '../../lib/learnerSession'
import toast from 'react-hot-toast'

const LEVEL_META: Record<string, { label: string; color: string; bg: string }> = {
  N1: { label: 'Coach de vie', color: '#3B82F6', bg: '#EFF6FF' },
  N2: { label: 'Master Coach Thérapeute', color: '#6C5CE7', bg: '#F0EEFF' },
  N3: { label: 'Master Coach Consultant', color: '#F59E0B', bg: '#FFFBEB' },
}

type Section = 'menu' | 'infos' | 'packs' | 'paiements' | 'securite'

export default function EspaceProfil() {
  const session = useOutletContext<LearnerSession>()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>('menu')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [editForm, setEditForm] = useState({ phone: '', whatsapp: '', address: '', city: '', profession: '', email: '', gender: '', cin: '' })
  const [saving, setSaving] = useState(false)
  const [cinFile, setCinFile] = useState<File | null>(null)
  const [uploadingCin, setUploadingCin] = useState(false)

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  // Paiements state (hoisted to avoid Rules of Hooks violation)
  const [paiLoading, setPaiLoading] = useState(false)
  const [paiements, setPaiements] = useState<any>(null)
  const [paiLoaded, setPaiLoaded] = useState(false)

  // Packs state
  const [showRequest, setShowRequest] = useState(false)
  const [requestMsg, setRequestMsg] = useState('')
  const [selectedOffer, setSelectedOffer] = useState('')
  const [sendingReq, setSendingReq] = useState(false)

  // Déclaration paiement state
  const [showPayForm, setShowPayForm] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', method: 'virement', date: new Date().toISOString().split('T')[0], notes: '' })
  const [payReceipt, setPayReceipt] = useState<File | null>(null)
  const [sendingPay, setSendingPay] = useState(false)

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (section === 'paiements' && !paiLoaded) {
      setPaiLoading(true)
      learnerApiCall<any>({ action: 'get_payments', payload: { participantId: session.participantId || profile?.acc?.participant_id, allPromotionIds: session.allPromotionIds } })
        .then(d => { setPaiements(d); setPaiLoading(false); setPaiLoaded(true) })
        .catch((e: any) => { toast.error('Erreur paiements : ' + (e?.message || 'inconnue')); setPaiLoading(false); setPaiLoaded(true) })
    }
  }, [section])

  async function load() {
    setLoading(true)
    try {
      const data = await learnerApiCall<any>({ action: 'get_profile' })
      setProfile(data)
      setEditForm({
        phone: data.participant?.phone || data.acc?.phone || '',
        whatsapp: data.participant?.whatsapp || '',
        address: data.participant?.address || '',
        city: data.participant?.city || '',
        profession: data.participant?.profession || '',
        email: data.participant?.email || data.acc?.email || session.email || '',
        gender: data.participant?.gender || '',
        cin: data.participant?.cin || '',
      })
    } catch (e: any) {
      toast.error('Erreur chargement profil : ' + (e?.message || 'inconnue'))
    }
    setLoading(false)
  }

  async function saveInfos(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await learnerApiCall({ action: 'update_profile', payload: editForm })
      toast.success('Profil mis à jour ✓')
      load()
    } catch { toast.error('Erreur lors de la sauvegarde') }
    setSaving(false)
  }

  async function uploadCin() {
    if (!cinFile) return
    setUploadingCin(true)
    try {
      const ext = cinFile.name.split('.').pop()
      const path = `cin/${session.id}/cin.${ext}`
      const { data: urlData } = await learnerApiCall<any>({ action: 'get_upload_url', payload: { bucket: 'learner-docs', path } })
      if (!urlData?.signedUrl) throw new Error('Impossible d\'obtenir le lien d\'upload')
      await fetch(urlData.signedUrl, { method: 'PUT', body: cinFile, headers: { 'Content-Type': cinFile.type } })
      toast.success('CIN uploadé ✓')
      setCinFile(null)
    } catch (e: any) { toast.error(e.message || 'Erreur upload') }
    setUploadingCin(false)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwdForm.next !== pwdForm.confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (pwdForm.next.length < 4) { toast.error('Minimum 4 caractères'); return }
    setSavingPwd(true)
    try {
      await learnerApi.changePassword(pwdForm.current, pwdForm.next)
      toast.success('Mot de passe modifié ✓')
      setPwdForm({ current: '', next: '', confirm: '' })
      setSection('menu')
    } catch (e: any) { toast.error(e.message || 'Erreur') }
    setSavingPwd(false)
  }

  const levels = session.allLevels?.length ? session.allLevels : [session.formationLevel]
  const highestLevel = levels[levels.length - 1] || 'N1'
  const meta = LEVEL_META[highestLevel] || LEVEL_META['N1']
  const initials = session.participantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const MENU_ITEMS = [
    { id: 'infos', label: 'Informations personnelles', icon: '👤', sub: 'Compléter ou modifier mon profil' },
    { id: 'packs', label: 'Mes packs coaching', icon: '🎯', sub: profile?.coachingPacks?.length ? `${profile.coachingPacks.length} pack${profile.coachingPacks.length > 1 ? 's' : ''}` : 'Découvrir les packs' },
    { id: 'paiements', label: 'Historique des paiements', icon: '💳', sub: 'Suivre mes règlements' },
    { id: 'securite', label: 'Sécurité', icon: '🔒', sub: 'Changer mon mot de passe' },
  ]

  function Back() {
    return (
      <button onClick={() => setSection('menu')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6C5CE7', fontWeight: 700, fontSize: 14, padding: '0 0 16px 0' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Retour
      </button>
    )
  }

  function Input({ label, value, onChange, type = 'text', placeholder = '' }: any) {
    return (
      <div>
        <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 4 }}>{label}</div>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
      </div>
    )
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const Header = () => (
    <div style={{ background: `linear-gradient(135deg, ${meta.color}, #6C5CE7)`, borderRadius: 24, padding: '24px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{session.participantName}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{session.username}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {levels.map(l => (
              <span key={l} style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 6, padding: '3px 8px' }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── MENU ──────────────────────────────────────────────────────
  if (section === 'menu') return (
    <div style={{ paddingTop: 16 }}>
      <Header />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MENU_ITEMS.map(item => (
          <button key={item.id} onClick={() => setSection(item.id as Section)}
            style={{ background: '#fff', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, border: 'none', cursor: 'pointer', textAlign: 'left', boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#8B8AAA', marginTop: 2 }}>{item.sub}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4C2DD" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
        <button onClick={() => { clearLearnerSession(); navigate('/espace/login', { replace: true }) }}
          style={{ background: '#FFF1F1', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid #FECACA', cursor: 'pointer', textAlign: 'left', marginTop: 4 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFE4E4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🚪</div>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: '#EF4444' }}>Se déconnecter</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )

  // ── INFOS PERSONNELLES ─────────────────────────────────────────
  if (section === 'infos') {
    const p = profile?.participant
    return (
      <div style={{ paddingTop: 16 }}>
        <Back />
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(108,92,231,0.08)' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1E1B4B', marginBottom: 16 }}>Mes informations</div>

          {/* Read-only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'Nom complet', value: session.participantName },
              { label: 'Identifiant', value: session.username },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#F5F4FF', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1E1B4B' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Editable */}
          <div style={{ fontWeight: 700, fontSize: 12, color: '#6C5CE7', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>Modifier mes informations</div>
          <form onSubmit={saveInfos} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input label="Email" type="email" value={editForm.email} onChange={(e: any) => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="mon@email.com" />
            <Input label="Téléphone" type="tel" value={editForm.phone} onChange={(e: any) => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="06 XX XX XX XX" />
            <Input label="WhatsApp" type="tel" value={editForm.whatsapp} onChange={(e: any) => setEditForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="06 XX XX XX XX" />

            <div>
              <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 4 }}>Genre</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ val: 'female', label: 'Femme' }, { val: 'male', label: 'Homme' }].map(g => (
                  <button key={g.val} type="button" onClick={() => setEditForm(f => ({ ...f, gender: g.val }))}
                    style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${editForm.gender === g.val ? '#6C5CE7' : '#EEECFF'}`, background: editForm.gender === g.val ? '#F0EEFF' : '#fff', color: editForm.gender === g.val ? '#6C5CE7' : '#8B8AAA' }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <Input label="CIN (numéro)" value={editForm.cin} onChange={(e: any) => setEditForm(f => ({ ...f, cin: e.target.value }))} placeholder="AB123456" />
            <Input label="Ville" value={editForm.city} onChange={(e: any) => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="Casablanca" />
            <Input label="Adresse" value={editForm.address} onChange={(e: any) => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="Rue, quartier…" />
            <Input label="Profession" value={editForm.profession} onChange={(e: any) => setEditForm(f => ({ ...f, profession: e.target.value }))} placeholder="Coach, RH, Entrepreneur…" />

            <button type="submit" disabled={saving}
              style={{ marginTop: 6, padding: 14, borderRadius: 14, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement…' : 'Sauvegarder'}
            </button>
          </form>
        </div>

        {/* CIN Upload */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(108,92,231,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 4 }}>📄 Document CIN</div>
          <div style={{ fontSize: 12, color: '#8B8AAA', marginBottom: 14 }}>Téléchargez une copie de votre carte nationale d'identité</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 14, border: '2px dashed #EEECFF', cursor: 'pointer', background: cinFile ? '#F0EEFF' : '#FAFAFE' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🪪</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1E1B4B' }}>{cinFile ? cinFile.name : 'Choisir un fichier'}</div>
              <div style={{ fontSize: 11, color: '#8B8AAA' }}>JPG, PNG ou PDF · max 5 Mo</div>
            </div>
            <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setCinFile(e.target.files?.[0] || null)} />
          </label>
          {cinFile && (
            <button onClick={uploadCin} disabled={uploadingCin}
              style={{ marginTop: 10, width: '100%', padding: 12, borderRadius: 12, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', opacity: uploadingCin ? 0.6 : 1 }}>
              {uploadingCin ? 'Upload en cours…' : '⬆ Envoyer le document'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── PACKS COACHING ─────────────────────────────────────────────
  if (section === 'packs') {
    const packs: any[] = profile?.coachingPacks || []
    const OFFRES = [
      { name: 'Pack Bien-être', sessions: 4, prix: '2 200 MAD', oldPrix: '2 800 MAD', emoji: '🌿', desc: 'Retrouver équilibre et sérénité, gérer le stress, clarifier vos priorités.' },
      { name: 'Pack Transformation', sessions: 10, prix: '4 800 MAD', oldPrix: '', emoji: '🚀', desc: 'Changer en profondeur : croyances, objectifs de vie, nouveau cap professionnel.' },
    ]

    async function sendRequest() {
      if (!selectedOffer) { toast.error('Choisissez un pack'); return }
      setSendingReq(true)
      try {
        await learnerApiCall({ action: 'send_message', payload: { content: `[DEMANDE PACK COACHING]\nPack demandé : ${selectedOffer}\n${requestMsg ? `Message : ${requestMsg}` : ''}` } })
        toast.success('Demande envoyée ✓ Nous vous contacterons bientôt.')
        setShowRequest(false); setRequestMsg(''); setSelectedOffer('')
      } catch { toast.error('Erreur lors de l\'envoi') }
      setSendingReq(false)
    }

    return (
      <div style={{ paddingTop: 16 }}>
        <Back />
        <div style={{ background: 'linear-gradient(135deg,#6C5CE7,#8B5CF6)', borderRadius: 20, padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Packs coaching</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{packs.length > 0 ? `${packs.length} pack${packs.length > 1 ? 's' : ''} actif${packs.length > 1 ? 's' : ''}` : 'Aucun pack pour le moment'}</div>
        </div>

        {/* Packs existants */}
        {packs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {packs.map((pack: any) => {
              const used = pack.used_sessions || 0
              const total = pack.total_sessions || 0
              const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
              const remaining = total - used
              const isActive = pack.status === 'active' || pack.status === 'en_cours'
              const paid = pack.amount_paid || 0
              const price = pack.price || 0
              const restant = Math.max(0, price - paid)
              const packName = (pack.name || '').split('\n')[0]
              return (
                <div key={pack.id} style={{ background: '#fff', borderRadius: 20, padding: '18px', boxShadow: '0 2px 12px rgba(108,92,231,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B', marginBottom: 4 }}>{packName || 'Pack coaching'}</div>
                      {pack.purchase_date && <div style={{ fontSize: 11, color: '#8B8AAA' }}>Depuis le {new Date(pack.purchase_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: isActive ? '#ECFDF5' : '#F5F4FF', color: isActive ? '#10B981' : '#8B8AAA', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                      {isActive ? 'Actif' : pack.status === 'completed' ? 'Terminé' : 'En cours'}
                    </span>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#8B8AAA' }}>Séances</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B' }}>{used} / {total}</span>
                    </div>
                    <div style={{ height: 8, background: '#F0EEFF', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#10B981' : '#6C5CE7', borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#6C5CE7', marginTop: 4 }}>{remaining} séance{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}</div>
                  </div>
                  {price > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: '#F5F4FF', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: '#8B8AAA', marginBottom: 2 }}>Prix total</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{price.toLocaleString('fr-MA')} MAD</div>
                      </div>
                      <div style={{ background: restant > 0 ? '#FFF7ED' : '#ECFDF5', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: '#8B8AAA', marginBottom: 2 }}>{restant > 0 ? 'Reste à payer' : 'Soldé ✓'}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: restant > 0 ? '#F59E0B' : '#10B981' }}>{restant > 0 ? `${restant.toLocaleString('fr-MA')} MAD` : '0 MAD'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Offres disponibles */}
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', marginBottom: 12 }}>Découvrir nos offres</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {OFFRES.map(o => (
            <div key={o.name} style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(108,92,231,0.06)', border: selectedOffer === o.name && showRequest ? '2px solid #6C5CE7' : '2px solid transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 28 }}>{o.emoji}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#1E1B4B' }}>{o.name}</div>
                  <div style={{ fontSize: 12, color: '#8B8AAA', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {o.sessions} séances ·{' '}
                    <span style={{ fontWeight: 700, color: '#6C5CE7' }}>{o.prix}</span>
                    {o.oldPrix && <span style={{ textDecoration: 'line-through', color: '#C4C2DD', fontSize: 11 }}>{o.oldPrix}</span>}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#8B8AAA', marginBottom: 12 }}>{o.desc}</div>
              <button onClick={() => { setSelectedOffer(o.name); setShowRequest(true) }}
                style={{ width: '100%', padding: '10px', borderRadius: 10, background: '#F0EEFF', color: '#6C5CE7', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                Je suis intéressée →
              </button>
            </div>
          ))}
        </div>

        {/* Formulaire demande */}
        {showRequest && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(108,92,231,0.15)', border: '2px solid #6C5CE7' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B', marginBottom: 4 }}>Demande de pack coaching</div>
            <div style={{ fontSize: 12, color: '#8B8AAA', marginBottom: 14 }}>Pack sélectionné : <strong style={{ color: '#6C5CE7' }}>{selectedOffer}</strong></div>
            <textarea value={requestMsg} onChange={e => setRequestMsg(e.target.value)}
              placeholder="Message optionnel (disponibilités, objectifs, questions…)"
              rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => setShowRequest(false)}
                style={{ flex: 1, padding: 12, borderRadius: 12, background: '#F5F4FF', color: '#8B8AAA', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={sendRequest} disabled={sendingReq}
                style={{ flex: 2, padding: 12, borderRadius: 12, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', opacity: sendingReq ? 0.6 : 1 }}>
                {sendingReq ? 'Envoi…' : '✉ Envoyer la demande'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── PAIEMENTS ──────────────────────────────────────────────────
  async function sendPaymentNotif() {
    if (!payForm.amount || isNaN(Number(payForm.amount))) { toast.error('Montant invalide'); return }
    setSendingPay(true)
    try {
      let receiptUrl = ''
      if (payReceipt) {
        const ext = payReceipt.name.split('.').pop()
        const path = `receipts/${session.id}/${Date.now()}.${ext}`
        const { data: urlData } = await learnerApiCall<any>({ action: 'get_upload_url', payload: { bucket: 'learner-docs', path } })
        if (urlData?.signedUrl) {
          await fetch(urlData.signedUrl, { method: 'PUT', body: payReceipt, headers: { 'Content-Type': payReceipt.type } })
          receiptUrl = urlData.signedUrl.split('?')[0]
        }
      }
      const methodLabels: Record<string, string> = { virement: 'Virement bancaire', especes: 'Espèces', cheque: 'Chèque', carte: 'Carte bancaire' }
      const msg = [
        `[DÉCLARATION DE PAIEMENT]`,
        `Apprenante : ${session.participantName}`,
        `Montant : ${Number(payForm.amount).toLocaleString('fr-MA')} MAD`,
        `Mode : ${methodLabels[payForm.method] || payForm.method}`,
        `Date : ${new Date(payForm.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        payForm.notes ? `Note : ${payForm.notes}` : '',
        receiptUrl ? `Reçu : ${receiptUrl}` : '',
      ].filter(Boolean).join('\n')
      await learnerApiCall({ action: 'send_message', payload: { content: msg } })
      toast.success('Paiement notifié ✓ Nous allons mettre à jour votre dossier.')
      setShowPayForm(false)
      setPayForm({ amount: '', method: 'virement', date: new Date().toISOString().split('T')[0], notes: '' })
      setPayReceipt(null)
    } catch { toast.error('Erreur lors de l\'envoi') }
    setSendingPay(false)
  }

  if (section === 'paiements') {
    const pays: any[] = paiements?.payments || []
    const promoMap: Record<string, { name: string }> = paiements?.promoMap || {}
    const totalPaid = pays.reduce((s: number, p: any) => s + (p.amount_paid || p.amount || 0), 0)
    const totalDue = pays.reduce((s: number, p: any) => s + (p.total_amount || 0), 0)
    const totalRestant = Math.max(0, totalDue - totalPaid)
    const modeLabel: Record<string, string> = { cash: 'Espèces', bank_transfer: 'Virement', check: 'Chèque', card: 'Carte', online: 'En ligne', virement: 'Virement', especes: 'Espèces', cheque: 'Chèque', carte: 'Carte' }

    return (
      <div style={{ paddingTop: 16 }}>
        <Back />
        <div style={{ background: 'linear-gradient(135deg,#10B981,#6C5CE7)', borderRadius: 20, padding: '20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Mes paiements</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{pays.length} enregistrement{pays.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={() => setShowPayForm(v => !v)}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 12, padding: '8px 14px', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            {showPayForm ? 'Annuler' : '+ Déclarer'}
          </button>
        </div>

        {/* Formulaire déclaration paiement */}
        {showPayForm && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: '0 4px 20px rgba(108,92,231,0.12)', border: '2px solid #6C5CE7' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B', marginBottom: 4 }}>Déclarer un paiement</div>
            <div style={{ fontSize: 12, color: '#8B8AAA', marginBottom: 16 }}>Nous mettrons à jour votre solde après vérification</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 4 }}>Montant versé (MAD) *</div>
                <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="ex: 2500" min="1"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 14, fontWeight: 700, color: '#1E1B4B', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 6 }}>Mode de paiement</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[{ val: 'virement', label: '🏦 Virement' }, { val: 'especes', label: '💵 Espèces' }, { val: 'cheque', label: '📝 Chèque' }, { val: 'carte', label: '💳 Carte' }].map(m => (
                    <button key={m.val} type="button" onClick={() => setPayForm(f => ({ ...f, method: m.val }))}
                      style={{ padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${payForm.method === m.val ? '#6C5CE7' : '#EEECFF'}`, background: payForm.method === m.val ? '#F0EEFF' : '#fff', color: payForm.method === m.val ? '#6C5CE7' : '#8B8AAA' }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 4 }}>Date du paiement</div>
                <input type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 4 }}>Reçu / Justificatif</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `2px dashed ${payReceipt ? '#6C5CE7' : '#EEECFF'}`, background: payReceipt ? '#F0EEFF' : '#FAFAFE', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>{payReceipt ? '📎' : '📤'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: payReceipt ? '#6C5CE7' : '#8B8AAA' }}>{payReceipt ? payReceipt.name : 'Joindre un reçu (optionnel)'}</div>
                    <div style={{ fontSize: 11, color: '#C4C2DD' }}>Photo, PDF · max 5 Mo</div>
                  </div>
                  {payReceipt && <button type="button" onClick={e => { e.preventDefault(); setPayReceipt(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4C2DD', fontSize: 16 }}>✕</button>}
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setPayReceipt(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 4 }}>Message (optionnel)</div>
                <textarea value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Référence du virement, précisions…" rows={2}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <button onClick={sendPaymentNotif} disabled={sendingPay || !payForm.amount}
                style={{ padding: 14, borderRadius: 14, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: (sendingPay || !payForm.amount) ? 0.6 : 1 }}>
                {sendingPay ? 'Envoi en cours…' : '✉ Envoyer la déclaration'}
              </button>
            </div>
          </div>
        )}

        {paiLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : pays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8B8AAA' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Aucun paiement enregistré</div>
            <div style={{ fontSize: 12 }}>Vos paiements apparaîtront ici</div>
          </div>
        ) : (
          <>
            {totalDue > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#ECFDF5', borderRadius: 14, padding: '14px' }}>
                  <div style={{ fontSize: 11, color: '#059669', marginBottom: 2 }}>Total payé</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#10B981' }}>{totalPaid.toLocaleString('fr-MA')} MAD</div>
                </div>
                <div style={{ background: totalRestant > 0 ? '#FFF7ED' : '#ECFDF5', borderRadius: 14, padding: '14px' }}>
                  <div style={{ fontSize: 11, color: totalRestant > 0 ? '#D97706' : '#059669', marginBottom: 2 }}>Reste à payer</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: totalRestant > 0 ? '#F59E0B' : '#10B981' }}>{totalRestant.toLocaleString('fr-MA')} MAD</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pays.map((p: any) => {
                const date = p.date ? new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
                const amtPaid = p.amount_paid || p.amount || 0
                const total = p.total_amount || 0
                const reste = Math.max(0, total - amtPaid)
                return (
                  <div key={p.id} style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💰</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>
                          {amtPaid.toLocaleString('fr-MA')} MAD payés
                          {total > 0 && <span style={{ fontWeight: 400, color: '#8B8AAA', fontSize: 12 }}> / {total.toLocaleString('fr-MA')} MAD</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#8B8AAA', marginTop: 2 }}>
                          {date}{p.method ? ` · ${modeLabel[p.method] || p.method}` : ''}
                          {(promoMap[p.promotion_id]?.name || p.program_name) ? ` · ${promoMap[p.promotion_id]?.name || p.program_name}` : ''}
                        </div>
                        {p.notes && <div style={{ fontSize: 11, color: '#C4C2DD', marginTop: 2 }}>{p.notes}</div>}
                        {total > 0 && (
                          <div style={{ marginTop: 8, height: 6, background: '#F0EEFF', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.round((amtPaid / total) * 100))}%`, height: '100%', background: reste > 0 ? '#F59E0B' : '#10B981', borderRadius: 3 }} />
                          </div>
                        )}
                        {reste > 0 && <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 4 }}>Reste : {reste.toLocaleString('fr-MA')} MAD</div>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: reste > 0 ? '#FFF7ED' : '#ECFDF5', color: reste > 0 ? '#F59E0B' : '#10B981', borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>
                        {reste > 0 ? 'En cours' : 'Soldé ✓'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── SÉCURITÉ ───────────────────────────────────────────────────
  if (section === 'securite') {
    return (
      <div style={{ paddingTop: 16 }}>
        <Back />
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(108,92,231,0.08)' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1E1B4B', marginBottom: 20 }}>Changer le mot de passe</div>
          <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'current', label: 'Mot de passe actuel' },
              { key: 'next', label: 'Nouveau mot de passe' },
              { key: 'confirm', label: 'Confirmer' },
            ].map(({ key, label }) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 4 }}>{label}</div>
                <input type={showPwd ? 'text' : 'password'} value={(pwdForm as any)[key]}
                  onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))} placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <button type="button" onClick={() => setShowPwd(v => !v)}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#6C5CE7', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {showPwd ? '🙈 Masquer' : '👁 Afficher les mots de passe'}
            </button>
            <button type="submit" disabled={savingPwd}
              style={{ padding: 14, borderRadius: 14, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: savingPwd ? 0.6 : 1 }}>
              {savingPwd ? 'Enregistrement…' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return null
}
