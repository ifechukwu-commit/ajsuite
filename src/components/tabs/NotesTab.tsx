'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props { caseId: string; initialNotes: string }

export default function NotesTab({ caseId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase.from('cases').update({ notes }).eq('id', caseId)
      if (error) throw error

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.from('timeline_events').insert({
          case_id: caseId,
          user_id: session.user.id,
          event_type: 'note_updated',
          description: 'Case notes updated.',
        })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save notes')
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
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Add case notes, instructions, observations..."
        className="w-full px-4 py-3 rounded-lg border text-sm outline-none resize-none transition-colors focus-navy"
        style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)', minHeight: '200px', lineHeight: '1.7' }} />
      <div className="flex justify-end items-center gap-3 mt-3">
        {saved && <span className="text-xs" style={{ color: 'var(--status-active)' }}>Saved</span>}
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 rounded text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--navy)' }}>
          {saving ? 'Saving...' : 'Save Notes'}
        </button>
      </div>
    </div>
  )
}
