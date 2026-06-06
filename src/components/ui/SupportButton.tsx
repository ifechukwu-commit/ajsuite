export default function SupportButton() {
  return (
    <a href="mailto:ajcasemanager46@gmail.com"
      className="flex items-center gap-2 text-xs transition-colors mb-3"
      style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
      onMouseOver={e => (e.currentTarget.style.color = 'var(--gold)')}
      onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 3l5 4 5-4" />
        <rect x="1" y="2" width="10" height="8" rx="1" />
      </svg>
      Support
    </a>
  )
}
