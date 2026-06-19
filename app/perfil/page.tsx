'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { UserStats } from '@/types/exam'

// Colores por especialidad
const SP_COLORS: Record<string, string> = {
  'Medicina Interna': '#00d9ff',
  'Pediatría':        '#60a5fa',
  'Ginecología':      '#f472b6',
  'Cirugía':          '#f87171',
  'Urgencias':        '#4ade80',
}
const DEFAULT_COLOR = '#94a3b8'

export default function PerfilPage() {
  const router   = useRouter()
  const [stats, setStats]   = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [tab, setTab]       = useState<'overview' | 'diagnostics' | 'history'>('overview')

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/stats', { credentials: 'include' })
      const data = await res.json() as { stats?: UserStats; error?: string }
      if (!res.ok) throw new Error(data.error)
      setStats(data.stats ?? null)
    } catch {
      setError('No se pudieron cargar las estadísticas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <main style={S.main}>
        <p style={{ color: '#00d9ff', textAlign: 'center', marginTop: 80 }}>Cargando tu perfil...</p>
      </main>
    )
  }

  if (error || !stats) {
    return (
      <main style={S.main}>
        <p style={{ color: '#f87171', textAlign: 'center', marginTop: 80 }}>{error || 'Sin datos disponibles aún.'}</p>
        <button onClick={() => window.location.href = '/home'} style={S.btnBack}>← Inicio</button>
      </main>
    )
  }

  const pctColor = stats.overallPct >= 70 ? '#4ade80' : stats.overallPct >= 50 ? '#fbbf24' : '#f87171'

  // Datos para gráficas
  const pieData = stats.bySpecialty.map(sp => ({
    name:  sp.specialty,
    value: sp.total,
    pct:   sp.pct,
    color: SP_COLORS[sp.specialty] ?? DEFAULT_COLOR,
  }))

  const barData = stats.bySpecialty.map(sp => ({
    name: sp.specialty.length > 10 ? sp.specialty.split(' ')[0] : sp.specialty,
    full: sp.specialty,
    pct:  sp.pct,
    fill: SP_COLORS[sp.specialty] ?? DEFAULT_COLOR,
  }))

  const lineData = stats.diagnosticHistory.map((d, i) => ({
    name: `Diag. ${i + 1}`,
    pct:  d.overallPct,
    date: new Date(d.takenAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
  }))

  return (
    <main style={S.main}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.location.href = '/home'} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>←</button>
          <h1 style={{ color: '#00d9ff', fontSize: '1.8rem', margin: 0, letterSpacing: 2 }}>MI PERFIL</h1>
        </div>
        <button onClick={fetchStats} style={{ background: 'none', border: '1px solid #334155', color: '#64748b', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'DM Sans, Arial, sans-serif' }}>↺ Actualizar</button>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 24, paddingLeft: 32 }}>
        Perfil académico · {stats.totalSessions} exámenes · {stats.totalQuestions} preguntas respondidas
      </p>

      {/* Score global */}
      <div style={{ backgroundColor: '#111827', borderRadius: 16, padding: 24, marginBottom: 20, border: '1px solid #1e293b', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
          <div style={{ color: pctColor, fontSize: '3.5rem', fontWeight: 'bold', lineHeight: 1 }}>{stats.overallPct}%</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4 }}>Efectividad global</div>
        </div>
        {[
          { val: stats.totalSessions,  label: 'Exámenes',    color: '#94a3b8' },
          { val: stats.totalCorrect,   label: 'Correctas',   color: '#4ade80' },
          { val: stats.totalQuestions - stats.totalCorrect, label: 'Incorrectas', color: '#f87171' },
        ].map(({ val, label, color }) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', minWidth: 70 }}>
            <div style={{ color, fontSize: '1.8rem', fontWeight: 'bold' }}>{val}</div>
            <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['overview', 'diagnostics', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${tab === t ? '#00d9ff' : '#334155'}`, backgroundColor: tab === t ? '#00d9ff' : 'transparent', color: tab === t ? '#0f0f1a' : '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: tab === t ? 'bold' : 'normal', fontFamily: 'DM Sans, Arial, sans-serif' }}>
            {t === 'overview' ? 'Resumen' : t === 'diagnostics' ? 'Diagnósticos' : 'Historial'}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ── */}
      {tab === 'overview' && (
        <>
          {/* Gráfica de pastel */}
          {pieData.length > 0 && (
            <div style={S.card}>
              <h2 style={S.cardTitle}>DISTRIBUCIÓN POR ESPECIALIDAD</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={pieData} cx={100} cy={100} innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontFamily: 'DM Sans, Arial, sans-serif' }}
                      formatter={(val, name) => {
                        const sp = pieData.find(d => d.name === name)
                        return [`${val} preg. · ${sp?.pct ?? 0}%`, name]
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, minWidth: 150 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{d.name}</span>
                      </div>
                      <span style={{ color: d.color, fontSize: '0.82rem', fontWeight: 'bold' }}>{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gráfica de barras */}
          {barData.length > 0 && (
            <div style={S.card}>
              <h2 style={S.cardTitle}>EFECTIVIDAD POR ÁREA</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'DM Sans, Arial, sans-serif' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontFamily: 'DM Sans, Arial, sans-serif' }}
                    formatter={(val, _, props) => [`${val}%`, props.payload?.full ?? '']}
                  />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Fortalezas y debilidades */}
          {stats.bySpecialty.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, ...S.card, minWidth: 180 }}>
                <h2 style={S.cardTitle}>💪 FORTALEZAS</h2>
                {stats.bySpecialty.filter(s => s.pct >= 70).slice(0, 3).map(sp => (
                  <div key={sp.specialty} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{sp.specialty}</span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.85rem' }}>{sp.pct}%</span>
                  </div>
                ))}
                {stats.bySpecialty.filter(s => s.pct >= 70).length === 0 && (
                  <p style={{ color: '#475569', fontSize: '0.82rem' }}>Aún no hay áreas con ≥70%</p>
                )}
              </div>
              <div style={{ flex: 1, ...S.card, minWidth: 180 }}>
                <h2 style={S.cardTitle}>⚠ A REFORZAR</h2>
                {stats.bySpecialty.filter(s => s.pct < 70).slice(0, 3).map(sp => (
                  <div key={sp.specialty} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{sp.specialty}</span>
                    <span style={{ color: sp.pct < 50 ? '#f87171' : '#fbbf24', fontWeight: 'bold', fontSize: '0.85rem' }}>{sp.pct}%</span>
                  </div>
                ))}
                {stats.bySpecialty.filter(s => s.pct < 70).length === 0 && (
                  <p style={{ color: '#4ade80', fontSize: '0.82rem' }}>¡Todas las áreas ≥70%! 🎉</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB: DIAGNÓSTICOS ── */}
      {tab === 'diagnostics' && (
        <>
          {stats.diagnosticHistory.length === 0 ? (
            <div style={S.card}>
              <p style={{ color: '#475569', textAlign: 'center', margin: 0 }}>
                Aún no has completado ningún examen diagnóstico.
              </p>
              <button onClick={() => router.push('/exams/diagnostico')} style={{ ...S.btnGold, marginTop: 16 }}>
                Realizar diagnóstico →
              </button>
            </div>
          ) : (
            <>
              {/* Línea de progreso entre diagnósticos */}
              {lineData.length > 1 && (
                <div style={S.card}>
                  <h2 style={S.cardTitle}>EVOLUCIÓN DE DIAGNÓSTICOS</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={lineData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: 8 }}
                        formatter={(val) => [`${val}%`, 'Efectividad']}
                      />
                      <Line type="monotone" dataKey="pct" stroke="#00d9ff" strokeWidth={2} dot={{ fill: '#00d9ff', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Historial de diagnósticos */}
              {stats.diagnosticHistory.map((d, i) => (
                <div key={d.sessionId} style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                      Diagnóstico #{stats.diagnosticHistory.length - i}
                    </span>
                    <span style={{ color: '#475569', fontSize: '0.78rem' }}>
                      {new Date(d.takenAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ color: d.overallPct >= 70 ? '#4ade80' : d.overallPct >= 50 ? '#fbbf24' : '#f87171', fontSize: '2rem', fontWeight: 'bold', marginBottom: 12 }}>
                    {d.overallPct}%
                  </div>
                  {d.bySpecialty.map(sp => (
                    <div key={sp.specialty} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{sp.specialty}</span>
                        <span style={{ color: SP_COLORS[sp.specialty] ?? DEFAULT_COLOR, fontSize: '0.8rem', fontWeight: 'bold' }}>{sp.pct}%</span>
                      </div>
                      <div style={{ backgroundColor: '#1e293b', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${sp.pct}%`, height: '100%', backgroundColor: SP_COLORS[sp.specialty] ?? DEFAULT_COLOR }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab === 'history' && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>SESIONES RECIENTES</h2>
          {(!stats.sessionHistory || stats.sessionHistory.length === 0) ? (
            <p style={{ color: '#475569', textAlign: 'center' }}>Aún no has completado ningún examen.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.sessionHistory.map((s) => {
                const pctColor = s.pct >= 70 ? '#4ade80' : s.pct >= 50 ? '#fbbf24' : '#f87171'
                const label: Record<string, string> = {
                  diagnostico: 'Diagnóstico',
                  diario: 'Diario',
                  personalizado: 'Personalizado',
                  simulador_cronometrado: 'Simulador Real',
                  simulador_libre: 'Simulador Libre',
                }
                const formatTime = (sec: number) => {
                  const h = Math.floor(sec / 3600)
                  const m = Math.floor((sec % 3600) / 60)
                  return h > 0 ? `${h}h ${m}m` : `${m}m`
                }
                return (
                  <div key={s.sessionId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#0d1117', borderRadius: 10, border: '1px solid #1e293b' }}>
                    <div>
                      <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 'bold' }}>{label[s.examType] ?? s.examType}</div>
                      <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: 2 }}>
                        {new Date(s.finishedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {s.timeTakenSeconds > 0 && ` · ${formatTime(s.timeTakenSeconds)}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: pctColor, fontSize: '1.2rem', fontWeight: 'bold' }}>{s.pct}%</div>
                      <div style={{ color: '#475569', fontSize: '0.72rem' }}>{s.correctAnswers}/{s.totalQuestions}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  main:      { padding: 24, fontFamily: 'DM Sans, Arial, sans-serif', maxWidth: 780, margin: '0 auto', backgroundColor: '#0f0f1a', minHeight: '100vh', color: '#e2e8f0' },
  card:      { backgroundColor: '#111827', borderRadius: 14, padding: 20, marginBottom: 16, border: '1px solid #1e293b' },
  cardTitle: { color: '#94a3b8', fontSize: '0.75rem', letterSpacing: '2px', margin: '0 0 16px 0' },
  btnGold:   { width: '100%', padding: 14, background: 'linear-gradient(135deg, #ff006e, #00d9ff)', color: '#0f0f1a', border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'DM Sans, Arial, sans-serif' },
  btnBack:   { padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, Arial, sans-serif', marginTop: 16, display: 'block', margin: '16px auto 0' },
}
