import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import type { LearnerSession } from '../../lib/learnerSession'
import { Send, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Msg { id: string; sender: 'learner' | 'admin'; content: string; read: boolean; created_at: string }

export default function EspaceMessages() {
  const session = useOutletContext<LearnerSession>()
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function load() {
    setLoading(true)
    const data = await learnerApi.getMessages() as any
    setMessages(data || [])
    setLoading(false)
  }

  async function send() {
    if (!text.trim()) return
    setSending(true)
    try {
      await learnerApi.sendMessage(text.trim())
      setText('')
      load()
    } catch {
      toast.error('Erreur envoi')
    }
    setSending(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-96">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">Échangez directement avec votre formatrice</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Aucun message pour l'instant</p>
              <p className="text-xs mt-1">Posez une question à votre formatrice !</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'learner' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                m.sender === 'learner'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                <p className="leading-relaxed">{m.content}</p>
                <p className={`text-xs mt-1 ${m.sender === 'learner' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 p-3 flex gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Votre message… (Entrée pour envoyer)"
            rows={2}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button onClick={send} disabled={sending || !text.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 self-end">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
