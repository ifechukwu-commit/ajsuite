'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { useCases } from '@/hooks/useCases'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { logActivity } from '@/lib/activityLog'
import type { TeamInvite, User } from '@/types'

export default function TeamPage() {
  const { user, workspaceId, loading: userLoading, isMemberBlocked } = useUser()
  const { cases } = useCases(workspaceId)
  const [members, setMembers] = useState<User[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner' | 'member'>('member')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    if (!workspaceId) return
    const [{ data: m }, { data: i }] = await Promise.all([
      supabase.from('users').select('*').eq('owner_id', workspaceId),
      supabase.from('team_invites').select('*').eq('owner_id', workspaceId),
    ])
    setMembers(m ?? [])
    setInvites(i ?? [])
  }, [workspaceId])

  useEffect(() => { load() }, [load])

  if (!userLoading && !user) { redirect('/'); return null }
  if (!userLoading && isMemberBlocked()) { redirect('/expired'); return null }

  const handleInvite = async () => {
    if (!email.trim() || !workspaceId) return
    setSending(true)
    setError(null)
    const { error } = await supabase.from('team_invites').insert({
      owner_id: workspaceId,
      email: email.trim().toLowerCase(),
      name: name.trim() || null,
      role,
    })
    if (error) setError(error.message.includes('duplicate') ? 'Already invited.' : error.message)
    else { setEmail(''); setName(''); setRole('member'); logActivity(supabase, user!.id, user!.email, 'team_invite_sent', email.trim()) }
    setSending(false)
    await load()
  }

  const revokeInvite = async (id: string) => {
    await supabase.from('team_invites').delete().eq('id', id)
    await load()
  }

  const removeMember = async (id: string) => {
    // Detaches the member from the workspace — they keep their Google
    // account, just lose access. They can be re-invited any time.
    await supabase.from('users').update({ owner_id: null, role: 'owner', trial_claimed: true, trial_start: new Date(0).toISOString() }).eq('id', id)
    await load()
  }

  return (
    <div className="flex h-screen">
      <Sidebar cases={cases} onNewCase={() => {}} />
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 pl-20 md:pl-6">
        <h1 className="font-baskerville text-xl mb-1" style={{ color: 'var(--navy)' }}>Team</h1>
        <p className="text-sm mb-6 max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Add an email to give someone full access to every case in this workspace — no separate trial, no separate setup. Same as sharing a folder.
        </p>

        {user?.role === 'owner' ? (
          <div className="rounded-lg border p-4 mb-6 max-w-md" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-2">
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Name"
                className="w-full px-3 py-2 rounded border text-sm focus-navy break-words"
                style={{ borderColor: 'var(--border)' }} />
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="colleague@gmail.com"
                className="w-full px-3 py-2 rounded border text-sm focus-navy break-words"
                style={{ borderColor: 'var(--border)' }} />
              <select value={role} onChange={e => setRole(e.target.value as 'owner' | 'member')}
                className="w-full px-3 py-2 rounded border text-sm focus-navy"
                style={{ borderColor: 'var(--border)' }}>
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </select>
              <button onClick={handleInvite} disabled={sending || !email.trim()}
                className="px-4 py-2 rounded text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--navy)' }}>
                Invite
              </button>
            </div>
            {error && <p className="text-xs mt-2 break-words" style={{ color: '#9B1C1C' }}>{error}</p>}
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Owner: full access, manage subscription, invite/remove members. Member: assigned work, upload documents, create notes and tasks.
              They'll get access the moment they sign in with this email — no action needed from them beforehand.
            </p>
          </div>
        ) : (
          <p className="text-sm mb-6 px-4 py-3 rounded-lg max-w-md" style={{ background: 'rgba(201,168,76,0.08)', color: 'var(--text-secondary)' }}>
            Only the workspace owner can invite or remove team members.
          </p>
        )}

        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Active Members</p>
          {members.length === 0 ? (
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>No team members yet.</p>
          ) : (
            <div className="flex flex-col gap-2 mb-6">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{m.full_name || m.email}</p>
                    <p className="text-xs break-words" style={{ color: 'var(--text-muted)' }}>{m.email}</p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--gold)' }}>{m.role}</p>
                  </div>
                  {user?.role === 'owner' && (
                    <button onClick={() => removeMember(m.id)} className="text-xs flex-shrink-0" style={{ color: '#9B1C1C' }}>Remove</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {invites.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Pending Invites</p>
              <div className="flex flex-col gap-2">
                {invites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg border" style={{ background: 'var(--warm-white)', borderColor: 'var(--border)' }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm break-words" style={{ color: 'var(--text-secondary)' }}>{inv.name || inv.email}</p>
                      <p className="text-xs break-words" style={{ color: 'var(--text-muted)' }}>{inv.email}</p>
                      <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--gold)' }}>{inv.role}</p>
                    </div>
                    {user?.role === 'owner' && (
                      <button onClick={() => revokeInvite(inv.id)} className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
