import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Public — someone needs to see what they're joining before they sign in.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: session } = await supabase
    .from('work_sessions')
    .select('id, status, case_id')
    .eq('token', token)
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  if (session.status === 'ended') return NextResponse.json({ error: 'This session has ended' }, { status: 410 })

  const { data: caseRow } = await supabase.from('cases').select('title, user_id').eq('id', session.case_id).single()
  const { data: owner } = await supabase.from('users').select('firm_name, full_name').eq('id', caseRow?.user_id).single()

  return NextResponse.json({
    caseTitle: caseRow?.title,
    firmName: owner?.firm_name || owner?.full_name || 'this firm',
  })
}
