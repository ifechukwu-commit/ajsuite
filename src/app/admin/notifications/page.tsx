'use client'
import { useEffect, useState } from 'react'
import SendNotificationModal from '@/components/admin/SendNotificationModal'
import type { User } from '@/types'

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [sent, setSent] = useState<{ title: string; to: string; date: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(data => setUsers(data ?? []))
  }, [])

  const handleSend = async (title: string, body: string, type: string, targetUserId: string | null) => {
    await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, type, targetUserId }),
    })
    const to = targetUserId
      ? users.find(u => u.id === targetUserId)?.email ?? targetUserId
      : `All users (${users.length})`
    setSent(s => [{ title, to, date: new Date().toLocaleDateString('en-GB') }, ...s])
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="font-baskerville text-xl mb-1 break-words" style={{ color: 'var(--navy)' }}>Send Notification</h1>
          <p className="text-sm break-words" style={{ color: 'var(--text-secondary)' }}>
            Broadcast announcements, updates, or renewal reminders to your users.
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-80 self-start sm:self-auto flex-shrink-0"
          style={{ background: 'var(--navy)' }}>
          New Notification
        </button>
      </div>

      {sent.length === 0 ? (
        <div className="rounded-lg border p-8 sm:p-12 text-center" style={{ background: '#fff', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications sent this session.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: '#fff', borderColor: 'var(--border)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-baskerville text-sm" style={{ color: 'var(--navy)' }}>Sent This Session</h3>
          </div>
          {sent.map((s, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-muted)' }}>To: {s.to}</p>
              </div>
              <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{s.date}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SendNotificationModal users={users} onClose={() => setShowModal(false)} onSend={handleSend} />
      )}
    </div>
  )
}
