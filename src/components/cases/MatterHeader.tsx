'use client'
import type { Case } from '@/types'
import StatusBadge from './StatusBadge'

interface Props {
  caseData: Case
  unreadNotifications: number
  onEdit: () => void
  onDelete: () => void
  onExport: () => void
  onUpload: () => void
  onNotifications: () => void
}

export default function MatterHeader({
  caseData, unreadNotifications, onEdit, onDelete, onExport, onUpload, onNotifications
}: Props) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b flex-shrink-0 flex-wrap"
      style={{ background: '#fff', borderColor: 'var(--border)' }}>
      <div className="flex-1 min-w-0">
        <h2 className="font-baskerville text-base truncate" style={{ color: 'var(--navy)' }}>{caseData.title}</h2>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
          {caseData.matter_type} · Client: {caseData.client_name} · Ref: {caseData.id.slice(0,8).toUpperCase()}
        </p>
      </div>

      <StatusBadge status={caseData.status} />

      <div className="flex items-center gap-2">
        <button onClick={onNotifications}
          className="relative p-2 rounded border transition-colors hover-navy"
          style={{ borderColor: 'var(--border)', background: 'transparent' }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
            <path d="M7.5 1.5A4 4 0 0 0 3.5 5.5v3l-1 1.5h10l-1-1.5v-3a4 4 0 0 0-4-4z" />
            <path d="M6 11.5a1.5 1.5 0 0 0 3 0" />
          </svg>
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: '#EF4444' }} />
          )}
        </button>

        <Btn onClick={onExport} label="Export" />
        <Btn onClick={onEdit} label="Edit" />
        <button onClick={onUpload}
          className="px-3 py-1.5 rounded text-xs font-medium text-white transition-opacity hover:opacity-80"
          style={{ background: 'var(--navy)' }}>
          + Document
        </button>
        <button onClick={onDelete}
          className="px-3 py-1.5 rounded text-xs font-medium border transition-colors"
          style={{ borderColor: '#FECACA', color: '#DC2626', background: 'transparent' }}>
          Delete
        </button>
      </div>
    </div>
  )
}

function Btn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded text-xs font-medium border transition-colors hover-navy"
      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
      {label}
    </button>
  )
}
