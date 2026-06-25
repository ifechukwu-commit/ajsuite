'use client'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { useState } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import NewCaseModal from '@/components/cases/NewCaseModal'
import StatusBadge from '@/components/cases/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'

export default function CasesPage() {
  const { user, workspaceId, loading: userLoading, isMemberBlocked } = useUser()
  const { cases, loading: casesLoading, createCase } = useCases(workspaceId)
  const [showNewCase, setShowNewCase] = useState(false)
  const [creating, setCreating] = useState(false)

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }

  return (
    <div className="flex h-screen">
      <Sidebar cases={cases} onNewCase={() => setShowNewCase(true)} />
      <main className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 pl-20 md:pl-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="font-baskerville text-xl break-words" style={{ color: 'var(--navy)' }}>All Cases</h1>
          <button onClick={() => setShowNewCase(true)}
            className="px-4 py-2 rounded text-xs font-bold text-white transition-opacity hover:opacity-80 self-start sm:self-auto"
            style={{ background: 'var(--navy)' }}>
            + New Matter
          </button>
        </div>

        {casesLoading || userLoading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : cases.length === 0 ? (
          <EmptyState title="No matters yet" description="Open your first case file to get started." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cases.map(c => (
              <Link key={c.id} href={`/cases/${c.id}`}
                className="block rounded-lg border p-4 transition-colors min-w-0"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium mb-1 break-words" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                <p className="text-xs mb-2 break-words" style={{ color: 'var(--text-muted)' }}>{c.matter_type} · {c.client_name}</p>
                <StatusBadge status={c.status} size="sm" />
              </Link>
            ))}
          </div>
        )}
      </main>

      {showNewCase && (
        <NewCaseModal
          onClose={() => setShowNewCase(false)}
          loading={creating}
          onSubmit={async (input) => {
            setCreating(true)
            await createCase(input)
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}
