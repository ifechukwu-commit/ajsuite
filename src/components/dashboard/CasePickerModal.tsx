'use client'
import { useRouter } from 'next/navigation'
import type { Case } from '@/types'

interface Props {
  cases: Case[]
  destination: 'documents' | 'tasks'
  onClose: () => void
}

export default function CasePickerModal({ cases, destination, onClose }: Props) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-xl shadow-2xl p-6 max-h-[70vh] flex flex-col" style={{ background: 'var(--surface)' }}>
        <h2 className="font-baskerville text-lg mb-1" style={{ color: 'var(--navy)' }}>
          {destination === 'documents' ? 'Upload to which case?' : 'Add task to which case?'}
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Pick a matter to continue.</p>

        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2">
          {cases.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No cases yet — open a case first.</p>
          ) : (
            cases.map(c => (
              <button key={c.id}
                onClick={() => router.push(`/cases/${c.id}?tab=${destination}`)}
                className="text-left px-4 py-3 rounded-lg border transition-colors hover-navy"
                style={{ borderColor: 'var(--border)', background: 'var(--warm-white)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.client_name}</p>
              </button>
            ))
          )}
        </div>

        <button onClick={onClose}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
