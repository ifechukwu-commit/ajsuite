'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

interface Props { onClose: () => void }

export default function NotificationsPanel({ onClose }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
  }

  const TYPE_LABELS: Record<Notification['type'], string> = {
    renewal: 'Renewal', update: 'Update', paystack: 'Billing', announcement: 'Announcement'
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-80 h-full border-l shadow-2xl flex flex-col" style={{ background: '#fff', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-baskerville text-sm" style={{ color: 'var(--navy)' }}>Notifications</h3>
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>Close</button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No notifications</p>
          ) : (
            notifications.map(n => (
              <div key={n.id}
                className="px-5 py-4 border-b cursor-pointer transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--border)', background: n.is_read ? 'transparent' : 'rgba(201,168,76,0.04)' }}
                onClick={() => markRead(n.id)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--gold)' }}>
                    {TYPE_LABELS[n.type]}
                  </span>
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />}
                </div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{n.body}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {new Date(n.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
