import Link from 'next/link'
import type { TimelineEvent } from '@/types'

interface Props { events: (TimelineEvent & { case_title?: string })[] }

const EVENT_LABELS: Record<string, string> = {
  case_created: 'Case Created',
  status_changed: 'Status Changed',
  document_uploaded: 'Document Uploaded',
  deadline_added: 'Deadline Added',
  task_completed: 'Task Completed',
  note_added: 'Note Added',
  case_exported: 'Case Exported',
}

export default function RecentActivity({ events }: Props) {
  return (
    <div className="rounded-lg border overflow-hidden mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-baskerville text-sm" style={{ color: 'var(--navy)' }}>Recent Activity</h3>
      </div>
      {events.length === 0 ? (
        <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No activity yet.</p>
      ) : (
        events.slice(0, 8).map(e => (
          <Link key={e.id} href={`/cases/${e.case_id}`}
            className="flex items-center gap-4 px-5 py-3 border-b last:border-0 hover-navy transition-colors"
            style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs flex-shrink-0 w-16" style={{ color: 'var(--text-muted)' }}>
              {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
              {EVENT_LABELS[e.event_type] ?? e.event_type}
            </p>
            <p className="text-xs flex-shrink-0 truncate max-w-[120px]" style={{ color: 'var(--text-muted)' }}>{e.case_title}</p>
          </Link>
        ))
      )}
    </div>
  )
}
