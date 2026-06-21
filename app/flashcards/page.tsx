'use client'

import { useState, useEffect } from 'react'

interface Pregunta {
  id: number
  caso: string
  categoria: string
  dificultad: string
}

interface RespuestaServer {
  isCorrect: boolean
  correcta: string
  justificacion: string
}

interface FlashData {
  dominadas: number[]
  porRepasar: number[]
  vistas: number
}

const DATA_KEY = 'enarm_flash_v2'
const CATEGORIAS = ['Todas', 'Medicina Interna', 'Cirugía', 'Ginecología', 'Pediatría', 'Urgencias']

function loadData(): FlashData {
  if (typeof window === 'undefined') return { dominadas: [], porRepasar: [], vistas: 0 }
  try {
    const raw = localStorage.getItem(DATA_KEY)
    return raw ? JSON.parse(raw) : { dominadas: [], porRepasar: [], vistas: 0 }
  } catch {
    return { dominadas: [], porRepasar: [], vistas: 0 }
  }
}

function saveData(d: FlashData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(d))
}

export default function FlashcardsPage() {
  const [pregunta, setPregunta] = useState<Pregunta | null>(null)
  const [volteada, setVolteada] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [categoria, setCategoria] = useState('Todas')
  const [data, setData] = useState<FlashData>(loadData)
  const [respuestaVisible, setRespuestaVisible] = useState(false)
  const [respuestaServer, setRespuestaServer] = useState<RespuestaServer | null>(null)
  const [esRepaso, setEsRepaso] = useState(false)

  const totalUnicas = data.dominadas.length + data.porRepasar.length
  const pctDominio = totalUnicas > 0 ? Math.round((data.dominadas.length / totalUnicas) * 100) : 0

  const cargarTarjeta = async (forceNew = false) => {
    setCargando(true)
    setPregunta(null)
    setVolteada(false)
    setRespuestaVisible(false)
    setRespuestaServer(null)
    setEsRepaso(false)

    // Si hay tarjetas por repasar, mostrar una de esas primero (cada 3 tarjetas o si no es nueva)
    const currentData = loadData()
    if (!forceNew && currentData.porRepasar.length > 0 && currentData.vistas % 3 === 0) {
      try {
        const repasarId = currentData.porRepasar[Math.floor(Math.random() * currentData.porRepasar.length)]
        const res = await fetch('/api/generar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ categoria: categoria === 'Todas' ? undefined : categoria, questionId: repasarId }),
        })
        const d = await res.json()
        if (res.ok && d.id) {
          setPregunta(d)
          setEsRepaso(true)
          setCargando(false)
          return
        }
      } catch { /* fall through to new card */ }
    }

    try {
      const res = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categoria: categoria === 'Todas' ? undefined : categoria }),
      })
      const d = await res.json()
      if (res.status === 401) { window.location.href = '/login'; return }
      if (res.status === 402) { window.location.href = '/upgrade'; return }
      if (!res.ok) throw new Error(d.error)
      setPregunta(d)
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCargando(false)
    }
  }

  const voltear = async () => {
    if (!volteada && pregunta && !respuestaServer) {
      try {
        const res = await fetch('/api/generar', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reveal', questionId: pregunta.id }),
        })
        const d = await res.json() as RespuestaServer
        setRespuestaServer(d)
      } catch {
        return
      }
    }
    setVolteada(v => !v)
    if (!volteada) {
      setTimeout(() => setRespuestaVisible(true), 200)
    } else {
      setRespuestaVisible(false)
    }
  }

  const marcar = (tipo: 'dominio' | 'repasar') => {
    if (!pregunta) return
    setData(prev => {
      const updated = { ...prev }
      const id = pregunta.id

      // Quitar de porRepasar si estaba ahí
      updated.porRepasar = updated.porRepasar.filter(x => x !== id)
      // Quitar de dominadas si estaba ahí (por si se re-marca)
      updated.dominadas = updated.dominadas.filter(x => x !== id)

      if (tipo === 'dominio') {
        updated.dominadas.push(id)
      } else {
        updated.porRepasar.push(id)
      }

      updated.vistas = prev.vistas + 1
      saveData(updated)
      return updated
    })
    cargarTarjeta()
  }

  const resetear = () => {
    const reset: FlashData = { dominadas: [], porRepasar: [], vistas: 0 }
    saveData(reset)
    setData(reset)
    setPregunta(null)
  }

  return (
    <main style={{ padding: '24px', fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
        <button onClick={() => window.location.href = '/home'}
          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', padding: '0', lineHeight: 1 }}>
          ←
        </button>
        <h1 style={{ color: '#00d9ff', fontSize: '1.8rem', margin: 0, letterSpacing: '2px' }}>FLASHCARDS</h1>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>
        Estudio rápido · Las tarjetas pendientes vuelven hasta que las domines
      </p>

      {/* Estadísticas */}
      {totalUnicas > 0 && (
        <div style={{ backgroundColor: '#111827', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Dominio de Flashcards</span>
            <span style={{ color: pctDominio === 100 ? '#4ade80' : '#fbbf24', fontSize: '0.82rem', fontWeight: 'bold' }}>{pctDominio}%</span>
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '99px', height: '6px', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{ width: `${pctDominio}%`, height: '100%', backgroundColor: pctDominio === 100 ? '#4ade80' : '#fbbf24', transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: 12 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#4ade80', fontSize: '1.3rem', fontWeight: 'bold' }}>{data.dominadas.length}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Dominio ✓</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#fbbf24', fontSize: '1.3rem', fontWeight: 'bold' }}>{data.porRepasar.length}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Por repasar ↺</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#94a3b8', fontSize: '1.3rem', fontWeight: 'bold' }}>{totalUnicas}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Vistas</div>
            </div>
          </div>
          {data.porRepasar.length > 0 && (
            <p style={{ color: '#fbbf24', fontSize: '0.78rem', textAlign: 'center', margin: '0 0 12px 0' }}>
              {data.porRepasar.length} tarjeta{data.porRepasar.length > 1 ? 's' : ''} pendiente{data.porRepasar.length > 1 ? 's' : ''} de repaso
            </p>
          )}
          {pctDominio === 100 && (
            <p style={{ color: '#4ade80', fontSize: '0.85rem', textAlign: 'center', margin: '0 0 12px 0', fontWeight: 'bold' }}>
              Todas dominadas
            </p>
          )}
          <button onClick={resetear}
            style={{ width: '100%', padding: 8, backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#475569', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'DM Sans, Arial, sans-serif' }}>
            Reiniciar estadísticas
          </button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {CATEGORIAS.map(cat => (
          <button key={cat} onClick={() => setCategoria(cat)}
            style={{
              padding: '7px 14px', borderRadius: '20px',
              border: `1px solid ${categoria === cat ? '#00d9ff' : '#334155'}`,
              backgroundColor: categoria === cat ? '#00d9ff' : 'transparent',
              color: categoria === cat ? '#0f0f1a' : '#64748b',
              cursor: 'pointer', fontSize: '0.78rem',
              fontWeight: categoria === cat ? 'bold' : 'normal',
              fontFamily: 'DM Sans, Arial, sans-serif',
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Botón inicio */}
      {!pregunta && (
        <button onClick={() => cargarTarjeta()} disabled={cargando}
          style={{
            width: '100%', padding: '16px',
            backgroundColor: cargando ? '#78600a' : '#00d9ff',
            color: '#0f0f1a', border: 'none', borderRadius: '12px',
            fontSize: '1rem', fontWeight: 'bold',
            cursor: cargando ? 'not-allowed' : 'pointer',
            letterSpacing: '1px', fontFamily: 'DM Sans, Arial, sans-serif',
            minHeight: '54px',
          }}>
          {cargando ? 'Cargando...' : data.porRepasar.length > 0 ? `↺ REPASAR ${data.porRepasar.length} PENDIENTES` : '▶  INICIAR FLASHCARDS'}
        </button>
      )}

      {/* Tarjeta */}
      {pregunta && (
        <div>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {esRepaso && <span style={{ backgroundColor: '#78350f', color: '#fbbf24', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 'bold' }}>REPASO</span>}
            {[`#${pregunta.id}`, pregunta.categoria, pregunta.dificultad].map(b => (
              <span key={b} style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem' }}>{b}</span>
            ))}
          </div>

          {/* Tarjeta flip */}
          <div onClick={voltear}
            style={{
              cursor: 'pointer', minHeight: '220px', maxHeight: '55vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' as never,
              borderRadius: '16px',
              border: `2px solid ${volteada ? '#ff006e' : esRepaso ? '#fbbf24' : '#00d9ff'}`,
              backgroundColor: volteada ? '#0d1117' : '#1a1f2e',
              padding: '24px', marginBottom: '20px',
              transition: 'all 0.3s ease', position: 'relative', userSelect: 'none',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            <div style={{ position: 'absolute', top: '14px', right: '16px', fontSize: '0.7rem', letterSpacing: '1px', color: volteada ? '#3b82f6' : '#00d9ff' }}>
              {volteada ? 'REVERSO' : 'ANVERSO'} ↕
            </div>
            {!volteada ? (
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.72rem', letterSpacing: '1px', margin: '0 0 14px 0' }}>PREGUNTA</p>
                <p style={{ margin: 0, lineHeight: '1.75', color: '#e2e8f0', fontSize: pregunta.caso.length > 400 ? '0.82rem' : '0.95rem' }}>
                  {pregunta.caso}
                </p>
              </div>
            ) : (
              <div style={{ opacity: respuestaVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                {respuestaServer ? (
                  <>
                    <p style={{ color: '#3b82f6', fontSize: '0.72rem', letterSpacing: '1px', margin: '0 0 10px 0' }}>RESPUESTA CORRECTA</p>
                    <p style={{ color: '#4ade80', fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                      {respuestaServer.correcta}
                    </p>
                    <p style={{ color: '#60a5fa', fontSize: '0.72rem', letterSpacing: '1px', margin: '0 0 8px 0' }}>JUSTIFICACIÓN</p>
                    <p style={{ margin: 0, lineHeight: '1.75', color: '#bfdbfe', fontSize: respuestaServer.justificacion.length > 300 ? '0.8rem' : '0.88rem' }}>
                      {respuestaServer.justificacion}
                    </p>
                  </>
                ) : (
                  <p style={{ color: '#64748b' }}>Cargando...</p>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          {volteada && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button onClick={() => marcar('repasar')}
                style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '2px solid #fbbf24', backgroundColor: 'transparent', color: '#fbbf24', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'DM Sans, Arial, sans-serif', minHeight: '54px' }}>
                ↺ Repasar
              </button>
              <button onClick={() => marcar('dominio')}
                style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '2px solid #4ade80', backgroundColor: '#14532d', color: '#4ade80', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'DM Sans, Arial, sans-serif', minHeight: '54px' }}>
                ✓ Dominio
              </button>
            </div>
          )}

          {/* Ver respuesta */}
          {!volteada && (
            <button onClick={voltear}
              style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', border: `2px solid ${esRepaso ? '#fbbf24' : '#00d9ff'}`, color: esRepaso ? '#fbbf24' : '#00d9ff', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'DM Sans, Arial, sans-serif', minHeight: '54px' }}>
              Ver respuesta →
            </button>
          )}
        </div>
      )}
    </main>
  )
}
