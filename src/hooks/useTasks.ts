'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/types'

export function useTasks(caseId: string, workspaceId?: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('case_id', caseId)
        .order('due_date', { ascending: true })
      if (error) throw error
      setTasks(data ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const createTask = async (input: { title: string; due_date: string | null; priority: 'High' | 'Medium' | 'Low' }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const ownerId = workspaceId ?? session.user.id

    const { error } = await supabase.from('tasks').insert({
      case_id: caseId,
      user_id: ownerId,
      created_by: session.user.id,
      ...input,
    })
    if (error) { setError(error.message); return }
    await fetchTasks()
  }

  const toggleTask = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: task.status === 'Done' ? 'Pending' : 'Done' })
      .eq('id', task.id)
    if (error) { setError(error.message); return }
    await fetchTasks()
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { setError(error.message); return }
    await fetchTasks()
  }

  return { tasks, loading, error, createTask, toggleTask, deleteTask }
}
