'use client'

interface Props {
  caseTitle: string
  onClose: () => void
  onConfirm: () => Promise<void>
  loading?: boolean
}

export default function ConfirmDeleteModal({ caseTitle, onClose, onConfirm, loading }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-xl shadow-2xl p-7" style={{ background: '#fff' }}>
        <h2 className="font-baskerville text-lg mb-2" style={{ color: '#DC2626' }}>Delete This Matter?</h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          This will permanently delete <strong style={{ color: 'var(--text-primary)' }}>{caseTitle}</strong> including
          all documents, summaries, chat history, notes, and timeline. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 rounded text-xs font-medium border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: '#DC2626' }}>
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}
