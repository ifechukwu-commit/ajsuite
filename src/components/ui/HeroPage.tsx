'use client'
import { createClient } from '@/lib/supabase/client'

function LegalSVG() {
  return (
    <svg viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '380px', height: 'auto' }}>
      <rect x="60" y="60" width="280" height="380" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
      <rect x="60" y="60" width="280" height="6" rx="2" fill="#8B1A2F"/>
      <rect x="88" y="90" width="140" height="3" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="88" y="102" width="100" height="2" rx="1" fill="rgba(255,255,255,0.25)"/>
      <rect x="88" y="120" width="224" height="1" fill="rgba(255,255,255,0.08)"/>
      <rect x="88" y="136" width="90" height="2" rx="1" fill="#8B1A2F" fillOpacity="0.8"/>
      <rect x="88" y="150" width="224" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="160" width="200" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="170" width="215" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="180" width="185" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="200" width="80" height="2" rx="1" fill="#8B1A2F" fillOpacity="0.8"/>
      <rect x="88" y="214" width="224" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="224" width="190" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="234" width="210" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="244" width="175" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="254" width="205" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="274" width="110" height="2" rx="1" fill="#8B1A2F" fillOpacity="0.8"/>
      <rect x="88" y="288" width="224" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="298" width="195" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="308" width="208" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="88" y="390" width="224" height="1" fill="rgba(255,255,255,0.08)"/>
      <rect x="88" y="400" width="130" height="1.5" rx="0.5" fill="rgba(255,255,255,0.1)"/>
      <rect x="80" y="68" width="1.5" height="364" fill="#8B1A2F" fillOpacity="0.3"/>
    </svg>
  )
}

export default function HeroPage() {
  const supabase = createClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--navy)' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <span className="font-baskerville text-white text-sm tracking-wide">AJ Suite</span>
          <span className="text-xs ml-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Legal Practice
          </span>
        </div>
        <button onClick={handleSignIn}
          className="text-xs font-medium px-4 py-2 rounded transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Sign in
        </button>
      </nav>

      {/* Hero — left text, right SVG */}
      <div className="flex flex-1 items-center px-8 md:px-16 gap-12 py-12 max-w-6xl mx-auto w-full">

        {/* Left — text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold tracking-widest uppercase mb-5"
            style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em' }}>
            Legal Case Management
          </p>
          <h1 className="font-baskerville text-4xl md:text-5xl text-white leading-tight mb-6"
            style={{ lineHeight: '1.15' }}>
            Every matter.<br />
            Every document.<br />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Always ready.</span>
          </h1>
          <p className="text-sm leading-relaxed mb-8 max-w-sm"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            Built for solo counsel and small chambers. Organise matters, review documents with AI precision, and manage every case in one place.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-3 mb-8">
            {[
              'AI legal review memoranda from uploaded documents',
              'Full case history, deadlines, and client records',
              'Chat with your case file - ask anything',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: '#8B1A2F' }} />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button onClick={handleSignIn}
            className="flex items-center gap-3 px-5 py-3.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 mb-3"
            style={{ background: '#fff', color: 'var(--navy)', width: 'fit-content' }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            30-day free trial · No credit card required
          </p>
        </div>

        {/* Right — SVG illustration */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <LegalSVG />
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          This platform is a legal productivity tool and does not constitute legal advice.
        </p>
        <a href="mailto:ajsuitesupport@gmail.com"
          className="text-xs transition-colors"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
          ajsuitesupport@gmail.com
        </a>
      </footer>
    </div>
  )
}
