'use client'
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function SettingsPage() {
  const { user, workspaceId, loading: userLoading, isActive, isRestricted, trialDaysLeft, signOut, isMemberBlocked } = useUser()
  const { cases } = useCases(workspaceId)
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }

  const handleSubscribe = async () => {
    setSubscribing(true)
    setError(null)
    try {
      const res = await fetch('/api/paystack/initiate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not start checkout')
      window.location.href = data.authorization_url
    } catch (err: any) {
      setError(err.message)
      setSubscribing(false)
    }
  }

  const statusLabel = isActive()
  ? (
      user?.plan === 'admin'
        ? 'Admin access'
        : user?.plan === 'solo' || user?.plan === 'chamber'
          ? 'Active — paid'
          : `Free trial — ${trialDaysLeft()} days left`
    )
  : 'Subscription ended'

  return (
    <div className="flex h-screen">
      <Sidebar cases={cases} onNewCase={() => {}} />
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 pl-20 md:pl-6 max-w-2xl">
        <h1 className="font-baskerville text-xl mb-6" style={{ color: 'var(--navy)' }}>Settings</h1>

        <Section title="Profile">
          <Row label="Name" value={user?.full_name || '—'} />
          <Row label="Email" value={user?.email || '—'} />
          <Row label="Firm" value={user?.firm_name || '—'} />
          <Row label="Role" value={user?.role === 'owner' ? 'Workspace Owner' : 'Team Member'} />
        </Section>

        <Section title="Workspace">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{statusLabel}</p>
              {isRestricted() && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Read access stays open. Subscribe to create new cases, add notes, or export again.</p>
              )}
            </div>
            {user?.role === 'owner' && (
  <button
    onClick={handleSubscribe}
    disabled={subscribing}
    className="px-4 py-2 rounded text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-80 disabled:opacity-50"
    style={{ background: 'var(--gold)', color: 'var(--navy)' }}
  >
    {subscribing
      ? 'Redirecting...'
      : isActive() && (user?.plan === 'solo' || user?.plan === 'chamber')
        ? 'Renew - ₦8,500/month'
        : 'Subscribe - ₦8,500/month'}
  </button>
)}

          </div>
          {error && <p className="text-xs" style={{ color: '#9B1C1C' }}>{error}</p>}
          <Link href="/team" className="text-xs font-medium" style={{ color: 'var(--navy)' }}>Manage team members →</Link>
        </Section>

        <Section title="Appearance">
          <ThemeToggle />
        </Section>

        <Section title="Security">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Signed in with Google. No password is stored - your account security follows your Google account.
          </p>
        </Section>

        <button onClick={signOut}
          className="mt-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors"
          style={{ borderColor: '#FECACA', color: '#DC2626', background: 'transparent' }}>
          Sign out
        </button>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-5 mb-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}
