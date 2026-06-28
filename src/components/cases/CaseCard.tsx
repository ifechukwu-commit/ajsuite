import Link from 'next/link'
import type { Case } from '@/types'
import StatusBadge from './StatusBadge'

interface Props { caseData: Case }

export default function CaseCard({ caseData }: Props) {
  const deadline = caseData.deadline
    ? new Date(caseData.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null

  return (
    <Link href={`/cases/${caseData.id}`}
      className="flex items-center gap-3 px-5 py-3.5 border-b transition-colors hover:bg-gray-50 cursor-pointer"
      style={{ borderColor: 'var(--border)', textDecoration: 'none' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{caseData.title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
          Client: {caseData.client_name}, {caseData.matter_type}
        </p>
      </div>
      <StatusBadge status={caseData.status} />
      {deadline && <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{deadline}</span>}
    </Link>
  )
}
