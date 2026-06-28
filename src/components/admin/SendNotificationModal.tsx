'use client'
import { useState } from 'react'
import type { User } from '@/types'

interface Props {
  users: User[]
  onClose: () => void
  onSend: (title: string, body: string, type: string, targetUserId: string | null) => Promise<void>
}

const TYPES = ['announcement', 'update', 'renewal', 'paystack']

export default function SendNotificationModal({ users, onClose, onSend }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('announcement')
  const [target, setTarget] = useState<'all' | 'one'>('all')
  const [userId, setUserId] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!title.trim()) return setError('Title is required')
    if (!body.trim()) return setError('Message body is required')
    if (target === 'one' && !userId) return setError('Select a user')
    setError(null)
    setSending(true)
    await onSend(title, body, type, target === 'one' ? userId : null)
    setSending(false)
    setDone(true)
    setTimeout(onClose, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-xl shadow-2xl p-7" style={{ background: '#fff' }}>
        <h2 className="font-baskerville text-lg mb-1" style={{ color: 'var(--navy)' }}>Send Notification</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
          Broadcast to all users or target one specific account.
        </p>

        {error && <p className="text-xs mb-4 px-3 py-2 rounded" style={{ background: '#FEE2E2', color: '#9B1C1C' }}>{error}</p>}

        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Send To</label>
          <div className="flex gap-2">
            {(['all', 'one'] as const).map(t => (
              <button key={t} onClick={() => setTarget(t)}
                className="flex-1 py-2 rounded border text-xs font-medium transition-colors"
                style={{
                  borderColor: target === t ? 'var(--navy)' : 'var(--border)',
                  background: target === t ? 'var(--navy)' : 'transparent',
                  color: target === t ? '#fff' : 'var(--text-secondary)',
                }}>
                {t === 'all' ? 'All Users' : 'Specific User'}
              </button>
            ))}
          </div>
        </div>

        {target === 'one' && (
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Select User</label>
            <select value={userId} onChange={e => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm outline-none"
              style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }}>
              <option value="">Select</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2 rounded border text-sm outline-none capitalize"
            style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }}>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Feature Available"
            className="w-full px-3 py-2 rounded border text-sm outline-none"
            style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }} />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="Write your message here..."
            rows={4} className="w-full px-3 py-2 rounded border text-sm outline-none resize-none"
            style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)', lineHeight: '1.6' }} />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded text-xs font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending || done}
            className="px-4 py-2 rounded text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: done ? '#2D6A4F' : 'var(--navy)' }}>
            {done ? 'Sent' : sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>
    </div>
  )
}
