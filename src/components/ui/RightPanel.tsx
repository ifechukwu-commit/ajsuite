import type { Case, Deadline } from '@/types'
import StatusBadge from '@/components/cases/StatusBadge'

interface Props {
  caseData: Case
  deadlines: Deadline[]
  onExport: () => void
  onDelete: () => void
}

export default function RightPanel({ caseData, deadlines, onExport, onDelete }: Props) {
  const upcoming = deadlines
    .filter(d => new Date(d.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4)

  return (
    <div className="w-64 flex-shrink-0 border-l overflow-y-auto p-5 scrollbar-thin"
      style={{ background: '#fff', borderColor: 'var(--border)' }}>

      <Section label="Case Details">
        <Row label="Reference" value={caseData.id.slice(0, 8).toUpperCase()} />
        <Row label="Matter Type" value={caseData.matter_type} />
        <Row label="Date Opened" value={new Date(caseData.created_at).toLocaleDateString('en-GB')} />
        <div className="mt-1"><StatusBadge status={caseData.status} size="sm" /></div>
      </Section>

      <Section label="Deadlines">
        {upcoming.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No upcoming deadlines</p>
        ) : (
          upcoming.map(d => (
            <div key={d.id} className="px-3 py-2 rounded mb-2"
              style={{
                background: 'var(--warm-white)',
                borderLeft: `3px solid ${d.is_critical ? '#EF4444' : 'var(--gold)'}`,
              }}>
              <p className="text-xs font-bold" style={{ color: 'var(--navy)' }}>
                {new Date(d.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{d.label}</p>
            </div>
          ))
        )}
      </Section>

      <Section label="Quick Actions">
        <ActionBtn onClick={onExport} label="Export Case Summary" />
        <ActionBtn onClick={onDelete} label="Delete Matter" danger />
      </Section>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}

function ActionBtn({ onClick, label, danger }: { onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-3 py-2 rounded border text-xs font-medium mb-2 transition-colors"
      style={danger
        ? { borderColor: '#FECACA', color: '#DC2626', background: 'transparent' }
        : { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
      {label}
    </button>
  )
}
