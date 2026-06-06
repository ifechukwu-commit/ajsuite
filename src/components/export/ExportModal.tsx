'use client'
import { useState } from 'react'

interface Props {
  caseTitle: string
  defaultReviewedBy: string
  caseId: string
  onClose: () => void
}

export default function ExportModal({ caseTitle, defaultReviewedBy, caseId, onClose }: Props) {
  const [format, setFormat] = useState<'pdf' | 'docx' | 'txt'>('pdf')
  const [fileName, setFileName] = useState(caseTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_'))
  const [reviewedBy, setReviewedBy] = useState(defaultReviewedBy)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    if (!reviewedBy.trim()) return setError('Reviewed by name is required before export')
    if (!fileName.trim()) return setError('File name is required')
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, format, fileName, reviewedBy }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Export failed')
      }

      if (format === 'txt') {
        const blob = await res.blob()
        triggerDownload(blob, `${fileName}.txt`, 'text/plain')
      } else if (format === 'pdf') {
        const { content } = await res.json()
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const lines = doc.splitTextToSize(content, 180)
        let y = 20
        lines.forEach((line: string) => {
          if (y > 270) { doc.addPage(); y = 20 }
          doc.text(line, 15, y)
          y += 5
        })
        doc.save(`${fileName}.pdf`)
      } else if (format === 'docx') {
        const { content } = await res.json()
        const { Document, Packer, Paragraph, TextRun } = await import('docx')
        const paragraphs = content.split('\n').map((line: string) =>
          new Paragraph({ children: [new TextRun({ text: line, size: 20 })] })
        )
        const docxDoc = new Document({ sections: [{ children: paragraphs }] })
        const blob = await Packer.toBlob(docxDoc)
        triggerDownload(blob, `${fileName}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      }

      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  const triggerDownload = (blob: Blob, name: string, type: string) => {
    const url = URL.createObjectURL(new Blob([blob], { type }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-xl shadow-2xl p-7" style={{ background: '#fff' }}>
        <h2 className="font-baskerville text-lg mb-1" style={{ color: 'var(--navy)' }}>Export Legal Memorandum</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>Select format and confirm details before export.</p>

        {error && <p className="text-xs mb-4 px-3 py-2 rounded" style={{ background: '#FEE2E2', color: '#9B1C1C' }}>{error}</p>}

        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Reviewed By</label>
          <input value={reviewedBy} onChange={e => setReviewedBy(e.target.value)}
            placeholder="Your name or firm name"
            className="w-full px-3 py-2 rounded border text-sm focus-navy"
            style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }} />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>This will appear on the exported memorandum.</p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>File Name</label>
          <input value={fileName} onChange={e => setFileName(e.target.value)}
            className="w-full px-3 py-2 rounded border text-sm focus-navy"
            style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-inter)' }} />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Export Format</label>
          <div className="flex flex-col gap-2">
            {(['pdf', 'docx', 'txt'] as const).map(f => (
              <label key={f} className="flex items-center gap-3 px-4 py-3 rounded border cursor-pointer text-sm transition-colors"
                style={{
                  borderColor: format === f ? 'var(--navy)' : 'var(--border)',
                  background: format === f ? 'rgba(27,43,75,0.03)' : 'transparent',
                }}>
                <input type="radio" name="format" checked={format === f} onChange={() => setFormat(f)} />
                {f === 'pdf' ? 'Export as PDF' : f === 'docx' ? 'Export as Word Document (.docx)' : 'Export as Plain Text (.txt)'}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded text-xs font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleExport} disabled={loading}
            className="px-4 py-2 rounded text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
            {loading ? 'Exporting...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
