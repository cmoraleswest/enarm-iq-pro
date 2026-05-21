'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SubmitExamResponse, AnswerResult, SpecialtyStats } from '@/types/exam'

export default function ResultadoPage() {
  const router       = useRouter()
  const params       = useSearchParams()
  const sessionId    = params.get('session') ?? ''
  const timeUp       = params.get('timeup') === '1'

  const [result, setResult]     = useState<SubmitExamResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<'todos' | 'incorrectas'>('todos')
  const [expandIdx, setExpandIdx] = useState<number | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(`exam_result_${sessionId}`)
    if (raw) {
      setResult(JSON.parse(raw) as SubmitExamResponse)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [sessionId])

  // La página de resultado recibe los datos via sessionStorage
  // (se guarda desde la página del examen antes de navegar)

  if (loading) {
    return <Screen><p style={{ color: '#D4AF37' }}>Cargando resultados...</p></Screen>
  }

  if (!result) {
    return (
      <Screen>
        <p style={{ color: '#f87171', marginBottom: 16 }}>No se encontraron los resultados de este examen.</p>
        <button onClick={() => router.push('/')} style={S.btnGold}>Volver al inicio</button>
      </Screen>
    )
  }

  const pctColor = result.pct >= 70 ? '#4ade80' : result.pct >= 50 ? '#fbbf24' : '#f87171'
  const filteredAnswers = filter === 'incorrectas'
    ? result.answers.filter(a => !a.isCorrect)
    : result.answers

  const examLabel: Record<string, string> = {
    diagnostico:             'Diagnóstico Inicial',
    diario:                  'Simulador Diario',
    personalizado:           'Examen Personalizado',
    simulador_cronometrado:  'Simulador Real Cronometrado',
    simulador_libre:         'Simulador Sin Cronómetro',
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m} minutos`
  }

  return (
    <main style={S.main}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ color: '#D4AF37', fontSize: '1.6rem', margin: 0, letterSpacing: 2 }}>RESULTADOS</h1>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: '1px solid #334155', color: '#64748b', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Georgia, serif' }}>
          Inicio
        </button>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 24 }}>{examLabel[result.examType] ?? result.examType}</p>

      {timeUp && (
        <div style={{ backgroundColor: '#450a0a', border: '1px solid #f87171', borderRadius: 10, padding: '10px 16px', marginBottom: 16 }}>
          <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.88rem' }}>⏰ El tiempo se agotó y el examen se envió automáticamente.</p>
        </div>
      )}

      {/* Score principal */}
      <div style={{ backgroundColor: '#111827', borderRadius: 16, padding: 28, marginBottom: 20, border: '1px solid #1e293b', textAlign: 'center' }}>
        <div style={{ color: pctColor, fontSize: '4rem', fontWeight: 'bold', lineHeight: 1 }}>{result.pct}%</div>
        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>
          {result.correctAnswers} correctas de {result.totalQuestions} preguntas
        </div>
        {result.timeTakenSeconds > 0 && (
          <div style={{ color: '#475569', fontSize: '0.82rem', marginTop: 8 }}>
            Tiempo: {formatTime(result.timeTakenSeconds)}
          </div>
        )}

        {/* Barra */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: 99, height: 10, margin: '20px 0 0 0', overflow: 'hidden' }}>
          <div style={{ width: `${result.pct}%`, height: '100%', backgroundColor: pctColor, transition: 'width 0.8s' }} />
        </div>
      </div>

      {/* Por especialidad */}
      <div style={{ backgroundColor: '#111827', borderRadius: 14, padding: 20, marginBottom: 20, border: '1px solid #1e293b' }}>
        <h2 style={{ color: '#94a3b8', fontSize: '0.78rem', letterSpacing: '2px', margin: '0 0 16px 0' }}>RESULTADOS POR ESPECIALIDAD</h2>
        {result.bySpecialty.map(sp => (
          <SpecialtyRow key={sp.specialty} sp={sp} />
        ))}
      </div>

      {/* Revisión de respuestas */}
      <div style={{ backgroundColor: '#111827', borderRadius: 14, padding: 20, border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#94a3b8', fontSize: '0.78rem', letterSpacing: '2px', margin: 0 }}>REVISIÓN DE RESPUESTAS</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['todos', 'incorrectas'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Georgia, serif', backgroundColor: filter === f ? '#D4AF37' : 'transparent', color: filter === f ? '#0f0f1a' : '#64748b', border: `1px solid ${filter === f ? '#D4AF37' : '#334155'}` }}>
                {f === 'todos' ? 'Todas' : 'Solo incorrectas'}
              </button>
            ))}
          </div>
        </div>

        {filteredAnswers.map((ans, i) => (
          <AnswerCard key={ans.questionId} ans={ans} idx={i} expanded={expandIdx === i} onToggle={() => setExpandIdx(expandIdx === i ? null : i)} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button onClick={() => router.push('/')} style={{ flex: 1, padding: 14, backgroundColor: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: 12, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          Volver al inicio
        </button>
        <button onClick={() => router.push('/perfil')} style={{ flex: 1, padding: 14, backgroundColor: '#D4AF37', color: '#0f0f1a', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
          Ver mi perfil →
        </button>
      </div>
    </main>
  )
}

function SpecialtyRow({ sp }: { sp: SpecialtyStats }) {
  const color = sp.pct >= 70 ? '#4ade80' : sp.pct >= 50 ? '#fbbf24' : '#f87171'
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{sp.specialty}</span>
        <span style={{ color, fontSize: '0.85rem', fontWeight: 'bold' }}>{sp.correct}/{sp.total} — {sp.pct}%</span>
      </div>
      <div style={{ backgroundColor: '#1e293b', borderRadius: 99, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${sp.pct}%`, height: '100%', backgroundColor: color, transition: 'width 0.6s' }} />
      </div>
    </div>
  )
}

