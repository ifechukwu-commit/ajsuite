'use client'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { redirect, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import RestrictedBanner from '@/components/dashboard/RestrictedBanner'
import Link from 'next/link'
import EmptyState from '@/components/ui/EmptyState'

export default function CalendarPage() {
  const router = useRouter()
  const { user, workspaceId, loading: userLoading, isRestricted, isMemberBlocked } = useUser()
  const { cases, loading: casesLoading } = useCases(workspaceId)

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }

  const upcoming = cases
    .filter(c => c.deadline && c.status !== 'Closed')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

  const grouped = upcoming.reduce<Record<string, typeof upcoming>>((acc, c) => {
    const key = new Date(c.deadline!).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    acc[key] = acc[key] ? [...acc[key], c] : [c]
    return acc
  }, {})

  return (
    <div className="flex h-screen">
      <Sidebar cases={cases} onNewCase={() => {}} />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        {isRestricted() && (
          <div className="p-4 pb-0"><RestrictedBanner onUpgrade={() => router.push('/settings')} /></div>
        )}
        <div className="p-6 pl-20 md:pl-6 max-w-2xl">
          <h1 className="font-baskerville text-xl mb-1" style={{ color: 'var(--navy)' }}>Calendar</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Every upcoming hearing and filing deadline, soonest first.</p>

          {casesLoading ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : upcoming.length === 0 ? (
            <EmptyState title="Nothing scheduled" description="Deadlines you set on a matter will show up here automatically." />
          ) : (
            Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{date}</p>
                <div className="flex flex-col gap-2">
                  {items.map(c => (
                    <Link key={c.id} href={`/cases/${c.id}`}
                      className="flex items-center justify-between px-4 py-3 rounded-lg border transition-colors hover-navy"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.matter_type} · {c.client_name}</p>
                      </div>
                      <span className="text-xs font-bold uppercase px-2 py-1 rounded flex-shrink-0"
                        style={{ background: c.status === 'Urgent' ? '#FEE2E2' : '#FFF3CD', color: c.status === 'Urgent' ? '#9B1C1C' : '#7B5E00', fontSize: '9px' }}>
                        {c.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
