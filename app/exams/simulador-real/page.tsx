'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { QuestionForClient, ClientAnswer } from '@/types/exam'

type Phase = 'intro' | 'loading' | 'exam' | 'submitting'

const TIEMPO_LIMITE = 5 * 60 * 60 // CIFRHS: 5 horas (300 minutos)

export default function SimuladorRealPage() {
  const router = useRouter()
  const [phase, setPhase]           = useState<Phase>('intro')
  const [questions, setQuestions]   = useState<QuestionForClient[]>([])
  const [sessionId, setSessionId]   = useState('')
  const [startedAt, setStartedAt]   = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers]       = useState<ClientAnswer[]>([])
  const [seleccion, setSeleccion]   = useState('')
  const [respondido, setRespondido] = useState(false)
  const [timeLeft, setTimeLeft]     = useState(TIEMPO_LIMITE)
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null)
  const submitExamRef               = useRef<(timeUp: boolean) => void>(() => {})

  useEffect(() => {
    try {
      const raw = localStorage.getItem('enarm_user_info')
      if (raw) { JSON.parse(raw) }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (phase !== 'exam' || !questions.length) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase, questions.length])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const timerColor = timeLeft < 1800 ? '#f87171' : timeLeft < 3600 ? '#fbbf24' : '#4ade80'

  const submitExam = async (timeUp: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('submitting')
    try {
      const res = await fetch('/api/exam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ action: 'submit', sessionId, answers, startedAt }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      sessionStorage.setItem(`exam_result_${data.sessionId}`, JSON.stringify(data))
      router.push(`/exams/resultado?session=${data.sessionId}${timeUp ? '&timeup=1' : ''}`)
    } catch {
      setPhase('exam')
      alert('Error al enviar el examen. Intenta de nuevo.')
    }
  }

  useEffect(() => { submitExamRef.current = submitExam })

  // Cronómetro regresivo
  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          submitExamRef.current(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const startExam = async () => {
    setPhase('loading')
    try {
      const res  = await fetch('/api/exam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ action: 'start', examType: 'simulador_cronometrado' }),
      })
      if (res.status === 401) { window.location.href = '/login'; return }
      if (res.status === 402) { window.location.href = '/upgrade'; return }
      const data = await res.json() as { sessionId: string; questions: QuestionForClient[] }
      if (!res.ok) throw new Error()
      setQuestions(data.questions)
      setSessionId(data.sessionId)
      setStartedAt(Date.now())
      setTimeLeft(TIEMPO_LIMITE)
      setPhase('exam')
    } catch {
      setPhase('intro')
    }
  }

  const seleccionar = (op: string) => {
    if (respondido) return
    setSeleccion(op)
  }

  const confirmarRespuesta = () => {
    if (respondido || !seleccion) return
    setRespondido(true)
    setAnswers(prev => [...prev, { questionId: questions[currentIdx].id, selected: seleccion }])
  }

  const siguiente = () => {
    if (currentIdx >= questions.length - 1) { submitExam(false); return }
    setCurrentIdx(i => i + 1)
    setRespondido(false)
    setSeleccion('')
  }

  if (phase === 'intro') {
    return (
      <main style={S.main}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => window.location.href = '/home'} style={S.back}>←</button>
          <h1 style={S.h1}>SIMULADOR REAL CRONOMETRADO</h1>
        </div>

        <div style={{ backgroundColor: '#450a0a', border: '1px solid #f87171', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <p style={{ color: '#fca5a5', margin: 0, fontWeight: 'bold', marginBottom: 8 }}>⚠ SIMULACIÓN DE CONDICIONES REALES</p>
          <p style={{ color: '#fecaca', margin: 0, lineHeight: 1.7, fontSize: '0.9rem' }}>
            280 reactivos · Cronómetro de 5 horas · Formato CIFRHS oficial · Las respuestas NO se muestran hasta el final.
            El examen se enviará automáticamente cuando el tiempo expire.
          </p>
        </div>

        {[['280', 'reactivos — formato CIFRHS 2025'], ['5:00:00', 'tiempo límite oficial'], ['~1 min', 'por reactivo (ritmo ENARM real)']].map(([v, l]) => (
          <div key={l} style={S.stat}><span style={{ color: '#f87171', fontSize: '1.2rem', fontWeight: 'bold', minWidth: 80 }}>{v}</span><span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>{l}</span></div>
        ))}

        <button onClick={startExam} style={{ ...S.btnRed, marginTop: 24 }}>INICIAR SIMULADOR REAL →</button>
      </main>
    )
  }

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <main style={{ ...S.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#f87171', fontSize: '1.1rem' }}>{phase === 'submitting' ? 'Calificando...' : 'Preparando 280 reactivos...'}</p>
      </main>
    )
  }

  const q    = questions[currentIdx]
  const prog = ((currentIdx + (respondido ? 1 : 0)) / questions.length) * 100

  return (
    <main style={S.main}>
      {/* Header con cronómetro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: '#111827', borderRadius: 12, padding: '12px 16px', border: '1px solid #1e293b' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{currentIdx + 1} / {questions.length}</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: timerColor, fontSize: '1.6rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 2 }}>{formatTime(timeLeft)}</div>
          <div style={{ color: '#475569', fontSize: '0.65rem' }}>TIEMPO RESTANTE</div>
        </div>
        <button onClick={() => submitExam(false)} style={{ backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'DM Sans, Arial, sans-serif' }}>
          Terminar
        </button>
      </div>

      <div style={{ height: 4, backgroundColor: '#1e293b', borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ width: `${prog}%`, height: '100%', backgroundColor: '#f87171', transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[`#${q.id}`, q.categoria].map(b => (
          <span key={b} style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '3px 10px', borderRadius: 10, fontSize: '0.72rem' }}>{b}</span>
        ))}
      </div>

      <div style={{ ...S.caso, maxHeight: '40vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <p style={{ margin: 0, lineHeight: '1.75', whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: q.caso.length > 400 ? '0.85rem' : '0.95rem' }}>{q.caso}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {q.opciones.map((op, i) => (
          <button key={i} onClick={() => seleccionar(op)} disabled={respondido}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: op.length > 80 ? '0.82rem' : '0.95rem', textAlign: 'left', cursor: respondido ? 'default' : 'pointer', fontFamily: 'DM Sans, Arial, sans-serif', lineHeight: '1.5', minHeight: 54, backgroundColor: seleccion === op ? '#1e3a5f' : '#1e293b', border: seleccion === op ? '2px solid #3b82f6' : '1px solid #475569', color: '#e2e8f0', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
            <span style={{ fontWeight: 'bold', marginRight: 10, color: respondido ? 'inherit' : '#f87171' }}>{String.fromCharCode(65 + i)})</span>
            {op}
          </button>
        ))}
      </div>

      {seleccion && !respondido && (
        <button onClick={confirmarRespuesta} style={{ ...S.btnRed, marginBottom: 12 }}>Confirmar respuesta</button>
      )}

      {respondido && (
        <button onClick={siguiente} style={S.btnRed}>
          {currentIdx >= questions.length - 1 ? 'Finalizar y ver resultados →' : 'Siguiente →'}
        </button>
      )}
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:    { padding: 24, fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: 780, margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' },
  h1:      { color: '#f87171', fontSize: '1.5rem', margin: 0, letterSpacing: 1 },
  back:    { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', padding: 0 },
  stat:    { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#111827', borderRadius: 10, padding: '12px 16px', border: '1px solid #1e293b', marginBottom: 10 },
  caso:    { backgroundColor: '#1a1f2e', borderLeft: '4px solid #f87171', borderRadius: 10, padding: 22, marginBottom: 20 },
  btnRed:  { width: '100%', padding: 16, backgroundColor: '#991b1b', color: '#fecaca', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'DM Sans, Arial, sans-serif', minHeight: 54 },
}
