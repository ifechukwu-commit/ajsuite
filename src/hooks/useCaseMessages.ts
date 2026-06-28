'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CaseMessage } from '@/types'

export function useCaseMessages(caseId: string) {
  const [messages, setMessages] = useState<CaseMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('case_messages')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
    if (error) { setError(error.message) } else { setMessages(data ?? []) }
    setLoading(false)
  }, [caseId])

  useEffect(() => {
    fetchMessages()
    // Simple polling — keeps this deliberately simple, no realtime
    // channel setup, no typing indicators, nothing fancy.
    const interval = setInterval(fetchMessages, 4000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  const sendMessage = async (body: string, attachedDocumentId?: string | null) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !body.trim()) return
    const { error } = await supabase.from('case_messages').insert({
      case_id: caseId,
      user_id: session.user.id,
      body: body.trim(),
      attached_document_id: attachedDocumentId ?? null,
    })
    if (error) { setError(error.message); return }
    await fetchMessages()
  }

  return { messages, loading, error, sendMessage, refetch: fetchMessages }
}
