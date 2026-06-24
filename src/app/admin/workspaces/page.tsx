'use client'
import { useEffect, useState } from 'react'
import type { User } from '@/types'
import { TRIAL_DAYS } from '@/lib/constants'

export default function AdminWorkspacesPage() {
  const [owners, setOwners] = useState<(User & { member_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/users')
    const data: User[] = await res.json()
    const ownerRows = data.filter(u => u.role === 'owner')
    const withCounts = ownerRows.map(o => ({
      ...o,
      member_count: data.filter(u => u.owner_id === o.id).length,
    }))
    setOwners(withCounts)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const trialDaysLeft = (u: User) =>
    Math.max(0, Math.ceil((new Date(u.trial_start).getTime() + TRIAL_DAYS * 86400000 - Date.now()) / 86400000))

  const status = (u: User) => {
  if (u.plan === 'admin') return { label: 'Admin', locked: false }

  if (u.plan === 'solo' || u.plan === 'chamber') {
    const active = !u.paid_until || new Date(u.paid_until) > new Date()
    return active
      ? { label: 'Active (paid)', locked: false }
      : { label: 'Restricted (unpaid)', locked: true }
  }

  const left = trialDaysLeft(u)
  return left > 0
    ? { label: `Trial — ${left}d left`, locked: false }
    : { label: 'Restricted (trial ended)', locked: true }
}

  const giftPass = async (userId: string) => {
    setActing(userId)
    await fetch('/api/admin/gift-pass', { method: 'POST', body: JSON.stringify({ userId }) })
    await load()
    setActing(null)
  }

  return (
    <div className="p-8">
      <h1 className="font-baskerville text-xl mb-1" style={{ color: 'var(--navy)' }}>Workspaces & Free Access</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Every workspace, its lock status, and a manual override for testers or favours — flips access on instantly, no payment record created.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {owners.map(o => {
            const s = status(o)
            return (
              <div key={o.id} className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{o.firm_name || o.full_name || o.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {o.email} · {o.member_count ?? 0} member{o.member_count === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded flex-shrink-0"
                  style={{ background: s.locked ? '#FEE2E2' : '#D8F3DC', color: s.locked ? '#9B1C1C' : '#2D6A4F', fontSize: '9px' }}>
                  {s.locked ? 'Locked — ' : ''}{s.label}
                </span>
                {o.plan !== 'admin' && (
                  <button onClick={() => giftPass(o.id)} disabled={acting === o.id}
                    className="px-3 py-1.5 rounded text-xs font-bold flex-shrink-0 transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
                    {acting === o.id ? 'Applying...' : 'Gift Free Pass'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
