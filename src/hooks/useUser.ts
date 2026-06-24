'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_EMAILS, TRIAL_DAYS } from '@/lib/constants'
import type { User } from '@/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  // For a member, this is the OWNER's row — status is always read from here, never from `user`.
  const [workspaceOwner, setWorkspaceOwner] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      setUser(data)

      if (data.role === 'member' && data.owner_id) {
        const { data: owner } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.owner_id)
          .single()
        setWorkspaceOwner(owner ?? null)
      } else {
        setWorkspaceOwner(null)
      }
    } catch (err) {
      console.error('useUser error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        fetchUser()
      }
      if (event === 'SIGNED_OUT') {
        window.location.href = '/'
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUser])

  // The record that actually determines access — your own, unless you're a member.
  const statusSource = workspaceOwner ?? user

  // The id every case/document/task/note should be saved under.
  const workspaceId = workspaceOwner?.id ?? user?.id ?? null

  const trialDaysLeft = (): number => {
    if (!statusSource) return 0
    const start = new Date(statusSource.trial_start)
    const diff = Math.ceil((start.getTime() + TRIAL_DAYS * 86400000 - Date.now()) / 86400000)
    return Math.max(0, diff)
  }

  const isAdmin = () => ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? '')

  const isActive = (): boolean => {
  if (!statusSource) return false

  if (statusSource.plan === 'admin') return true

  if (statusSource.plan === 'solo' || statusSource.plan === 'chamber') {
    return !statusSource.paid_until || new Date(statusSource.paid_until) > new Date()
  }

  if (statusSource.plan === 'trial') {
    return statusSource.trial_claimed && trialDaysLeft() > 0
  }

  return false
}

  // Owner whose trial/subscription has lapsed — stays in the dashboard, read-only.
  const isRestricted = (): boolean => user?.role === 'owner' && !isActive()

  // Member whose owner's workspace has lapsed — middleware should already have
  // redirected them to /expired before this ever renders. Kept as a safety net.
  const isMemberBlocked = (): boolean => user?.role === 'member' && !isActive()

  const isTrialExpired = () => statusSource?.plan === 'trial' && trialDaysLeft() === 0
  const showTrialBanner = () => user?.role === 'owner' && statusSource?.plan === 'trial' && trialDaysLeft() <= 7 && trialDaysLeft() > 0

  const reviewedBy = (): string => {
    if (!user) return ''
    return user.firm_name || `${user.full_name}${user.title ? ` ${user.title}` : ''}`
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return {
    user,
    workspaceId,
    loading,
    trialDaysLeft,
    isAdmin,
    isActive,
    isRestricted,
    isMemberBlocked,
    isTrialExpired,
    showTrialBanner,
    reviewedBy,
    signOut,
  }
}
