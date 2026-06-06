'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminSidebar from '@/components/admin/AdminSidebar'

const ADMIN_EMAILS = [
  'ajcasemanager46@gmail.com',
  'ifechukwudarlington.dev@gmail.com',
  'ahia4.agent@gmail.com',
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? '')) {
        router.replace('/dashboard')
        return
      }
      setChecking(false)
    }
    check()
  }, [])

  if (checking) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Verifying access...</p>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--warm-white)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
    </div>
  )
}
