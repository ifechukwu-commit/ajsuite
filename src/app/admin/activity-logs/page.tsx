'use client'
import { useEffect, useState } from 'react'

interface ActivityLog {
  id: string
  email: string | null
  action: string
  detail: string | null
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  case_created: 'Opened a new matter',
  team_invite_sent: 'Sent a team invite',
  free_access_granted: 'Granted free access',
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/activity-logs').then(r => r.json()).then(data => {
      setLogs(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-baskerville text-xl mb-1 break-words" style={{ color: 'var(--navy)' }}>Activity Logs</h1>
      <p className="text-sm mb-8 break-words" style={{ color: 'var(--text-secondary)' }}>The most recent 200 actions across every workspace, most recent first.</p>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity recorded yet.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {logs.map(log => (
            <div key={log.id} className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <p className="text-sm break-words" style={{ color: 'var(--text-primary)' }}>
                  <span className="font-medium">{log.email ?? 'Unknown'}</span> — {ACTION_LABELS[log.action] ?? log.action}
                </p>
                <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {new Date(log.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              {log.detail && <p className="text-xs mt-1 break-words" style={{ color: 'var(--text-muted)' }}>{log.detail}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
