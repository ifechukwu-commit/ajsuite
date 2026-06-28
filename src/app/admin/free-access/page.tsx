'use client'
import { useEffect, useState } from 'react'
import type { User } from '@/types'

const DURATIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '1 year', value: 365 },
  { label: 'Lifetime', value: 0 }, // 0 = lifetime, sent as null
]

export default function AdminFreeAccessPage() {
  const [owners, setOwners] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [duration, setDuration] = useState<Record<string, number>>({})

  const load = async () => {
    const res = await fetch('/api/admin/users')
    const data: User[] = await res.json()
    setOwners(data.filter(u => u.role === 'owner' && u.plan !== 'admin'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const giftPass = async (userId: string) => {
    setActing(userId)
    const days = duration[userId] ?? 30
    await fetch('/api/admin/gift-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, durationDays: days === 0 ? null : days }),
    })
    await load()
    setActing(null)
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-baskerville text-xl mb-1 break-words" style={{ color: 'var(--navy)' }}>Free Access Control</h1>
      <p className="text-sm mb-8 break-words" style={{ color: 'var(--text-secondary)' }}>
        Manually grant free access to a workspace, for testers, partners, or favours. No payment record is created.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {owners.map(o => (
            <div key={o.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{o.firm_name || o.full_name || o.email}</p>
                <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-muted)' }}>{o.email}, currently {o.plan}</p>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <select value={duration[o.id] ?? 30} onChange={e => setDuration(d => ({ ...d, [o.id]: Number(e.target.value) }))}
                  className="px-2 py-1.5 rounded border text-xs" style={{ borderColor: 'var(--border)' }}>
                  {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <button onClick={() => giftPass(o.id)} disabled={acting === o.id}
                  className="px-3 py-1.5 rounded text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
                  {acting === o.id ? 'Applying...' : 'Grant Free Access'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
