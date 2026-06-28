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
import WelcomeTour from '@/components/dashboard/WelcomeTour'

export default function DashboardPage() {
  const router = useRouter()
  const { user, workspaceId, loading: userLoading, showTrialBanner, trialDaysLeft, isRestricted, isMemberBlocked } = useUser()
  const { cases, loading: casesLoading, createCase } = useCases(workspaceId)
  const [showNewCase, setShowNewCase] = useState(false)
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null)
  const handleNewCase = () => isRestricted() ? setBlockedMsg('New cases are paused until you renew. Everything you already have stays fully visible.') : setShowNewCase(true)
  const [creating, setCreating] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }

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
      {isRestricted() && <RestrictedBanner onUpgrade={() => router.push('/settings')} />}
      <DeadlinesBanner deadlines={allDeadlines} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar cases={cases} onNewCase={handleNewCase} />
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
            <DashboardHome user={user} cases={cases} onNewCase={handleNewCase} />
          ) : null}
        </main>
      </div>
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {blockedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-xs rounded-xl shadow-2xl p-5 text-center" style={{ background: '#fff' }}>
            <p className="text-sm font-bold mb-1 break-words" style={{ color: 'var(--navy)' }}>Notice</p>
            <p className="text-xs mb-4 break-words" style={{ color: 'var(--text-secondary)' }}>{blockedMsg}</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setBlockedMsg(null); router.push('/settings') }}
                className="px-4 py-2 rounded text-xs font-bold" style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
                Subscribe, ₦8,500 per month
              </button>
              <button onClick={() => setBlockedMsg(null)} className="px-4 py-2 rounded text-xs font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {user && !user.onboarding_completed && <WelcomeTour userId={user.id} workspaceName={user.firm_name || user.full_name || 'there'} />}
      {user && user.onboarding_completed && <ReviewPopup userId={user.id} lastPromptAt={user.last_review_prompt_at} accountCreatedAt={user.created_at} />}
      {showNewCase && (
        <NewCaseModal
          onClose={() => setShowNewCase(false)}
          loading={creating}
          onSubmit={async (input) => {
            setCreating(true)
            const created = await createCase(input)
            setCreating(false)
            if (created) {
              setShowNewCase(false)
              router.push(`/cases/${created.id}`)
            } else {
              setBlockedMsg('Could not open this matter. Please try again.')
            }
          }}
        />
      )}
    </div>
  )
}