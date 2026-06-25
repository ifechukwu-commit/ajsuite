import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Supabase free-tier projects auto-pause after a period of inactivity,
// which breaks the auth/GoTrue endpoint entirely (TypeError: Failed to
// fetch / AuthRetryableFetchError on token refresh). This tiny, harmless
// read keeps the project "active" so that never happens.
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('users').select('id').limit(1)

  return NextResponse.json({ ok: !error, checkedAt: new Date().toISOString() })
}
