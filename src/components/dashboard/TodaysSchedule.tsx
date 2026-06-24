import Link from 'next/link'
import type { Case, Task } from '@/types'

interface Props { cases: Case[]; tasksToday: (Task & { case_title?: string })[] }

export default function TodaysSchedule({ cases, tasksToday }: Props) {
  const todayCases = cases.filter(c => {
    if (!c.deadline) return false
    return new Date(c.deadline).toDateString() === new Date().toDateString()
  })

  const isEmpty = todayCases.length === 0 && tasksToday.length === 0

  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-baskerville text-sm" style={{ color: 'var(--navy)' }}>Today's Schedule</h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
      {isEmpty ? (
        <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Nothing due today.</p>
      ) : (
        <>
          {todayCases.map(c => (
            <Link key={c.id} href={`/cases/${c.id}`}
              className="flex items-center gap-3 px-5 py-3 border-b hover-navy transition-colors"
              style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold uppercase px-2 py-1 rounded flex-shrink-0"
                style={{ background: 'var(--status-urgent-bg)', color: 'var(--status-urgent)', fontSize: '9px' }}>Deadline</span>
              <p className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
            </Link>
          ))}
          {tasksToday.map(t => (
            <Link key={t.id} href={`/cases/${t.case_id}?tab=tasks`}
              className="flex items-center gap-3 px-5 py-3 border-b last:border-0 hover-navy transition-colors"
              style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold uppercase px-2 py-1 rounded flex-shrink-0"
                style={{ background: 'var(--status-pending-bg)', color: 'var(--status-pending)', fontSize: '9px' }}>Task</span>
              <p className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
              <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{t.case_title}</p>
            </Link>
          ))}
        </>
      )}
    </div>
  )
}