function AnswerCard({ ans, idx, expanded, onToggle }: { ans: AnswerResult; idx: number; expanded: boolean; onToggle: () => void }) {
  return (
    <div style={{ marginBottom: 10, borderRadius: 10, border: `1px solid ${ans.isCorrect ? '#14532d' : '#450a0a'}`, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', padding: '12px 16px', backgroundColor: ans.isCorrect ? '#0d1f12' : '#1a0606', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Georgia, serif', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>#{idx + 1}</span>
        <span style={{ color: '#cbd5e1', fontSize: '0.85rem', flex: 1, lineHeight: '1.4' }}>
          {ans.caso.length > 100 ? ans.caso.slice(0, 100) + '…' : ans.caso}
        </span>
        <span style={{ color: ans.isCorrect ? '#4ade80' : '#f87171', fontSize: '1rem', flexShrink: 0 }}>
          {ans.isCorrect ? '✓' : '✗'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '16px', backgroundColor: '#0d1117', borderTop: '1px solid #1e293b' }}>
          <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '0 0 4px 0' }}>TU RESPUESTA</p>
          <p style={{ color: ans.isCorrect ? '#4ade80' : '#f87171', margin: '0 0 12px 0', fontSize: '0.9rem' }}>{ans.selected}</p>
          {!ans.isCorrect && (
            <>
              <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '0 0 4px 0' }}>RESPUESTA CORRECTA</p>
              <p style={{ color: '#4ade80', margin: '0 0 12px 0', fontSize: '0.9rem' }}>{ans.correcta}</p>
            </>
          )}
          <p style={{ color: '#60a5fa', fontSize: '0.72rem', margin: '0 0 6px 0' }}>JUSTIFICACIÓN</p>
          <p style={{ color: '#bfdbfe', margin: 0, lineHeight: '1.8', fontSize: '0.88rem' }}>{ans.justificacion}</p>
        </div>
      )}
    </div>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', padding: 24 }}>
      {children}
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:    { padding: 24, fontFamily: 'Georgia, serif', maxWidth: 780, margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' },
  btnGold: { padding: '14px 28px', backgroundColor: '#D4AF37', color: '#0f0f1a', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif' },
}
