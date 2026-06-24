interface Props {
  onNewCase: () => void
  onUploadDocument: () => void
  onCreateTask: () => void
}

export default function QuickActions({ onNewCase, onUploadDocument, onCreateTask }: Props) {
  const buttons = [
    { label: 'New Case', onClick: onNewCase, primary: true },
    { label: 'Upload Document', onClick: onUploadDocument, primary: false },
    { label: 'Create Task', onClick: onCreateTask, primary: false },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {buttons.map((b, i) => (
        <button key={i} onClick={b.onClick}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
          style={b.primary
            ? { background: 'var(--navy)', color: '#fff' }
            : { background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
          {b.label}
        </button>
      ))}
    </div>
  )
}
