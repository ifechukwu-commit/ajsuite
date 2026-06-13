'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { useDocuments } from '@/hooks/useDocuments'
import { useChat } from '@/hooks/useChat'
import Sidebar from '@/components/layout/Sidebar'
import TrialBanner from '@/components/layout/TrialBanner'
import DeadlinesBanner from '@/components/layout/DeadlinesBanner'
import MatterHeader from '@/components/cases/MatterHeader'
import OverviewTab from '@/components/tabs/OverviewTab'
import DocumentsTab from '@/components/tabs/DocumentsTab'
import ChatTab from '@/components/tabs/ChatTab'
import TimelineTab from '@/components/tabs/TimelineTab'
import NotesTab from '@/components/tabs/NotesTab'
import RightPanel from '@/components/ui/RightPanel'
import EditCaseModal from '@/components/cases/EditCaseModal'
import ConfirmDeleteModal from '@/components/cases/ConfirmDeleteModal'
import ExportModal from '@/components/export/ExportModal'
import NotificationsPanel from '@/components/notifications/NotificationsPanel'
import type { Case, TimelineEvent, Deadline, Document } from '@/types'

type Tab = 'overview' | 'documents' | 'chat' | 'timeline' | 'notes'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'documents', label: 'Documents' },
  { key: 'chat', label: 'AI Chat' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'notes', label: 'Notes' },
]

export default function CasePage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string
  const supabase = createClient()

  const { user, loading: userLoading, showTrialBanner, trialDaysLeft, reviewedBy, isActive } = useUser()
  const { cases, updateCase, deleteCase } = useCases()
  const { documents, loading: docsLoading, uploading, error: docError, fetchDocuments, uploadDocument, deleteDocument, requestSummary } = useDocuments(caseId)
  const { messages, loading: chatLoading, sending, error: chatError, fetchMessages, sendMessage } = useChat(caseId)

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [notifications, setNotifications] = useState(0)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!userLoading && !user) router.push('/')
    if (!userLoading && user && !isActive()) router.push('/expired')
  }, [user, userLoading])

  useEffect(() => {
    const found = cases.find(c => c.id === caseId)
    if (found) setCaseData(found)
  }, [cases, caseId])

  useEffect(() => {
    const loadExtras = async () => {
      const [{ data: tl }, { data: dl }, { data: notif }] = await Promise.all([
        supabase.from('timeline_events').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
        supabase.from('deadlines').select('*').eq('case_id', caseId),
        supabase.from('notifications').select('id').eq('is_read', false).eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? ''),
      ])
      setTimeline(tl ?? [])
      setDeadlines(dl ?? [])
      setNotifications((notif ?? []).length)
    }
    if (caseId) { loadExtras(); fetchDocuments(); fetchMessages() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  const handleDelete = async () => {
    if (!caseData) return
    setDeleting(true)
    const ok = await deleteCase(caseData.id)
    setDeleting(false)
    if (ok) router.push('/dashboard')
  }

  const allDeadlines = cases
    .filter(c => c.deadline)
    .map(c => ({ id: c.id, case_id: c.id, user_id: c.user_id, label: c.title, due_date: c.deadline!, is_critical: c.status === 'Urgent', created_at: c.created_at }))

  if (!caseData) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading matter...</p>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      {showTrialBanner() && <TrialBanner daysLeft={trialDaysLeft()} />}
      <DeadlinesBanner deadlines={allDeadlines} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar cases={cases} onNewCase={() => {}} activeCaseId={caseId} />

        <main className="flex-1 flex flex-col overflow-hidden">
          <MatterHeader
            caseData={caseData}
            unreadNotifications={notifications}
            onEdit={() => setShowEdit(true)}
            onDelete={() => setShowDelete(true)}
            onExport={() => setShowExport(true)}
            onUpload={() => setActiveTab('documents')}
            onNotifications={() => setShowNotifications(true)}
          />

          {/* Tabs */}
          <div className="flex border-b px-6 flex-shrink-0" style={{ background: '#fff', borderColor: 'var(--border)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className="px-4 py-3 text-xs font-medium border-b-2 transition-colors"
                style={{
                  color: activeTab === t.key ? 'var(--navy)' : 'var(--text-secondary)',
                  borderBottomColor: activeTab === t.key ? 'var(--gold)' : 'transparent',
                  fontWeight: activeTab === t.key ? 600 : 400,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              {activeTab === 'overview' && <OverviewTab caseData={caseData} documents={documents} />}
              {activeTab === 'documents' && (
                <DocumentsTab
                  documents={documents} uploading={uploading} error={docError}
                  onUpload={uploadDocument} onDelete={deleteDocument}
                  onSummarise={requestSummary} onViewSummary={setSelectedDoc}
                />
              )}
              {activeTab === 'chat' && (
                <ChatTab
                  messages={messages} sending={sending} error={chatError}
                  onSend={sendMessage} reviewedBy={reviewedBy()}
                />
              )}
              {activeTab === 'timeline' && <TimelineTab events={timeline} />}
              {activeTab === 'notes' && <NotesTab caseId={caseId} initialNotes={caseData.notes ?? ''} />}
            </div>
            <RightPanel caseData={caseData} deadlines={deadlines} onExport={() => setShowExport(true)} onDelete={() => setShowDelete(true)} />
          </div>
        </main>
      </div>

      {showEdit && (
        <EditCaseModal caseData={caseData} onClose={() => setShowEdit(false)}
          onSubmit={async (input) => { await updateCase(input); setShowEdit(false) }} />
      )}
      {showDelete && (
        <ConfirmDeleteModal caseTitle={caseData.title} loading={deleting}
          onClose={() => setShowDelete(false)} onConfirm={handleDelete} />
      )}
      {showExport && (
        <ExportModal caseTitle={caseData.title} defaultReviewedBy={reviewedBy()} caseId={caseId} onClose={() => setShowExport(false)} />
      )}
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}

      {/* Summary viewer */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelectedDoc(null)}>
          <div className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col" style={{ background: '#fff', maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-baskerville text-sm" style={{ color: 'var(--navy)' }}>{selectedDoc.file_name}</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-xs" style={{ color: 'var(--text-muted)' }}>Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-primary)' }}>
                {selectedDoc.summary}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
