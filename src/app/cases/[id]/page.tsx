'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { useDocuments } from '@/hooks/useDocuments'
import Sidebar from '@/components/layout/Sidebar'
import TrialBanner from '@/components/layout/TrialBanner'
import RestrictedBanner from '@/components/dashboard/RestrictedBanner'
import DeadlinesBanner from '@/components/layout/DeadlinesBanner'
import MatterHeader from '@/components/cases/MatterHeader'
import OverviewTab from '@/components/tabs/OverviewTab'
import DocumentsTab from '@/components/tabs/DocumentsTab'
import TasksTab from '@/components/tabs/TasksTab'
import TimelineTab from '@/components/tabs/TimelineTab'
import NotesTab from '@/components/tabs/NotesTab'
import RightPanel from '@/components/ui/RightPanel'
import EditCaseModal from '@/components/cases/EditCaseModal'
import ConfirmDeleteModal from '@/components/cases/ConfirmDeleteModal'
import ExportModal from '@/components/export/ExportModal'
import NotificationsPanel from '@/components/notifications/NotificationsPanel'
import type { Case, TimelineEvent, Deadline } from '@/types'

type Tab = 'overview' | 'documents' | 'tasks' | 'timeline' | 'notes'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'documents', label: 'Documents' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'notes', label: 'Notes' },
]

export default function CasePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const caseId = params.id as string
  const supabase = createClient()

  const { user, workspaceId, loading: userLoading, showTrialBanner, trialDaysLeft, reviewedBy, isActive, isRestricted, isMemberBlocked } = useUser()
  const { cases, updateCase, deleteCase } = useCases(workspaceId)
  const canUpload = user?.role === 'owner' || isActive()
  const { documents, loading: docsLoading, uploading, error: docError, fetchDocuments, uploadDocument, deleteDocument, previewDocument, downloadDocument } =
    useDocuments(caseId, { workspaceId, capStorage: user?.plan === 'trial' })

  const initialTab = (searchParams.get('tab') as Tab) || 'overview'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [notifications, setNotifications] = useState(0)

  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!userLoading && !user) router.push('/')
    // Members whose firm has lapsed are a safety net here — middleware
    // should already have redirected them before this ever renders.
    if (!userLoading && user && isMemberBlocked()) router.push('/expired')
    // Owners are NEVER redirected here, even when expired — they stay,
    // restricted, with full read access. See RestrictedBanner below.
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
    if (caseId) { loadExtras(); fetchDocuments() }
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
  .map(c => ({
    id: c.id,
    case_id: c.id,
    user_id: c.user_id,
    label: c.title,
    due_date: c.deadline!,
    is_critical: c.status === 'Urgent',
    created_at: c.created_at,
    created_by: c.created_by ?? null
  }))
  if (!caseData) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading matter...</p>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      {showTrialBanner() && <TrialBanner daysLeft={trialDaysLeft()} />}
      {isRestricted() && (
        <div className="px-4 pt-3"><RestrictedBanner onUpgrade={() => router.push('/settings')} /></div>
      )}
      <DeadlinesBanner deadlines={allDeadlines} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar cases={cases} onNewCase={() => {}} activeCaseId={caseId} />

        <main className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
          <div className="pl-16 md:pl-0">
            <MatterHeader
              caseData={caseData}
              unreadNotifications={notifications}
              onEdit={() => setShowEdit(true)}
              onDelete={() => setShowDelete(true)}
              onExport={() => setShowExport(true)}
              onUpload={() => setActiveTab('documents')}
              onNotifications={() => setShowNotifications(true)}
            />
          </div>

          {/* Tabs — horizontally scrollable on mobile */}
          <div className="flex border-b px-4 md:px-6 flex-shrink-0 overflow-x-auto scrollbar-thin"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className="px-3 md:px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
                style={{
                  color: activeTab === t.key ? 'var(--navy)' : 'var(--text-secondary)',
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
            <div className="flex-1 overflow-y-auto min-w-0">
              {activeTab === 'overview' && <OverviewTab caseData={caseData} documents={documents} />}
              {activeTab === 'documents' && (
                <DocumentsTab
                  documents={documents} uploading={uploading} error={docError}
                  onUpload={uploadDocument} onDelete={deleteDocument} onPreview={previewDocument} onDownload={downloadDocument}
                />
              )}
              {activeTab === 'tasks' && <TasksTab caseId={caseId} workspaceId={workspaceId} />}
              {activeTab === 'timeline' && <TimelineTab events={timeline} />}
              {activeTab === 'notes' && <NotesTab caseId={caseId} workspaceId={workspaceId} />}
            </div>

            {/* Right panel — hidden on mobile entirely, visible md and up */}
            <div className="hidden md:block">
              <RightPanel caseData={caseData} deadlines={deadlines} onExport={() => setShowExport(true)} onDelete={() => setShowDelete(true)} />
            </div>
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
    </div>
  )
}
