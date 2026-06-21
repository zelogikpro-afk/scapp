import { useEffect, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { supabaseAdmin } from '../../lib/supabase'
import { type LearnerSession } from '../../lib/learnerSession'
import { Megaphone, Calendar, PlayCircle, FileText, BookOpen, ChevronRight } from 'lucide-react'

interface Announcement { id: string; content: string; created_at: string }
interface ScheduleItem { id: string; title: string; seance_date: string; seance_time: string; location_or_link: string }

export default function EspaceAccueil() {
  const session = useOutletContext<LearnerSession>()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [nextSessions, setNextSessions] = useState<ScheduleItem[]>([])
  const [stats, setStats] = useState({ recordings: 0, docs: 0, testUnlocks: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    // Get promotion_id from learner account
    const { data: learnerData } = await supabaseAdmin.from('learner_accounts').select('promotion_id').eq('id', session.id).single()
    const sessionId = learnerData?.promotion_id

    const [annoRes, schedRes, recRes, docRes, testRes] = await Promise.all([
      sessionId
        ? supabaseAdmin.from('announcements').select('*').eq('promotion_id', sessionId).order('created_at', { ascending: false }).limit(5)
        : Promise.resolve({ data: [] }),
      sessionId
        ? supabaseAdmin.from('session_schedule').select('*').eq('promotion_id', sessionId).gte('seance_date', new Date().toISOString().slice(0, 10)).order('seance_date').limit(3)
        : Promise.resolve({ data: [] }),
      sessionId
        ? supabaseAdmin.from('recordings').select('id', { count: 'exact' }).eq('promotion_id', sessionId)
        : Promise.resolve({ count: 0 }),
      supabaseAdmin.from('elearning_docs').select('id', { count: 'exact' }).eq('level', session.formationLevel).eq('is_visible', true),
      supabaseAdmin.from('test_unlocks').select('id', { count: 'exact' }).eq('learner_id', session.id),
    ])

    setAnnouncements((annoRes.data as Announcement[]) || [])
    setNextSessions((schedRes.data as ScheduleItem[]) || [])
    setStats({
      recordings: (recRes as any).count || 0,
      docs: (docRes as any).count || 0,
      testUnlocks: (testRes as any).count || 0,
    })
    setLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium">{greeting} 👋</p>
        <h1 className="text-2xl font-bold mt-1">{session.participantName}</h1>
        <p className="text-blue-200 text-sm mt-1">
          {session.formationLevel === 'N1' ? 'Formation Niveau 1 — Coach de vie et Développement Personnel'
            : session.formationLevel === 'N2' ? 'Formation Niveau 2 — Master Coach Thérapeute'
            : 'Formation Niveau 3 — Master Coach Consultant'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Enregistrements', value: stats.recordings, icon: PlayCircle, to: '/espace/enregistrements', color: 'text-blue-600 bg-blue-50' },
          { label: 'Documents', value: stats.docs, icon: FileText, to: '/espace/documents', color: 'text-green-600 bg-green-50' },
          { label: 'Tests déverrouillés', value: stats.testUnlocks, icon: BookOpen, to: '/espace/tests', color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, to, color }) => (
          <Link key={to} to={to} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Prochaines séances */}
      {nextSessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Prochaines séances</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {nextSessions.map(s => (
              <div key={s.id} className="px-5 py-3.5 flex items-start gap-4">
                <div className="bg-blue-50 rounded-xl px-3 py-2 text-center min-w-[52px]">
                  <p className="text-xs text-blue-400 font-medium">{new Date(s.seance_date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</p>
                  <p className="text-lg font-bold text-blue-700 leading-none">{new Date(s.seance_date + 'T00:00:00').getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                  {s.seance_time && <p className="text-xs text-gray-400 mt-0.5">{s.seance_time}</p>}
                  {s.location_or_link && (
                    s.location_or_link.startsWith('http') ? (
                      <a href={s.location_or_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-0.5 block truncate">
                        Rejoindre la séance →
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">{s.location_or_link}</p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annonces */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Annonces</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {announcements.map(a => (
              <div key={a.id} className="px-5 py-4 flex gap-4">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {announcements.length === 0 && nextSessions.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400 text-sm">Pas d'annonces ni de séances prévues pour l'instant.</p>
          <p className="text-gray-300 text-xs mt-1">Votre formateur vous informera prochainement.</p>
        </div>
      )}
    </div>
  )
}
