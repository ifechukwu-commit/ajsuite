'use client'
import { useRef } from 'react'
import type { Document } from '@/types'
import EmptyState from '@/components/ui/EmptyState'

interface Props {
  documents: Document[]
  uploading: boolean
  error: string | null
  onUpload: (file: File) => Promise<any>
  onDelete: (doc: Document) => Promise<any>
  onPreview: (doc: Document) => Promise<void>
  onDownload: (doc: Document) => Promise<void>
}

const TYPE_COLORS: Record<string, string> = {
  pdf: '#1B2B4B', doc: '#1a56a0', docx: '#1a56a0', txt: '#5a5a5a'
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsTab({ documents, uploading, error, onUpload, onDelete, onPreview, onDownload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  return (
    <div className="p-6 overflow-y-auto scrollbar-thin">
      {error && (
        <div className="mb-4 px-4 py-3 rounded text-sm" style={{ background: '#FEE2E2', color: '#9B1C1C' }}>{error}</div>
      )}

      <div className="rounded-lg border-2 border-dashed p-8 text-center mb-6 cursor-pointer transition-colors"
        style={{ borderColor: 'var(--border)', background: 'var(--warm-white)' }}
        onDrop={handleDrop} onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
        {uploading ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Uploading...</p>
        ) : (
          <>
            <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <path d="M16 22V10M10 16l6-6 6 6" /><rect x="4" y="4" width="24" height="24" rx="4" />
            </svg>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Drop files here or click to upload</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF, DOC, DOCX, or TXT · Maximum 10MB per file</p>
          </>
        )}
      </div>

      {documents.length === 0 ? (
        <EmptyState title="No documents uploaded" description="Upload a motion, affidavit, or evidence file to attach it to this matter." />
      ) : (
        <>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b"
            style={{ color: 'var(--navy)', borderColor: 'var(--border)' }}>Uploaded Documents</h3>
          <div className="flex flex-col gap-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-lg border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: TYPE_COLORS[doc.file_type] ?? '#1B2B4B', fontSize: '10px', fontWeight: 700 }}>
                    {doc.file_type.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{doc.file_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(doc.created_at).toLocaleDateString('en-GB')} · {formatSize(doc.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <DocBtn onClick={() => onPreview(doc)} gold>Preview</DocBtn>
                  <DocBtn onClick={() => onDownload(doc)}>Download</DocBtn>
                  <DocBtn onClick={() => onDelete(doc)}>Delete</DocBtn>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function DocBtn({ onClick, children, gold }: { onClick: () => void; children: React.ReactNode; gold?: boolean }) {
  return (
    <button onClick={onClick} className="text-xs px-3 py-1.5 rounded border transition-colors"
      style={gold
        ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'rgba(201,168,76,0.05)' }
        : { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
      {children}
    </button>
  )
}
