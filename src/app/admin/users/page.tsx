'use client'
import { useEffect, useState } from 'react'
import UserTable from '@/components/admin/UserTable'
import UserActionModal from '@/components/admin/UserActionModal'
import type { User, Plan } from '@/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<Plan | 'all'>('all')
  const [selected, setSelected] = useState<User | null>(null)

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    let result = users
    if (search) result = result.filter(u =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    )
    if (planFilter !== 'all') result = result.filter(u => u.plan === planFilter)
    setFiltered(result)
  }, [users, search, planFilter])

  const handleUpdate = async (userId: string, plan: Plan) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan }),
    })
    await fetchUsers()
    setSelected(null)
  }

  return (
    <div className="p-8">
      <h1 className="font-baskerville text-xl mb-1" style={{ color: 'var(--navy)' }}>Users</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{users.length} total accounts</p>

      <div className="flex gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 px-4 py-2 rounded-lg border text-sm focus-navy"
          style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)', background: '#fff' }} />
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value as Plan | 'all')}
          className="px-4 py-2 rounded-lg border text-sm"
          style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)', background: '#fff' }}>
          <option value="all">All Plans</option>
          <option value="trial">Trial</option>
          <option value="solo">Solo Counsel</option>
          <option value="chamber">Chamber Pro</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading users...</p>
      ) : (
        <UserTable users={filtered} onAction={setSelected} />
      )}

      {selected && (
        <UserActionModal user={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
      )}
    </div>
  )
}
