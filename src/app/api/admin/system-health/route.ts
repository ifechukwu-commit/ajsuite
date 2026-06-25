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
    const start = Date.now()
    const [{ count: userCount }, { count: caseCount }, { count: docCount }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('cases').select('*', { count: 'exact', head: true }),
      supabase.from('documents').select('*', { count: 'exact', head: true }),
    ])
    const dbLatencyMs = Date.now() - start

    return NextResponse.json({
      databaseConnected: true,
      dbLatencyMs,
      userCount: userCount ?? 0,
      caseCount: caseCount ?? 0,
      docCount: docCount ?? 0,
      checkedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ databaseConnected: false, error: err.message }, { status: 200 })
  }
}
