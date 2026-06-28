'use client'
import { useEffect, useState } from 'react'
import type { User } from '@/types'

export default function AdminSubscriptionsPage() {
  const [paid, setPaid] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then((data: User[]) => {
      setPaid(data.filter(u => u.plan === 'solo' || u.plan === 'chamber'))
      setLoading(false)
    })
  }, [])

  const isLifetime = (u: User) => !u.paid_until
  const isActive = (u: User) => isLifetime(u) || new Date(u.paid_until!) > new Date()

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-baskerville text-xl mb-1 break-words" style={{ color: 'var(--navy)' }}>Subscriptions</h1>
      <p className="text-sm mb-8 break-words" style={{ color: 'var(--text-secondary)' }}>
        Every workspace currently on a paid plan (₦8,500/month), including free-forever lifetime grants.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : paid.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No paid subscriptions yet.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {paid.map(u => (
            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{u.firm_name || u.full_name || u.email}</p>
                <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-muted)' }}>{u.email}, {u.plan}</p>
              </div>
              <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded flex-shrink-0 self-start break-words"
                style={{ background: isActive(u) ? '#D8F3DC' : '#FEE2E2', color: isActive(u) ? '#2D6A4F' : '#9B1C1C', fontSize: '9px' }}>
                {isLifetime(u) ? 'Lifetime' : isActive(u) ? `Renews ${new Date(u.paid_until!).toLocaleDateString('en-GB')}` : 'Expired'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
