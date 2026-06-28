'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activityLog'
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

  const createTask = async (input: { title: string; due_date: string | null; priority: 'High' | 'Medium' | 'Low'; assigned_to?: string | null }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const ownerId = workspaceId ?? session.user.id

    const { error } = await supabase.from('tasks').insert({
      case_id: caseId,
      user_id: ownerId,
      created_by: session.user.id,
      status: 'Pending',
      ...input,
    })
    if (error) { setError(error.message); return }
    await fetchTasks()
  }

  // Member moves their own work forward: Pending -> In Progress, or
  // In Progress -> Submitted (optionally attaching a file + note).
  const advanceStatus = async (task: Task, status: 'In Progress' | 'Submitted', opts?: { note?: string; documentId?: string }) => {
    const update: Record<string, any> = { status }
    if (status === 'Submitted') {
      update.submitted_at = new Date().toISOString()
      update.submission_note = opts?.note ?? null
      update.submission_document_id = opts?.documentId ?? null
    }
    const { error } = await supabase.from('tasks').update(update).eq('id', task.id)
    if (error) { setError(error.message); return }
    if (status === 'Submitted') {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) logActivity(supabase, session.user.id, session.user.email, 'task_submitted', task.title)
    }
    await fetchTasks()
  }

  // Owner reviews submitted work: Approved, or Needs Revision (sends it
  // back to In Progress for another pass).
  const reviewTask = async (task: Task, decision: 'Approved' | 'Needs Revision') => {
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('tasks').update({
      status: decision,
      reviewed_by: session?.user.id ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', task.id)
    if (error) { setError(error.message); return }
    await fetchTasks()
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { setError(error.message); return }
    await fetchTasks()
  }

  return { tasks, loading, error, createTask, advanceStatus, reviewTask, deleteTask, refetch: fetchTasks }
}
