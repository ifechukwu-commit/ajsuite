import type { Case } from '@/types'
import CaseCard from '@/components/cases/CaseCard'
import EmptyState from '@/components/ui/EmptyState'

interface Props {
  cases: Case[]
  onNewCase: () => void
}

export default function RecentCases({ cases, onNewCase }: Props) {
  const recent = cases.slice(0, 6)

  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: '#fff', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-baskerville text-sm" style={{ color: 'var(--navy)' }}>Recent Matters</h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cases.length} total</span>
      </div>
      {recent.length === 0 ? (
        <EmptyState
          title="No matters yet"
          description="Open your first case file to get started."
          action={{ label: 'Open New Matter', onClick: onNewCase }}
        />
      ) : (
        recent.map(c => <CaseCard key={c.id} caseData={c} />)
      )}
    </div>
  )
}
