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

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { title, body, type, targetUserId } = await request.json()
    const supabase = await createServiceClient()

    if (targetUserId) {
      await supabase.from('notifications').insert({ user_id: targetUserId, title, body, type })
    } else {
      const { data: users } = await supabase.from('users').select('id')
      const inserts = (users ?? []).map(u => ({ user_id: u.id, title, body, type }))
      if (inserts.length > 0) await supabase.from('notifications').insert(inserts)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
