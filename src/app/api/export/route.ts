import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { caseId, format, fileName, reviewedBy } = await request.json()

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: caseData } = await supabase.from('cases').select('*').eq('id', caseId).single()
    const { data: docs } = await supabase.from('documents').select('*').eq('case_id', caseId).eq('summary_status', 'done')

    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const divider = '\n'

    let content = `LEGAL MATTER EXPORT\n\n`
    content += `Matter: ${caseData?.title ?? ''}\n`
    content += `Client: ${caseData?.client_name ?? ''}\n`
    content += `Matter Type: ${caseData?.matter_type ?? ''}\n`
    content += `Status: ${caseData?.status ?? ''}\n`
    content += `Reference: ${caseData?.id.slice(0, 8).toUpperCase() ?? ''}\n`
    content += `Date Exported: ${date}\n`
    content += `Reviewed By: ${reviewedBy}\n\n`
    content += `${divider}\n\n`

    if (caseData?.notes) {
      content += `CASE NOTES\n\n${caseData.notes}\n\n${divider}\n\n`
    }

    if (docs && docs.length > 0) {
      docs.forEach(doc => {
        content += `DOCUMENT REVIEW: ${doc.file_name}\n\n${doc.summary}\n\n${divider}\n\n`
      })
    }

    content += `REVIEWED BY: ${reviewedBy}\n\n`
    content += `CONFIDENTIALITY NOTICE: This export contains AI-generated analysis and does not constitute legal advice. All findings must be independently verified by a licensed legal professional before reliance in any legal matter.`

    const safeName = fileName.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_') || 'export'

    if (format === 'txt') {
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeName}.txt"`,
        }
      })
    }

    if (format === 'pdf') {
      // Return content for client-side jsPDF generation
      return NextResponse.json({ content, fileName: safeName, format: 'pdf' })
    }

    if (format === 'docx') {
      // Return content for client-side docx generation
      return NextResponse.json({ content, fileName: safeName, format: 'docx' })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (err: any) {
    console.error('Export error:', err)
    return NextResponse.json({ error: err.message ?? 'Export failed' }, { status: 500 })
  }
}
