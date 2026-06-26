import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: invite, error } = await service
    .from('team_invites')
    .select('id')
    .eq('email', user.email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (invite) {
    await service
      .from('team_invites')
      .delete()
      .eq('id', invite.id)
  }

  return NextResponse.json({ success: true })
}