import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceAccess } from '@/lib/access/workspace'

export async function POST(request: Request) {
  try {
    const { caseId, format, fileName, reviewedBy } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const access = await getWorkspaceAccess(supabase, user.id)
    if (!access?.canExport) {
      return NextResponse.json({ error: 'Exporting is part of an active subscription. Subscribe to export this matter.' }, { status: 402 })
    }

    const [{ data: caseData }, { data: notes }, { data: tasks }, { data: documents }] = await Promise.all([
      supabase.from('cases').select('*').eq('id', caseId).single(),
      supabase.from('case_notes').select('*').eq('case_id', caseId).order('created_at', { ascending: true }),
      supabase.from('tasks').select('*').eq('case_id', caseId).order('due_date', { ascending: true }),
      supabase.from('documents').select('file_name, created_at').eq('case_id', caseId),
    ])

    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const divider = '\n'

    let content = `LEGAL MATTER EXPORT\n\n`
    content += `Matter: ${caseData?.title ?? ''}\n`
    content += `Case Number: ${caseData?.case_number || 'Not assigned'}\n`
    content += `Client: ${caseData?.client_name ?? ''}\n`
    content += `Opposing Party: ${caseData?.opposing_party || 'Not set'}\n`
    content += `Court: ${caseData?.court || 'Not set'}\n`
    content += `Judge: ${caseData?.judge || 'Not set'}\n`
    content += `Matter Type: ${caseData?.matter_type ?? ''}\n`
    content += `Status: ${caseData?.status ?? ''}\n`
    content += `Date Exported: ${date}\n`
    content += `Reviewed By: ${reviewedBy}\n\n${divider}\n\n`

    if (notes && notes.length > 0) {
      content += `CASE NOTES\n\n`
      notes.forEach(n => {
        content += `${new Date(n.created_at).toLocaleDateString('en-GB')}, ${n.body}\n\n`
      })
      content += `${divider}\n\n`
    }

    if (tasks && tasks.length > 0) {
      content += `TASKS\n\n`
      tasks.forEach(t => {
        content += `[${t.status === 'Approved' ? 'x' : ' '}] ${t.title} (${t.status})${t.due_date ? ` due ${new Date(t.due_date).toLocaleDateString('en-GB')}` : ''}\n`
      })
      content += `\n${divider}\n\n`
    }

    if (documents && documents.length > 0) {
      content += `DOCUMENTS ON FILE\n\n`
      documents.forEach(d => {
        content += `${d.file_name}, uploaded ${new Date(d.created_at).toLocaleDateString('en-GB')}\n`
      })
      content += `\n${divider}\n\n`
    }

    content += `REVIEWED BY: ${reviewedBy}\n\n`
    content += `This export was prepared from AJ Suite case records. It does not constitute legal advice and should be reviewed against the original source documents before use.`

    const safeName = fileName.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_') || 'export'

    if (format === 'txt') {
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeName}.txt"`,
        }
      })
    }

    if (format === 'pdf' || format === 'docx') {
      return NextResponse.json({ content, fileName: safeName, format })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (err: any) {
    console.error('Export error:', err)
    return NextResponse.json({ error: err.message ?? 'Export failed' }, { status: 500 })
  }
}
