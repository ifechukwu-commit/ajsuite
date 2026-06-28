import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const caseId = searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ error: 'Missing caseId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: session } = await service
    .from('work_sessions')
    .select('*')
    .eq('case_id', caseId)
    .eq('status', 'active')
    .maybeSingle()

  if (!session) return NextResponse.json({ session: null, members: [] })

  const { data: members } = await service
    .from('session_members')
    .select('*')
    .eq('session_id', session.id)
    .order('joined_at', { ascending: true })

  return NextResponse.json({ session, members: members ?? [] })
}
