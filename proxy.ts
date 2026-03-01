import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const currentUser = request.cookies.get('session')?.value

  // Check for protected route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
     if (!currentUser) {
         return NextResponse.redirect(new URL('/auth/login', request.url))
     }
     
     // Verify token validity
     try {
         const payload = await decrypt(currentUser);
         if (!payload || new Date(payload.expires) < new Date()) {
             // Invalid or expired
             return NextResponse.redirect(new URL('/auth/login', request.url))
         }
     } catch {
    // Invalid token
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/signup')) && currentUser) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
