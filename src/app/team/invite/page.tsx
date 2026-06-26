'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Invite = {
  id: string
  owner_id: string
  email: string
  name: string | null
  role: 'owner' | 'member'
  created_at: string
}

export default function TeamInvitePage() {
  const router = useRouter()
  const supabase = createClient()

  const [invite, setInvite] = useState<Invite | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInvite = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user?.email) {
        router.replace('/')
        return
      }

      const { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data) {
        router.replace('/dashboard')
        return
      }

      setInvite(data)
      setLoading(false)
    }

    loadInvite()
  }, [router])

  const accept = async () => {
    setActioning(true)
    setError(null)

    const res = await fetch('/api/team/accept', {
      method: 'POST',
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Failed to accept invite')
      setActioning(false)
      return
    }

    router.replace('/dashboard')
  }

  const decline = async () => {
    setActioning(true)
    setError(null)

    const res = await fetch('/api/team/decline', {
      method: 'POST',
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Failed to decline invite')
      setActioning(false)
      return
    }

    router.replace('/')
  }

  if (loading) {
    return (
      <div className="p-6 text-sm">
        Checking invitation...
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="p-6 text-sm">
        No invitation found.
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg">
      <h1 className="text-lg font-bold mb-2">Team Invitation</h1>

      <p className="text-sm mb-4">
        You have been invited to join a workspace as <b>{invite.role}</b>.
      </p>

      {invite.name && (
        <p className="text-sm mb-4">
          Invited by: <b>{invite.name}</b>
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 mb-3">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={accept}
          disabled={actioning}
          className="px-4 py-2 bg-black text-white text-xs rounded"
        >
          Accept
        </button>

        <button
          onClick={decline}
          disabled={actioning}
          className="px-4 py-2 border text-xs rounded"
        >
          Decline
        </button>
      </div>
    </div>
  )
}