'use client'
import type { Deadline } from '@/types'

interface Props {
  deadlines: Deadline[]
}

export default function DeadlinesBanner({ deadlines }: Props) {
  const upcoming = deadlines
    .filter(d => new Date(d.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)

  if (upcoming.length === 0) return null

  return (
    <div className="flex items-center gap-6 px-6 py-2 text-xs font-medium text-white flex-shrink-0 overflow-hidden"
      style={{ background: 'linear-gradient(90deg, #7B1C1C, #9B2C2C)' }}>
      <span className="opacity-70 tracking-widest uppercase text-xs flex-shrink-0">Upcoming Deadlines</span>
      {upcoming.map(d => (
        <div key={d.id} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: d.is_critical ? '#F87171' : '#FCD34D' }} />
          <span>{d.label} — {new Date(d.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      ))}
    </div>
  )
}
