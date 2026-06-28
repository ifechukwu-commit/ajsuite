'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTasks } from '@/hooks/useTasks'
import { useCaseMessages } from '@/hooks/useCaseMessages'
import type { Document, WorkSession, SessionMember } from '@/types'

interface Props {
  caseId: string
  workspaceId: string | null
  currentUserId: string
  isOwner: boolean
  documents: Document[]
  onDownloadDocument: (doc: Document) => Promise<void>
  onPreviewDocument: (doc: Document) => Promise<void>
  onUploadDocument: (file: File) => Promise<any>
  onDeleteDocument: (doc: Document) => Promise<any>
  isRestricted: boolean
  onBlocked: (msg: string) => void
}

type SubTab = 'tasks' | 'files' | 'discussion' | 'submissions'
const SUBS: { key: SubTab; label: string }[] = [
  { key: 'tasks', label: 'Assigned Tasks' },
  { key: 'files', label: 'Shared Case Files' },
  { key: 'discussion', label: 'Team Discussion' },
  { key: 'submissions', label: 'Submissions' },
]

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Pending: { bg: '#E5E7EB', color: '#374151' },
  'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
  Submitted: { bg: '#FEF3C7', color: '#92400E' },
  Approved: { bg: '#D8F3DC', color: '#2D6A4F' },
  'Needs Revision': { bg: '#FEE2E2', color: '#9B1C1C' },
}

