'use client'
import { useState } from 'react'
import { useCaseNotes } from '@/hooks/useCaseNotes'
import type { Case, Document } from '@/types'

interface Props { caseData: Case; documents: Document[]; workspaceId: string | null; isRestricted: boolean; onBlocked: (msg: string) => void }

export default function OverviewTab({ caseData, documents, workspaceId, isRestricted, onBlocked }: Props) {
  const { notes, loading: notesLoading, addNote } = useCaseNotes(caseData.id, workspaceId)
  const [draft, setDraft] = useState('')

  const handleAddNote = async () => {
    if (!draft.trim()) return
    if (isRestricted) { onBlocked('Adding new case notes is paused until you renew.'); return }
    await addNote(draft)
    setDraft('')
  }

  const deadline = caseData.deadline
    ? new Date(caseData.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const daysLeft = caseData.deadline
    ? Math.ceil((new Date(caseData.deadline).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card title="Case Information">
          <Row label="Case Title" value={caseData.title} />
          <Row label="Case Number" value={caseData.case_number || 'Not set'} />
          <Row label="Client Name" value={caseData.client_name} />
          <Row label="Client Contact" value={caseData.client_contact || 'Not provided'} />
          <Row label="Opposing Party" value={caseData.opposing_party || 'Not set'} />
          <Row label="Court" value={caseData.court || 'Not set'} />
          <Row label="Judge" value={caseData.judge || 'Not set'} />
          <Row label="Case Type" value={caseData.matter_type} />
        </Card>
        <Card title="Matter Summary">
          <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-primary)' }}>
            {caseData.notes || 'No summary notes added yet.'}
          </p>
        </Card>
        <Card title="Documents">
          <p className="font-baskerville text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>{documents.length}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>file{documents.length === 1 ? '' : 's'} attached to this matter</p>
        </Card>
        <Card title="Next Hearing">
          {deadline ? (
            <>
              <p className="font-baskerville text-3xl font-bold mb-1"
                style={{ color: daysLeft !== null && daysLeft <= 7 ? '#DC2626' : 'var(--navy)' }}>
                {new Date(caseData.deadline!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-xs break-words" style={{ color: 'var(--text-muted)' }}>
                {deadline}, {daysLeft !== null ? `${daysLeft} days remaining` : ''}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No deadline set</p>
          )}
        </Card>
      </div>

      <div className="rounded-lg border p-4 sm:p-5 min-w-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-1 break-words" style={{ color: 'var(--text-muted)' }}>Case Notes</h3>
        <p className="text-xs mb-3 break-words" style={{ color: 'var(--text-muted)' }}>
          A permanent record for this matter, client instructions, court outcomes, anything worth remembering. Separate from Team Discussion, which is for day-to-day collaboration.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()}
            placeholder="e.g. Client instructed settlement"
            className="flex-1 px-3 py-2 rounded border text-sm min-w-0" style={{ borderColor: 'var(--border)' }} />
          <button onClick={handleAddNote} className="text-xs px-4 py-2 rounded font-bold text-white flex-shrink-0" style={{ background: 'var(--navy)' }}>
            Add Note
          </button>
        </div>

        {notesLoading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notes recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {notes.map(note => (
              <div key={note.id} className="px-3 py-2 rounded border min-w-0" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm break-words whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{note.body}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(note.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 sm:p-5 min-w-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3 break-words" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 min-w-0">
      <p className="text-xs break-words" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}
