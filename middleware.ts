import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION = 'enarm_sess'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir siempre: login, assets de Next.js
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

  // Sin sesión → forzar login
  const session = request.cookies.get(SESSION)?.value
  if (!session) {
    const url = request.nextUrl.pathname
    if (url === '/') return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|$).+)'],
}
