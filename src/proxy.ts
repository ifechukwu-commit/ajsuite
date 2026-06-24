import { createClient } from '@/lib/supabase/server'
import { getWorkspaceAccess } from '@/lib/access/workspace'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/cases', '/history', '/admin', '/claim']

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))

  if (isProtected) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // /admin and /claim are exempt from the workspace check —
      // /admin gates itself on super_admin email, /claim has to be
      // reachable by definition before a trial exists.
      if (!pathname.startsWith('/admin') && !pathname.startsWith('/claim')) {
        const access = await getWorkspaceAccess(supabase, user.id)
        if (access?.hardBlocked) {
          return NextResponse.redirect(new URL('/expired', request.url))
        }
        // Owners with an expired workspace are NOT redirected — they stay
        // in the dashboard in restricted/read-only mode. The UI reads
        // access.restricted to show the banner and lock write actions.
      }
    } catch {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/cases/:path*', '/history/:path*', '/admin/:path*', '/claim/:path*'],
}
