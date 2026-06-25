'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import EmptyState from '@/components/ui/EmptyState'
import type { Task } from '@/types'

export default function AllTasksPage() {
  const { user, workspaceId, loading: userLoading, isMemberBlocked } = useUser()
  const { cases } = useCases(workspaceId)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const caseTitle = (caseId: string) => cases.find(c => c.id === caseId)?.title ?? 'Unknown matter'

  const load = useCallback(async () => {
    if (cases.length === 0) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('case_id', cases.map(c => c.id))
      .order('due_date', { ascending: true })
    setTasks(data ?? [])
    setLoading(false)
  }, [cases])

  useEffect(() => { load() }, [load])

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'Done' ? 'Pending' : 'Done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  return (
    <div className="flex h-screen">
      <Sidebar cases={cases} onNewCase={() => {}} />
      <main className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 pl-20 md:pl-6">
        <h1 className="font-baskerville text-xl mb-6 break-words" style={{ color: 'var(--navy)' }}>All Tasks</h1>

        {loading || userLoading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : tasks.length === 0 ? (
          <EmptyState title="No tasks yet" description="Tasks you create inside a matter will show up here." />
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map(task => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 rounded-lg border min-w-0"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <button onClick={() => toggleStatus(task)}
                  className="w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center"
                  style={{ borderColor: 'var(--gold)', background: task.status === 'Done' ? 'var(--gold)' : 'transparent' }}>
                  {task.status === 'Done' && <span style={{ color: 'var(--navy)', fontSize: '12px' }}>✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-words"
                    style={{ color: 'var(--text-primary)', textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>
                    {task.title}
                  </p>
                  <Link href={`/cases/${task.case_id}`} className="text-xs break-words hover:underline" style={{ color: 'var(--navy)' }}>
                    {caseTitle(task.case_id)}
                  </Link>
                  <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-muted)' }}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : 'No due date'} · {task.priority} priority
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
