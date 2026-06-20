'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { QuestionForClient, ClientAnswer } from '@/types/exam'

type Phase = 'intro' | 'loading' | 'exam' | 'submitting'

export default function DiagnosticoPage() {
  const router = useRouter()
  const [phase, setPhase]           = useState<Phase>('intro')
  const [questions, setQuestions]   = useState<QuestionForClient[]>([])
  const [sessionId, setSessionId]   = useState('')
  const [startedAt, setStartedAt]   = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers]       = useState<ClientAnswer[]>([])
  const [seleccion, setSeleccion]   = useState('')
  const [respondido, setRespondido] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('enarm_user_info')
      if (raw) {
        const u = JSON.parse(raw)
        // Acceso validado por proxy
      }
    } catch { /* ignore */ }
  }, [])

  const startExam = async () => {
    setPhase('loading')
    try {
      const res  = await fetch('/api/exam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ action: 'start', examType: 'diagnostico' }),
      })
      const data = await res.json() as { sessionId: string; questions: QuestionForClient[] }
      if (!res.ok) throw new Error()
      setQuestions(data.questions)
      setSessionId(data.sessionId)
      setStartedAt(Date.now())
      setPhase('exam')
    } catch {
      setPhase('intro')
    }
  }

  const responder = (op: string) => {
    if (respondido) return
    setSeleccion(op)
    setRespondido(true)
    setAnswers(prev => [...prev, { questionId: questions[currentIdx].id, selected: op }])
  }

  const siguiente = async () => {
    const isLast = currentIdx >= questions.length - 1
    if (isLast) {
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
      return
    }
    setCurrentIdx(i => i + 1)
    setRespondido(false)
    setSeleccion('')
  }

  if (phase === 'intro') {
    return (
      <main style={S.main}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => window.location.href = '/home'} style={S.back}>←</button>
          <h1 style={S.h1}>EXAMEN DIAGNÓSTICO</h1>
        </div>

        <div style={S.infoCard}>
          <p style={S.badge}>◉ EVALUACIÓN INICIAL</p>
          <h2 style={{ color: '#e2e8f0', margin: '0 0 16px 0', fontSize: '1.3rem' }}>¿Cuál es tu nivel real?</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
            Este examen evalúa tu nivel en las 5 especialidades del ENARM con <strong style={{ color: '#00d9ff' }}>180 preguntas</strong> (36 por área).
            Al terminar verás tu perfil académico detallado con fortalezas y áreas de mejora.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {[
            ['180', 'preguntas totales'],
            ['36', 'preguntas por especialidad'],
            ['5', 'especialidades evaluadas'],
            ['~', 'sin límite de tiempo'],
          ].map(([val, label]) => (
            <div key={label} style={S.stat}>
              <span style={{ color: '#00d9ff', fontSize: '1.3rem', fontWeight: 'bold', minWidth: 32 }}>{val}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>{label}</span>
            </div>
          ))}
        </div>

        <p style={{ color: '#475569', fontSize: '0.82rem', marginBottom: 20 }}>
          💡 Puedes repetir este diagnóstico cada 30-45 días para medir tu progreso.
        </p>

        <button onClick={startExam} style={S.btnGold}>INICIAR DIAGNÓSTICO →</button>
      </main>
    )
  }

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <main style={{ ...S.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#00d9ff', fontSize: '1.1rem' }}>{phase === 'submitting' ? 'Generando tu perfil académico...' : 'Preparando 180 preguntas...'}</p>
      </main>
    )
  }

  const q    = questions[currentIdx]
  const prog = ((currentIdx + (respondido ? 1 : 0)) / questions.length) * 100

  // Agrupar por especialidad para sección indicator
  const specialtiesOrder = ['Medicina Interna', 'Pediatría', 'Ginecología', 'Cirugía', 'Urgencias']
  const spIdx = Math.floor(currentIdx / 36)
  const currentSp = specialtiesOrder[Math.min(spIdx, 4)]

  return (
    <main style={S.main}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 style={{ ...S.h1, fontSize: '1.4rem' }}>DIAGNÓSTICO</h1>
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.82rem' }}>{currentIdx + 1} / {questions.length}</span>
      </div>

      {/* Barra de progreso con secciones */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ height: 6, backgroundColor: '#1e293b', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ width: `${prog}%`, height: '100%', backgroundColor: '#00d9ff', transition: 'width 0.3s' }} />
        </div>
        <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>Área actual: <span style={{ color: '#94a3b8' }}>{currentSp}</span></p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[`#${q.id}`, q.categoria, q.dificultad].map(b => (
          <span key={b} style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '3px 10px', borderRadius: 10, fontSize: '0.72rem' }}>{b}</span>
        ))}
      </div>

      <div style={S.caso}><p style={{ margin: 0, lineHeight: '1.85', whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{q.caso}</p></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {q.opciones.map((op, i) => {
          const isSelected = seleccion === op
          return (
            <button key={i} onClick={() => responder(op)} disabled={respondido}
              style={{ width: '100%', padding: '16px 20px', borderRadius: 12, fontSize: '0.95rem', textAlign: 'left', cursor: respondido ? 'default' : 'pointer', fontFamily: 'DM Sans, Arial, sans-serif', lineHeight: '1.5', minHeight: 54, backgroundColor: isSelected && respondido ? '#1e3a5f' : '#1e293b', border: isSelected && respondido ? '2px solid #3b82f6' : '1px solid #475569', color: '#e2e8f0' }}>
              <span style={{ fontWeight: 'bold', marginRight: 10, color: respondido ? 'inherit' : '#00d9ff' }}>{String.fromCharCode(65 + i)})</span>
              {op}
            </button>
          )
        })}
      </div>

      {/* Sin justificación durante el diagnóstico */}
      {respondido && (
        <button onClick={siguiente} style={S.btnGold}>
          {currentIdx >= questions.length - 1 ? 'Finalizar y ver perfil →' : 'Siguiente →'}
        </button>
      )}
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:     { padding: 24, fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: 780, margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' },
  h1:       { color: '#00d9ff', fontSize: '1.6rem', margin: 0, letterSpacing: 2 },
  back:     { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', padding: '8px 12px', minHeight: 44, minWidth: 44 },
  badge:    { color: '#00d9ff', fontSize: '0.72rem', letterSpacing: '2px', margin: '0 0 8px 0' },
  infoCard: { backgroundColor: '#111827', borderRadius: 14, padding: 24, marginBottom: 20, border: '1px solid #1e293b' },
  stat:     { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#111827', borderRadius: 10, padding: '12px 16px', border: '1px solid #1e293b' },
  caso:     { backgroundColor: '#1a1f2e', borderLeft: '4px solid #00d9ff', borderRadius: 10, padding: 22, marginBottom: 20 },
  btnGold:  { width: '100%', padding: 16, background: 'linear-gradient(135deg, #ff006e, #00d9ff)', color: '#0f0f1a', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'DM Sans, Arial, sans-serif', minHeight: 54 },
}
