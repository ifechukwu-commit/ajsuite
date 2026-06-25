'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const COUNTRIES = ['Nigeria', 'United States', 'United Kingdom', 'Ghana', 'Kenya', 'South Africa', 'Canada', 'Australia', 'Other']

export default function ClaimTrialPage() {
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [workspaceType, setWorkspaceType] = useState<'solo' | 'chamber' | ''>('')
  const [firmName, setFirmName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const { data: user } = await supabase
        .from('users')
        .select('trial_claimed, plan, owner_id')
        .eq('id', session.user.id)
        .single()

      if (user?.owner_id || user?.trial_claimed || user?.plan !== 'trial') {
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

      if (!workspaceType) throw new Error('Please tell us if you are a solo practice or a chamber/firm.')
      if (!firmName.trim()) throw new Error('Please enter your firm or workspace name.')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('users')
        .update({
          trial_start: new Date().toISOString(),
          trial_claimed: true,
          country: country || null,
          state: state || null,
          workspace_type: workspaceType,
          firm_name: firmName.trim(),
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
          Full access to case management, document storage, and everything AJ Suite offers.
          Your trial begins the moment you claim it.
        </p>

        <div className="rounded-xl p-6 mb-6 text-left"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            'Unlimited case files and documents',
            'Deadline reminders that follow every hearing date',
            'Full timeline, task tracking, and export access',
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

        {/* Solo or Chamber */}
        <div className="mb-6 text-left">
          <label className="text-xs mb-2 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Are you a solo practice or a chamber/firm?</label>
          <div className="flex flex-col sm:flex-row gap-2">
            {(['solo', 'chamber'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setWorkspaceType(type)}
                className="flex-1 px-3 py-3 rounded-lg text-sm font-medium capitalize transition-colors break-words"
                style={{
                  background: workspaceType === type ? '#fff' : 'rgba(255,255,255,0.08)',
                  color: workspaceType === type ? 'var(--navy)' : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>
                {type === 'solo' ? 'Solo Practice' : 'Chamber / Firm'}
              </button>
            ))}
          </div>
        </div>

        {/* Firm / Workspace Name */}
        <div className="mb-6 text-left">
          <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Firm / Workspace Name</label>
          <input
            type="text"
            value={firmName}
            onChange={e => setFirmName(e.target.value)}
            placeholder="e.g. Okafor & Co. Chambers"
            className="w-full px-3 py-2.5 rounded-lg text-sm break-words"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} />
        </div>

        {/* Country and State */}
        <div className="flex flex-col gap-3 mb-6 text-left">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Country <span style={{ color: 'rgba(255,255,255,0.2)' }}>(optional)</span></label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: country ? '#fff' : 'rgba(255,255,255,0.35)' }}>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#1B2B4B' }}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>State / Region <span style={{ color: 'rgba(255,255,255,0.2)' }}>(optional)</span></label>
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="e.g. Lagos, Abuja, New York"
              className="w-full px-3 py-2.5 rounded-lg text-sm placeholder-opacity-30"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} />
          </div>
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