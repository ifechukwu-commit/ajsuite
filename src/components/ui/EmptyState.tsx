interface Props {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--warm-white-2)' }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <path d="M7 10h6M7 13h4" />
        </svg>
      </div>
      <h3 className="font-baskerville text-base mb-2" style={{ color: 'var(--navy)' }}>{title}</h3>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      {action && (
        <button onClick={action.onClick}
          className="mt-5 px-5 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--navy)', color: '#fff' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
