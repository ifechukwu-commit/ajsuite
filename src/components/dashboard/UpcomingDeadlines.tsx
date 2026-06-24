import Link from 'next/link'
import type { Case } from '@/types'

interface Props { cases: Case[] }

export default function UpcomingDeadlines({ cases }: Props) {
  const upcoming = cases
    .filter(c => c.deadline && c.status !== 'Closed')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5)

  const statusFor = (c: Case) => {
    const days = Math.ceil((new Date(c.deadline!).getTime() - Date.now()) / 86400000)
    if (days < 0) return { label: 'Overdue', bg: 'var(--status-urgent-bg)', color: 'var(--status-urgent)' }
    if (days <= 3) return { label: 'Active', bg: 'var(--status-active-bg)', color: 'var(--status-active)' }
    return { label: 'Pending', bg: 'var(--status-pending-bg)', color: 'var(--status-pending)' }
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-baskerville text-sm" style={{ color: 'var(--navy)' }}>Upcoming Deadlines</h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>30/14/7/3/1 day reminders</span>
      </div>
      {upcoming.length === 0 ? (
        <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Nothing scheduled.</p>
      ) : (
        upcoming.map(c => {
          const s = statusFor(c)
          return (
            <Link key={c.id} href={`/cases/${c.id}`}
              className="flex items-center gap-4 px-5 py-3 border-b last:border-0 hover-navy transition-colors"
              style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs flex-shrink-0 w-16" style={{ color: 'var(--text-muted)' }}>
                {new Date(c.deadline!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
              <span className="text-xs font-bold uppercase px-2 py-1 rounded flex-shrink-0"
                style={{ background: s.bg, color: s.color, fontSize: '9px' }}>{s.label}</span>
            </Link>
          )
        })
      )}
    </div>
  )
}
