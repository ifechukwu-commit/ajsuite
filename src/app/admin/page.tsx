'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { User } from '@/types'

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(data => {
      setUsers(data ?? [])
      setLoading(false)
    })
  }, [])

  const trialDaysLeft = (u: User) => {
    const diff = Math.ceil((new Date(u.trial_start).getTime() + 14 * 86400000 - Date.now()) / 86400000)
    return Math.max(0, diff)
  }

  const stats = {
    total: users.length,
    trial: users.filter(u => u.plan === 'trial' && trialDaysLeft(u) > 0).length,
    solo: users.filter(u => u.plan === 'solo').length,
    chamber: users.filter(u => u.plan === 'chamber').length,
    expired: users.filter(u => u.plan === 'trial' && trialDaysLeft(u) === 0).length,
    admin: users.filter(u => u.plan === 'admin').length,
  }

  const cards = [
    { label: 'Total Users', value: stats.total, color: 'var(--navy)' },
    { label: 'On Trial', value: stats.trial, color: '#7B5E00' },
    { label: 'Solo Counsel', value: stats.solo, color: '#2D6A4F' },
    { label: 'Chamber Pro', value: stats.chamber, color: 'var(--gold)' },
    { label: 'Trial Expired', value: stats.expired, color: '#DC2626' },
    { label: 'Admin', value: stats.admin, color: 'var(--navy)' },
  ]

  const PLAN_STYLES: Record<string, { bg: string; color: string }> = {
    trial:   { bg: '#FFF3CD', color: '#7B5E00' },
    solo:    { bg: '#D8F3DC', color: '#2D6A4F' },
    chamber: { bg: 'rgba(201,168,76,0.15)', color: '#7B5E00' },
    admin:   { bg: 'var(--navy)', color: '#fff' },
  }

  return (
    <div className="p-8">
      <h1 className="font-baskerville text-xl mb-1" style={{ color: 'var(--navy)' }}>Admin Overview</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {cards.map((c, i) => (
              <div key={i} className="rounded-lg border p-5" style={{ background: '#fff', borderColor: 'var(--border)' }}>
                <p className="font-baskerville text-3xl font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mb-6">
            <Link href="/admin/users"
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ background: 'var(--navy)' }}>
              Manage Users
            </Link>
            <Link href="/admin/notifications"
              className="px-5 py-2.5 rounded-lg text-sm font-bold border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              Send Notification
            </Link>
          </div>

          <div className="rounded-lg border overflow-hidden" style={{ background: '#fff', borderColor: 'var(--border)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-baskerville text-sm" style={{ color: 'var(--navy)' }}>Recent Signups</h3>
            </div>
            {users.slice(0, 8).map(u => {
              const s = PLAN_STYLES[u.plan] ?? PLAN_STYLES.trial
              return (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3 border-b"
                  style={{ borderColor: 'var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.full_name || u.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded flex-shrink-0"
                    style={{ background: s.bg, color: s.color, fontSize: '9px' }}>{u.plan}</span>
                  <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
