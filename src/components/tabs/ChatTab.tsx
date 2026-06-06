'use client'
import { useState, useEffect, useRef } from 'react'
import type { ChatMessage } from '@/types'
import EmptyState from '@/components/ui/EmptyState'

interface Props {
  messages: ChatMessage[]
  sending: boolean
  error: string | null
  onSend: (content: string) => Promise<boolean>
  reviewedBy: string
}

export default function ChatTab({ messages, sending, error, onSend, reviewedBy }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    await onSend(text)
  }

  const initials = reviewedBy.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col h-full p-6" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {error && (
        <div className="mb-3 px-4 py-2 rounded text-sm" style={{ background: '#FEE2E2', color: '#9B1C1C' }}>{error}</div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-4 mb-4">
        {messages.length === 0 ? (
          <EmptyState title="No messages yet" description="Ask about this case or any uploaded document." />
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={msg.role === 'assistant'
                  ? { background: 'var(--navy)', color: '#fff' }
                  : { background: 'var(--gold)', color: 'var(--navy)' }}>
                {msg.role === 'assistant' ? 'AJ' : initials}
              </div>
              <div className="max-w-2xl px-4 py-3 rounded-lg text-sm leading-relaxed"
                style={msg.role === 'assistant'
                  ? { background: '#fff', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '2px 8px 8px 8px' }
                  : { background: 'var(--navy)', color: 'rgba(255,255,255,0.92)', borderRadius: '8px 2px 8px 8px' }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--navy)', color: '#fff' }}>AJ</div>
            <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Analysing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t pt-4 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Ask about this case or any uploaded document..."
          rows={2} className="flex-1 px-4 py-2.5 rounded-lg border text-sm resize-none outline-none transition-colors focus-navy"
          style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }} />
        <button onClick={handleSend} disabled={sending || !input.trim()}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white self-end transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--navy)' }}>
          Send
        </button>
      </div>
    </div>
  )
}
