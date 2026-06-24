'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Case, NewCaseInput, EditCaseInput } from '@/types'

export function useCases(workspaceId?: string | null) {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // No explicit filter — RLS already scopes this to your own workspace.
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setCases(data ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Failed to load cases')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCases() }, [fetchCases])

  const createCase = async (input: NewCaseInput): Promise<Case | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Saved under the workspace owner's id so the whole firm can see it —
      // not the raw signed-in id, which would be wrong for invited members.
      const ownerId = workspaceId ?? session.user.id

      const { data, error } = await supabase
        .from('cases')
        .insert({ ...input, user_id: ownerId, created_by: session.user.id })
        .select()
        .single()

      if (error) throw error

      await supabase.from('timeline_events').insert({
        case_id: data.id,
        user_id: ownerId,
        event_type: 'case_created',
        description: `Matter opened: ${data.title}`,
      })

      await fetchCases()
      return data
    } catch (err: any) {
      setError(err.message ?? 'Failed to create case')
      return null
    }
  }

  const updateCase = async (input: EditCaseInput): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { id, ...rest } = input
      const { error } = await supabase
        .from('cases')
        .update(rest)
        .eq('id', id)

      if (error) throw error

      const ownerId = workspaceId ?? session.user.id
      await supabase.from('timeline_events').insert({
        case_id: id,
        user_id: ownerId,
        event_type: 'status_changed',
        description: `Matter updated. Status: ${input.status}`,
      })

      await fetchCases()
      return true
    } catch (err: any) {
      setError(err.message ?? 'Failed to update case')
      return false
    }
  }

  const deleteCase = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('cases').delete().eq('id', id)
      if (error) throw error
      await fetchCases()
      return true
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete case')
      return false
    }
  }

  return { cases, loading, error, fetchCases, createCase, updateCase, deleteCase }
}
