'use client'

interface Props {
  daysLeft: number
}

export default function TrialBanner({ daysLeft }: Props) {
  if (daysLeft > 14) return null

  return (
    <div className="flex items-center justify-between px-6 py-2 text-xs font-medium text-white flex-shrink-0"
      style={{ background: 'linear-gradient(90deg, #92400e, #b45309)' }}>
      <span>
        Your free trial ends in <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong>. Enjoy full access until then.
      </span>
      <a href="mailto:ajsuitesupport@gmail.com?subject=AJ Suite Subscription"
        className="text-xs font-bold px-3 py-1 rounded transition-opacity hover:opacity-80"
        style={{ background: '#fff', color: '#92400e' }}>
        Subscribe
      </a>
    </div>
  )
}
