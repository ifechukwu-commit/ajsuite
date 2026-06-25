'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const { user, workspaceId, loading: userLoading, isActive, isRestricted, trialDaysLeft, signOut, isMemberBlocked } = useUser()
  const { cases } = useCases(workspaceId)
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [firmInput, setFirmInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [localName, setLocalName] = useState<string | null>(null)
  const [localFirm, setLocalFirm] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      setNameInput(user.full_name || '')
      setFirmInput(user.firm_name || '')
    }
  }, [user])

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    setProfileError(null)
    const { error } = await supabase
      .from('users')
      .update({ full_name: nameInput.trim(), firm_name: firmInput.trim() })
      .eq('id', user.id)
    if (error) {
      setProfileError(error.message)
    } else {
      setLocalName(nameInput.trim())
      setLocalFirm(firmInput.trim())
      setEditingProfile(false)
    }
    setSavingProfile(false)
  }

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
          {editingProfile ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Name</label>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm focus-navy break-words"
                  style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Firm</label>
                <input value={firmInput} onChange={e => setFirmInput(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm focus-navy break-words"
                  style={{ borderColor: 'var(--border)' }} />
              </div>
              {profileError && <p className="text-xs break-words" style={{ color: '#9B1C1C' }}>{profileError}</p>}
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="px-4 py-2 rounded text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: 'var(--navy)' }}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => { setEditingProfile(false); setNameInput(localName ?? user?.full_name ?? ''); setFirmInput(localFirm ?? user?.firm_name ?? '') }}
                  className="px-4 py-2 rounded text-xs font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <Row label="Name" value={localName || user?.full_name || '—'} />
              <Row label="Email" value={user?.email || '—'} />
              <Row label="Firm" value={localFirm || user?.firm_name || '—'} />
              <button onClick={() => setEditingProfile(true)}
                className="text-xs font-medium mt-2" style={{ color: 'var(--navy)' }}>
                Edit Name / Firm →
              </button>
            </>
          )}
        </Section>

        <Section title="Workspace">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{statusLabel}</p>
              {isRestricted() && (
                <p className="text-xs mt-1 break-words" style={{ color: 'var(--text-muted)' }}>Read access stays open. Subscribe to create new cases, add notes, or export again.</p>
              )}
            </div>
            {user?.role === 'owner' && (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="px-4 py-2 rounded text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-50 break-words text-center"
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
          {error && <p className="text-xs break-words" style={{ color: '#9B1C1C' }}>{error}</p>}
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
    <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b last:border-0 gap-0.5" style={{ borderColor: 'var(--border)' }}>
      <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-medium break-words sm:text-right" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}
