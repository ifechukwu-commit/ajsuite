'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

const TRIAL_DAYS = 30
const ADMIN_EMAILS = [
  'ajcasemanager46@gmail.com',
  'ifechukwudarlington.dev@gmail.com',
  'ahia4.agent@gmail.com',
]

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
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
      } catch (err) {
        console.error('useUser error:', err)
      } finally {
        setLoading(false)
      }
    }

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
  }, [])

  const trialDaysLeft = (): number => {
    if (!user) return 0
    const start = new Date(user.trial_start)
    const now = new Date()
    const diff = Math.ceil((start.getTime() + TRIAL_DAYS * 86400000 - now.getTime()) / 86400000)
    return Math.max(0, diff)
  }

  const isAdmin = () => ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? '')
  const isActive = () => {
    if (!user) return false
    if (isAdmin()) return true
    if (user.plan === 'solo' || user.plan === 'chamber') return true
    return trialDaysLeft() > 0
  }

  const isTrialExpired = () => user?.plan === 'trial' && trialDaysLeft() === 0
  const showTrialBanner = () => user?.plan === 'trial' && trialDaysLeft() <= 7 && trialDaysLeft() > 0

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
    loading,
    trialDaysLeft,
    isAdmin,
    isActive,
    isTrialExpired,
    showTrialBanner,
    reviewedBy,
    signOut,
  }
}
