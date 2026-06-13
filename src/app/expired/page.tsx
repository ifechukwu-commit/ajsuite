export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--navy)' }}>
      <h1 className="font-baskerville text-3xl text-white mb-3">Your Trial Has Ended</h1>
      <p className="text-sm mb-8 max-w-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Your 30-day free trial is complete. Subscribe to continue accessing your cases, documents, and AI analysis.
      </p>
      <a href="mailto:ajsuitesupport@gmail.com?subject=AJ Suite Subscription"
        className="px-6 py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
        style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
        Contact Us to Subscribe
      </a>
      <a href="/" className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Sign out
      </a>
    </div>
  )
}
