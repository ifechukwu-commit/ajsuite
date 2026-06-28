'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CaseNote } from '@/types'

export function useCaseNotes(caseId: string, workspaceId?: string | null) {
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('case_notes')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
    if (error) { setError(error.message) } else { setNotes(data ?? []) }
    setLoading(false)
  }, [caseId])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const addNote = async (body: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !body.trim()) return
    const ownerId = workspaceId ?? session.user.id

    const { error } = await supabase.from('case_notes').insert({
      case_id: caseId,
      user_id: ownerId,
      created_by: session.user.id,
      body: body.trim(),
    })
    if (error) { setError(error.message); return }

    // Case notes are a permanent record of what happened on the matter —
    // every one of them also lands on the Timeline automatically.
    await supabase.from('timeline_events').insert({
      case_id: caseId,
      user_id: ownerId,
      event_type: 'note_added',
      description: body.trim().slice(0, 140),
    })

    await fetchNotes()
  }

  return { notes, loading, error, addNote, refetch: fetchNotes }
}
