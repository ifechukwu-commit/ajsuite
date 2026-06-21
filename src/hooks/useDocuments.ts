'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { friendlyError } from '@/lib/errors'
import type { Document } from '@/types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain']

export function useDocuments(caseId: string) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data ?? [])
    } catch (err: any) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [caseId])

  const uploadDocument = async (file: File): Promise<Document | null> => {
    try {
      if (file.size > MAX_FILE_SIZE) throw new Error('This file is too large. Maximum size is 10MB. Please compress or split the document and try again.')
     if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Unsupported file type. Please upload a PDF, Word document (.docx only - older .doc files are not supported), or plain text (.txt) file.')
      setUploading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop()
      const path = `${session.user.id}/${caseId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

      const fileType = ext === 'pdf' ? 'pdf' : ext === 'txt' ? 'txt' : ext === 'doc' ? 'doc' : 'docx'

      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          case_id: caseId,
          user_id: session.user.id,
          file_name: file.name,
          file_type: fileType,
          file_url: publicUrl,
          file_size: file.size,
          summary_status: 'pending',
        })
        .select()
        .single()

      if (dbError) throw dbError

      await supabase.from('timeline_events').insert({
        case_id: caseId,
        user_id: session.user.id,
        event_type: 'document_uploaded',
        description: `Document uploaded: ${file.name}`,
      })

      await fetchDocuments()
      return data
    } catch (err: any) {
      setError(friendlyError(err))
      return null
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (doc: Document): Promise<boolean> => {
    try {
      const path = new URL(doc.file_url).pathname.split('/documents/')[1]
      await supabase.storage.from('documents').remove([path])
      const { error } = await supabase.from('documents').delete().eq('id', doc.id)
      if (error) throw error
      await fetchDocuments()
      return true
    } catch (err: any) {
      setError(friendlyError(err))
      return false
    }
  }

 const requestSummary = async (docId: string): Promise<void> => {
  try {
    const doc = documents.find(d => d.id === docId)
    if (!doc) return

    await supabase.from('documents').update({ summary_status: 'processing' }).eq('id', docId)

    const { data: signedData } = await supabase.storage
  .from('documents')
  .createSignedUrl(new URL(doc.file_url).pathname.split('/documents/')[1], 300)

if (!signedData?.signedUrl) throw new Error('Could not access file')
const fileRes = await fetch(signedData.signedUrl)
    let text = ''

    if (doc.file_type === 'txt') {
      text = await fileRes.text()
    } else if (doc.file_type === 'pdf') {
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
      GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      const buffer = await fileRes.arrayBuffer()
      const pdf = await getDocument({ data: buffer }).promise
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ')
      }
    } else if (doc.file_type === 'docx') {
      try {
        const { default: mammoth } = await import('mammoth')
        const buffer = await fileRes.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer: buffer })
        text = result.value
      } catch {
        throw new Error('This document could not be read. It may be corrupted or saved in an unsupported format. Please re-save as .docx and try again.')
      }
    }

    await fetch('/api/summarise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId, caseId, text }),
    })

    // Store raw text for page-specific chat queries
    if (text) {
      await supabase
        .from('documents')
        .update({ raw_text: text.slice(0, 100000) })
        .eq('id', docId)
    }

    await fetchDocuments()
  } catch (err: any) {
    setError(friendlyError(err))
  }
}

  return { documents, loading, uploading, error, fetchDocuments, uploadDocument, deleteDocument, requestSummary }
}
