'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserInfo {
  uid:    string
  email:  string
  isPaid: boolean
  plan?:  string | null
}

const EXAM_MODULES = [
  {
    id:       'diagnostico',
    section:  'A',
    title:    'Diagnóstico Inicial',
    desc:     '180 preguntas · 36 por especialidad · Genera tu perfil académico completo',
    color:    '#00d9ff',
    href:     '/exams/diagnostico',
    tag:      'OPCIONAL · CADA 30-45 DÍAS',
  },
  {
    id:       'diario',
    section:  'B',
    title:    'Simulador Diario',
    desc:     '10 preguntas aleatorias · Justificación inmediata después de cada respuesta',
    color:    '#4ade80',
    href:     '/exams/diario',
    tag:      'RECOMENDADO DIARIO',
  },
  {
    id:       'personalizado',
    section:  'C',
    title:    'Examen Personalizado',
    desc:     'Elige entre 10 y 40 preguntas · Selecciona una o varias especialidades',
    color:    '#a78bfa',
    href:     '/exams/personalizado',
    tag:      'A TU RITMO',
  },
  {
    id:       'simulador_real',
    section:  'D',
    title:    'Simulador Real',
    desc:     '280 reactivos · Cronómetro de 5 horas · Formato CIFRHS oficial',
    color:    '#f87171',
    href:     '/exams/simulador-real',
    tag:      'ALTA INTENSIDAD',
  },
  {
    id:       'simulador_libre',
    section:  'E',
    title:    'Simulador Sin Límite',
    desc:     '280 reactivos · Sin cronómetro · Registra tu tiempo real al terminar',
    color:    '#60a5fa',
    href:     '/exams/simulador-libre',
    tag:      'ESTUDIO PROFUNDO',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [userInfo, setUserInfo]   = useState<UserInfo | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('enarm_user_info')
    if (raw) {
      try { setUserInfo(JSON.parse(raw) as UserInfo) } catch { /* corrupt data */ }
    }
    fetch('/api/check-session', { credentials: 'include' })
      .then(r => r.json())
      .then((data: { status: string; uid?: string; email?: string; isPaid?: boolean; plan?: string }) => {
        if (data.status === 'OK' && data.uid) {
          const updated = { uid: data.uid, email: data.email ?? '', isPaid: data.isPaid ?? false, plan: data.plan ?? null }
          setUserInfo(updated)
          localStorage.setItem('enarm_user_info', JSON.stringify(updated))
        } else {
          localStorage.removeItem('enarm_user_info')
          window.location.href = '/login'
        }
      })
      .catch(() => {
        if (!raw) window.location.href = '/login'
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth', { method: 'DELETE', credentials: 'include' })
    localStorage.removeItem('enarm_user_info')
    window.location.href = '/login'
  }


  if (loading && !userInfo) {
    return (
      <main style={S.main}>
        <h1 style={S.logo}>Simula ENARM</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 8 }}>Cargando...</p>
      </main>
    )
  }

  const isPaid = loading ? true : (userInfo ? userInfo.isPaid : false)

  return (
    <main style={S.main}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <h1 style={S.logo}>Simula ENARM</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/perfil')} style={S.btnGhost}>Mi perfil</button>
          <button onClick={handleLogout} disabled={loggingOut} style={{ ...S.btnGhost, color: '#475569' }}>
            {loggingOut ? '...' : 'Salir'}
          </button>
        </div>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>
        {userInfo?.email ?? ''} · 280 reactivos · Formato CIFRHS 2025
      </p>


      {/* Banner referidos — solo plan anual */}
      {isPaid && userInfo?.plan === 'annual' && (
        <div onClick={() => router.push('/perfil')}
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f2027)', borderRadius: 14, padding: '16px 20px', marginBottom: 16, border: '1px solid #D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', animation: 'pulse-gold 3s ease-in-out infinite' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.8rem' }}>💰</span>
            <div>
              <p style={{ color: '#D4AF37', fontSize: '0.7rem', letterSpacing: '2px', margin: '0 0 4px 0' }}>PROGRAMA DE REFERIDOS</p>
              <h3 style={{ color: '#4ade80', margin: 0, fontSize: '1.1rem' }}>Gana <strong>$150 MXN</strong> por cada amigo</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '4px 0 0 0' }}>Te pagamos por transferencia cuando tu referido se suscriba</p>
            </div>
          </div>
          <span style={{ color: '#D4AF37', fontSize: '1.5rem' }}>→</span>
        </div>
      )}

      {/* Flashcards rápidas */}
      <div style={{ backgroundColor: '#111827', borderRadius: 14, padding: '16px 20px', marginBottom: 16, border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: !isPaid ? 'not-allowed' : 'pointer', opacity: !isPaid ? 0.5 : 1 }}
        onClick={() => !isPaid ? router.push('/upgrade') : router.push('/flashcards')}>
        <div>
          <p style={{ color: '#fbbf24', fontSize: '0.7rem', letterSpacing: '2px', margin: '0 0 4px 0' }}>MÓDULO EXTRA</p>
          <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1.1rem' }}>Flashcards</h3>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Tarjetas rápidas · Anverso/Reverso · 2 minutos entre pacientes</p>
        </div>
        <span style={{ color: '#334155', fontSize: '1.5rem' }}>→</span>
      </div>

      {/* Módulos de examen */}
      <h2 style={{ color: '#475569', fontSize: '0.72rem', letterSpacing: '2px', margin: '20px 0 12px 0' }}>5 TIPOS DE EXAMEN</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {EXAM_MODULES.map(m => (
          <button
            key={m.id}
            onClick={() => !isPaid ? router.push('/upgrade') : router.push(m.href)}
            style={{ display: 'block', width: '100%', textAlign: 'left', backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: 20, cursor: !isPaid ? 'not-allowed' : 'pointer', transition: 'border-color 0.2s', fontFamily: 'DM Sans, Arial, sans-serif', opacity: !isPaid ? 0.5 : 1 }}
            onMouseEnter={e => isPaid && (e.currentTarget.style.borderColor = m.color)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <p style={{ color: m.color, fontSize: '0.68rem', letterSpacing: '2px', margin: '0 0 5px 0' }}>SECCIÓN {m.section} — {m.tag}</p>
                <h3 style={{ color: '#e2e8f0', fontSize: '1.15rem', margin: 0, fontWeight: 'bold' }}>{m.title}</h3>
              </div>
              <span style={{ color: '#334155', fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>→</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>{m.desc}</p>
          </button>
        ))}
      </div>

      <p style={{ color: '#1e293b', fontSize: '0.72rem', textAlign: 'center', marginTop: 40 }}>
        Simula ENARM · 2026
      </p>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:     { padding: 24, fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: 700, margin: '0 auto', backgroundColor: '#0a0a14', minHeight: '100vh', color: '#e2e8f0' },
  logo:     { color: '#00d9ff', fontSize: '2rem', margin: 0, letterSpacing: 3 },
  btnGhost: { backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'DM Sans, Arial, sans-serif', minHeight: 44, touchAction: 'manipulation' as const },
}
