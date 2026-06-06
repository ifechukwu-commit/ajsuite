import { NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = [
  'ajcasemanager46@gmail.com',
  'ifechukwudarlington.dev@gmail.com',
  'ahia4.agent@gmail.com',
]

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? '')) return null
  return session
}

export async function GET() {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const supabase = await createServiceClient()
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { userId, plan } = await request.json()
    const supabase = await createServiceClient()
    const { error } = await supabase.from('users').update({ plan }).eq('id', userId)
    if (error) throw error
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Your Plan Has Been Updated',
      body: `Your account has been updated to the ${plan === 'solo' ? 'Solo Counsel' : plan === 'chamber' ? 'Chamber Pro' : plan} plan.`,
      type: 'announcement',
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
