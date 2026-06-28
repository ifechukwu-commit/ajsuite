'use client'
import { useState } from 'react'

interface RestrictedBannerProps {
  onUpgrade: () => void
}

/**
 * A dismissible popup shown once per dashboard visit when access is
 * restricted (owner, trial ended or unpaid) — not a fixed banner, so it
 * doesn't eat into mobile screen space. Everything stays readable
 * underneath; this just explains what's paused and why renewing matters.
 */
export default function RestrictedBanner({ onUpgrade }: RestrictedBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-sm rounded-xl shadow-2xl p-5 sm:p-6" style={{ background: '#fff' }}>
        <p className="text-sm font-bold mb-1 break-words" style={{ color: 'var(--navy)' }}>Your subscription has ended</p>
        <p className="text-xs mb-4 break-words" style={{ color: 'var(--text-secondary)' }}>
          You can still log in, view every case and document, read case notes, and download or export your files. New cases, new uploads, assigning tasks, team discussion, submissions, and inviting members are paused until you subscribe.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={onUpgrade}
            className="flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
            Subscribe, ₦8,500 per month
          </button>
          <button onClick={() => setDismissed(true)}
            className="px-4 py-2 rounded-lg text-xs font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
