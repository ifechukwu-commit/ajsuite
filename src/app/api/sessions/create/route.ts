import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { caseId } = await request.json()
  if (!caseId) return NextResponse.json({ error: 'Missing caseId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Confirm this person actually belongs to the firm that owns this case
  // before handing out a link to it.
  const { data: caseRow, error: caseErr } = await service.from('cases').select('user_id').eq('id', caseId).single()
  const { data: me, error: meErr } = await service.from('users').select('id, owner_id').eq('id', user.id).single()
  const myWorkspaceId = me?.owner_id ?? me?.id

  if (!caseRow || !me || caseRow.user_id !== myWorkspaceId) {
    return NextResponse.json({
      error: 'Forbidden',
      debug: {
        caseFound: !!caseRow, caseError: caseErr?.message,
        meFound: !!me, meError: meErr?.message,
        caseOwnerId: caseRow?.user_id, myWorkspaceId,
      },
    }, { status: 403 })
  }

  // Re-use an existing active session for this matter rather than
  // spawning duplicates every time someone clicks the button.
  const { data: existing } = await service
    .from('work_sessions')
    .select('*')
    .eq('case_id', caseId)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) return NextResponse.json(existing)

  const { data: created, error } = await service
    .from('work_sessions')
    .insert({ case_id: caseId, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(created)
}
