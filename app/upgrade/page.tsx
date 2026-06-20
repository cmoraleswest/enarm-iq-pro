'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserInfo { creditBalance: number; referralCode: string }

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'annual' | 'monthly' | null>(null)

  const checkout = async (plan: 'annual' | 'monthly') => {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Error al crear sesión de pago')
      window.location.href = data.url
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al procesar el pago')
      setLoading(null)
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 440, backgroundColor: '#111827', borderRadius: 16, padding: '40px 32px', border: '1px solid #D4AF37', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🎓</div>
        <h1 style={{ color: '#D4AF37', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: 2 }}>ACTIVA TU SUSCRIPCIÓN</h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 32, fontSize: '0.9rem' }}>
          Elige tu plan para acceder al simulador completo con las 2,000 preguntas del banco ENARM.
        </p>

        {userInfo && userInfo.creditBalance > 0 && (
          <div style={{ backgroundColor: '#052e16', border: '1px solid #4ade80', borderRadius: 10, padding: 12, marginBottom: 20, textAlign: 'center' }}>
            <span style={{ color: '#4ade80', fontSize: '0.9rem' }}>💰 Tienes <strong>${userInfo.creditBalance} MXN</strong> de saldo por referidos</span>
          </div>
        )}

        {[{ key: 'annual', label: 'Plan Anual', sub: 'AHORRA 41% · Más popular', price: '$599', per: 'MXN/año', color: '#4ade80' },
          { key: 'monthly', label: 'Plan Mensual', sub: 'Cancela cuando quieras', price: '$99', per: 'MXN/mes', color: '#94a3b8' }
        ].map(p => (
          <div key={p.key} onClick={() => setPlan(p.key as 'monthly' | 'annual')}
            style={{ padding: 16, borderRadius: 12, border: `2px solid ${plan === p.key ? '#00d9ff' : '#1e3a5f'}`, backgroundColor: plan === p.key ? '#001a1f' : '#0f172a', cursor: 'pointer', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>{p.label}</div>
              <div style={{ color: p.color, fontSize: '0.78rem', marginTop: 2 }}>{p.sub}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#00d9ff', fontSize: '1.3rem', fontWeight: 'bold' }}>{p.price}</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{p.per}</div>
            </div>
          </div>
        ))}

        <div style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: 16, marginTop: 8, border: '1px solid #1e3a5f' }}>
          {['2,000 preguntas reales ENARM', '5 tipos de simulador', 'Perfil académico y analíticas', 'Simulador cronometrado 6 horas', 'Flashcards de memorización', 'Historial y progreso completo'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ color: '#4ade80' }}>✓</span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Plan Anual */}
        <button
          style={{ width: '100%', padding: 16, backgroundColor: '#D4AF37', color: '#0f0f1a', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '1px', fontFamily: 'Georgia, serif', marginBottom: 12, position: 'relative' }}
          onClick={() => checkout('annual')}
          disabled={loading !== null}
        >
          {loading === 'annual' ? 'Redirigiendo...' : 'PLAN ANUAL — $599 MXN/año'}
          <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'normal', marginTop: 4, color: '#1e293b' }}>
            Ahorra $589 vs mensual · Solo $49.9/mes
          </span>
        </button>

        {/* Plan Mensual */}
        <button
          style={{ width: '100%', padding: 16, backgroundColor: 'transparent', border: '2px solid #D4AF37', color: '#D4AF37', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '1px', fontFamily: 'Georgia, serif', marginBottom: 20 }}
          onClick={() => checkout('monthly')}
          disabled={loading !== null}
        >
          {loading === 'monthly' ? 'Redirigiendo...' : 'PLAN MENSUAL — $99 MXN/mes'}
        </button>

        {userInfo?.referralCode && (
          <div style={{ marginTop: 24, padding: 16, backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid #334155', textAlign: 'center' }}>
            <p style={{ color: '#60a5fa', fontSize: '0.78rem', letterSpacing: 1, margin: '0 0 8px 0' }}>🤝 GANA $150 POR REFERIDO</p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 12px 0' }}>Comparte tu link y recibe $150 de saldo cuando tu amigo pague</p>
            <div style={{ backgroundColor: '#1e293b', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#00d9ff', fontFamily: 'monospace', marginBottom: 10 }}>
              enarm-iq.vercel.app/ref/{userInfo.referralCode}
            </div>
            <button onClick={copyReferral}
              style={{ padding: '8px 20px', backgroundColor: copied ? '#4ade80' : 'transparent', border: '1px solid #334155', color: copied ? '#0f0f1a' : '#94a3b8', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem' }}>
              {copied ? '✓ Copiado' : 'Copiar link'}
            </button>
          </div>
        )}

        <button onClick={() => window.location.href = '/login'}
          style={{ width: '100%', padding: 12, backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'DM Sans, Arial, sans-serif', marginTop: 12 }}>
          Iniciar sesión con otra cuenta
        </button>
      </div>
    </main>
  )
}
