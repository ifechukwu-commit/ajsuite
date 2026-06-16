'use client'
import type { User, Plan } from '@/types'

interface Props {
  users: User[]
  onAction: (user: User) => void
}

const PLAN_STYLES: Record<string, { bg: string; color: string }> = {
  trial:   { bg: '#FFF3CD', color: '#7B5E00' },
  solo:    { bg: '#D8F3DC', color: '#2D6A4F' },
  chamber: { bg: 'rgba(201,168,76,0.15)', color: '#7B5E00' },
  admin:   { bg: 'var(--navy)', color: '#fff' },
}

function trialDaysLeft(u: User) {
  const diff = Math.ceil((new Date(u.trial_start).getTime() + 30 * 86400000 - Date.now()) / 86400000)
  return Math.max(0, diff)
}

export default function UserTable({ users, onAction }: Props) {
  if (users.length === 0) return (
    <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>No users found.</p>
  )

  return (
    <div className="rounded-lg border overflow-x-auto" style={{ background: '#fff', borderColor: 'var(--border)' }}>
      <table className="w-full">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: 'var(--border)', background: 'var(--warm-white)' }}>
            {['Name', 'Email', 'Country', 'State', 'Plan', 'Trial Days', 'Joined', 'Action'].map(h => (
              <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const s = PLAN_STYLES[u.plan] ?? { bg: '#eee', color: '#333' }
            const days = u.plan === 'trial' ? trialDaysLeft(u) : null
            return (
              <tr key={u.id} className="border-b transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {u.full_name || '—'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {(u as any).country || '—'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {(u as any).state || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded"
                    style={{ background: s.bg, color: s.color, fontSize: '9px' }}>
                    {u.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs"
                  style={{ color: days !== null && days <= 3 ? '#DC2626' : 'var(--text-muted)' }}>
                  {days !== null ? `${days} days` : '—'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(u.created_at).toLocaleDateString('en-GB')}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => onAction(u)}
                    className="text-xs px-3 py-1.5 rounded border transition-colors"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
                    Manage
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}