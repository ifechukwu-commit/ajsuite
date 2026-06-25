'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import EmptyState from '@/components/ui/EmptyState'
import type { CaseNote } from '@/types'

export default function AllNotesPage() {
  const { user, workspaceId, loading: userLoading, isMemberBlocked } = useUser()
  const { cases } = useCases(workspaceId)
  const [notes, setNotes] = useState<CaseNote[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const caseTitle = (caseId: string) => cases.find(c => c.id === caseId)?.title ?? 'Unknown matter'

  const load = useCallback(async () => {
    if (cases.length === 0) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('case_notes')
      .select('*')
      .in('case_id', cases.map(c => c.id))
      .order('created_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }, [cases])

  useEffect(() => { load() }, [load])

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }

  return (
    <div className="flex h-screen">
      <Sidebar cases={cases} onNewCase={() => {}} />
      <main className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 pl-20 md:pl-6">
        <h1 className="font-baskerville text-xl mb-6 break-words" style={{ color: 'var(--navy)' }}>All Notes</h1>

        {loading || userLoading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : notes.length === 0 ? (
          <EmptyState title="No notes yet" description="Notes you add inside a matter will show up here." />
        ) : (
          <div className="flex flex-col gap-2">
            {notes.map(note => (
              <div key={note.id} className="px-4 py-3 rounded-lg border min-w-0"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-sm break-words whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{note.body}</p>
                <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                  <Link href={`/cases/${note.case_id}`} className="text-xs break-words hover:underline" style={{ color: 'var(--navy)' }}>
                    {caseTitle(note.case_id)}
                  </Link>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(note.created_at).toLocaleDateString('en-GB')}
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
