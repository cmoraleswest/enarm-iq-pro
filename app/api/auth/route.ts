import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase-admin'
import { createUserProfile, getUserProfile, isTrialActive, trialDaysLeft, detectFraud } from '@/lib/firestore'

const SESSION_COOKIE = 'enarm_sess'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 días (Firebase gestiona el trial, no la cookie)

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

  return handleLogin(body.idToken ?? '', request)
}

async function handleLogin(idToken: string, request: Request) {
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)

    // Usuario debe tener email verificado
    if (!decoded.email_verified) {
      return NextResponse.json({ error: 'Debes verificar tu correo electrónico antes de continuar.' }, { status: 403 })
    }

    const profile = await getUserProfile(decoded.uid)
    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado. Regístrate primero.' }, { status: 404 })
    }

    const active  = isTrialActive(profile)
    const daysLeft = trialDaysLeft(profile)

    if (!active) {
      return NextResponse.json({ error: 'Tu período de prueba ha finalizado.', code: 'TRIAL_EXPIRED' }, { status: 402 })
    }

    // Crear cookie de sesión
    const sessionData = JSON.stringify({
      uid:         decoded.uid,
      email:       decoded.email,
      isPaid:      profile.isPaid,
      daysLeft,
      trialActive: active,
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, Buffer.from(sessionData).toString('base64'), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   SESSION_MAX_AGE,
      path:     '/',
    })

    return NextResponse.json({ ok: true, uid: decoded.uid, email: decoded.email, isPaid: profile.isPaid, daysLeft })
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
  const { uid, email, fingerprint, ip } = await request.json() as {
    uid: string
    email: string
    fingerprint: string
    ip: string
  }

  try {
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
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}
