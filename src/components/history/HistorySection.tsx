import type { Case } from '@/types'
import CaseCard from '@/components/cases/CaseCard'
import EmptyState from '@/components/ui/EmptyState'

interface Props { cases: Case[]; onNewCase: () => void }

export default function HistorySection({ cases, onNewCase }: Props) {
  const closed = cases.filter(c => c.status === 'Closed')
  const all = cases

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
      <h1 className="font-baskerville text-xl mb-1" style={{ color: 'var(--navy)' }}>Matter History</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        All cases, conversations, and document reviews saved to your account.
      </p>

      <div className="rounded-lg border overflow-hidden mb-6" style={{ background: '#fff', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-baskerville text-sm" style={{ color: 'var(--navy)' }}>All Matters</h3>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{all.length} total · {closed.length} closed</span>
        </div>
        {all.length === 0 ? (
          <EmptyState title="No matters yet" description="Open your first case file to get started."
            action={{ label: '+ Open New Matter', onClick: onNewCase }} />
        ) : (
          all.map(c => <CaseCard key={c.id} caseData={c} />)
        )}
      </div>
    </div>
  )
}
