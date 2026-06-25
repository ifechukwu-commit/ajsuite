'use client'
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TrialBanner from '@/components/layout/TrialBanner'
import RestrictedBanner from '@/components/dashboard/RestrictedBanner'
import DeadlinesBanner from '@/components/layout/DeadlinesBanner'
import DashboardHome from '@/components/dashboard/DashboardHome'
import NewCaseModal from '@/components/cases/NewCaseModal'
import { redirect } from 'next/navigation'
import NotificationsPanel from '@/components/notifications/NotificationsPanel'
import ReviewPopup from '@/components/dashboard/ReviewPopup'

export default function DashboardPage() {
  const router = useRouter()
  const { user, workspaceId, loading: userLoading, showTrialBanner, trialDaysLeft, isRestricted, isMemberBlocked } = useUser()
  const { cases, loading: casesLoading, createCase } = useCases(workspaceId)
  const [showNewCase, setShowNewCase] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  if (!userLoading && !user) { redirect('/'); return null }
  // Members of a lapsed firm are redirected — middleware should already have
  // caught this, this is a client-side safety net only.
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }
  // Owners are NEVER redirected here, even when their trial/subscription has
  // lapsed. They stay, read-only, with the banner below explaining why.

  const allDeadlines = cases
  .filter(c => c.deadline)
  .map(c => ({
    id: c.id,
    case_id: c.id,
    user_id: c.user_id,
    label: c.title,
    due_date: c.deadline!,
    is_critical: c.status === 'Urgent',
    created_at: c.created_at,
    created_by: c.created_by ?? null
  }))
  return (
    <div className="flex flex-col h-screen">
      {showTrialBanner() && <TrialBanner daysLeft={trialDaysLeft()} />}
      {isRestricted() && (
        <div className="px-4 pt-3"><RestrictedBanner onUpgrade={() => router.push('/settings')} /></div>
      )}
      <DeadlinesBanner deadlines={allDeadlines} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar cases={cases} onNewCase={() => setShowNewCase(true)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-end px-6 py-3 border-b flex-shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <button onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded border"
              style={{ borderColor: 'var(--border)', background: 'transparent' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
                <path d="M7.5 1.5A4 4 0 0 0 3.5 5.5v3l-1 1.5h10l-1-1.5v-3a4 4 0 0 0-4-4z"/>
                <path d="M6 11.5a1.5 1.5 0 0 0 3 0"/>
              </svg>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: '#EF4444' }} />
            </button>
          </div>
          {casesLoading || userLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
            </div>
          ) : user ? (
            <DashboardHome user={user} cases={cases} onNewCase={() => setShowNewCase(true)} />
          ) : null}
        </main>
      </div>
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {user && <ReviewPopup userId={user.id} lastPromptAt={user.last_review_prompt_at} />}
      {showNewCase && (
        <NewCaseModal
          onClose={() => setShowNewCase(false)}
          loading={creating}
          onSubmit={async (input) => {
            setCreating(true)
            await createCase(input)
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}
