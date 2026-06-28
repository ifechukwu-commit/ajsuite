'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function JoinSessionPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()

  const [info, setInfo] = useState<{ caseTitle?: string; firmName?: string; error?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    fetch(`/api/sessions/info?token=${token}`).then(r => r.json()).then(setInfo).finally(() => setLoading(false))
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user))
  }, [token])

  const handleJoin = async () => {
    setJoining(true)
    const res = await fetch('/api/sessions/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push(`/cases/${data.caseId}`)
    } else {
      setInfo({ error: data.error })
      setJoining(false)
    }
  }

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/join/${token}`)}`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--navy)' }}>
      <div className="w-full max-w-sm rounded-xl shadow-2xl p-6 sm:p-8 text-center" style={{ background: '#fff' }}>
        <h1 className="font-baskerville text-lg mb-4 break-words" style={{ color: 'var(--navy)' }}>AJ Suite</h1>

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading invitation...</p>
        ) : info?.error ? (
          <p className="text-sm break-words" style={{ color: '#9B1C1C' }}>{info.error}</p>
        ) : (
          <>
            <p className="text-sm mb-1 break-words" style={{ color: 'var(--text-primary)' }}>
              You've been invited to collaborate on
            </p>
            <p className="font-baskerville text-base mb-1 break-words" style={{ color: 'var(--navy)' }}>{info?.caseTitle}</p>
            <p className="text-xs mb-6 break-words" style={{ color: 'var(--text-muted)' }}>at {info?.firmName}</p>

            {signedIn ? (
              <button onClick={handleJoin} disabled={joining}
                className="w-full px-4 py-2.5 rounded text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--navy)' }}>
                {joining ? 'Joining...' : 'Join Workspace'}
              </button>
            ) : (
              <button onClick={handleSignIn}
                className="w-full px-4 py-2.5 rounded text-sm font-bold text-white transition-opacity hover:opacity-80"
                style={{ background: 'var(--navy)' }}>
                Sign in with Google to Join
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
