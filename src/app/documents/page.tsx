'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import EmptyState from '@/components/ui/EmptyState'
import type { Document } from '@/types'

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AllDocumentsPage() {
  const { user, workspaceId, loading: userLoading, isMemberBlocked } = useUser()
  const { cases } = useCases(workspaceId)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const caseTitle = (caseId: string) => cases.find(c => c.id === caseId)?.title ?? 'Unknown matter'

  const load = useCallback(async () => {
    if (cases.length === 0) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('*')
      .in('case_id', cases.map(c => c.id))
      .order('created_at', { ascending: false })
    setDocuments(data ?? [])
    setLoading(false)
  }, [cases])

  useEffect(() => { load() }, [load])

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }

  const openSignedUrl = async (doc: Document, download: boolean) => {
    const path = new URL(doc.file_url).pathname.split('/documents/')[1]
    const { data, error } = await supabase.storage.from('documents')
      .createSignedUrl(path, 300, download ? { download: doc.file_name } : undefined)
    if (error || !data?.signedUrl) return
    if (download) {
      const link = window.document.createElement('a')
      link.href = data.signedUrl
      link.download = doc.file_name
      link.click()
    } else {
      window.open(data.signedUrl, '_blank')
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar cases={cases} onNewCase={() => {}} />
      <main className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 pl-20 md:pl-6">
        <h1 className="font-baskerville text-xl mb-6 break-words" style={{ color: 'var(--navy)' }}>All Documents</h1>

        {loading || userLoading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : documents.length === 0 ? (
          <EmptyState title="No documents yet" description="Documents you upload inside a matter will show up here." />
        ) : (
          <div className="flex flex-col gap-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 rounded-lg border min-w-0"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{doc.file_name}</p>
                  <Link href={`/cases/${doc.case_id}`} className="text-xs break-words hover:underline" style={{ color: 'var(--navy)' }}>
                    {caseTitle(doc.case_id)}
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(doc.created_at).toLocaleDateString('en-GB')}, {formatSize(doc.file_size)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <button onClick={() => openSignedUrl(doc, false)} className="text-xs px-3 py-1.5 rounded border"
                    style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Preview</button>
                  <button onClick={() => openSignedUrl(doc, true)} className="text-xs px-3 py-1.5 rounded border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Download</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
