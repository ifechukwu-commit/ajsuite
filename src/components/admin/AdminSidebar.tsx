'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/notifications', label: 'Send Notification' },
]

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const pathname = usePathname()

  return (
    <>
      {!collapsed && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-10" onClick={() => setCollapsed(true)} />
      )}

      <div className={`w-64 md:w-52 flex flex-col flex-shrink-0 h-full
        fixed md:relative z-20 md:z-auto
        transition-transform duration-300 ease-out
        ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
        style={{ background: 'var(--navy)', borderRight: '1px solid var(--navy-muted)' }}>

        <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--navy-muted)' }}>
          <div>
            <h1 className="font-baskerville text-white text-sm">AJ Suite</h1>
            <p className="text-xs mt-0.5 uppercase tracking-widest" style={{ color: 'var(--gold)', fontSize: '9px' }}>Admin Panel</p>
          </div>
          <button className="md:hidden p-1" onClick={() => setCollapsed(true)} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={() => setCollapsed(true)}
                className="px-3 py-2 rounded-md text-xs transition-all"
                style={{
                  background: active ? 'var(--gold)' : 'transparent',
                  color: active ? 'var(--navy)' : 'rgba(255,255,255,0.65)',
                  fontWeight: active ? 600 : 400,
                }}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--navy-muted)' }}>
          <Link href="/dashboard" className="text-xs transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            ← Back to App
          </Link>
          <p className="text-center mt-3" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
            Assumpta · Joseph
          </p>
        </div>
      </div>

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