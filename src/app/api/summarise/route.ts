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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: caseData } = await supabase
      .from('cases').select('title, id').eq('id', caseId).single()

    await supabase.from('documents').update({ summary_status: 'processing' }).eq('id', documentId)

    const summary = await summariseDocument(
      extractedText.slice(0, 60000),
      caseData?.title ?? 'Unknown Matter'
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
    const isTimeout = err?.message?.includes('timeout') || err?.code === 'ETIMEDOUT'
    const message = isTimeout
      ? 'The AI took too long to respond. Please try again.'
      : err.message ?? 'Summarisation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}