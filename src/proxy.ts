import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/cases', '/history', '/admin', '/claim']

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { pathname } = request.nextUrl
const isProtected = PROTECTED.some(p => pathname.startsWith(p))

if (isProtected) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!user || error) {
      return NextResponse.redirect(new URL('/', request.url))
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