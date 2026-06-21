'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { QuestionForClient, ClientAnswer, AnswerResult, SubmitExamResponse } from '@/types/exam'

type Phase = 'loading' | 'exam' | 'submitting'

export default function DiarioPage() {
  const router = useRouter()
  const [phase, setPhase]               = useState<Phase>('loading')
  const [questions, setQuestions]       = useState<QuestionForClient[]>([])
  const [sessionId, setSessionId]       = useState('')
  const [startedAt, setStartedAt]       = useState(0)
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [answers, setAnswers]           = useState<ClientAnswer[]>([])
  const [justifVisible, setJustifVisible] = useState(false)
  const [currentResult, setCurrentResult] = useState<AnswerResult | null>(null)
  const [resultSessionId, setResultSessionId] = useState('')
  const [error, setError]               = useState('')

  const startExam = async () => {
    setPhase('loading')
    try {
      const res  = await fetch('/api/exam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ action: 'start', examType: 'diario' }),
      })
      const data = await res.json() as { sessionId: string; questions: QuestionForClient[] }
      if (!res.ok) throw new Error('Error al cargar')
      setQuestions(data.questions)
      setSessionId(data.sessionId)
      setStartedAt(Date.now())
      setCurrentIdx(0)
      setAnswers([])
      setCurrentResult(null)
      setJustifVisible(false)
      setPhase('exam')
    } catch {
      setError('Error al cargar el examen.')
      setPhase('exam')
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('enarm_user_info')
      if (raw) {
        JSON.parse(raw)
      }
    } catch { /* ignore */ }
    startExam()
  }, [])

  const responder = async (selected: string) => {
    if (currentResult) return
    const q = questions[currentIdx]
    const newAnswers = [...answers, { questionId: q.id, selected }]
    setAnswers(newAnswers)

    const isLast = currentIdx >= questions.length - 1

    setPhase('submitting')
    try {
      const res = await fetch('/api/exam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // partial=true → califica sin borrar sesión (para feedback inmediato)
        // partial=false → submit final, guarda en Firestore
        body:    JSON.stringify({ action: 'submit', sessionId, answers: newAnswers, startedAt, partial: !isLast }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()

      if (isLast) {
        const result = data as SubmitExamResponse
        sessionStorage.setItem(`exam_result_${result.sessionId}`, JSON.stringify(result))
        setResultSessionId(result.sessionId)
        setCurrentResult(result.answers[currentIdx])
      } else {
        setCurrentResult((data as { answers: AnswerResult[] }).answers[currentIdx])
      }
      setTimeout(() => setJustifVisible(true), 300)
    } catch {
      setError('Error al calificar.')
    } finally {
      setPhase('exam')
    }
  }

  const siguiente = () => {
    const isLast = currentIdx >= questions.length - 1
    if (isLast) {
      router.push(`/exams/resultado?session=${resultSessionId}`)
      return
    }
    setCurrentIdx(i => i + 1)
    setCurrentResult(null)
    setJustifVisible(false)
  }

  if (phase === 'loading') return <LoadingScreen />

  if (!questions.length) {
    return (
      <main style={S.main}>
        <p style={{ color: '#f87171', textAlign: 'center', marginTop: 80 }}>{error || 'Error al cargar el examen.'}</p>
        <button onClick={startExam} style={{ ...S.btnPrimary, background: 'linear-gradient(135deg, #ff006e, #00d9ff)', marginTop: 16 }}>Reintentar</button>
      </main>
    )
  }

  const q    = questions[currentIdx]
  const prog = ((currentIdx + (currentResult ? 1 : 0)) / questions.length) * 100

  return (
    <main style={S.main}>
      <Header title="SIMULADOR DIARIO" subtitle="10 preguntas · Justificación inmediata" onBack={() => window.location.href = '/home'} />

      {/* Progreso */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Pregunta {currentIdx + 1} de {questions.length}</span>
          <span style={{ color: '#00d9ff', fontSize: '0.8rem', fontWeight: 'bold' }}>{Math.round(prog)}%</span>
        </div>
        <ProgressBar pct={prog} color="#00d9ff" />
      </div>

      {/* Badge */}
      <Badges q={q} />

      {/* Caso */}
      <div style={{ ...S.caso, maxHeight: '40vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <p style={{ margin: 0, lineHeight: '1.75', whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: q.caso.length > 400 ? '0.85rem' : '0.95rem' }}>{q.caso}</p>
      </div>

      {/* Opciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {q.opciones.map((op, i) => {
          let bg = '#1e293b', border = '1px solid #475569', color = '#e2e8f0'
          if (currentResult) {
            if (op === currentResult.correcta) { bg = '#14532d'; border = '2px solid #4ade80'; color = '#bbf7d0' }
            else if (op === currentResult.selected && !currentResult.isCorrect) { bg = '#450a0a'; border = '2px solid #f87171'; color = '#fecaca' }
            else { border = '1px solid #334155'; color = '#64748b' }
          }
          return (
            <button key={i} onClick={() => responder(op)} disabled={!!currentResult}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: op.length > 80 ? '0.82rem' : '0.95rem', textAlign: 'left', cursor: currentResult ? 'default' : 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, Arial, sans-serif', lineHeight: '1.5', minHeight: 54, backgroundColor: bg, border, color, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
              <span style={{ fontWeight: 'bold', marginRight: 10, color: currentResult ? 'inherit' : '#00d9ff' }}>{String.fromCharCode(65 + i)})</span>
              {op}
              {currentResult?.correcta === op   && <span style={{ float: 'right' }}>✓</span>}
              {currentResult?.selected === op && !currentResult.isCorrect && <span style={{ float: 'right' }}>✗</span>}
            </button>
          )
        })}
      </div>

      {/* Justificación inmediata (solo en diario) */}
      {currentResult && (
        <div style={{ backgroundColor: '#0d1117', border: '1px solid #1d4ed8', borderRadius: 12, padding: 20, marginBottom: 20, opacity: justifVisible ? 1 : 0, transition: 'opacity 0.5s ease', maxHeight: '50vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <p style={{ color: '#60a5fa', fontSize: '0.78rem', letterSpacing: '1.5px', margin: '0 0 12px 0' }}>📋 ANÁLISIS TÉCNICO — GPC</p>
          <p style={{ margin: 0, lineHeight: '1.75', color: '#bfdbfe', fontSize: currentResult.justificacion && currentResult.justificacion.length > 300 ? '0.82rem' : '0.9rem' }}>{currentResult.justificacion || 'Justificación no disponible.'}</p>
        </div>
      )}

      {currentResult && (
        <button onClick={siguiente} style={{ ...S.btnPrimary, background: 'linear-gradient(135deg, #ff006e, #00d9ff)' }}>
          {currentIdx >= questions.length - 1 ? 'Ver resultados →' : 'Siguiente pregunta →'}
        </button>
      )}

      {error && <p style={{ color: '#f87171', textAlign: 'center' }}>{error}</p>}
    </main>
  )
}

// ──── Componentes compartidos ────────────────
function LoadingScreen() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#00d9ff', fontFamily: 'DM Sans, Arial, sans-serif', fontSize: '1.1rem' }}>Cargando preguntas...</p>
    </main>
  )
}

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>←</button>
        <h1 style={{ color: '#00d9ff', fontSize: '1.6rem', margin: 0, letterSpacing: 2 }}>{title}</h1>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 24, paddingLeft: 32 }}>{subtitle}</p>
    </div>
  )
}

function ProgressBar({ pct, color = '#00d9ff' }: { pct: number; color?: string }) {
  return (
    <div style={{ backgroundColor: '#1e293b', borderRadius: 99, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, transition: 'width 0.4s' }} />
    </div>
  )
}

function Badges({ q }: { q: QuestionForClient }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      {[`#${q.id}`, q.categoria, q.dificultad].map(b => (
        <span key={b} style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '3px 10px', borderRadius: 10, fontSize: '0.72rem' }}>{b}</span>
      ))}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:       { padding: 24, fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: 780, margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' },
  caso:       { backgroundColor: '#1a1f2e', borderLeft: '4px solid #00d9ff', borderRadius: 10, padding: 22, marginBottom: 20 },
  btnPrimary: { width: '100%', padding: 16, color: '#0f0f1a', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'DM Sans, Arial, sans-serif', minHeight: 54, background: 'linear-gradient(135deg, #ff006e, #00d9ff)' },
}

export { LoadingScreen, Header, ProgressBar, Badges, S }
