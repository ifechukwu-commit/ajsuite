import type { Case, Document } from '@/types'

interface Props { caseData: Case; documents: Document[] }

export default function OverviewTab({ caseData, documents }: Props) {
  const reviewed = documents.filter(d => d.summary_status === 'done').length
  const deadline = caseData.deadline
    ? new Date(caseData.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const daysLeft = caseData.deadline
    ? Math.ceil((new Date(caseData.deadline).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="p-6 overflow-y-auto scrollbar-thin">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card title="Matter Summary">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {caseData.notes || 'No summary notes added yet.'}
          </p>
        </Card>
        <Card title="Client Details">
          <Row label="Name" value={caseData.client_name} />
          <Row label="Contact" value={caseData.client_contact || 'Not provided'} />
          <Row label="Matter Type" value={caseData.matter_type} />
          <Row label="Reference" value={caseData.id.slice(0, 8).toUpperCase()} />
        </Card>
        <Card title="Documents">
          <p className="font-baskerville text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>{documents.length}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{reviewed} reviewed · {documents.length - reviewed} pending</p>
        </Card>
        <Card title="Next Deadline">
          {deadline ? (
            <>
              <p className="font-baskerville text-3xl font-bold mb-1"
                style={{ color: daysLeft !== null && daysLeft <= 7 ? '#DC2626' : 'var(--navy)' }}>
                {new Date(caseData.deadline!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {deadline} · {daysLeft !== null ? `${daysLeft} days remaining` : ''}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No deadline set</p>
          )}
        </Card>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-5" style={{ background: '#fff', borderColor: 'var(--border)' }}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}
