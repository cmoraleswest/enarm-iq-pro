'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserInfo {
  uid:    string
  email:  string
  isPaid: boolean
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
    desc:     '360 preguntas · Cronómetro de 6 horas · Condiciones del ENARM real',
    color:    '#f87171',
    href:     '/exams/simulador-real',
    tag:      'ALTA INTENSIDAD',
  },
  {
    id:       'simulador_libre',
    section:  'E',
    title:    'Simulador Sin Límite',
    desc:     '360 preguntas · Sin cronómetro · Registra tu tiempo real al terminar',
    color:    '#60a5fa',
    href:     '/exams/simulador-libre',
    tag:      'ESTUDIO PROFUNDO',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [userInfo, setUserInfo]   = useState<UserInfo | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem('enarm_user_info')
    const path = window.location.pathname
    const keys = Object.keys(localStorage)
    setDebugInfo(`v1.3.3 | path=${path} | keys=[${keys.join(',')}] | hasData=${!!raw}`)
    if (raw) {
      try { setUserInfo(JSON.parse(raw) as UserInfo) } catch { /* corrupt data */ }
    }
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth', { method: 'DELETE', credentials: 'include' })
    localStorage.removeItem('enarm_user_info')
    window.location.href = '/login'
  }


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
        {userInfo?.email ?? 'Cargando...'} · Banco maestro 2,000 preguntas
      </p>


      {/* Flashcards rápidas */}
      <div style={{ backgroundColor: '#111827', borderRadius: 14, padding: '16px 20px', marginBottom: 16, border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: false ? 'not-allowed' : 'pointer', opacity: false ? 0.5 : 1 }}
        onClick={() => false ? router.push('/upgrade') : router.push('/flashcards')}>
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
            onClick={() => false ? router.push('/upgrade') : router.push(m.href)}
            style={{ display: 'block', width: '100%', textAlign: 'left', backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: 20, cursor: false ? 'not-allowed' : 'pointer', transition: 'border-color 0.2s', fontFamily: 'DM Sans, Arial, sans-serif', opacity: false ? 0.5 : 1 }}
            onMouseEnter={e => !false && (e.currentTarget.style.borderColor = m.color)}
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

      <div style={{ marginTop: 40, padding: '16px 20px', backgroundColor: '#111827', borderRadius: 12, border: '1px solid #1e293b' }}>
        <p style={{ color: '#475569', fontSize: '0.68rem', letterSpacing: '2px', margin: '0 0 8px 0' }}>VERSIÓN</p>
        <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 4px 0' }}>v1.3.3 — 19 junio 2026</p>
        <ul style={{ color: '#475569', fontSize: '0.75rem', margin: '8px 0 0 0', paddingLeft: 16, lineHeight: '1.8' }}>
          <li>Fix: eliminado proxy/middleware del servidor — causa raíz del redirect a login</li>
          <li>Fix: navegación libre entre secciones sin kicks a login</li>
          <li>Fix: sesión basada en localStorage (no depende de cookies del servidor)</li>
          <li>Fix: perfil se genera automáticamente al iniciar sesión</li>
          <li>Fix: resultados de examen con respuesta correcta y justificación</li>
          <li>Fix: resultados se recuperan del servidor si se pierde sessionStorage</li>
          <li>Rebrand: toda la app con colores SimulaENARM (cyan/pink)</li>
          <li>Rebrand: fuente DM Sans en todas las pantallas</li>
        </ul>
      </div>

      {debugInfo && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#1a0a2e', border: '1px solid #6b21a8', borderRadius: 8, fontSize: '0.7rem', color: '#c084fc', wordBreak: 'break-all' }}>
          🔍 DEBUG: {debugInfo}
        </div>
      )}

      <p style={{ color: '#1e293b', fontSize: '0.72rem', textAlign: 'center', marginTop: 16 }}>
        Simula ENARM · Banco Maestro 2025
      </p>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:     { padding: 24, fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: 700, margin: '0 auto', backgroundColor: '#0a0a14', minHeight: '100vh', color: '#e2e8f0' },
  logo:     { color: '#00d9ff', fontSize: '2rem', margin: 0, letterSpacing: 3 },
  btnGhost: { backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'DM Sans, Arial, sans-serif' },
}
