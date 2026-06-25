import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fire-and-forget activity log entry. Never throws — a logging failure
 * should never block the actual action the user is trying to do.
 */
export async function logActivity(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  action: string,
  detail?: string
) {
  try {
    await supabase.from('activity_logs').insert({ user_id: userId, email, action, detail })
  } catch {
    // intentionally swallowed
  }
}
