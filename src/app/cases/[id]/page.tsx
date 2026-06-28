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
import TeamCollaborationTab from '@/components/tabs/TeamCollaborationTab'
import TimelineTab from '@/components/tabs/TimelineTab'
import RightPanel from '@/components/ui/RightPanel'
import EditCaseModal from '@/components/cases/EditCaseModal'
import ConfirmDeleteModal from '@/components/cases/ConfirmDeleteModal'
import ExportModal from '@/components/export/ExportModal'
import NotificationsPanel from '@/components/notifications/NotificationsPanel'
import type { Case, TimelineEvent, Deadline } from '@/types'

type Tab = 'overview' | 'documents' | 'collaboration' | 'timeline'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'documents', label: 'Documents' },
  { key: 'collaboration', label: 'Team Collaboration' },
  { key: 'timeline', label: 'Timeline' },
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
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null)
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
    if (found) { setCaseData(found); return }
    // Not in the firm-scoped list — likely a session member with
    // temporary access. RLS allows them to see this one case directly.
    supabase.from('cases').select('*').eq('id', caseId).single().then(({ data }) => {
      if (data) setCaseData(data)
    })
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
      {isRestricted() && <RestrictedBanner onUpgrade={() => router.push('/settings')} />}
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
              {activeTab === 'overview' && <OverviewTab caseData={caseData} documents={documents} workspaceId={workspaceId} isRestricted={isRestricted()} onBlocked={setBlockedMsg} />}
              {activeTab === 'documents' && (
                <DocumentsTab
                  documents={documents} uploading={uploading} error={docError}
                  onUpload={async (file) => isRestricted() ? setBlockedMsg('Uploading new documents is paused until you renew.') : uploadDocument(file)}
                  onDelete={deleteDocument} onPreview={previewDocument} onDownload={downloadDocument}
                />
              )}
              {activeTab === 'collaboration' && (
                <TeamCollaborationTab
                  caseId={caseId} workspaceId={workspaceId} currentUserId={user?.id ?? ''} isOwner={!!caseData && caseData.user_id === workspaceId}
                  documents={documents} onDownloadDocument={downloadDocument} onPreviewDocument={previewDocument}
                  onUploadDocument={async (file: File) => isRestricted() ? setBlockedMsg('Uploading new files is paused until you renew.') : uploadDocument(file)}
                  onDeleteDocument={deleteDocument}
                  isRestricted={isRestricted()} onBlocked={setBlockedMsg}
                />
              )}
              {activeTab === 'timeline' && <TimelineTab events={timeline} />}
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
          onSubmit={async (input) => {
            const ok = await updateCase(input)
            if (ok) { setShowEdit(false) } else { setBlockedMsg('Could not save your changes. Please try again.') }
          }} />
      )}
      {showDelete && (
        <ConfirmDeleteModal caseTitle={caseData.title} loading={deleting}
          onClose={() => setShowDelete(false)} onConfirm={handleDelete} />
      )}
      {showExport && (
        <ExportModal caseTitle={caseData.title} defaultReviewedBy={reviewedBy()} caseId={caseId} onClose={() => setShowExport(false)} />
      )}
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {blockedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-xs rounded-xl shadow-2xl p-5 text-center" style={{ background: '#fff' }}>
            <p className="text-sm font-bold mb-1 break-words" style={{ color: 'var(--navy)' }}>Subscribe to continue</p>
            <p className="text-xs mb-4 break-words" style={{ color: 'var(--text-secondary)' }}>{blockedMsg}</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setBlockedMsg(null); router.push('/settings') }}
                className="px-4 py-2 rounded text-xs font-bold" style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
                Subscribe, ₦8,500 per month
              </button>
              <button onClick={() => setBlockedMsg(null)} className="px-4 py-2 rounded text-xs font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
