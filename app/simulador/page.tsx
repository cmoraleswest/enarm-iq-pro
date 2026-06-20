'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Caso {
  id: number
  caso: string
  opciones: string[]
  categoria: string
  dificultad: string
}

interface VerifyResult {
  isCorrect: boolean
  correcta: string
  justificacion: string
}

interface StatCategoria {
  correctas: number
  total: number
}

interface Stats {
  correctas: number
  incorrectas: number
  porCategoria: Record<string, StatCategoria>
}

const STATS_KEY = 'enarm_simulador_stats'
const CATEGORIAS = ['Todas', 'Medicina Interna', 'Cirugía', 'Ginecología', 'Pediatría', 'Urgencias']
type EstadoBoton = 'idle' | 'correcto' | 'incorrecto' | 'revelado'

function loadStats(): Stats {
  if (typeof window === 'undefined') return { correctas: 0, incorrectas: 0, porCategoria: {} }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? JSON.parse(raw) : { correctas: 0, incorrectas: 0, porCategoria: {} }
  } catch {
    return { correctas: 0, incorrectas: 0, porCategoria: {} }
  }
}

function saveStats(s: Stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

export default function SimuladorPage() {
  const router = useRouter()
  const [caso, setCaso] = useState<Caso | null>(null)
  const [cargando, setCargando] = useState(false)
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [respondido, setRespondido] = useState(false)
  const [categoria, setCategoria] = useState('Todas')
  const [stats, setStats] = useState<Stats>({ correctas: 0, incorrectas: 0, porCategoria: {} })
  const [verResumen, setVerResumen] = useState(false)
  const [showJustif, setShowJustif] = useState(false)
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)

  // Cargar stats persistidos
  useEffect(() => {
    setStats(loadStats())
  }, [])

  const cargarPregunta = async () => {
    setCargando(true)
    setCaso(null)
    setSeleccion(null)
    setRespondido(false)
    setVerResumen(false)
    setShowJustif(false)
    setVerifyResult(null)
    try {
      const res = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: categoria === 'Todas' ? undefined : categoria }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCaso(data)
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCargando(false)
    }
  }

  const responder = async (opcion: string) => {
    if (respondido || !caso) return
    setSeleccion(opcion)
    setRespondido(true)

    try {
      const res = await fetch('/api/generar/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: caso.id, selected: opcion }),
      })
      const data = await res.json() as VerifyResult
      setVerifyResult(data)

      const esCorrecta = data.isCorrect
      setStats(prev => {
        const cat = prev.porCategoria[caso.categoria] ?? { correctas: 0, total: 0 }
        const updated: Stats = {
          correctas: prev.correctas + (esCorrecta ? 1 : 0),
          incorrectas: prev.incorrectas + (esCorrecta ? 0 : 1),
          porCategoria: {
            ...prev.porCategoria,
            [caso.categoria]: {
              correctas: cat.correctas + (esCorrecta ? 1 : 0),
              total: cat.total + 1,
            },
          },
        }
        saveStats(updated)
        return updated
      })

      setTimeout(() => setShowJustif(true), 300)
    } catch {
      setRespondido(false)
      setSeleccion(null)
    }
  }

  const estadoBoton = (opcion: string): EstadoBoton => {
    if (!respondido || !verifyResult) return 'idle'
    if (opcion === verifyResult.correcta) return 'correcto'
    if (opcion === seleccion) return 'incorrecto'
    return 'revelado'
  }

  const estiloBoton = (estado: EstadoBoton): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: '100%', padding: '16px 20px', borderRadius: '12px',
      fontSize: '0.95rem', textAlign: 'left', cursor: respondido ? 'default' : 'pointer',
      transition: 'all 0.2s', fontFamily: 'Georgia, serif', lineHeight: '1.5',
      minHeight: '54px',
    }
    if (estado === 'correcto')   return { ...base, backgroundColor: '#14532d', border: '2px solid #4ade80', color: '#bbf7d0', fontWeight: 'bold' }
    if (estado === 'incorrecto') return { ...base, backgroundColor: '#450a0a', border: '2px solid #f87171', color: '#fecaca' }
    if (estado === 'revelado')   return { ...base, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#64748b' }
    return { ...base, backgroundColor: '#1e293b', border: '1px solid #475569', color: '#e2e8f0' }
  }

  const total = stats.correctas + stats.incorrectas
  const pct = total > 0 ? Math.round((stats.correctas / total) * 100) : 0

  const resetStats = () => {
    const empty: Stats = { correctas: 0, incorrectas: 0, porCategoria: {} }
    setStats(empty)
    saveStats(empty)
    setVerResumen(false)
  }

  return (
    <main style={{ padding: '24px', fontFamily: 'Georgia, serif', maxWidth: '780px', margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', padding: '0', lineHeight: 1 }}
            title="Volver al dashboard"
          >
            ←
          </button>
          <h1 style={{ color: '#D4AF37', fontSize: '1.8rem', margin: 0, letterSpacing: '2px' }}>SIMULADOR PRO</h1>
        </div>
        {total > 0 && (
          <button
            onClick={() => setVerResumen(!verResumen)}
            style={{ backgroundColor: 'transparent', border: '1px solid #D4AF37', color: '#D4AF37', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Georgia, serif' }}
          >
            {verResumen ? '← Volver' : `📊 ${pct}% (${stats.correctas}/${total})`}
          </button>
        )}
      </div>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>
        2,000 preguntas reales · Banco maestro ENARM
      </p>

      {/* Panel de resumen */}
      {verResumen && (
        <div style={{ backgroundColor: '#111827', borderRadius: '14px', padding: '24px', marginBottom: '24px', border: '1px solid #1e293b' }}>
          <h2 style={{ color: '#D4AF37', margin: '0 0 20px 0', fontSize: '1rem', letterSpacing: '1px' }}>📊 RESUMEN DE SESIÓN</h2>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Respondidas', valor: total, color: '#94a3b8' },
              { label: 'Correctas', valor: stats.correctas, color: '#4ade80' },
              { label: 'Incorrectas', valor: stats.incorrectas, color: '#f87171' },
              { label: 'Acierto', valor: `${pct}%`, color: pct >= 70 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171' },
            ].map(({ label, valor, color }) => (
              <div key={label} style={{ flex: '1 1 80px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', textAlign: 'center', minWidth: '80px' }}>
                <div style={{ color, fontSize: '1.6rem', fontWeight: 'bold' }}>{valor}</div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#1e293b', borderRadius: '99px', height: '8px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 70 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171', transition: 'width 0.4s' }} />
          </div>

          <h3 style={{ color: '#94a3b8', fontSize: '0.78rem', letterSpacing: '1px', margin: '0 0 12px 0' }}>POR ESPECIALIDAD</h3>
          {Object.entries(stats.porCategoria).map(([cat, s]) => {
            const p = Math.round((s.correctas / s.total) * 100)
            return (
              <div key={cat} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{cat}</span>
                  <span style={{ color: p >= 70 ? '#4ade80' : p >= 50 ? '#fbbf24' : '#f87171', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {s.correctas}/{s.total} — {p}%
                  </span>
                </div>
                <div style={{ backgroundColor: '#1e293b', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${p}%`, height: '100%', backgroundColor: p >= 70 ? '#4ade80' : p >= 50 ? '#fbbf24' : '#f87171', transition: 'width 0.4s' }} />
                </div>
              </div>
            )
          })}

          <button
            onClick={resetStats}
            style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Georgia, serif' }}
          >
            Reiniciar estadísticas
          </button>
        </div>
      )}

      {/* Simulador */}
      {!verResumen && (
        <>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                style={{
                  padding: '7px 14px', borderRadius: '20px',
                  border: `1px solid ${categoria === cat ? '#D4AF37' : '#334155'}`,
                  backgroundColor: categoria === cat ? '#D4AF37' : 'transparent',
                  color: categoria === cat ? '#0f0f1a' : '#64748b',
                  cursor: 'pointer', fontSize: '0.78rem',
                  fontWeight: categoria === cat ? 'bold' : 'normal',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Botón principal */}
          <button
            onClick={cargarPregunta}
            disabled={cargando}
            style={{
              width: '100%', padding: '16px',
              backgroundColor: cargando ? '#78600a' : '#D4AF37',
              color: '#0f0f1a', border: 'none', borderRadius: '12px',
              fontSize: '1rem', fontWeight: 'bold',
              cursor: cargando ? 'not-allowed' : 'pointer',
              letterSpacing: '1px', marginBottom: '28px', fontFamily: 'Georgia, serif',
              minHeight: '54px',
            }}
          >
            {cargando ? 'Cargando...' : caso ? '→ Siguiente pregunta' : '▶  INICIAR SIMULADOR'}
          </button>

          {/* Caso clínico */}
          {caso && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[`#${caso.id}`, caso.categoria, caso.dificultad].map(b => (
                  <span key={b} style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem' }}>{b}</span>
                ))}
              </div>

              <div style={{ backgroundColor: '#1a1f2e', borderLeft: '4px solid #D4AF37', borderRadius: '10px', padding: '22px', marginBottom: '20px' }}>
                <p style={{ margin: 0, lineHeight: '1.85', whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{caso.caso}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {caso.opciones.map((opcion, i) => {
                  const estado = estadoBoton(opcion)
                  return (
                    <button key={i} onClick={() => responder(opcion)} style={estiloBoton(estado)}>
                      <span style={{ fontWeight: 'bold', marginRight: '10px', color: estado === 'idle' ? '#D4AF37' : 'inherit' }}>
                        {String.fromCharCode(65 + i)})
                      </span>
                      {opcion}
                      {estado === 'correcto'   && <span style={{ float: 'right' }}>✓</span>}
                      {estado === 'incorrecto' && <span style={{ float: 'right' }}>✗</span>}
                    </button>
                  )
                })}
              </div>

              {/* Justificación con fade-in */}
              {respondido && verifyResult && (
                <div style={{
                  backgroundColor: '#0d1117', border: '1px solid #1d4ed8',
                  borderRadius: '12px', padding: '24px',
                  opacity: showJustif ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}>
                  <h3 style={{ color: '#60a5fa', margin: '0 0 14px 0', fontSize: '0.8rem', letterSpacing: '1.5px' }}>
                    📋 ANÁLISIS TÉCNICO — GUÍA DE PRÁCTICA CLÍNICA
                  </h3>
                  <p style={{ margin: 0, lineHeight: '1.9', color: '#bfdbfe', fontSize: '0.95rem' }}>
                    {verifyResult.justificacion}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  )
}
