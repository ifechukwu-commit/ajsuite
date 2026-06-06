'use client'
import { useState } from 'react'
import type { User, Plan } from '@/types'

interface Props {
  user: User
  onClose: () => void
  onUpdate: (userId: string, plan: Plan) => Promise<void>
}

const PLANS: { value: Plan; label: string }[] = [
  { value: 'trial', label: 'Trial' },
  { value: 'solo', label: 'Solo Counsel' },
  { value: 'chamber', label: 'Chamber Pro' },
  { value: 'admin', label: 'Admin' },
]

export default function UserActionModal({ user, onClose, onUpdate }: Props) {
  const [plan, setPlan] = useState<Plan>(user.plan)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(user.id, plan)
    setSaving(false)
    setDone(true)
    setTimeout(onClose, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-xl shadow-2xl p-7" style={{ background: '#fff' }}>
        <h2 className="font-baskerville text-lg mb-1" style={{ color: 'var(--navy)' }}>Manage User</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
          {user.full_name || user.email}
        </p>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-secondary)' }}>Assign Plan</label>
          <div className="flex flex-col gap-2">
            {PLANS.map(p => (
              <label key={p.value}
                className="flex items-center gap-3 px-4 py-3 rounded border cursor-pointer text-sm transition-colors"
                style={{
                  borderColor: plan === p.value ? 'var(--navy)' : 'var(--border)',
                  background: plan === p.value ? 'rgba(27,43,75,0.03)' : 'transparent',
                }}>
                <input type="radio" name="plan" checked={plan === p.value} onChange={() => setPlan(p.value)} />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded text-xs font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || done}
            className="px-4 py-2 rounded text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: done ? '#2D6A4F' : 'var(--navy)' }}>
            {done ? 'Saved' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
