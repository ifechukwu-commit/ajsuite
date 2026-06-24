'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { friendlyError } from '@/lib/errors'
import { STORAGE_CAP_BYTES_UNPAID } from '@/lib/constants'
import type { Document } from '@/types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain',
]

interface UseDocumentsOptions {
  workspaceId?: string | null
  /** Pass false once the workspace is on a paid/admin plan — lifts the 150MB cap. */
  capStorage?: boolean
}

export function useDocuments(caseId: string, options: UseDocumentsOptions = {}) {
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
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('This file is too large. Maximum size is 10MB. Please compress or split the document and try again.')
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Unsupported file type. Please upload a PDF, Word document (.doc or .docx), or plain text (.txt) file.')
      }

      setUploading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const ownerId = options.workspaceId ?? session.user.id

      // Storage cap check — only applies to unpaid workspaces. New uploads
      // stop at 150MB; nothing already uploaded is ever touched by this.
      if (options.capStorage) {
        const { data: owner } = await supabase
          .from('users')
          .select('storage_used_bytes')
          .eq('id', ownerId)
          .single()
        const used = owner?.storage_used_bytes ?? 0
        if (used + file.size > STORAGE_CAP_BYTES_UNPAID) {
          throw new Error('Storage is full on the free plan (150MB). Subscribe to keep uploading — everything already saved stays readable either way.')
        }
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'txt'
      const path = `${ownerId}/${caseId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file, { cacheControl: 'public, max-age=31536000, immutable' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

      const fileType = ext === 'pdf' ? 'pdf' : ext === 'txt' ? 'txt' : ext === 'doc' ? 'doc' : 'docx'

      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          case_id: caseId,
          user_id: ownerId,
          created_by: session.user.id,
          file_name: file.name,
          file_type: fileType,
          file_url: publicUrl,
          file_size: file.size,
        })
        .select()
        .single()

      if (dbError) throw dbError

      await supabase.from('timeline_events').insert({
        case_id: caseId,
        user_id: ownerId,
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

  /**
   * Preview = open the file in a new tab via a signed URL. PDFs render
   * natively in the browser; .doc/.docx prompt the user's own Word/Docs app.
   * No server-side extraction needed for this — that was only ever required
   * to feed an AI model, which no longer exists in this product.
   */
  const previewDocument = async (doc: Document): Promise<void> => {
    try {
      const path = new URL(doc.file_url).pathname.split('/documents/')[1]
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 300)
      if (error || !data?.signedUrl) throw error ?? new Error('Could not open file')
      window.open(data.signedUrl, '_blank')
    } catch (err: any) {
      setError(friendlyError(err))
    }
  }

  return { documents, loading, uploading, error, fetchDocuments, uploadDocument, deleteDocument, previewDocument }
}
