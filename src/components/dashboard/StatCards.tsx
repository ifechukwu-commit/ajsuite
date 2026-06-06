import type { Case } from '@/types'

interface Props { cases: Case[] }

export default function StatCards({ cases }: Props) {
  const active = cases.filter(c => c.status === 'Active' || c.status === 'Urgent').length
  const urgent = cases.filter(c => c.status === 'Urgent').length
  const closed = cases.filter(c => c.status === 'Closed').length
  const thisMonth = cases.filter(c => {
    const d = new Date(c.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const cards = [
    { num: active, label: 'Active Matters', sub: `${urgent} urgent`, subRed: urgent > 0 },
    { num: urgent, label: 'Urgent Matters', sub: 'Require attention', subRed: urgent > 0 },
    { num: thisMonth, label: 'Opened This Month', sub: 'New matters', subRed: false },
    { num: closed, label: 'Closed Matters', sub: 'All time', subRed: false },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((c, i) => (
        <div key={i} className="rounded-lg p-5 border" style={{ background: '#fff', borderColor: 'var(--border)' }}>
          <p className="font-baskerville text-3xl font-bold" style={{ color: 'var(--navy)' }}>{c.num}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
          <p className="text-xs mt-1.5 font-medium" style={{ color: c.subRed ? '#EF4444' : 'var(--text-muted)' }}>{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
