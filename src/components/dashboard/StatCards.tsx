import type { Case } from '@/types'

interface Props { cases: Case[]; tasksDueToday: number }

export default function StatCards({ cases, tasksDueToday }: Props) {
  const active = cases.filter(c => c.status === 'Active' || c.status === 'Urgent').length
  const upcomingHearings = cases.filter(c => {
    if (!c.deadline) return false
    const days = Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 14
  }).length

  const cards = [
    { num: cases.length, label: 'Total Cases', sub: 'All matters' },
    { num: active, label: 'Active Cases', sub: 'In progress' },
    { num: upcomingHearings, label: 'Upcoming Hearings', sub: 'Next 14 days' },
    { num: tasksDueToday, label: 'Tasks Due Today', sub: tasksDueToday > 0 ? 'Needs attention' : 'All clear', subRed: tasksDueToday > 0 },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((c, i) => (
        <div key={i} className="rounded-lg p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="font-baskerville text-3xl font-bold" style={{ color: 'var(--navy)' }}>{c.num}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
          <p className="text-xs mt-1.5 font-medium" style={{ color: c.subRed ? '#EF4444' : 'var(--text-muted)' }}>{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
