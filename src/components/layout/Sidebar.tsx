'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Case } from '@/types'
import StatusBadge from '@/components/cases/StatusBadge'
import SupportButton from '@/components/ui/SupportButton'

interface Props {
  cases: Case[]
  onNewCase: () => void
  activeCaseId?: string
}

export default function Sidebar({ cases, onNewCase, activeCaseId }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const activeCases = cases.filter(c => c.status !== 'Closed').slice(0, 8)

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-10" onClick={() => setCollapsed(true)} />
      )}

      <div className={`flex flex-col flex-shrink-0 transition-all duration-200 scrollbar-thin overflow-y-auto
        ${collapsed ? 'w-0 overflow-hidden' : 'w-60'}
        fixed md:relative z-20 md:z-auto h-full md:h-auto`}
        style={{ background: 'var(--navy)', borderRight: '1px solid var(--navy-muted)' }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--navy-muted)' }}>
          <h1 className="font-baskerville text-white text-sm tracking-wide">AJ Suite</h1>
          <p className="text-xs mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Legal Practice Suite</p>
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
          <p className="text-center" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
            Assumpta · Joseph
          </p>
        </div>
      </div>

      {/* Mobile toggle */}
      <button className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-md"
        style={{ background: 'var(--navy)', color: '#fff' }}
        onClick={() => setCollapsed(!collapsed)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect y="2" width="16" height="2" rx="1" />
          <rect y="7" width="16" height="2" rx="1" />
          <rect y="12" width="16" height="2" rx="1" />
        </svg>
      </button>
    </>
  )
}
