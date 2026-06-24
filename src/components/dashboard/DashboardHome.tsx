'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Case, User, Task, TimelineEvent } from '@/types'
import StatCards from './StatCards'
import QuickActions from './QuickActions'
import TodaysSchedule from './TodaysSchedule'
import UpcomingDeadlines from './UpcomingDeadlines'
import RecentActivity from './RecentActivity'
import RecentCases from './RecentCases'
import CasePickerModal from './CasePickerModal'

interface Props {
  user: User
  cases: Case[]
  onNewCase: () => void
}

export default function DashboardHome({ user, cases, onNewCase }: Props) {
  const supabase = createClient()
  const [tasksToday, setTasksToday] = useState<(Task & { case_title?: string })[]>([])
  const [events, setEvents] = useState<(TimelineEvent & { case_title?: string })[]>([])
  const [picker, setPicker] = useState<'documents' | 'tasks' | null>(null)

  useEffect(() => {
    const load = async () => {
      const todayStr = new Date().toISOString().slice(0, 10)

      const [{ data: tasks }, { data: timeline }] = await Promise.all([
        supabase.from('tasks').select('*').eq('due_date', todayStr).eq('status', 'Pending'),
        supabase.from('timeline_events').select('*').order('created_at', { ascending: false }).limit(8),
      ])

      const caseTitleFor = (caseId: string) => cases.find(c => c.id === caseId)?.title

      setTasksToday((tasks ?? []).map(t => ({ ...t, case_title: caseTitleFor(t.case_id) })))
      setEvents((timeline ?? []).map(e => ({ ...e, case_title: caseTitleFor(e.case_id) })))
    }
    if (cases.length >= 0) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases.length])

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

      <StatCards cases={cases} tasksDueToday={tasksToday.length} />
      <QuickActions
        onNewCase={onNewCase}
        onUploadDocument={() => setPicker('documents')}
        onCreateTask={() => setPicker('tasks')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TodaysSchedule cases={cases} tasksToday={tasksToday} />
        <UpcomingDeadlines cases={cases} />
      </div>

      <RecentActivity events={events} />
      <RecentCases cases={cases} onNewCase={onNewCase} />

      {picker && <CasePickerModal cases={cases} destination={picker} onClose={() => setPicker(null)} />}
    </div>
  )
}
