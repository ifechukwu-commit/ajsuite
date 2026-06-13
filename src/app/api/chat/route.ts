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

    // Get all documents — summaries AND raw text for page-specific queries
    const { data: docs } = await supabase
      .from('documents')
      .select('file_name, summary, raw_text, summary_status')
      .eq('case_id', caseId)

    // Detect page/line reference in message e.g. "page 3", "page 12 line 4"
    const pageMatch = message.match(/page\s+(\d+)/i)
    const requestedPage = pageMatch ? parseInt(pageMatch[1]) : null

    let documentContext = 'No documents have been reviewed for this case yet.'

    if (docs && docs.length > 0) {
      if (requestedPage) {
        // User asked about a specific page — use raw text, extract relevant chunk
        const rawContextParts = docs
          .filter(d => d.raw_text)
          .map(d => {
            const pages = d.raw_text.split(/\f|\[PAGE\s*\d+\]/i)
            const pageContent = pages[requestedPage - 1] ?? pages[pages.length - 1] ?? ''
            return `DOCUMENT: ${d.file_name}\nPAGE ${requestedPage} CONTENT:\n${pageContent.slice(0, 3000)}`
          })
        documentContext = rawContextParts.length > 0
          ? rawContextParts.join('\n\n---\n\n')
          : docs.map(d => `DOCUMENT: ${d.file_name}\n\n${d.summary ?? 'No summary available.'}`).join('\n\n---\n\n')
      } else {
        // Standard query — use summaries
        documentContext = docs
          .filter(d => d.summary_status === 'done')
          .map(d => `DOCUMENT: ${d.file_name}\n\n${d.summary}`)
          .join('\n\n---\n\n') || 'No documents have been reviewed for this case yet.'
      }
    }

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
    const isTimeout = err?.message?.includes('timeout') || err?.code === 'ETIMEDOUT'
    const message = isTimeout
      ? 'The AI took too long to respond. Please try again.'
      : err.message ?? 'Chat failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
