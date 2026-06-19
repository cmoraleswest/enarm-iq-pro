'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { QuestionForClient, ClientAnswer } from '@/types/exam'

type Phase = 'intro' | 'loading' | 'exam' | 'submitting'

export default function SimuladorLibrePage() {
  const router = useRouter()
  const [phase, setPhase]           = useState<Phase>('intro')
  const [questions, setQuestions]   = useState<QuestionForClient[]>([])
  const [sessionId, setSessionId]   = useState('')
  const [startedAt, setStartedAt]   = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers]       = useState<ClientAnswer[]>([])
  const [seleccion, setSeleccion]   = useState('')
  const [respondido, setRespondido] = useState(false)
  const [elapsed, setElapsed]       = useState(0)
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const startExam = async () => {
    setPhase('loading')
    try {
      const res  = await fetch('/api/exam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ action: 'start', examType: 'simulador_libre' }),
      })
      const data = await res.json() as { sessionId: string; questions: QuestionForClient[] }
      if (!res.ok) throw new Error()
      setQuestions(data.questions)
      setSessionId(data.sessionId)
      setStartedAt(Date.now())
      setElapsed(0)
      setPhase('exam')
    } catch {
      setPhase('intro')
    }
  }

  const submitExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('submitting')
    const res = await fetch('/api/exam', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:    JSON.stringify({ action: 'submit', sessionId, answers, startedAt }),
    })
    const data = await res.json()
    sessionStorage.setItem(`exam_result_${data.sessionId}`, JSON.stringify(data))
    router.push(`/exams/resultado?session=${data.sessionId}`)
  }

  const responder = (op: string) => {
    if (respondido) return
    setSeleccion(op)
    setRespondido(true)
    setAnswers(prev => [...prev, { questionId: questions[currentIdx].id, selected: op }])
  }

  const siguiente = () => {
    if (currentIdx >= questions.length - 1) { submitExam(); return }
    setCurrentIdx(i => i + 1)
    setRespondido(false)
    setSeleccion('')
  }

  if (phase === 'intro') {
    return (
      <main style={S.main}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => window.location.href = '/home'} style={S.back}>←</button>
          <h1 style={S.h1}>SIMULADOR SIN CRONÓMETRO</h1>
        </div>

        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <p style={{ color: '#93c5fd', margin: 0, fontWeight: 'bold', marginBottom: 8 }}>◉ SIMULACIÓN COMPLETA SIN PRESIÓN</p>
          <p style={{ color: '#bfdbfe', margin: 0, lineHeight: 1.7, fontSize: '0.9rem' }}>
            360 preguntas · Sin límite de tiempo · Se registra cuánto tardas · Justificaciones al final.
          </p>
        </div>

        {[['360', 'preguntas — simulación completa'], ['∞', 'sin límite de tiempo'], ['⏱', 'registra tu tiempo real']].map(([v, l]) => (
          <div key={l} style={S.stat}><span style={{ color: '#60a5fa', fontSize: '1.2rem', fontWeight: 'bold', minWidth: 40 }}>{v}</span><span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>{l}</span></div>
        ))}

        <button onClick={startExam} style={{ ...S.btnBlue, marginTop: 24 }}>INICIAR SIMULADOR →</button>
      </main>
    )
  }

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <main style={{ ...S.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#60a5fa', fontSize: '1.1rem' }}>{phase === 'submitting' ? 'Calificando tu examen...' : 'Cargando 360 preguntas...'}</p>
      </main>
    )
  }

  const q    = questions[currentIdx]
  const prog = ((currentIdx + (respondido ? 1 : 0)) / questions.length) * 100

  return (
    <main style={S.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: '#111827', borderRadius: 12, padding: '12px 16px', border: '1px solid #1e293b' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{currentIdx + 1} / {questions.length}</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#60a5fa', fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatElapsed(elapsed)}</div>
          <div style={{ color: '#475569', fontSize: '0.65rem' }}>TIEMPO TRANSCURRIDO</div>
        </div>
        <button onClick={submitExam} style={{ backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'DM Sans, Arial, sans-serif' }}>
          Terminar
        </button>
      </div>

      <div style={{ height: 4, backgroundColor: '#1e293b', borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ width: `${prog}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[`#${q.id}`, q.categoria, q.dificultad].map(b => (
          <span key={b} style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '3px 10px', borderRadius: 10, fontSize: '0.72rem' }}>{b}</span>
        ))}
      </div>

      <div style={{ backgroundColor: '#1a1f2e', borderLeft: '4px solid #3b82f6', borderRadius: 10, padding: 22, marginBottom: 20 }}>
        <p style={{ margin: 0, lineHeight: '1.85', whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{q.caso}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {q.opciones.map((op, i) => (
          <button key={i} onClick={() => responder(op)} disabled={respondido}
            style={{ width: '100%', padding: '16px 20px', borderRadius: 12, fontSize: '0.95rem', textAlign: 'left', cursor: respondido ? 'default' : 'pointer', fontFamily: 'DM Sans, Arial, sans-serif', lineHeight: '1.5', minHeight: 54, backgroundColor: seleccion === op && respondido ? '#1e3a5f' : '#1e293b', border: seleccion === op && respondido ? '2px solid #3b82f6' : '1px solid #475569', color: '#e2e8f0' }}>
            <span style={{ fontWeight: 'bold', marginRight: 10, color: respondido ? 'inherit' : '#60a5fa' }}>{String.fromCharCode(65 + i)})</span>
            {op}
          </button>
        ))}
      </div>

      {respondido && (
        <button onClick={siguiente} style={S.btnBlue}>
          {currentIdx >= questions.length - 1 ? 'Finalizar y ver resultados →' : 'Siguiente →'}
        </button>
      )}
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:    { padding: 24, fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: 780, margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' },
  h1:      { color: '#60a5fa', fontSize: '1.5rem', margin: 0, letterSpacing: 1 },
  back:    { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', padding: 0 },
  stat:    { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#111827', borderRadius: 10, padding: '12px 16px', border: '1px solid #1e293b', marginBottom: 10 },
  btnBlue: { width: '100%', padding: 16, backgroundColor: '#1d4ed8', color: '#bfdbfe', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'DM Sans, Arial, sans-serif', minHeight: 54 },
}
