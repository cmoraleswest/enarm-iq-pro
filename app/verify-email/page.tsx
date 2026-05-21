'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { sendEmailVerification, reload } from 'firebase/auth'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router   = useRouter()
  const [sent, setSent]       = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError]     = useState('')

  const resend = async () => {
    const user = auth.currentUser
    if (!user) { router.push('/login'); return }
    try {
      await sendEmailVerification(user, { url: `${window.location.origin}/login` })
      setSent(true)
    } catch {
      setError('No se pudo reenviar. Intenta en unos minutos.')
    }
  }

  const checkVerification = async () => {
    const user = auth.currentUser
    if (!user) { router.push('/login'); return }
    setChecking(true)
    setError('')
    try {
      await reload(user)
      if (user.emailVerified) {
        router.push('/login')
      } else {
        setError('Aún no hemos recibido la verificación. Revisa tu bandeja de entrada.')
      }
    } catch {
      setError('Error al verificar. Intenta de nuevo.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#111827', borderRadius: 16, padding: '40px 32px', border: '1px solid #1e293b', textAlign: 'center' }}>
        {/* Ícono de email */}
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>✉️</div>

        <h1 style={{ color: '#D4AF37', fontSize: '1.5rem', margin: '0 0 8px 0', letterSpacing: 2 }}>
          VERIFICA TU CORREO
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 32 }}>
          Enviamos un enlace de verificación a tu correo.
          <br />Revisa también la carpeta de spam.
        </p>

        <button
          onClick={checkVerification}
          disabled={checking}
          style={{ width: '100%', padding: 14, backgroundColor: '#D4AF37', color: '#0f0f1a', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 'bold', cursor: checking ? 'not-allowed' : 'pointer', marginBottom: 12, fontFamily: 'Georgia, serif' }}
        >
          {checking ? 'Verificando...' : 'Ya verifiqué mi correo →'}
        </button>

        <button
          onClick={resend}
          style={{ width: '100%', padding: 12, backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', borderRadius: 10, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
        >
          {sent ? '✓ Correo reenviado' : 'Reenviar correo'}
        </button>

        {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: 12 }}>{error}</p>}

        <p style={{ color: '#334155', fontSize: '0.78rem', marginTop: 28 }}>
          <Link href="/login" style={{ color: '#475569', textDecoration: 'none' }}>← Volver al inicio de sesión</Link>
        </p>
      </div>
    </main>
  )
}
