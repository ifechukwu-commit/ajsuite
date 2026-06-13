'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClaimTrialPage() {
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: user } = await supabase
        .from('users')
        .select('trial_claimed, plan')
        .eq('id', session.user.id)
        .single()

      if (user?.trial_claimed || user?.plan !== 'trial') {
        setAlreadyClaimed(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    }
    check()
  }, [])

  const handleClaim = async () => {
    try {
      setClaiming(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('users')
        .update({
          trial_start: new Date().toISOString(),
          trial_claimed: true,
        })
        .eq('id', session.user.id)

      if (updateError) throw updateError

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setClaiming(false)
    }
  }

  if (alreadyClaimed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}>
        <p className="text-sm text-white">Trial already active. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--navy)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="mb-2">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            AJ Suite
          </span>
        </div>
        <h1 className="font-baskerville text-3xl text-white mb-3 leading-tight">
          Your 30-Day Free Trial
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Full access to case management, AI document review, and everything AJ Suite offers.
          Your trial begins the moment you claim it.
        </p>

        <div className="rounded-xl p-6 mb-6 text-left"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            'Unlimited case files and documents',
            'AI legal document review memoranda',
            'Full chat, timeline, and export access',
            'No payment required to start',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start mb-3 last:mb-0">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#8B1A2F' }}>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{item}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm text-left"
            style={{ background: 'rgba(139,26,47,0.2)', color: '#fca5a5', border: '1px solid rgba(139,26,47,0.4)' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full py-3.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: '#fff', color: 'var(--navy)' }}>
          {claiming ? 'Activating...' : 'Claim Your 30-Day Free Trial'}
        </button>

        <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          No credit card required. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
