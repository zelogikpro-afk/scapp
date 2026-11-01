import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Shield, CheckCircle, Phone, Calendar, Globe, Users } from 'lucide-react'
import type { Coach } from './CoachesDirectory'

// Même mock que l'annuaire — à remplacer par fetch Supabase
const COACHES_MOCK: Coach[] = [
  {
    id: '1', slug: 'sofya-bennani',
    firstName: 'Sofya', lastName: 'Bennani',
    title: 'Coach personnel & développement de soi',
    specialties: ['Connaissance de soi', 'Croyances limitantes', 'Confiance en soi'],
    city: 'Casablanca', languages: ['Arabe', 'Français'],
    bio: 'J\'accompagne les femmes à se reconnecter à leur identité profonde et à poser des choix de vie alignés avec leurs valeurs. Certifiée SC Academy Promo 2023. \n\nMa méthode est basée sur l\'écoute active, les outils de coaching certifiés, et une bienveillance inconditionnelle. Ensemble, nous explorons vos ressources intérieures pour construire la vie que vous souhaitez vraiment.',
    sessionPrice: 300, firstSessionFree: true,
    online: true, inPerson: true,
    certifications: ['Coach SC Academy', 'Certifiée Compass', 'Certifiée IE'],
    promoNumber: 3, rating: 5.0, reviewCount: 4, available: true,
    whatsapp: '212600000001',
  },
  {
    id: '2', slug: 'meryam-coach',
    firstName: 'Meryam', lastName: 'Aator',
    title: 'Coach professionnel & transition de carrière',
    specialties: ['Orientation professionnelle', 'Leadership', 'Gestion du stress'],
    city: 'Rabat', languages: ['Arabe', 'Français', 'Anglais'],
    bio: 'J\'aide les professionnels à traverser les transitions de carrière avec clarté et confiance. 10 ans d\'expérience en entreprise avant de devenir coach.\n\nJe travaille notamment avec des cadres en reconversion, des jeunes diplômés qui cherchent leur voie, et des managers qui souhaitent développer leur leadership.',
    sessionPrice: 250, firstSessionFree: false, firstSessionPrice: 100,
    online: true, inPerson: false,
    certifications: ['Coach SC Academy', 'Certifiée QS', 'Certifiée Valeurs'],
    promoNumber: 5, rating: 4.9, reviewCount: 7, available: true,
    whatsapp: '212600000002',
  },
  {
    id: '3', slug: 'fatima-zahra-coach',
    firstName: 'Fatima Zahra', lastName: 'El Mansouri',
    title: 'Coach familial & parental',
    specialties: ['Relations familiales', 'Parentalité', 'Communication'],
    city: 'Marrakech', languages: ['Arabe', 'Français'],
    bio: 'Spécialisée dans l\'accompagnement des familles et parents pour créer des foyers harmonieux et des relations épanouissantes.',
    sessionPrice: 200, firstSessionFree: true,
    online: true, inPerson: true,
    certifications: ['Coach SC Academy', 'Certifiée Compass'],
    promoNumber: 2, rating: 5.0, reviewCount: 2, available: true,
    whatsapp: '212600000003',
  },
  {
    id: '4', slug: 'karim-benali',
    firstName: 'Karim', lastName: 'Benali',
    title: 'Coach de performance & entrepreneuriat',
    specialties: ['Entrepreneuriat', 'Performance', 'Vision stratégique'],
    city: 'Casablanca', languages: ['Arabe', 'Français', 'Anglais'],
    bio: 'Entrepreneur reconverti coach, j\'accompagne les porteurs de projets et dirigeants à clarifier leur vision et passer à l\'action.',
    sessionPrice: 400, firstSessionFree: false, firstSessionPrice: 150,
    online: true, inPerson: true,
    certifications: ['Coach SC Academy', 'Certifié Compass', 'Certifié QS', 'Certifié IE'],
    promoNumber: 1, rating: 4.8, reviewCount: 12, available: true,
    whatsapp: '212600000004',
  },
  {
    id: '5', slug: 'nadia-coach',
    firstName: 'Nadia', lastName: 'Ouhmmou',
    title: 'Coach scolaire & adolescents',
    specialties: ['Orientation scolaire', 'Adolescents', 'Motivation'],
    city: 'Fès', languages: ['Arabe', 'Français'],
    bio: 'Ancienne professeure, je me spécialise dans l\'accompagnement des jeunes pour construire leur projet personnel et retrouver la motivation d\'apprendre.',
    sessionPrice: 150, firstSessionFree: true,
    online: true, inPerson: true,
    certifications: ['Coach SC Academy', 'Certifiée Valeurs'],
    promoNumber: 4, available: true,
    whatsapp: '212600000005',
  },
]

