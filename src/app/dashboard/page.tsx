'use client'
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import Sidebar from '@/components/layout/Sidebar'
import TrialBanner from '@/components/layout/TrialBanner'
import DeadlinesBanner from '@/components/layout/DeadlinesBanner'
import DashboardHome from '@/components/dashboard/DashboardHome'
import NewCaseModal from '@/components/cases/NewCaseModal'
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  const { user, loading: userLoading, showTrialBanner, trialDaysLeft, isActive } = useUser()
  const { cases, loading: casesLoading, createCase } = useCases()
  const [showNewCase, setShowNewCase] = useState(false)
  const [creating, setCreating] = useState(false)

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && !isActive()) { redirect('/expired'); return null }

  const allDeadlines = cases
    .filter(c => c.deadline)
    .map(c => ({ id: c.id, case_id: c.id, user_id: c.user_id, label: c.title, due_date: c.deadline!, is_critical: c.status === 'Urgent', created_at: c.created_at }))

  return (
    <div className="flex flex-col h-screen">
      {showTrialBanner() && <TrialBanner daysLeft={trialDaysLeft()} />}
      <DeadlinesBanner deadlines={allDeadlines} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar cases={cases} onNewCase={() => setShowNewCase(true)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {casesLoading || userLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
            </div>
          ) : user ? (
            <DashboardHome user={user} cases={cases} onNewCase={() => setShowNewCase(true)} />
          ) : null}
        </main>
      </div>

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
