import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithCase } from '@/lib/groq/client'

export async function POST(request: Request) {
  try {
    const { caseId, message } = await request.json()
    if (!caseId || !message) return NextResponse.json({ error: 'Missing caseId or message' }, { status: 400 })

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Get all document summaries for context
    const { data: docs } = await supabase
      .from('documents').select('file_name, summary').eq('case_id', caseId).eq('summary_status', 'done')

    const documentContext = docs && docs.length > 0
      ? docs.map(d => `DOCUMENT: ${d.file_name}\n\n${d.summary}`).join('\n\n---\n\n')
      : 'No documents have been reviewed for this case yet.'

    // Get recent chat history
    const { data: history } = await supabase
      .from('chat_messages').select('role, content').eq('case_id', caseId)
      .order('created_at', { ascending: true }).limit(20)

    const messages = (history ?? []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    messages.push({ role: 'user', content: message })

    const reply = await chatWithCase(messages, documentContext)

    await supabase.from('chat_messages').insert({
      case_id: caseId,
      user_id: session.user.id,
      role: 'assistant',
      content: reply,
    })

    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: err.message ?? 'Chat failed' }, { status: 500 })
  }
}
