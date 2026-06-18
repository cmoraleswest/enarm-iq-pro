'use client'

import { useState } from 'react'

interface Pregunta {
  id: number
  caso: string
  respuesta_correcta: string
  justificacion: string
  categoria: string
  dificultad: string
}

interface FlashStats {
  dominio: number
  repasar: number
  total: number
}

const STATS_KEY = 'enarm_flashcard_stats'
const CATEGORIAS = ['Todas', 'Medicina Interna', 'Cirugía', 'Ginecología', 'Pediatría', 'Urgencias']

function loadStats(): FlashStats {
  if (typeof window === 'undefined') return { dominio: 0, repasar: 0, total: 0 }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? JSON.parse(raw) : { dominio: 0, repasar: 0, total: 0 }
  } catch {
    return { dominio: 0, repasar: 0, total: 0 }
  }
}

function saveStats(s: FlashStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

export default function FlashcardsPage() {
  const [pregunta, setPregunta] = useState<Pregunta | null>(null)
  const [volteada, setVolteada] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [categoria, setCategoria] = useState('Todas')
  const [stats, setStats] = useState<FlashStats>(loadStats)
  const [respuestaVisible, setRespuestaVisible] = useState(false)

  const cargarTarjeta = async () => {
    setCargando(true)
    setPregunta(null)
    setVolteada(false)
    setRespuestaVisible(false)
    try {
      const res = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categoria: categoria === 'Todas' ? undefined : categoria }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPregunta(data)
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCargando(false)
    }
  }

  const voltear = () => {
    setVolteada(v => !v)
    if (!volteada) {
      setTimeout(() => setRespuestaVisible(true), 200)
    } else {
      setRespuestaVisible(false)
    }
  }

  const marcar = (tipo: 'dominio' | 'repasar') => {
    setStats(prev => {
      const updated: FlashStats = {
        dominio: prev.dominio + (tipo === 'dominio' ? 1 : 0),
        repasar: prev.repasar + (tipo === 'repasar' ? 1 : 0),
        total: prev.total + 1,
      }
      saveStats(updated)
      return updated
    })
    cargarTarjeta()
  }

  const pctDominio = stats.total > 0 ? Math.round((stats.dominio / stats.total) * 100) : 0

  return (
    <main style={{ padding: '24px', fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
        <button
          onClick={() => window.location.href = '/home'}
          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', padding: '0', lineHeight: 1 }}
          title="Volver al dashboard"
        >
          ←
        </button>
        <h1 style={{ color: '#00d9ff', fontSize: '1.8rem', margin: 0, letterSpacing: '2px' }}>FLASHCARDS</h1>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>
        Estudio rápido · Toca la tarjeta para revelar
      </p>

      {/* Estadísticas */}
      {stats.total > 0 && (
        <div style={{ backgroundColor: '#111827', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Dominio de Flashcards</span>
            <span style={{ color: '#4ade80', fontSize: '0.82rem', fontWeight: 'bold' }}>{pctDominio}%</span>
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '99px', height: '6px', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{ width: `${pctDominio}%`, height: '100%', backgroundColor: '#4ade80', transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#4ade80', fontSize: '1.3rem', fontWeight: 'bold' }}>{stats.dominio}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Dominio ✓</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#fbbf24', fontSize: '1.3rem', fontWeight: 'bold' }}>{stats.repasar}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Repasar ↺</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#94a3b8', fontSize: '1.3rem', fontWeight: 'bold' }}>{stats.total}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoria(cat)}
            style={{
              padding: '7px 14px', borderRadius: '20px',
              border: `1px solid ${categoria === cat ? '#00d9ff' : '#334155'}`,
              backgroundColor: categoria === cat ? '#00d9ff' : 'transparent',
              color: categoria === cat ? '#0f0f1a' : '#64748b',
              cursor: 'pointer', fontSize: '0.78rem',
              fontWeight: categoria === cat ? 'bold' : 'normal',
              fontFamily: 'DM Sans, Arial, sans-serif',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Botón inicio */}
      {!pregunta && (
        <button
          onClick={cargarTarjeta}
          disabled={cargando}
          style={{
            width: '100%', padding: '16px',
            backgroundColor: cargando ? '#78600a' : '#00d9ff',
            color: '#0f0f1a', border: 'none', borderRadius: '12px',
            fontSize: '1rem', fontWeight: 'bold',
            cursor: cargando ? 'not-allowed' : 'pointer',
            letterSpacing: '1px', fontFamily: 'DM Sans, Arial, sans-serif',
            minHeight: '54px',
          }}
        >
          {cargando ? 'Cargando...' : '▶  INICIAR FLASHCARDS'}
        </button>
      )}

      {/* Tarjeta flip */}
      {pregunta && (
        <div>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[`#${pregunta.id}`, pregunta.categoria, pregunta.dificultad].map(b => (
              <span key={b} style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem' }}>{b}</span>
            ))}
          </div>

          {/* Tarjeta con efecto flip via CSS */}
          <div
            onClick={voltear}
            style={{
              cursor: 'pointer',
              minHeight: '220px',
              borderRadius: '16px',
              border: `2px solid ${volteada ? '#ff006e' : '#00d9ff'}`,
              backgroundColor: volteada ? '#0d1117' : '#1a1f2e',
              padding: '28px',
              marginBottom: '20px',
              transition: 'all 0.3s ease',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            {/* Indicador anverso/reverso */}
            <div style={{
              position: 'absolute', top: '14px', right: '16px',
              fontSize: '0.7rem', letterSpacing: '1px',
              color: volteada ? '#3b82f6' : '#00d9ff',
            }}>
              {volteada ? 'REVERSO' : 'ANVERSO'} ↕
            </div>

            {!volteada ? (
              // ANVERSO: pregunta
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.72rem', letterSpacing: '1px', margin: '0 0 14px 0' }}>PREGUNTA</p>
                <p style={{ margin: 0, lineHeight: '1.8', color: '#e2e8f0', fontSize: '0.95rem' }}>
                  {pregunta.caso.length > 300 ? pregunta.caso.slice(0, 300) + '…' : pregunta.caso}
                </p>
              </div>
            ) : (
              // REVERSO: respuesta + justificación
              <div style={{ opacity: respuestaVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                <p style={{ color: '#3b82f6', fontSize: '0.72rem', letterSpacing: '1px', margin: '0 0 10px 0' }}>RESPUESTA CORRECTA</p>
                <p style={{ color: '#4ade80', fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  {pregunta.respuesta_correcta}
                </p>
                <p style={{ color: '#00d9ff', fontSize: '0.72rem', letterSpacing: '1px', margin: '0 0 8px 0' }}>JUSTIFICACIÓN</p>
                <p style={{ margin: 0, lineHeight: '1.8', color: '#94a3b8', fontSize: '0.88rem' }}>
                  {pregunta.justificacion}
                </p>
              </div>
            )}
          </div>

          {/* Botones de acción — solo visibles tras voltear */}
          {volteada && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => marcar('repasar')}
                style={{
                  flex: 1, padding: '16px', borderRadius: '12px',
                  border: '2px solid #fbbf24', backgroundColor: 'transparent',
                  color: '#fbbf24', fontSize: '1rem', fontWeight: 'bold',
                  cursor: 'pointer', fontFamily: 'DM Sans, Arial, sans-serif',
                  minHeight: '54px',
                }}
              >
                ↺ Repasar luego
              </button>
              <button
                onClick={() => marcar('dominio')}
                style={{
                  flex: 1, padding: '16px', borderRadius: '12px',
                  border: '2px solid #4ade80', backgroundColor: '#14532d',
                  color: '#4ade80', fontSize: '1rem', fontWeight: 'bold',
                  cursor: 'pointer', fontFamily: 'DM Sans, Arial, sans-serif',
                  minHeight: '54px',
                }}
              >
                ✓ Dominio
              </button>
            </div>
          )}

          {/* Botón siguiente (antes de voltear) */}
          {!volteada && (
            <button
              onClick={voltear}
              style={{
                width: '100%', padding: '16px',
                backgroundColor: 'transparent', border: '2px solid #D4AF37',
                color: '#00d9ff', borderRadius: '12px',
                fontSize: '1rem', fontWeight: 'bold',
                cursor: 'pointer', letterSpacing: '1px', fontFamily: 'DM Sans, Arial, sans-serif',
                minHeight: '54px',
              }}
            >
              Ver respuesta →
            </button>
          )}
        </div>
      )}
    </main>
  )
}
