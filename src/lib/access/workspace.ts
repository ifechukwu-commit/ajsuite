import type { SupabaseClient } from '@supabase/supabase-js'
import { TRIAL_DAYS } from '@/lib/constants'

export type WorkspaceStatus = 'trial' | 'paid' | 'admin' | 'expired'

export interface WorkspaceAccess {
  /** The id that owns the workspace's data — your own id if you're an owner, your owner's id if you're a member. */
  workspaceId: string
  role: 'owner' | 'member'
  status: WorkspaceStatus
  /** False only for: a member whose owner's workspace is expired. The single hard-block case. */
  hardBlocked: boolean
  /** True only for: an owner whose own workspace is expired (trial ended, unpaid). Read-only archive mode. */
  restricted: boolean
  canCreateCaseOrNote: boolean
  canUpload: boolean
  canExport: boolean
  daysLeftInTrial: number | null
}

/**
 * Computes what this signed-in user can actually do right now.
 * Call once per request (middleware or layout) and pass the result down —
 * don't recompute per component.
 */
export async function getWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkspaceAccess | null> {
  const { data: me } = await supabase
    .from('users')
    .select('id, role, owner_id, plan, trial_claimed, trial_start, paid_until')
    .eq('id', userId)
    .single()

  if (!me) return null

  const isMember = me.role === 'member' && !!me.owner_id
  const workspaceId = isMember ? me.owner_id : me.id

  // For a member, status is read from the OWNER's row, not their own.
  const ownerRow = isMember
    ? (await supabase
        .from('users')
        .select('plan, trial_claimed, trial_start, paid_until')
        .eq('id', workspaceId)
        .single()).data
    : me

  if (!ownerRow) return null

  const active = computeActive(ownerRow)
  const status: WorkspaceStatus = ownerRow.plan === 'admin'
    ? 'admin'
    : ownerRow.plan === 'paid'
      ? (active ? 'paid' : 'expired')
      : (active ? 'trial' : 'expired')

  const daysLeftInTrial = ownerRow.plan === 'trial' && ownerRow.trial_claimed
    ? Math.max(0, TRIAL_DAYS - daysSince(ownerRow.trial_start))
    : null

  if (isMember) {
    return {
      workspaceId,
      role: 'member',
      status,
      hardBlocked: !active,
      restricted: false, // restricted mode is an owner-only concept; members just get blocked
      canCreateCaseOrNote: active,
      canUpload: false, // members never get the owner's upload exception
      canExport: active,
      daysLeftInTrial,
    }
  }

  return {
    workspaceId,
    role: 'owner',
    status,
    hardBlocked: false, // owners are never hard-blocked, only restricted
    restricted: !active,
    canCreateCaseOrNote: active,
    canUpload: true, // owners can keep uploading even when expired
    canExport: active,
    daysLeftInTrial,
  }
}

function computeActive(row: { plan: string; trial_claimed: boolean; trial_start: string; paid_until: string | null }) {
  if (row.plan === 'admin') return true
  if (row.plan === 'paid') return !row.paid_until || new Date(row.paid_until) > new Date()
  if (row.plan === 'trial') return row.trial_claimed && daysSince(row.trial_start) < TRIAL_DAYS
  return false
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}
