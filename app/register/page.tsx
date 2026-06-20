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
        credentials: 'include',
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
        credentials: 'include',
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
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.logo}>ENARM 360</h1>
        <p style={styles.sub}>Crea tu cuenta para acceder al simulador</p>

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

          <button type="submit" disabled={loading} style={{ ...styles.btn, backgroundColor: loading ? '#78600a' : '#D4AF37', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creando cuenta...' : 'CREAR CUENTA'}
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.infoBadge}>
          <p style={{ color: '#D4AF37', fontSize: '0.78rem', letterSpacing: '1px', margin: '0 0 4px 0' }}>◉ ACCESO PREMIUM</p>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>280 reactivos CIFRHS · 18,515 plazas · Desde $99 MXN/mes</p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#475569', fontSize: '0.85rem' }}>
          Ya tienes cuenta? <a href="/login" style={{ color: '#00d9ff' }}>Inicia sesion</a>
        </p>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' as const }}>
          <a href="/terminos" style={{ color: '#334155', fontSize: '0.72rem' }}>Terminos</a>
          <a href="/privacidad" style={{ color: '#334155', fontSize: '0.72rem' }}>Privacidad</a>
          <a href="/aviso-privacidad" style={{ color: '#334155', fontSize: '0.72rem' }}>Aviso</a>
        </div>
        <p style={{ textAlign: 'center', marginTop: 12, color: '#1e293b', fontSize: '0.65rem' }}>v1.3.3</p>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  )
}

function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button type="button" onClick={toggle} style={styles.eyeBtn} aria-label={show ? 'Ocultar' : 'Mostrar'}>
      {show
        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main:       { minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif' },
  card:       { width: '100%', maxWidth: 420, backgroundColor: '#111827', borderRadius: 16, padding: '40px 32px', border: '1px solid #1e293b' },
  logo:       { color: '#D4AF37', fontSize: '2rem', letterSpacing: 3, margin: '0 0 4px 0', textAlign: 'center' },
  sub:        { color: '#475569', fontSize: '0.8rem', textAlign: 'center', marginBottom: 36 },
  label:      { display: 'block', color: '#94a3b8', fontSize: '0.78rem', letterSpacing: '1px', marginBottom: 8 },
  input:      { width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '13px 16px', color: '#e2e8f0', fontSize: '1rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' },
  btn:        { width: '100%', padding: 15, color: '#0f0f1a', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'Georgia, serif', marginTop: 8, transition: 'background-color 0.2s' },
  error:      { color: '#f87171', fontSize: '0.85rem', textAlign: 'center', marginTop: 12, backgroundColor: '#450a0a', padding: 10, borderRadius: 8 },
  eyeBtn:     { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 10, lineHeight: 0, minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  infoBadge: { marginTop: 28, padding: 16, backgroundColor: '#0f172a', borderRadius: 10, border: '1px solid #D4AF37' },
}
