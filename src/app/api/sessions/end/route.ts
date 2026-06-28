import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { sessionId } = await request.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: session } = await service.from('work_sessions').select('case_id').eq('id', sessionId).single()
  const { data: caseRow } = await service.from('cases').select('user_id').eq('id', session?.case_id).single()
  const { data: me } = await service.from('users').select('id, owner_id').eq('id', user.id).single()
  const myWorkspaceId = me?.owner_id ?? me?.id

  if (!caseRow || caseRow.user_id !== myWorkspaceId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date().toISOString()

  await service.from('work_sessions').update({ status: 'ended', ended_at: now }).eq('id', sessionId)
  // Every member's data (messages, tasks, documents) stays exactly where
  // it is — only their ability to access it going forward is revoked.
  await service.from('session_members').update({ revoked_at: now }).eq('session_id', sessionId).is('revoked_at', null)

  return NextResponse.json({ success: true })
}
