'use client'
import { useEffect, useState } from 'react'

interface LoginLog {
  id: string
  email: string
  logged_in_at: string
}

export default function AdminLoginLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/login-logs').then(r => r.json()).then(data => {
      setLogs(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-baskerville text-xl mb-1 break-words" style={{ color: 'var(--navy)' }}>Login Logs</h1>
      <p className="text-sm mb-8 break-words" style={{ color: 'var(--text-secondary)' }}>The most recent 200 sign-ins, most recent first.</p>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No logins recorded yet.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {logs.map(log => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm break-words" style={{ color: 'var(--text-primary)' }}>{log.email}</p>
              <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {new Date(log.logged_in_at).toLocaleString('en-GB')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
