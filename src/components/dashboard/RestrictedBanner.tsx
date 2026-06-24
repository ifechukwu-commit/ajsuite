interface RestrictedBannerProps {
  onUpgrade: () => void
}

/**
 * Shown at the top of the dashboard only when access.restricted is true
 * (owner, trial ended or unpaid). Everything stays readable underneath —
 * this banner explains what's locked, it doesn't block the screen.
 */
export default function RestrictedBanner({ onUpgrade }: RestrictedBannerProps) {
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 mb-4 rounded-lg"
      style={{ background: 'rgba(139,26,47,0.12)', border: '1px solid rgba(139,26,47,0.35)' }}
    >
      <div>
        <p className="text-sm font-bold text-white">Your subscription has ended</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          You can still read every case, document, and note. New cases, new notes, and exporting are paused until you subscribe.
        </p>
      </div>
      <button
        onClick={onUpgrade}
        className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-90"
        style={{ background: 'var(--gold)', color: 'var(--navy)' }}
      >
        Subscribe — ₦8,500/month
      </button>
    </div>
  )
}
