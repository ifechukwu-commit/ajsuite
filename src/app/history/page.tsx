'use client'
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import Sidebar from '@/components/layout/Sidebar'
import TrialBanner from '@/components/layout/TrialBanner'
import HistorySection from '@/components/history/HistorySection'
import NewCaseModal from '@/components/cases/NewCaseModal'

export default function HistoryPage() {
  const { user, showTrialBanner, trialDaysLeft } = useUser()
  const { cases, createCase } = useCases()
  const [showNewCase, setShowNewCase] = useState(false)

  return (
    <div className="flex flex-col h-screen">
      {showTrialBanner() && <TrialBanner daysLeft={trialDaysLeft()} />}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar cases={cases} onNewCase={() => setShowNewCase(true)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <HistorySection cases={cases} onNewCase={() => setShowNewCase(true)} />
        </main>
      </div>
      {showNewCase && (
        <NewCaseModal onClose={() => setShowNewCase(false)}
          onSubmit={async (input) => { await createCase(input); setShowNewCase(false) }} />
      )}
    </div>
  )
}
