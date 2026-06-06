'use client'
import { useState } from 'react'
import type { NewCaseInput, CaseStatus } from '@/types'

interface Props {
  onClose: () => void
  onSubmit: (input: NewCaseInput) => Promise<void>
  loading?: boolean
}

const INITIAL: NewCaseInput = {
  title: '', client_name: '', client_contact: '',
  matter_type: '', status: 'Active', deadline: '', notes: '',
}

export default function NewCaseModal({ onClose, onSubmit, loading }: Props) {
  const [form, setForm] = useState<NewCaseInput>(INITIAL)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof NewCaseInput, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Matter title is required')
    if (!form.client_name.trim()) return setError('Client name is required')
    if (!form.matter_type.trim()) return setError('Matter type is required')
    setError(null)
    await onSubmit(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl p-7" style={{ background: '#fff' }}>
        <h2 className="font-baskerville text-lg mb-1" style={{ color: 'var(--navy)' }}>Open New Matter</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>Enter the details for the new case file.</p>

        {error && <p className="text-xs mb-4 px-3 py-2 rounded" style={{ background: '#FEE2E2', color: '#9B1C1C' }}>{error}</p>}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Matter Title *" value={form.title} onChange={v => set('title', v)} placeholder="e.g. Johnson v. ABC Corp" />
          <Field label="Matter Type *" value={form.matter_type} onChange={v => set('matter_type', v)} placeholder="e.g. Commercial Litigation" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Client Name *" value={form.client_name} onChange={v => set('client_name', v)} placeholder="Full legal name" />
          <Field label="Client Contact" value={form.client_contact} onChange={v => set('client_contact', v)} placeholder="Phone or email" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value as CaseStatus)}
              className="w-full px-3 py-2 rounded text-sm border outline-none" style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }}>
              {(['Active','Urgent','Pending','Closed'] as CaseStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Field label="Deadline" value={form.deadline} onChange={v => set('deadline', v)} type="date" />
        </div>
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Initial instructions or context..."
            rows={3} className="w-full px-3 py-2 rounded text-sm border outline-none resize-none"
            style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }} />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded text-xs font-medium border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-4 py-2 rounded text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--navy)' }}>
            {loading ? 'Opening...' : 'Open Matter'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded text-sm border outline-none transition-colors focus-navy"
        style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }} />
    </div>
  )
}
