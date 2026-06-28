// This page is now reached by ONE audience only: an invited team
// member whose firm's workspace has lapsed. The owner never lands
// here — an expired owner stays inside the dashboard in restricted
// (read-only) mode. See src/lib/access/workspace.ts.

export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--navy)' }}>
      <h1 className="font-baskerville text-3xl text-white mb-3">Access Paused</h1>
      <p className="text-sm mb-8 max-w-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Your firm's subscription has lapsed. Only the workspace owner can renew it.
        Once renewed, your access opens back up automatically. No action needed on your end.
      </p>
      <a href="mailto:ajsuitesupport@gmail.com?subject=AJ Suite Access Paused"
        className="px-6 py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
        style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
        Contact Support
      </a>
      <a href="/" className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Sign out
      </a>
    </div>
  )
}
