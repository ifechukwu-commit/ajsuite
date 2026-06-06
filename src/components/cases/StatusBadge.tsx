import type { CaseStatus } from '@/types'

const styles: Record<CaseStatus, { bg: string; color: string }> = {
  Active:  { bg: '#D8F3DC', color: '#2D6A4F' },
  Urgent:  { bg: '#FEE2E2', color: '#9B1C1C' },
  Pending: { bg: '#FFF3CD', color: '#7B5E00' },
  Closed:  { bg: '#F3F4F6', color: '#4B5563' },
}

interface Props {
  status: CaseStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const s = styles[status]
  const padding = size === 'sm' ? '1px 6px' : '4px 10px'
  const fontSize = size === 'sm' ? '9px' : '11px'

  return (
    <span className="font-semibold uppercase tracking-wide rounded"
      style={{ background: s.bg, color: s.color, padding, fontSize, letterSpacing: '0.04em' }}>
      {status}
    </span>
  )
}
