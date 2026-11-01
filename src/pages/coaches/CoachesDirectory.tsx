import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Star, Shield, ChevronRight, Phone } from 'lucide-react'

export interface Coach {
  id: string
  slug: string
  firstName: string
  lastName: string
  photo?: string
  title: string
  specialties: string[]
  city: string
  languages: string[]
  bio: string
  sessionPrice: number | null
  firstSessionFree: boolean
  firstSessionPrice?: number
  online: boolean
  inPerson: boolean
  certifications: string[]
  promoNumber?: number
  rating?: number
  reviewCount?: number
  available: boolean
  whatsapp?: string
}

// Mock data — remplacer par Supabase quand la table sera créée
const COACHES_MOCK: Coach[] = [
  {
    id: '1', slug: 'sofya-bennani',
    firstName: 'Sofya', lastName: 'Bennani',
    title: 'Coach personnel & développement de soi',
    specialties: ['Connaissance de soi', 'Croyances limitantes', 'Confiance en soi'],
    city: 'Casablanca', languages: ['Arabe', 'Français'],
    bio: 'J\'accompagne les femmes à se reconnecter à leur identité profonde et à poser des choix de vie alignés avec leurs valeurs. Certifiée SC Academy Promo 2023.',
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
    bio: 'J\'aide les professionnels à traverser les transitions de carrière avec clarté et confiance. 10 ans d\'expérience en entreprise avant de devenir coach.',
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

const ALL_CITIES = ['Toutes les villes', ...Array.from(new Set(COACHES_MOCK.map(c => c.city)))]
const ALL_SPECIALTIES = ['Toutes les spécialités', 'Connaissance de soi', 'Professionnel', 'Familial', 'Adolescents', 'Entrepreneuriat']

function CoachCard({ coach, onClick }: { coach: Coach; onClick: () => void }) {
  const initials = `${coach.firstName[0]}${coach.lastName[0]}`
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {coach.photo ? <img src={coach.photo} className="w-full h-full object-cover rounded-xl" alt="" /> : initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{coach.firstName} {coach.lastName}</p>
              <p className="text-xs text-blue-600 mt-0.5">{coach.title}</p>
            </div>
            {coach.promoNumber && (
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 flex-shrink-0 font-medium">
                Promo #{coach.promoNumber}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1.5">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{coach.city}</span>
            {coach.online && <span className="text-[10px] bg-green-50 text-green-700 rounded-full px-1.5 py-0.5 ml-1">En ligne</span>}
            {coach.inPerson && <span className="text-[10px] bg-blue-50 text-blue-700 rounded-full px-1.5 py-0.5">Présentiel</span>}
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {coach.specialties.slice(0, 3).map(s => (
          <span key={s} className="text-[11px] bg-gray-50 text-gray-600 rounded-full px-2 py-0.5">{s}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div>
          {coach.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-700">{coach.rating}</span>
              <span className="text-xs text-gray-400">({coach.reviewCount} avis)</span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-0.5">
            {coach.firstSessionFree
              ? '🎁 1ère séance offerte'
              : coach.firstSessionPrice
                ? `1ère séance : ${coach.firstSessionPrice} MAD`
                : coach.sessionPrice
                  ? `À partir de ${coach.sessionPrice} MAD`
                  : 'Tarif sur demande'}
          </p>
        </div>
        <div className="flex items-center gap-1 text-blue-600">
          <span className="text-xs font-medium">Voir le profil</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* SC certs */}
      <div className="flex items-center gap-1 mt-2">
        <Shield className="w-3 h-3 text-blue-500" />
        <span className="text-[11px] text-blue-600 font-medium">Coach certifié SC Academy</span>
      </div>
    </div>
  )
}

export default function CoachesDirectory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('Toutes les villes')
  const [specialty, setSpecialty] = useState('Toutes les spécialités')

  const filtered = COACHES_MOCK.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${c.firstName} ${c.lastName} ${c.title} ${c.specialties.join(' ')}`.toLowerCase().includes(q)
    const matchCity = city === 'Toutes les villes' || c.city === city
    const matchSpecialty = specialty === 'Toutes les spécialités' || c.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
    return matchSearch && matchCity && matchSpecialty && c.available
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a1628] to-[#1565c0] px-4 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Success Compass Academy</span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">Trouvez votre coach</h1>
          <p className="text-blue-200 text-sm mt-1">Tous nos coachs sont certifiés par SC Academy</p>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom, spécialité…"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white text-sm outline-none placeholder-gray-400 text-gray-900"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="text-xs bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20 outline-none flex-shrink-0"
            >
              {ALL_CITIES.map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
            </select>
            <select
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="text-xs bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20 outline-none flex-shrink-0"
            >
              {ALL_SPECIALTIES.map(s => <option key={s} value={s} className="text-gray-900">{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        <p className="text-xs text-gray-400 font-medium">{filtered.length} coach{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</p>
        {filtered.map(coach => (
          <CoachCard
            key={coach.id}
            coach={coach}
            onClick={() => navigate(`/coaches/${coach.slug}`)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">Aucun coach trouvé</p>
            <p className="text-sm mt-1">Essayez d'autres critères</p>
          </div>
        )}
      </div>

      {/* Footer CTA — join as coach */}
      <div className="max-w-lg mx-auto px-4 pb-10">
        <div className="bg-gradient-to-r from-[#0a1628] to-[#1565c0] rounded-2xl p-5 text-center">
          <p className="text-white font-bold text-sm">Vous êtes diplômé(e) SC Academy ?</p>
          <p className="text-blue-200 text-xs mt-1">Rejoignez notre annuaire et développez votre activité</p>
          <a
            href={`https://wa.me/212603609792?text=${encodeURIComponent('Bonjour, je suis lauréat(e) SC Academy et je souhaite rejoindre l\'annuaire coaches.')}`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 mt-3 bg-amber-400 text-[#0a1628] font-bold text-sm px-5 py-2.5 rounded-xl"
          >
            <Phone className="w-4 h-4" />
            Nous contacter
          </a>
        </div>
      </div>
    </div>
  )
}
