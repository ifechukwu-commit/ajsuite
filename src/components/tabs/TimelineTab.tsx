import type { TimelineEvent } from '@/types'
import EmptyState from '@/components/ui/EmptyState'

interface Props { events: TimelineEvent[] }

const DOT_COLORS: Record<TimelineEvent['event_type'], string> = {
  case_created: 'var(--navy)',
  status_changed: 'var(--gold)',
  document_uploaded: '#2D6A4F',
  deadline_added: '#DC2626',
  note_updated: 'var(--text-muted)',
  case_exported: 'var(--gold)',
}

export default function TimelineTab({ events }: Props) {
  const sorted = [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (sorted.length === 0) {
    return <div className="p-6"><EmptyState title="No timeline events" description="Activity on this matter will appear here." /></div>
  }

  return (
    <div className="p-6 overflow-y-auto scrollbar-thin">
      <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b"
        style={{ color: 'var(--navy)', borderColor: 'var(--border)' }}>Case Timeline</h3>
      <div className="flex flex-col">
        {sorted.map((event, i) => (
          <div key={event.id} className="flex gap-4 pb-6">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                style={{ background: DOT_COLORS[event.event_type] ?? 'var(--text-muted)' }} />
              {i < sorted.length - 1 && (
                <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)', minHeight: '24px' }} />
              )}
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                {new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
