'use client'
import { useState } from 'react'
import type { Case, EditCaseInput, CaseStatus } from '@/types'

interface Props {
  caseData: Case
  onClose: () => void
  onSubmit: (input: EditCaseInput) => Promise<void>
  loading?: boolean
}

export default function EditCaseModal({ caseData, onClose, onSubmit, loading }: Props) {
  const [form, setForm] = useState<EditCaseInput>({
    id: caseData.id,
    title: caseData.title,
    client_name: caseData.client_name,
    client_contact: caseData.client_contact ?? '',
    matter_type: caseData.matter_type,
    status: caseData.status,
    deadline: caseData.deadline ?? '',
    notes: caseData.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof EditCaseInput, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Matter title is required')
    setError(null)
    await onSubmit(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl p-7" style={{ background: '#fff' }}>
        <h2 className="font-baskerville text-lg mb-1" style={{ color: 'var(--navy)' }}>Edit Matter</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>Update the details for this case file.</p>

        {error && <p className="text-xs mb-4 px-3 py-2 rounded" style={{ background: '#FEE2E2', color: '#9B1C1C' }}>{error}</p>}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Matter Title *" value={form.title} onChange={v => set('title', v)} />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value as CaseStatus)}
              className="w-full px-3 py-2 rounded text-sm border outline-none"
              style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }}>
              {(['Active','Urgent','Pending','Closed'] as CaseStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Client Name *" value={form.client_name} onChange={v => set('client_name', v)} />
          <Field label="Client Contact" value={form.client_contact} onChange={v => set('client_contact', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Matter Type *" value={form.matter_type} onChange={v => set('matter_type', v)} />
          <Field label="Deadline" value={form.deadline} onChange={v => set('deadline', v)} type="date" />
        </div>
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={3} className="w-full px-3 py-2 rounded text-sm border outline-none resize-none"
            style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }} />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded text-xs font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-4 py-2 rounded text-xs font-medium text-white hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--navy)' }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded text-sm border outline-none"
        style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }} />
    </div>
  )
}
