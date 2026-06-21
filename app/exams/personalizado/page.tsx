'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { QuestionForClient, ClientAnswer, Specialty } from '@/types/exam'
import { ALL_SPECIALTIES } from '@/types/exam'

type Phase = 'config' | 'loading' | 'exam' | 'submitting'

export default function PersonalizadoPage() {
  const router = useRouter()
  const [phase, setPhase]           = useState<Phase>('config')
  const [numQ, setNumQ]             = useState(20)
  const [selected, setSelected]     = useState<Specialty[]>([...ALL_SPECIALTIES])
  const [questions, setQuestions]   = useState<QuestionForClient[]>([])
  const [sessionId, setSessionId]   = useState('')
  const [startedAt, setStartedAt]   = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers]       = useState<ClientAnswer[]>([])
  const [respondido, setRespondido] = useState(false)
  const [seleccion, setSeleccion]   = useState('')
  const [error, setError]           = useState('')

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

  const toggleSpecialty = (sp: Specialty) => {
    setSelected(prev =>
      prev.includes(sp)
        ? prev.length > 1 ? prev.filter(s => s !== sp) : prev
        : [...prev, sp]
    )
  }

  const startExam = async () => {
    setPhase('loading')
    try {
      const res  = await fetch('/api/exam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ action: 'start', examType: 'personalizado', specialties: selected, numQuestions: numQ }),
      })
      if (res.status === 401) { window.location.href = '/login'; return }
      if (res.status === 402) { window.location.href = '/upgrade'; return }
      const data = await res.json() as { sessionId: string; questions: QuestionForClient[] }
      if (!res.ok) throw new Error()
      setQuestions(data.questions)
      setSessionId(data.sessionId)
      setStartedAt(Date.now())
      setCurrentIdx(0)
      setAnswers([])
      setRespondido(false)
      setSeleccion('')
      setPhase('exam')
    } catch { setError('Error al iniciar.'); setPhase('config') }
  }

  const responder = (op: string) => {
    if (respondido) return
    setSeleccion(op)
    setRespondido(true)
    setAnswers(prev => [...prev, { questionId: questions[currentIdx].id, selected: op }])
  }

  const siguiente = () => {
    if (currentIdx >= questions.length - 1) {
      submitExam()
      return
    }
    setCurrentIdx(i => i + 1)
    setRespondido(false)
    setSeleccion('')
  }

  const submitExam = async () => {
    setPhase('submitting')
    try {
      const res = await fetch('/api/exam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ action: 'submit', sessionId, answers, startedAt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      sessionStorage.setItem(`exam_result_${data.sessionId}`, JSON.stringify(data))
      router.push(`/exams/resultado?session=${data.sessionId}`)
    } catch { setError('Error al enviar.'); setPhase('exam') }
  }

  // ── Pantalla de configuración ──
  if (phase === 'config') {
    return (
      <main style={S.main}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={() => window.location.href = '/home'} style={S.backBtn}>←</button>
          <h1 style={S.title}>EXAMEN PERSONALIZADO</h1>
        </div>
        <p style={S.sub}>Elige tus especialidades y número de preguntas</p>

        {/* Número de preguntas */}
        <div style={S.section}>
          <p style={S.sectionLabel}>NÚMERO DE PREGUNTAS: <span style={{ color: '#00d9ff' }}>{numQ}</span></p>
          <input type="range" min={10} max={40} step={5} value={numQ} onChange={e => setNumQ(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#00d9ff' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.75rem', marginTop: 4 }}>
            <span>10</span><span>40</span>
          </div>
        </div>

        {/* Especialidades */}
        <div style={S.section}>
          <p style={S.sectionLabel}>ESPECIALIDADES</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ALL_SPECIALTIES.map(sp => (
              <button key={sp} onClick={() => toggleSpecialty(sp)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1px solid ${selected.includes(sp) ? '#00d9ff' : '#334155'}`, backgroundColor: selected.includes(sp) ? '#1a1f2e' : 'transparent', color: selected.includes(sp) ? '#e2e8f0' : '#64748b', cursor: 'pointer', fontFamily: 'DM Sans, Arial, sans-serif', fontSize: '0.9rem', textAlign: 'left' }}>
                <span style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected.includes(sp) ? '#00d9ff' : '#334155'}`, backgroundColor: selected.includes(sp) ? '#00d9ff' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#0f0f1a', flexShrink: 0 }}>
                  {selected.includes(sp) ? '✓' : ''}
                </span>
                {sp}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#f87171', textAlign: 'center', marginBottom: 12 }}>{error}</p>}

        <button onClick={startExam} style={{ ...S.btnGold, width: '100%', marginTop: 8 }}>
          INICIAR EXAMEN — {numQ} PREGUNTAS →
        </button>
      </main>
    )
  }

  if (phase === 'loading' || phase === 'submitting') {
    return <LoadingScreen msg={phase === 'submitting' ? 'Calificando...' : 'Cargando...'} />
  }

  const q    = questions[currentIdx]
  const prog = ((currentIdx + (respondido ? 1 : 0)) / questions.length) * 100

  return (
    <main style={S.main}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button onClick={() => window.location.href = '/home'} style={S.backBtn}>←</button>
        <h1 style={S.title}>PERSONALIZADO</h1>
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.82rem' }}>{currentIdx + 1}/{questions.length}</span>
      </div>
      <div style={{ height: 6, backgroundColor: '#1e293b', borderRadius: 99, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ width: `${prog}%`, height: '100%', backgroundColor: '#00d9ff', transition: 'width 0.4s' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[`#${q.id}`, q.categoria, q.dificultad].map(b => (
          <span key={b} style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '3px 10px', borderRadius: 10, fontSize: '0.72rem' }}>{b}</span>
        ))}
      </div>

      <div style={{ ...S.caso, maxHeight: '40vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <p style={{ margin: 0, lineHeight: '1.75', whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: q.caso.length > 400 ? '0.85rem' : '0.95rem' }}>{q.caso}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {q.opciones.map((op, i) => {
          const isSelected = seleccion === op
          const bg     = respondido && isSelected ? '#1e3a5f' : '#1e293b'
          const border = respondido && isSelected ? '2px solid #3b82f6' : '1px solid #475569'
          return (
            <button key={i} onClick={() => responder(op)} disabled={respondido}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: op.length > 80 ? '0.82rem' : '0.95rem', textAlign: 'left', cursor: respondido ? 'default' : 'pointer', fontFamily: 'DM Sans, Arial, sans-serif', lineHeight: '1.5', minHeight: 54, backgroundColor: bg, border, color: '#e2e8f0', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
              <span style={{ fontWeight: 'bold', marginRight: 10, color: respondido ? 'inherit' : '#00d9ff' }}>{String.fromCharCode(65 + i)})</span>
              {op}
            </button>
          )
        })}
      </div>

      {respondido && (
        <button onClick={siguiente} style={S.btnGold}>
          {currentIdx >= questions.length - 1 ? 'Ver resultados →' : 'Siguiente →'}
        </button>
      )}
    </main>
  )
}

function LoadingScreen({ msg = 'Cargando...' }) {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#00d9ff', fontFamily: 'DM Sans, Arial, sans-serif', fontSize: '1.1rem' }}>{msg}</p>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:         { padding: 24, fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: 780, margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' },
  title:        { color: '#00d9ff', fontSize: '1.6rem', margin: 0, letterSpacing: 2 },
  sub:          { color: '#64748b', fontSize: '0.82rem', marginBottom: 28, paddingLeft: 32 },
  backBtn:      { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', padding: 0 },
  section:      { backgroundColor: '#111827', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid #1e293b' },
  sectionLabel: { color: '#94a3b8', fontSize: '0.78rem', letterSpacing: '1px', margin: '0 0 14px 0' },
  caso:         { backgroundColor: '#1a1f2e', borderLeft: '4px solid #00d9ff', borderRadius: 10, padding: 22, marginBottom: 20 },
  btnGold:      { width: '100%', padding: 16, background: 'linear-gradient(135deg, #ff006e, #00d9ff)', color: '#0f0f1a', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'DM Sans, Arial, sans-serif', minHeight: 54 },
}
