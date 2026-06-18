'use client'

import { useState } from 'react'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { generateFingerprint, getClientIp } from '@/lib/fingerprint'

export default function RegisterPage() {
  const [email, setEmail]         = useState('')
  const [pass, setPass]           = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (pass.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (pass !== confirm) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    try {
      const fingerprint = generateFingerprint()
      const ip          = await getClientIp()

      const fraudCheck = await fetch('/api/auth', {
        method:  'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'register', fingerprint, ip }),
      })
      const fraudData = await fraudCheck.json() as { error?: string; ok?: boolean }
      if (!fraudCheck.ok) {
        setError(fraudData.error ?? 'No se puede crear la cuenta en este momento.')
        return
      }

      const cred = await createUserWithEmailAndPassword(auth, email, pass)

      await sendEmailVerification(cred.user, {
        url: `${window.location.origin}/login`,
      })

      const idToken = await cred.user.getIdToken()
      await fetch('/api/auth', {
        method:  'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken, fingerprint, ip }),
      })

      window.location.href = '/verify-email'
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') setError('Este correo ya tiene una cuenta registrada.')
      else if (code === 'auth/invalid-email') setError('El correo electrónico no es válido.')
      else setError('Error al crear la cuenta. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', backgroundColor: '#1a1a2e', border: '1px solid #1e3a5f', borderRadius: 10, color: '#e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'DM Sans, Arial, sans-serif' }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'DM Sans, Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#0f0f1a', borderRadius: 20, padding: '40px 32px', border: '1px solid #1a1a2e' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <svg width="40" height="40" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="38" fill="none" stroke="#00d9ff" strokeWidth="2" opacity="0.3"/>
              <path d="M 15 40 L 28 40 L 32 28 L 40 52 L 48 40 L 65 40" fill="none" stroke="#ff006e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="28" cy="40" r="2.5" fill="#ff006e"/>
              <circle cx="48" cy="40" r="2.5" fill="#ff006e"/>
              <circle cx="65" cy="40" r="2.5" fill="#ff006e"/>
            </svg>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>Simula<span style={{ color: '#00d9ff' }}>ENARM</span></span>
          </div>
          <p style={{ color: '#475569', fontSize: '0.82rem' }}>Crea tu cuenta gratuita · 2 dias de acceso completo</p>
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: 2, display: 'block', marginBottom: 8 }}>CORREO ELECTRONICO</label>
            <input style={inp} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: 2, display: 'block', marginBottom: 8 }}>CONTRASENA</label>
            <div style={{ position: 'relative' }}>
              <input style={inp} type={showPass ? 'text' : 'password'} autoComplete="new-password" required value={pass} onChange={e => setPass(e.target.value)} placeholder="Minimo 8 caracteres" />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.1rem' }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: 2, display: 'block', marginBottom: 8 }}>CONFIRMAR CONTRASENA</label>
            <input style={inp} type={showPass ? 'text' : 'password'} autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite tu contrasena" />
          </div>

          {error && <p style={{ color: '#ff006e', fontSize: '0.85rem', marginBottom: 16, textAlign: 'center' }}>{error}</p>}

          <button style={{ width: '100%', padding: 14, background: loading ? '#334155' : 'linear-gradient(135deg, #ff006e, #00d9ff)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, Arial, sans-serif' }} type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'CREAR CUENTA GRATIS'}
          </button>
        </form>

        {/* Trial badge */}
        <div style={{ marginTop: 24, padding: 14, backgroundColor: '#0a1628', borderRadius: 12, border: '1px solid #1e3a5f', textAlign: 'center' }}>
          <p style={{ color: '#00d9ff', fontSize: '0.72rem', letterSpacing: '2px', margin: '0 0 4px 0' }}>◉ PERIODO DE PRUEBA</p>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>2 dias de acceso completo · Sin tarjeta de credito</p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#475569', fontSize: '0.85rem' }}>
          Ya tienes cuenta? <a href="/login" style={{ color: '#00d9ff' }}>Inicia sesion</a>
        </p>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' as const }}>
          <a href="/terminos" style={{ color: '#334155', fontSize: '0.72rem' }}>Terminos</a>
          <a href="/privacidad" style={{ color: '#334155', fontSize: '0.72rem' }}>Privacidad</a>
          <a href="/aviso-privacidad" style={{ color: '#334155', fontSize: '0.72rem' }}>Aviso</a>
        </div>
      </div>
    </main>
  )
}
