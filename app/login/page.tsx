'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { generateFingerprint, getClientIp } from '@/lib/fingerprint'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await cred.user.getIdToken()
      const fingerprint = generateFingerprint()
      const ip = await getClientIp()
      const res = await fetch('/api/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', idToken, fingerprint, ip }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'TRIAL_EXPIRED') { window.location.href = '/upgrade'; return }
        setError(data.error || 'Error al iniciar sesion')
        return
      }
      if (data.uid) localStorage.setItem('enarm_user_info', JSON.stringify({ uid: data.uid, email: data.email, isPaid: data.isPaid, daysLeft: data.daysLeft }))
      window.location.href = '/home'
    } catch {
      setError('Correo o contrasena incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: '100%', padding: '12px 16px', backgroundColor: '#1a1a2e', border: '1px solid #1e3a5f', borderRadius: 10, color: '#e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'DM Sans, Arial, sans-serif' }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'DM Sans, Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#0f0f1a', borderRadius: 20, padding: '40px 32px', border: '1px solid #1a1a2e' }}>
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
          <p style={{ color: '#475569', fontSize: '0.82rem' }}>2,000 preguntas reales · 5 simuladores</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: 2, display: 'block', marginBottom: 8 }}>CORREO ELECTRONICO</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: 2, display: 'block', marginBottom: 8 }}>CONTRASENA</label>
            <div style={{ position: 'relative' }}>
              <input style={inp} type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimo 6 caracteres" required />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.1rem' }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          {error && <p style={{ color: '#ff006e', fontSize: '0.85rem', marginBottom: 16, textAlign: 'center' }}>{error}</p>}
          <button style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #ff006e, #00d9ff)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, Arial, sans-serif' }} type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'INGRESAR'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, color: '#475569', fontSize: '0.85rem' }}>
          No tienes cuenta? <a href="/register" style={{ color: '#00d9ff' }}>Registrate gratis</a>
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
