'use client'
import { createClient } from '@/lib/supabase/client'

export default function HeroPage() {
  const supabase = createClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
  redirectTo: `${window.location.origin}/auth/callback`,
  queryParams: { prompt: 'select_account' }
},
    })
  }

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col items-center justify-start py-10 px-6 text-center"
      style={{ background: 'var(--navy)' }}>
      <div className="w-full max-w-md py-10">

        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>
            Legal Case Management
          </p>
          <h1 className="font-baskerville text-4xl text-white leading-tight mb-4">
            Your Cases. Your Documents.<br />Always Ready.
          </h1>
          <p className="text-sm leading-relaxed mx-auto max-w-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Built for solo lawyers and small firms. Organise matters, review documents with AI precision, and manage every case in one place.
          </p>
        </div>

        <div className="rounded-xl p-7 mb-6 text-left"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            What to Expect
          </p>
          <div className="flex flex-col gap-4 mb-6">
            {[
              'Upload contracts and documents. Receive a structured legal review memorandum instantly.',
              'Every case, conversation, and summary saved across sessions. Continue where you left off.',
              'Track deadlines, notes, and case history in one organised place.',
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--gold)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#1B2B4B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{item}</p>
              </div>
            ))}
          </div>

          <button onClick={handleSignIn}
            className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: '#fff', color: 'var(--navy)', fontFamily: 'var(--font-inter)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="rounded-lg p-4 text-left mb-5"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Important Notice
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            This platform is a legal productivity tool and does not constitute legal advice.
            AI-generated analysis is for organisational purposes only. Users are solely responsible
            for verifying all AI output before relying on it in any legal matter. By signing in,
            you confirm you are a licensed legal professional and accept these terms.
          </p>
        </div>

        <a href="mailto:ajcasemanager46@gmail.com"
          className="text-xs transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
          ajcasemanager46@gmail.com
        </a>
      </div>
    </div>
  )
}
