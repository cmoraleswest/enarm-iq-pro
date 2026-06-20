'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [pass, setPass]         = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Firebase Auth — verifica email y contraseña
      const cred = await signInWithEmailAndPassword(auth, email, pass)

      if (!cred.user.emailVerified) {
        setError('Debes verificar tu correo electrónico. Revisa tu bandeja de entrada.')
        setLoading(false)
        return
      }

      // 2. Obtener ID token y crear sesión en servidor
      const idToken = await cred.user.getIdToken()
      const res = await fetch('/api/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'login', idToken }),
      })
      const data = await res.json() as { error?: string; ok?: boolean; uid?: string; email?: string; isPaid?: boolean }

      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión.')
        return
      }

      // Solo para display en UI — la autorización real viene de la cookie httpOnly
      localStorage.setItem('enarm_user_info', JSON.stringify({
        uid:    data.uid,
        email:  data.email,
        isPaid: data.isPaid,
      }))

      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.')
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos.')
      } else {
        setError('Error de conexión. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={S.main}>
      <div style={S.card}>
        <h1 style={S.logo}>ENARM 360</h1>
        <p style={S.sub}>Simulador de Casos Clínicos · 2,000 preguntas reales</p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>CORREO ELECTRÓNICO</label>
            <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" style={S.input} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={S.label}>CONTRASEÑA</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} autoComplete="current-password" required value={pass} onChange={e => setPass(e.target.value)} placeholder="Tu contraseña" style={{ ...S.input, paddingRight: 48 }} />
              <button type="button" onClick={() => setShowPass(v => !v)} style={S.eyeBtn} aria-label={showPass ? 'Ocultar' : 'Mostrar'}>
                {showPass
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ ...S.btn, backgroundColor: loading ? '#78600a' : '#D4AF37', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Ingresando...' : 'INGRESAR'}
          </button>
        </form>

        {error && <p style={S.error}>{error}</p>}

        <p style={{ textAlign: 'center', marginTop: 24, color: '#475569', fontSize: '0.85rem' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: '#D4AF37', textDecoration: 'none' }}>Crear cuenta →</Link>
        </p>
      </div>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:   { minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif' },
  card:   { width: '100%', maxWidth: 400, backgroundColor: '#111827', borderRadius: 16, padding: '40px 32px', border: '1px solid #1e293b' },
  logo:   { color: '#D4AF37', fontSize: '2rem', letterSpacing: 3, margin: '0 0 4px 0', textAlign: 'center' },
  sub:    { color: '#475569', fontSize: '0.8rem', textAlign: 'center', marginBottom: 36 },
  label:  { display: 'block', color: '#94a3b8', fontSize: '0.78rem', letterSpacing: '1px', marginBottom: 8 },
  input:  { width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '13px 16px', color: '#e2e8f0', fontSize: '1rem', fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' },
  btn:    { width: '100%', padding: 15, color: '#0f0f1a', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'Georgia, serif', marginTop: 8 },
  error:  { color: '#f87171', fontSize: '0.85rem', textAlign: 'center', marginTop: 12, backgroundColor: '#450a0a', padding: 10, borderRadius: 8 },
  eyeBtn: { position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, lineHeight: 0 },
}
