import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: session } = await service
    .from('work_sessions')
    .select('id, case_id, status')
    .eq('token', token)
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  if (session.status === 'ended') return NextResponse.json({ error: 'This session has ended' }, { status: 410 })

  // Already a member (re-clicking the same link) — just confirm, don't duplicate.
  const { data: existingMember } = await service
    .from('session_members')
    .select('id, revoked_at')
    .eq('session_id', session.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    if (existingMember.revoked_at) {
      return NextResponse.json({ error: 'Your access to this session was revoked' }, { status: 403 })
    }
    return NextResponse.json({ caseId: session.case_id })
  }

  const { error } = await service.from('session_members').insert({
    session_id: session.id,
    user_id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name ?? null,
    joined_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ caseId: session.case_id })
}
