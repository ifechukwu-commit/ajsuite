'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CaseNote } from '@/types'
import EmptyState from '@/components/ui/EmptyState'

interface Props { caseId: string; workspaceId?: string | null }

export default function NotesTab({ caseId, workspaceId }: Props) {
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('case_notes')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setNotes(data ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleAdd = async () => {
    if (!body.trim()) return
    try {
      setSaving(true)
      setError(null)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const ownerId = workspaceId ?? session.user.id

      const { error } = await supabase.from('case_notes').insert({
        case_id: caseId,
        user_id: ownerId,
        created_by: session.user.id,
        body: body.trim(),
      })
      if (error) throw error

      await supabase.from('timeline_events').insert({
        case_id: caseId,
        user_id: ownerId,
        event_type: 'note_added',
        description: 'A note was added to this matter.',
      })

      setBody('')
      await fetchNotes()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b"
        style={{ color: 'var(--navy)', borderColor: 'var(--border)' }}>Case Notes</h3>

      {error && (
        <div className="mb-3 px-4 py-2 rounded text-sm" style={{ background: '#FEE2E2', color: '#9B1C1C' }}>{error}</div>
      )}

      <div className="mb-6">
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="Client called today. Judge requested additional documents. Witness unavailable..."
          className="w-full px-4 py-3 rounded-lg border text-sm outline-none resize-none transition-colors focus-navy"
          style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)', minHeight: '100px', lineHeight: '1.7' }} />
        <div className="flex justify-end mt-2">
          <button onClick={handleAdd} disabled={saving || !body.trim()}
            className="px-5 py-2 rounded text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--navy)' }}>
            {saving ? 'Saving...' : 'Add Note'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading notes...</p>
      ) : notes.length === 0 ? (
        <EmptyState title="No notes yet" description="Add the first note for this matter above." />
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(n => (
            <div key={n.id} className="rounded-lg border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{n.body}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                {new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
