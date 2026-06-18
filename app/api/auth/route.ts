import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { createUserProfile, getUserProfile, isTrialActive, trialDaysLeft, detectFraud } from '@/lib/firestore'

const SESSION_COOKIE = 'enarm_sess'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 días

function setSessionCookie(response: NextResponse, sessionData: string) {
  response.cookies.set(SESSION_COOKIE, Buffer.from(sessionData).toString('base64'), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
  })
  return response
}

// POST: login (verificar idToken, crear cookie de sesión)
export async function POST(request: Request) {
  const body = await request.json() as {
    action: 'login' | 'register'
    idToken?: string
    fingerprint?: string
    ip?: string
  }

  if (body.action === 'register') {
    return handleRegister(body.fingerprint ?? '', body.ip ?? 'unknown')
  }

  return handleLogin(body.idToken ?? '', body.fingerprint ?? '', body.ip ?? 'unknown')
}

async function handleLogin(idToken: string, fingerprint: string, ip: string) {
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)

    if (!decoded.email_verified) {
      return NextResponse.json({ error: 'Debes verificar tu correo electrónico antes de continuar.' }, { status: 403 })
    }

    let profile = await getUserProfile(decoded.uid)

    // Auto-crear perfil si no existe (caso: registro completó Firebase Auth pero falló el PUT)
    if (!profile) {
      await createUserProfile(decoded.uid, decoded.email ?? '', fingerprint, ip)
      profile = await getUserProfile(decoded.uid)
    }

    if (!profile) {
      return NextResponse.json({ error: 'Error al crear perfil.' }, { status: 500 })
    }

    const active  = isTrialActive(profile)
    const daysLeft = trialDaysLeft(profile)

    if (!active) {
      return NextResponse.json({ error: 'Tu período de prueba ha finalizado.', code: 'TRIAL_EXPIRED' }, { status: 402 })
    }

    const sessionData = JSON.stringify({
      uid:         decoded.uid,
      email:       decoded.email,
      isPaid:      profile.isPaid,
      daysLeft,
      trialActive: active,
    })

    const response = NextResponse.json({ ok: true, uid: decoded.uid, email: decoded.email, isPaid: profile.isPaid, daysLeft })
    return setSessionCookie(response, sessionData)
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 })
  }
}

async function handleRegister(fingerprint: string, ip: string) {
  // Verificación anti-fraude — solo bloquea si hay trial expirado en mismo dispositivo/IP
  const isFraud = await detectFraud(fingerprint, ip)
  if (isFraud) {
    return NextResponse.json({
      error: 'Ya utilizaste el período de prueba gratuito desde este dispositivo.',
      code: 'FRAUD_DETECTED',
    }, { status: 403 })
  }
  return NextResponse.json({ ok: true })
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