export default function CoachProfile() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const coach = COACHES_MOCK.find(c => c.slug === slug)

  if (!coach) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Coach introuvable</p>
          <button onClick={() => navigate('/coaches')} className="mt-4 text-blue-600 text-sm font-medium">
            ← Retour à l'annuaire
          </button>
        </div>
      </div>
    )
  }

  const initials = `${coach.firstName[0]}${coach.lastName[0]}`
  const waMessage = encodeURIComponent(`Bonjour ${coach.firstName}, j'ai trouvé votre profil sur Success Compass et je souhaite réserver une séance de coaching.`)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a1628] to-[#1565c0] px-4 pt-10 pb-16">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate('/coaches')} className="flex items-center gap-1 text-blue-200 text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Annuaire
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border-2 border-white/30">
              {coach.photo ? <img src={coach.photo} className="w-full h-full object-cover rounded-2xl" alt="" /> : initials}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-medium">Coach SC Academy · Promo #{coach.promoNumber}</span>
              </div>
              <h1 className="text-xl font-black text-white">{coach.firstName} {coach.lastName}</h1>
              <p className="text-blue-200 text-sm mt-0.5">{coach.title}</p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-blue-300" />
                <span className="text-blue-200 text-xs">{coach.city}</span>
                {coach.rating && (
                  <>
                    <span className="text-blue-400 mx-1">·</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-blue-200 text-xs">{coach.rating} ({coach.reviewCount} avis)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 -mt-6 pb-32 space-y-4">

        {/* Booking card — sticky CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500">Tarif séance</p>
              <p className="text-2xl font-black text-gray-900">
                {coach.sessionPrice ? `${coach.sessionPrice} MAD` : 'Sur demande'}
              </p>
              {coach.firstSessionFree && (
                <p className="text-xs text-green-600 font-medium mt-0.5">🎁 1ère séance offerte</p>
              )}
              {!coach.firstSessionFree && coach.firstSessionPrice && (
                <p className="text-xs text-blue-600 font-medium mt-0.5">1ère séance : {coach.firstSessionPrice} MAD</p>
              )}
            </div>
            <div className="text-right text-xs text-gray-400 space-y-1">
              {coach.online && <p className="flex items-center gap-1 justify-end"><Globe className="w-3.5 h-3.5" />En ligne</p>}
              {coach.inPerson && <p className="flex items-center gap-1 justify-end"><Users className="w-3.5 h-3.5" />Présentiel</p>}
            </div>
          </div>
          <a
            href={`https://wa.me/${coach.whatsapp}?text=${waMessage}`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl text-sm"
          >
            <Phone className="w-4 h-4" />
            Réserver via WhatsApp
          </a>
          <p className="text-center text-xs text-gray-400 mt-2">Réponse sous 24h</p>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-3">À propos</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{coach.bio}</p>
        </div>

        {/* Specialties */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-3">Spécialités</h2>
          <div className="flex flex-wrap gap-2">
            {coach.specialties.map(s => (
              <span key={s} className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-3">Certifications SC Academy</h2>
          <div className="space-y-2">
            {coach.certifications.map(cert => (
              <div key={cert} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{cert}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-3">Langues</h2>
          <div className="flex gap-2 flex-wrap">
            {coach.languages.map(l => (
              <span key={l} className="bg-gray-50 text-gray-600 text-xs px-3 py-1.5 rounded-full border border-gray-100">{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-pb">
        <div className="max-w-lg mx-auto flex gap-3">
          <a
            href={`https://wa.me/${coach.whatsapp}?text=${waMessage}`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#0a1628] text-white font-bold py-3.5 rounded-xl text-sm"
          >
            <Calendar className="w-4 h-4" />
            Prendre rendez-vous
          </a>
        </div>
      </div>
    </div>
  )
}
