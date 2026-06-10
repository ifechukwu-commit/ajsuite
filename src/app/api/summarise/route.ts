import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { summariseDocument } from '@/lib/groq/client'

export async function POST(request: Request) {
  let documentId = ''

  try {
    const body = await request.json()
    documentId = body.documentId
    const caseId = body.caseId
    const extractedText = body.text

    if (!documentId || !caseId) {
      return NextResponse.json({ error: 'Missing documentId or caseId' }, { status: 400 })
    }

    if (!extractedText || extractedText.trim().length < 50) {
      const supabase = await createClient()
      await supabase.from('documents').update({ summary_status: 'unreadable' }).eq('id', documentId)
      return NextResponse.json({
        error: 'This document appears to be scanned or image-based. AI cannot process it.'
      }, { status: 422 })
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: caseData } = await supabase
      .from('cases').select('title, id').eq('id', caseId).single()

    await supabase.from('documents').update({ summary_status: 'processing' }).eq('id', documentId)

    const summary = await summariseDocument(
      extractedText.slice(0, 12000),
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
