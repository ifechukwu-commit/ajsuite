'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Case } from '@/types'
import StatusBadge from '@/components/cases/StatusBadge'
import SupportButton from '@/components/ui/SupportButton'
import { useUser } from '@/hooks/useUser'

const ADMIN_EMAILS = [
  'ajcasemanager46@gmail.com',
  'ifechukwudarlington.dev@gmail.com',
  'ahia4.agent@gmail.com',
]

interface Props {
  cases: Case[]
  onNewCase: () => void
  activeCaseId?: string
}

export default function Sidebar({ cases, onNewCase, activeCaseId }: Props) {
  const [collapsed, setCollapsed] = useState(true)
  const [adminOpen, setAdminOpen] = useState(false)
  const { signOut, user } = useUser()
  const pathname = usePathname()
  const activeCases = cases.filter(c => c.status !== 'Closed').slice(0, 8)
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email)

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-10 transition-opacity duration-300"
          onClick={() => setCollapsed(true)} />
      )}

      <div className={`flex flex-col flex-shrink-0 scrollbar-thin overflow-y-auto
        w-64 md:w-60
        fixed md:relative z-20 md:z-auto h-full md:h-auto
        transition-transform duration-300 ease-out
        ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
        style={{ background: 'var(--navy)', borderRight: '1px solid var(--navy-muted)' }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--navy-muted)' }}>
          <div>
            <h1 className="font-baskerville text-white text-sm tracking-wide">AJ Suite</h1>
            <p className="text-xs mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Legal Practice Suite</p>
          </div>
          <button className="md:hidden p-1" onClick={() => setCollapsed(true)} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <div className="px-3 py-4">
          <p className="text-xs font-bold tracking-widest uppercase px-2 mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Navigation</p>
          {[
            { href: '/dashboard', label: 'Dashboard', icon: 'M8 1L1 7v8h5v-5h4v5h5V7L8 1z' },
            { href: '/history', label: 'History', icon: null },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs mb-1 transition-all"
              style={{
                color: pathname === href ? 'var(--navy)' : 'rgba(255,255,255,0.65)',
                background: pathname === href ? 'var(--gold)' : 'transparent',
                fontWeight: pathname === href ? 600 : 400,
              }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                {icon ? <path d={icon} /> : (
                  <>
                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </>
                )}
              </svg>
              {label}
            </Link>
          ))}

          {/* Admin dropdown — only visible to admin emails */}
          {isAdmin && (
            <div className="mt-1">
              <button onClick={() => setAdminOpen(!adminOpen)}
                className="flex items-center justify-between w-full gap-2.5 px-3 py-2 rounded-md text-xs mb-1 transition-all"
                style={{ color: 'rgba(255,255,255,0.65)', background: 'transparent' }}>
                <span className="flex items-center gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1l6 3v4c0 4-3 6-6 7-3-1-6-3-6-7V4l6-3z" />
                  </svg>
                  Admin
                </span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"
                  style={{ transform: adminOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <path d="M2 3.5L5 6.5L8 3.5" />
                </svg>
              </button>
              {adminOpen && (
                <div className="ml-4 border-l pl-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Link href="/admin"
                    className="block px-3 py-2 rounded-md text-xs mb-1 transition-all"
                    style={{ color: pathname === '/admin' ? 'var(--gold)' : 'rgba(255,255,255,0.55)' }}>
                    Overview
                  </Link>
                  <Link href="/admin/users"
                    className="block px-3 py-2 rounded-md text-xs mb-1 transition-all"
                    style={{ color: pathname === '/admin/users' ? 'var(--gold)' : 'rgba(255,255,255,0.55)' }}>
                    Users
                  </Link>
                  <Link href="/admin/notifications"
                    className="block px-3 py-2 rounded-md text-xs mb-1 transition-all"
                    style={{ color: pathname === '/admin/notifications' ? 'var(--gold)' : 'rgba(255,255,255,0.55)' }}>
                    Send Notification
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Matters */}
        <div className="px-3 pb-4 flex-1">
          <p className="text-xs font-bold tracking-widest uppercase px-2 mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Active Matters</p>
          {activeCases.map(c => (
            <Link key={c.id} href={`/cases/${c.id}`}
              className="block px-3 py-2.5 rounded-md mb-1 cursor-pointer transition-all"
              style={{
                background: activeCaseId === c.id ? 'rgba(201,168,76,0.1)' : 'transparent',
                border: activeCaseId === c.id ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
              }}>
              <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{c.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.matter_type}</p>
              <div className="mt-1.5"><StatusBadge status={c.status} size="sm" /></div>
            </Link>
          ))}
        </div>

        {/* New Matter Button */}
        <div className="px-3 pb-3">
          <button onClick={onNewCase}
            className="w-full py-2 rounded-md text-xs font-bold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
            + New Matter
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--navy-muted)' }}>
          <SupportButton />
          <button
            onClick={signOut}
            className="text-xs mb-2 w-full text-left py-1.5 transition-colors rounded"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
          <p className="text-center" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
            Assumpta · Joseph
          </p>
        </div>
      </div>

      {/* Mobile toggle */}
      {collapsed && (
        <button className="md:hidden fixed top-4 left-4 z-30 p-2.5 rounded-md shadow-lg"
          style={{ background: 'var(--navy)', color: '#fff' }}
          onClick={() => setCollapsed(false)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect y="2" width="16" height="2" rx="1" />
            <rect y="7" width="16" height="2" rx="1" />
            <rect y="12" width="16" height="2" rx="1" />
          </svg>
        </button>
      )}
    </>
  )
}

