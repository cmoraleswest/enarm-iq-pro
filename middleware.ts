import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'enarm_sess'

const PUBLIC_PATHS = ['/login', '/register', '/verify-email', '/upgrade', '/privacidad', '/terminos', '/aviso-privacidad', '/faq', '/pago/exitoso']
const PUBLIC_API   = ['/api/auth', '/api/stripe']

// Rutas que requieren isPaid para acceder
const PAID_ONLY = [
  '/simulador', '/flashcards', '/perfil',
  '/exams/diagnostico', '/exams/diario', '/exams/personalizado',
  '/exams/simulador-real', '/exams/simulador-libre', '/exams/resultado',
]

const ALLOWED_ORIGINS = [
  'https://simulaenarm.com',
  'https://www.simulaenarm.com',
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  for (const prefix of PUBLIC_API) {
    if (pathname.startsWith(prefix)) return true
  }
  return false
}

function isPaidRoute(pathname: string): boolean {
  return PAID_ONLY.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {}
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

interface SessionData {
  uid: string
  isPaid: boolean
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function parseSession(raw: string): Promise<SessionData | null> {
  try {
    const dotIdx = raw.lastIndexOf('.')
    if (dotIdx === -1) return null

    const payload = raw.slice(0, dotIdx)
    const sig = raw.slice(dotIdx + 1)

    const secret = process.env.SESSION_SECRET
    if (!secret) return null

    const expected = await hmacHex(secret, payload)
    if (sig.length !== expected.length) return null
    let mismatch = 0
    for (let i = 0; i < sig.length; i++) {
      mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
    }
    if (mismatch !== 0) return null

    const data = JSON.parse(atob(payload)) as SessionData
    if (!data.uid) return null
    return data
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')
  const isApi = pathname.startsWith('/api/')

  // Preflight CORS
  if (request.method === 'OPTIONS' && isApi) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
  }

  // CORS: bloquear orígenes no autorizados en producción
  if (isApi && origin && process.env.NODE_ENV === 'production') {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'Origen no autorizado' }, { status: 403 })
    }
  }

  // Rutas públicas — pasar sin validación
  if (isPublic(pathname)) {
    const res = NextResponse.next()
    for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v)
    return res
  }

  // Validar cookie de sesión
  const raw = request.cookies.get(SESSION_COOKIE)?.value
  if (!raw) {
    if (isApi) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await parseSession(raw)
  if (!session) {
    if (isApi) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rutas de pago — redirigir a /upgrade si no ha pagado
  if (!session.isPaid && (isPaidRoute(pathname) || pathname === '/')) {
    return NextResponse.redirect(new URL('/upgrade', request.url))
  }

  // APIs protegidas — bloquear si no ha pagado
  if (!session.isPaid && isApi && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/stripe') && !pathname.startsWith('/api/account')) {
    return NextResponse.json({ error: 'Suscripción requerida' }, { status: 402 })
  }

  const res = NextResponse.next()
  if (isApi) {
    for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v)
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|og-image\\.png|robots\\.txt|sw\\.js|manifest\\.json|sitemap\\.xml).*)'],
}
