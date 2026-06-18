import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION = 'enarm_sess'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasSession = request.cookies.has(SESSION)
  if (hasSession && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify-email' ||
    pathname === '/terminos' ||
    pathname === '/privacidad' ||
    pathname === '/aviso-privacidad' ||
    pathname.startsWith('/ref/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const session = request.cookies.get(SESSION)?.value
  if (!session) {
    if (pathname === '/') return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|$).+)'],
}
