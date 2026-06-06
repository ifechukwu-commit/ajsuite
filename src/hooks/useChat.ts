'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types'

export function useChat(caseId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  const sendMessage = async (content: string): Promise<boolean> => {
    try {
      setSending(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { error: insertError } = await supabase.from('chat_messages').insert({
        case_id: caseId,
        user_id: session.user.id,
        role: 'user',
        content,
      })
      if (insertError) throw insertError

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, message: content }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error ?? 'Chat request failed')
      }

      await fetchMessages()
      return true
    } catch (err: any) {
      setError(err.message ?? 'Failed to send message')
      return false
    } finally {
      setSending(false)
    }
  }

  return { messages, loading, sending, error, fetchMessages, sendMessage }
}
