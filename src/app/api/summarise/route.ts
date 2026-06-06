import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { summariseDocument } from '@/lib/groq/client'
import pdfParse from 'pdf-parse'

export async function POST(request: Request) {
  let documentId = ''
  let caseId = ''

  try {
    const body = await request.json()
    documentId = body.documentId
    caseId = body.caseId

    if (!documentId || !caseId) {
      return NextResponse.json({ error: 'Missing documentId or caseId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: doc, error: docErr } = await supabase
      .from('documents').select('*').eq('id', documentId).single()
    if (docErr || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const { data: caseData } = await supabase
      .from('cases').select('title, id').eq('id', caseId).single()

    await supabase.from('documents').update({ summary_status: 'processing' }).eq('id', documentId)

    const fileRes = await fetch(doc.file_url)
    if (!fileRes.ok) throw new Error('Failed to fetch file from storage')

    let text = ''

    if (doc.file_type === 'pdf') {
      const buffer = Buffer.from(await fileRes.arrayBuffer())
      const parsed = await pdfParse(buffer)
      text = parsed.text ?? ''
    } else {
      text = await fileRes.text()
    }

    if (!text || text.trim().length < 50) {
      await supabase.from('documents').update({ summary_status: 'unreadable' }).eq('id', documentId)
      return NextResponse.json({
        error: 'This document appears to be scanned or image-based. AI cannot process it. Please upload a text-based document.'
      }, { status: 422 })
    }

    const summary = await summariseDocument(
      text.slice(0, 12000), // cap tokens — free tier Groq safety
      caseData?.title ?? 'Unknown Matter',
      caseData?.id.slice(0, 8).toUpperCase() ?? 'REF-000'
    )

    await supabase.from('documents')
      .update({ summary, summary_status: 'done' })
      .eq('id', documentId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Summarise error:', err)
    if (documentId) {
      const supabase = await createClient()
      await supabase.from('documents').update({ summary_status: 'failed' }).eq('id', documentId)
    }
    return NextResponse.json({ error: err.message ?? 'Summarisation failed' }, { status: 500 })
  }
}
