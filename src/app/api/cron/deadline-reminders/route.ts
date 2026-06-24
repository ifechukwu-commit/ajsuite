import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Fires once per matching day, not as a countdown — so a deadline 9 days
// out doesn't notify until it actually hits 7.
const INTERVALS = [30, 14, 7, 3, 1]

export async function GET(request: Request) {
  // Vercel Cron sends this header automatically when CRON_SECRET is set
  // in the project's environment variables.
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: cases } = await supabase
    .from('cases')
    .select('id, title, deadline, user_id')
    .not('deadline', 'is', null)
    .neq('status', 'Closed')

  let sent = 0

  for (const c of cases ?? []) {
    const due = new Date(c.deadline!)
    due.setHours(0, 0, 0, 0)
    const daysLeft = Math.round((due.getTime() - today.getTime()) / 86400000)

    if (!INTERVALS.includes(daysLeft)) continue

    // Dedupe — don't re-notify if this exact reminder already went out today.
    // The title doubles as the dedupe key, so it has to read naturally too.
    const title = `Deadline Reminder: ${c.title} (${daysLeft}d)`
    const { data: already } = await supabase
      .from('notifications').select('id').eq('title', title).gte('created_at', today.toISOString()).limit(1)
    if (already && already.length > 0) continue

    // Notify the owner and every team member of this workspace.
    const { data: recipients } = await supabase
      .from('users').select('id').or(`id.eq.${c.user_id},owner_id.eq.${c.user_id}`)

    const rows = (recipients ?? []).map(r => ({
      user_id: r.id,
      title,
      body: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left until the deadline on this matter.`,
      type: 'renewal' as const,
    }))

    if (rows.length > 0) {
      await supabase.from('notifications').insert(rows)
      sent += rows.length
    }

    // NOTE: email delivery isn't wired up — that needs an email provider
    // (e.g. Resend) and an API key, neither of which exist yet in .env.
    // In-app notification above is the only channel live right now.
  }

  return NextResponse.json({ checked: (cases ?? []).length, notificationsSent: sent })
}
