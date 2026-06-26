import { NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/constants'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) return null
  return user
}

export async function GET() {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const supabase = await createServiceClient()
    const { data: reviews, error } = await supabase
      .from('app_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error

    const userIds = [...new Set(reviews.map(r => r.user_id))]
    const { data: users } = await supabase.from('users').select('id, email, full_name').in('id', userIds)
    const byId = new Map((users ?? []).map(u => [u.id, u]))

    const withUser = reviews.map(r => ({ ...r, email: byId.get(r.user_id)?.email, full_name: byId.get(r.user_id)?.full_name }))
    return NextResponse.json(withUser)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}