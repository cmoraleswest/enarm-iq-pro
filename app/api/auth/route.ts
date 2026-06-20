import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { createUserProfile, getUserProfile } from '@/lib/firestore'

const SESSION_COOKIE = 'enarm_sess'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60

// POST: login o pre-registro
export async function POST(request: Request) {
  const body = await request.json() as {
    action: 'login' | 'register'
    idToken?: string
    fingerprint?: string
    ip?: string
  }

  if (body.action === 'register') {
    return NextResponse.json({ ok: true })
  }

  return handleLogin(body.idToken ?? '')
}

async function handleLogin(idToken: string) {
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)

    if (!decoded.email_verified) {
      return NextResponse.json({ error: 'Debes verificar tu correo electrónico antes de continuar.' }, { status: 403 })
    }

    let profile = await getUserProfile(decoded.uid)

    if (!profile) {
      await createUserProfile(decoded.uid, decoded.email ?? '', fingerprint, ip)
      profile = await getUserProfile(decoded.uid)
    }

    if (!profile) {
      return NextResponse.json({ error: 'Error al crear perfil.' }, { status: 500 })
    }

    const sessionData = JSON.stringify({
      uid:    decoded.uid,
      email:  decoded.email,
      isPaid: profile.isPaid,
    })
    const response = NextResponse.json({
      ok: true,
      uid: decoded.uid,
      email: decoded.email,
      isPaid: profile.isPaid,
      daysLeft,
      cookieSet: true,
    })

    response.cookies.set(SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   SESSION_MAX_AGE,
      path:     '/',
    })

    return NextResponse.json({
      ok: true,
      uid: decoded.uid,
      email: decoded.email,
      isPaid: profile.isPaid,
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 })
  }
}

// PUT: crear perfil tras registro exitoso en Firebase Auth
export async function PUT(request: Request) {
  const { idToken, fingerprint, ip } = await request.json() as {
    idToken: string
    fingerprint: string
    ip: string
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    const uid = decoded.uid
    const email = decoded.email ?? ''

    const existing = await getUserProfile(uid)
    if (!existing) {
      await createUserProfile(uid, email, fingerprint, ip)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Create profile error:', err)
    return NextResponse.json({ error: 'Error al crear perfil.' }, { status: 500 })
  }
}

// DELETE: cerrar sesión
export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  return response
}
