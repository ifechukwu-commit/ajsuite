import { NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/constants'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) return null
  return user
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId, durationDays } = await request.json()
    const supabase = createServiceClient()

    const paidUntil = durationDays
      ? new Date(Date.now() + durationDays * 86400000).toISOString()
      : null

    const { error } = await supabase
      .from('users')
      .update({ plan: 'solo', paid_until: paidUntil })
      .eq('id', userId)

    if (error) throw error

    await supabase.from('activity_logs').insert({
      user_id: admin.id,
      email: admin.email,
      action: 'free_access_granted',
      detail: `userId=${userId} duration=${durationDays ?? 'lifetime'}days`,
    })

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Access Granted',
      body: 'Your workspace has been given complimentary access by the AJ Suite team.',
      type: 'announcement',
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed' }, { status: 500 })
  }
}
