import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabaseAdmin } from '../../lib/supabase'
import { type LearnerSession } from '../../lib/learnerSession'
import { Award, CheckCircle, Lock, Download } from 'lucide-react'

export default function EspaceCertificat() {
  const session = useOutletContext<LearnerSession>()
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [modRes, lesRes, progRes] = await Promise.all([
      supabaseAdmin.from('elearning_modules').select('id').eq('formation_level', session.formationLevel).eq('is_published', true),
      supabaseAdmin.from('elearning_lessons').select('id, module_id').eq('is_published', true),
      supabaseAdmin.from('lesson_progress').select('lesson_id').eq('learner_id', session.id),
    ])
    const modIds = new Set((modRes.data || []).map((m: any) => m.id))
    const myLessons = (lesRes.data || []).filter((l: any) => modIds.has(l.module_id))
    const completedIds = new Set((progRes.data || []).map((p: any) => p.lesson_id))
    setTotal(myLessons.length)
    setProgress(myLessons.filter((l: any) => completedIds.has(l.id)).length)
    setLoading(false)
  }

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0
  const eligible = pct === 100

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-1">
          <Award className="w-5 h-5 text-yellow-500" />
          <h1 className="text-xl font-bold text-gray-900">Mon certificat</h1>
        </div>
        <p className="text-sm text-gray-500">Success Compass Academy</p>
      </div>

      {eligible ? (
        <div className="bg-white rounded-2xl border border-green-200 p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Award className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Félicitations !</h2>
            <p className="text-gray-600 mt-1">{session.participantName}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {session.formationLevel === 'N1' ? 'Coach de vie et Développement Personnel — Niveau 1'
                : session.formationLevel === 'N2' ? 'Master Coach Thérapeute — Niveau 2'
                : 'Master Coach Consultant — Niveau 3'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Formation complète — {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Télécharger le certificat
          </button>
          <p className="text-xs text-gray-400">Le certificat PDF sera généré automatiquement</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Certificat verrouillé</h2>
            <p className="text-sm text-gray-500 mt-1">Terminez tous les modules pour débloquer votre certificat</p>
          </div>

          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Progression</span>
                <span className="text-blue-600 font-bold">{pct}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">{progress} / {total} leçons terminées</p>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-500">
              <div className={`flex items-center gap-2 ${pct === 100 ? 'text-green-600' : ''}`}>
                {pct === 100 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                <span>Terminer tous les modules de cours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                <span>Réussir le quiz de fin de formation</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
