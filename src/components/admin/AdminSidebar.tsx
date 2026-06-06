'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/notifications', label: 'Send Notification' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-52 flex flex-col flex-shrink-0 h-full"
      style={{ background: 'var(--navy)', borderRight: '1px solid var(--navy-muted)' }}>
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--navy-muted)' }}>
        <h1 className="font-baskerville text-white text-sm">AJ Suite</h1>
        <p className="text-xs mt-0.5 uppercase tracking-widest" style={{ color: 'var(--gold)', fontSize: '9px' }}>Admin Panel</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
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
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
          ← Back to App
        </Link>
        <p className="text-center mt-3" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
          Assumpta · Joseph
        </p>
      </div>
    </div>
  )
}
