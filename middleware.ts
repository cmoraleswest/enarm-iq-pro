import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Candado de sitio — cuando SITE_LOCKED=true solo entra quien tenga sesión activa
const LOCKED   = process.env.SITE_LOCKED === 'true'
const SESSION  = 'enarm_sess'
const API_AUTH = '/api/auth'

export function middleware(request: NextRequest) {
  if (!LOCKED) return NextResponse.next()

  const { pathname } = request.nextUrl
  const session = request.cookies.get(SESSION)?.value

  // Permitir siempre: el endpoint de login y assets
  if (pathname.startsWith(API_AUTH) || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Si tiene sesión activa, puede pasar
  if (session) return NextResponse.next()

  // Sin sesión: solo permitir la página de login
  if (pathname === '/login') return NextResponse.next()

  // Todo lo demás → redirigir a login
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