export default function TeamCollaborationTab({ caseId, workspaceId, currentUserId, isOwner, documents, onDownloadDocument, onPreviewDocument, onUploadDocument, onDeleteDocument, isRestricted, onBlocked }: Props) {
  const [sub, setSub] = useState<SubTab>('tasks')
  const [session, setSession] = useState<WorkSession | null>(null)
  const [members, setMembers] = useState<SessionMember[]>([])
  const [nameById, setNameById] = useState<Record<string, string>>({})
  const [memberOptions, setMemberOptions] = useState<{ id: string; name: string }[]>([])
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const { tasks, loading: tasksLoading, createTask, advanceStatus, reviewTask } = useTasks(caseId, workspaceId)
  const { messages, sendMessage } = useCaseMessages(caseId)

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/sessions?caseId=${caseId}`)
    const data = await res.json()
    setSession(data.session)
    setMembers(data.members ?? [])
  }, [caseId])

  useEffect(() => { loadSession() }, [loadSession])

  // Resolve names for chat/tasks — firm side (owner + permanent members)
  // plus anyone who joined via a secure link for this matter.
  useEffect(() => {
    const load = async () => {
      if (!workspaceId) return
      const { data: firmUsers } = await supabase.from('users').select('id, full_name, email').or(`id.eq.${workspaceId},owner_id.eq.${workspaceId}`)
      const map: Record<string, string> = {}
      ;(firmUsers ?? []).forEach(u => { map[u.id] = u.full_name || u.email })
      members.forEach(m => { if (m.user_id) map[m.user_id] = map[m.user_id] || m.name || m.email })
      setNameById(map)

      const options: { id: string; name: string }[] = (firmUsers ?? []).map(u => ({ id: u.id, name: u.full_name || u.email }))
      members.filter(m => m.user_id && !m.revoked_at).forEach(m => {
        if (!options.some(o => o.id === m.user_id)) options.push({ id: m.user_id!, name: m.name || m.email })
      })
      setMemberOptions(options)
    }
    load()
  }, [workspaceId, members])

  const [linkError, setLinkError] = useState<string | null>(null)
  const generateLink = async () => {
    setLinkError(null)
    const res = await fetch('/api/sessions/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId }),
    })
    const data = await res.json()
    if (res.ok) {
      setSession(data)
    } else {
      console.error('sessions/create failed:', data)
     const debugText = data.debug ? ` (caseFound: ${data.debug.caseFound}, caseError: ${data.debug.caseError}, meFound: ${data.debug.meFound}, meError: ${data.debug.meError}, caseOwnerId: ${data.debug.caseOwnerId}, myWorkspaceId: ${data.debug.myWorkspaceId})` : ''
      setLinkError((data.error || 'Something went wrong.') + debugText)
    }
  }

  const copyLink = () => {
    if (!session) return
    navigator.clipboard.writeText(`${window.location.origin}/join/${session.token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const endSession = async () => {
    if (!session) return
    const confirmed = window.confirm('End this work session? Everyone you invited will lose access immediately. Nothing they uploaded or discussed will be deleted.')
    if (!confirmed) return
    await fetch('/api/sessions/end', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id }),
    })
    await loadSession()
  }

  return (
    <div className="p-4 sm:p-6 overflow-y-auto h-full">
      {isOwner && (
        <div className="rounded-lg border p-4 mb-5 max-w-full" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {session ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>
                  Collaboration open, {members.filter(m => !m.revoked_at).length} joined
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={copyLink} className="text-xs px-3 py-1.5 rounded font-bold flex-shrink-0"
                    style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
                    {copied ? 'Link copied' : 'Copy Invite Link'}
                  </button>
                  <button onClick={endSession} className="text-xs px-3 py-1.5 rounded border flex-shrink-0"
                    style={{ borderColor: '#9B1C1C', color: '#9B1C1C' }}>
                    End Collaboration
                  </button>
                </div>
              </div>
              <p className="text-xs break-words mb-1" style={{ color: 'var(--text-muted)' }}>
                Send the copied link to anyone you want working on this matter. They sign in with Google, no separate account needed.
              </p>
              {members.filter(m => !m.revoked_at).length > 0 && (
                <p className="text-xs break-words" style={{ color: 'var(--text-secondary)' }}>
                  Currently in this matter: {members.filter(m => !m.revoked_at).map(m => m.name || m.email).join(', ')}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-sm break-words" style={{ color: 'var(--text-secondary)' }}>No one is collaborating on this matter right now.</p>
              <button onClick={generateLink} className="text-xs px-3 py-1.5 rounded font-bold self-start sm:self-auto flex-shrink-0"
                style={{ background: 'var(--navy)', color: '#fff' }}>
                Invite Team Member
              </button>
            </div>
          )}
          {linkError && <p className="text-xs mt-2 break-words" style={{ color: '#9B1C1C' }}>{linkError}</p>}
        </div>
      )}

      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-thin pb-1">
        {SUBS.map(s => (
          <button key={s.key} onClick={() => setSub(s.key)}
            className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 whitespace-nowrap transition-colors"
            style={{
              background: sub === s.key ? 'var(--navy)' : 'var(--surface)',
              color: sub === s.key ? '#fff' : 'var(--text-secondary)',
              border: sub === s.key ? 'none' : '1px solid var(--border)',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {sub === 'tasks' && (
        <TasksModule tasks={tasks} loading={tasksLoading} isOwner={isOwner} currentUserId={currentUserId}
          nameById={nameById} memberOptions={memberOptions} createTask={createTask} advanceStatus={advanceStatus} reviewTask={reviewTask}
          onUploadDocument={onUploadDocument} isRestricted={isRestricted} onBlocked={onBlocked} />
      )}
      {sub === 'files' && (
        <FilesModule documents={documents} onDownload={onDownloadDocument} onPreview={onPreviewDocument}
          onUpload={onUploadDocument} onDelete={onDeleteDocument} isOwner={isOwner}
          isRestricted={isRestricted} onBlocked={onBlocked} />
      )}
      {sub === 'discussion' && (
        <DiscussionModule messages={messages} nameById={nameById} currentUserId={currentUserId} onSend={sendMessage}
          isRestricted={isRestricted} onBlocked={onBlocked} />
      )}
      {sub === 'submissions' && <SubmissionsModule tasks={tasks} documents={documents} nameById={nameById} />}
    </div>
  )
}

// ----------------------------------------------------------------
function TasksModule({ tasks, loading, isOwner, currentUserId, nameById, memberOptions, createTask, advanceStatus, reviewTask, onUploadDocument, isRestricted, onBlocked }: any) {
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null)
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [submitNote, setSubmitNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) return
    if (isRestricted) { onBlocked('Assigning new tasks is paused until you renew.'); return }
    await createTask({ title: title.trim(), due_date: dueDate || null, priority, assigned_to: assignedTo || null })
    setTitle(''); setDueDate(''); setAssignedTo(''); setShowNew(false)
  }

  const handleSubmitWork = async (task: any) => {
    if (isRestricted) { onBlocked('Submitting work is paused until you renew.'); return }
    setSubmitting(true)
    let documentId: string | undefined
    if (submitFile) {
      const doc = await onUploadDocument(submitFile)
      documentId = doc?.id
    }
    await advanceStatus(task, 'Submitted', { note: submitNote, documentId })
    setSubmitting(false)
    setSubmittingTaskId(null)
    setSubmitFile(null)
    setSubmitNote('')
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading tasks...</p>

  return (
    <div>
      {isOwner && (
        <div className="mb-4">
          {showNew ? (
            <div className="rounded-lg border p-3 flex flex-col gap-2 max-w-md" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Research recent Supreme Court decisions"
                className="px-3 py-2 rounded border text-sm break-words" style={{ borderColor: 'var(--border)' }} />
             <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Assign to (name, optional)"
                className="px-3 py-2 rounded border text-sm break-words" style={{ borderColor: 'var(--border)' }} />
              <div className="flex gap-2">
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded border text-sm" style={{ borderColor: 'var(--border)' }} />
                <select value={priority} onChange={e => setPriority(e.target.value as any)}
                  className="px-3 py-2 rounded border text-sm" style={{ borderColor: 'var(--border)' }}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} className="text-xs px-3 py-1.5 rounded font-bold text-white" style={{ background: 'var(--navy)' }}>Assign Task</button>
                <button onClick={() => setShowNew(false)} className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: 'var(--border)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNew(true)} className="text-xs px-3 py-1.5 rounded font-bold text-white" style={{ background: 'var(--navy)' }}>
              Assign Task
            </button>
          )}
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tasks assigned yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task: any) => {
            const colors = STATUS_COLORS[task.status]
            return (
              <div key={task.id} className="rounded-lg border p-3 min-w-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                   <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-muted)' }}>
                      Assigned to {task.assigned_to || 'unassigned'}
                    </p>
                    <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-muted)' }}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : 'No due date'}, {task.priority} priority
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded flex-shrink-0 self-start" style={{ background: colors.bg, color: colors.color, fontSize: '10px' }}>
                    {task.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {!isOwner && task.status === 'Pending' && (
                    <button onClick={() => advanceStatus(task, 'In Progress')} className="text-xs px-3 py-1 rounded border" style={{ borderColor: 'var(--border)' }}>Start Work</button>
                  )}
                  {!isOwner && (task.status === 'In Progress' || task.status === 'Needs Revision') && submittingTaskId !== task.id && (
                    <button onClick={() => setSubmittingTaskId(task.id)} className="text-xs px-3 py-1 rounded font-bold text-white" style={{ background: 'var(--gold)', color: 'var(--navy)' }}>Upload Submission</button>
                  )}
                  {isOwner && task.status === 'Submitted' && (
                    <>
                      <button onClick={() => reviewTask(task, 'Approved')} className="text-xs px-3 py-1 rounded font-bold text-white" style={{ background: '#2D6A4F' }}>Approve</button>
                      <button onClick={() => reviewTask(task, 'Needs Revision')} className="text-xs px-3 py-1 rounded border" style={{ borderColor: '#9B1C1C', color: '#9B1C1C' }}>Request Revision</button>
                    </>
                  )}
                </div>

                {submittingTaskId === task.id && (
                  <div className="mt-3 p-3 rounded border flex flex-col gap-2" style={{ background: 'var(--warm-white)', borderColor: 'var(--border)' }}>
                    <label className="inline-block text-xs px-3 py-1.5 rounded border cursor-pointer self-start break-words" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {submitFile ? submitFile.name : 'Choose file (optional)'}
                      <input type="file" className="hidden" onChange={e => setSubmitFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <textarea value={submitNote} onChange={e => setSubmitNote(e.target.value)} placeholder="Comment (optional)"
                      rows={2} className="px-3 py-2 rounded border text-sm resize-none break-words" style={{ borderColor: 'var(--border)' }} />
                    <div className="flex gap-2">
                      <button onClick={() => handleSubmitWork(task)} disabled={submitting}
                        className="text-xs px-3 py-1.5 rounded font-bold text-white disabled:opacity-50" style={{ background: 'var(--navy)' }}>
                        {submitting ? 'Submitting...' : 'Submit'}
                      </button>
                      <button onClick={() => { setSubmittingTaskId(null); setSubmitFile(null); setSubmitNote('') }} className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: 'var(--border)' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
function FilesModule({ documents, onDownload, onPreview, onUpload, onDelete, isOwner, isRestricted, onBlocked }: any) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (isRestricted) { onBlocked('Uploading new files is paused until you renew.'); return }
    setUploading(true)
    await onUpload(file)
    setUploading(false)
  }

  return (
    <div>
      <div className="mb-4">
        <label className="inline-block text-xs px-3 py-1.5 rounded font-bold text-white cursor-pointer" style={{ background: 'var(--navy)' }}>
          {uploading ? 'Uploading...' : 'Upload File'}
          <input type="file" className="hidden" disabled={uploading} onChange={e => handleFile(e.target.files?.[0])} />
        </label>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No shared files yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc: Document) => (
            <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-lg border min-w-0"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-sm font-medium break-words min-w-0" style={{ color: 'var(--text-primary)' }}>{doc.file_name}</p>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <button onClick={() => onPreview(doc)} className="text-xs px-3 py-1 rounded border" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>View</button>
                <button onClick={() => onDownload(doc)} className="text-xs px-3 py-1 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Download</button>
                {isOwner && (
                  <button onClick={() => onDelete(doc)} className="text-xs px-3 py-1 rounded border" style={{ borderColor: '#9B1C1C', color: '#9B1C1C' }}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
function DiscussionModule({ messages, nameById, currentUserId, onSend, isRestricted, onBlocked }: any) {
  const [text, setText] = useState('')

  const handleSend = async () => {
    if (!text.trim()) return
    if (isRestricted) { onBlocked('Team Discussion is paused until you renew.'); return }
    await onSend(text)
    setText('')
  }

  return (
    <div className="flex flex-col" style={{ height: '60vh', maxHeight: '500px' }}>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-3 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet. Say hello.</p>
        ) : messages.map((m: any) => {
          const mine = m.user_id === currentUserId
          return (
            <div key={m.id} className={`max-w-[85%] sm:max-w-[70%] ${mine ? 'self-end' : 'self-start'}`}>
              {!mine && <p className="text-xs mb-0.5 break-words" style={{ color: 'var(--text-muted)' }}>{nameById[m.user_id] || 'Team member'}</p>}
              <div className="px-3 py-2 rounded-lg break-words text-sm"
                style={{ background: mine ? 'var(--navy)' : 'var(--surface)', color: mine ? '#fff' : 'var(--text-primary)', border: mine ? 'none' : '1px solid var(--border)' }}>
                {m.body}
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', textAlign: mine ? 'right' : 'left' }}>
                {new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded border text-sm min-w-0" style={{ borderColor: 'var(--border)' }} />
        <button onClick={handleSend} className="text-xs px-4 py-2 rounded font-bold text-white flex-shrink-0" style={{ background: 'var(--navy)' }}>Send</button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
function SubmissionsModule({ tasks, documents, nameById }: any) {
  const submitted = tasks.filter((t: any) => t.submitted_at)
  if (submitted.length === 0) return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No work submitted yet.</p>
  return (
    <div className="flex flex-col gap-2">
      {submitted.map((task: any) => {
        const doc = documents.find((d: Document) => d.id === task.submission_document_id)
        const colors = STATUS_COLORS[task.status]
        return (
          <div key={task.id} className="px-4 py-3 rounded-lg border min-w-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{doc?.file_name || task.title}</p>
                <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-muted)' }}>
                  Submitted by {nameById[task.created_by] || 'team member'}, {new Date(task.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
                {task.submission_note && <p className="text-xs mt-1 break-words" style={{ color: 'var(--text-secondary)' }}>{task.submission_note}</p>}
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded flex-shrink-0 self-start" style={{ background: colors.bg, color: colors.color, fontSize: '10px' }}>
                Status: {task.status}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
