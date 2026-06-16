'use client'
import type { Case, User } from '@/types'
import StatCards from './StatCards'
import RecentCases from './RecentCases'

interface Props {
  user: User
  cases: Case[]
  onNewCase: () => void
}

export default function DashboardHome({ user, cases, onNewCase }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = user.firm_name || user.full_name || 'Counsel'

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const urgent = cases.filter(c => c.status === 'Urgent').length

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
      <h1 className="font-baskerville text-xl mb-1" style={{ color: 'var(--navy)' }}>
        {greeting}, {name}.
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {today}{urgent > 0 ? ` - ${urgent} matter${urgent > 1 ? 's' : ''} require attention today.` : '.'}
      </p>
      <StatCards cases={cases} />
      <RecentCases cases={cases} onNewCase={onNewCase} />
    </div>
  )
}
