'use client'
import { useEffect, useState } from 'react'

interface Health {
  databaseConnected: boolean
  dbLatencyMs?: number
  userCount?: number
  caseCount?: number
  docCount?: number
  checkedAt?: string
  error?: string
}

export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)

  const check = () => {
    setLoading(true)
    fetch('/api/admin/system-health').then(r => r.json()).then(data => {
      setHealth(data)
      setLoading(false)
    })
  }

  useEffect(() => { check() }, [])

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <h1 className="font-baskerville text-xl break-words" style={{ color: 'var(--navy)' }}>System Health</h1>
        <button onClick={check} disabled={loading}
          className="px-3 py-1.5 rounded text-xs font-bold self-start sm:self-auto"
          style={{ background: 'var(--navy)', color: '#fff' }}>
          {loading ? 'Checking...' : 'Re-check now'}
        </button>
      </div>
      <p className="text-sm mb-8 break-words" style={{ color: 'var(--text-secondary)' }}>A quick live check of the database connection and overall size.</p>

      {loading && !health ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Checking...</p>
      ) : health ? (
        <div className="flex flex-col gap-3 max-w-md">
          <div className="rounded-lg border p-4 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Database</p>
            <span className="text-xs font-bold uppercase px-2 py-1 rounded break-words"
              style={{ background: health.databaseConnected ? '#D8F3DC' : '#FEE2E2', color: health.databaseConnected ? '#2D6A4F' : '#9B1C1C', fontSize: '9px' }}>
              {health.databaseConnected ? 'Connected' : 'Unreachable'}
            </span>
          </div>
          {health.databaseConnected ? (
            <>
              <HealthRow label="Response time" value={`${health.dbLatencyMs}ms`} />
              <HealthRow label="Total users" value={String(health.userCount)} />
              <HealthRow label="Total cases" value={String(health.caseCount)} />
              <HealthRow label="Total documents" value={String(health.docCount)} />
            </>
          ) : (
            <p className="text-xs break-words" style={{ color: '#9B1C1C' }}>{health.error}</p>
          )}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last checked: {health.checkedAt ? new Date(health.checkedAt).toLocaleString('en-GB') : '—'}</p>
        </div>
      ) : null}
    </div>
  )
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-sm font-bold break-words" style={{ color: 'var(--navy)' }}>{value}</p>
    </div>
  )
}
