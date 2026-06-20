'use client'
import { useState, useEffect } from 'react'
import { track } from '@/lib/analytics'

export default function UpgradePage() {
  const [loading, setLoading] = useState<'annual' | 'monthly' | null>(null)

  useEffect(() => { track.upgradeView() }, [])

  const checkout = async (plan: 'annual' | 'monthly') => {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        credentials: 'include',
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
        <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 28, fontSize: '0.9rem' }}>
          Prepárate para el examen de 280 reactivos, 5 horas y compite con bases de datos calibradas para 18,515 plazas.
        </p>

        <div style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid #1e3a5f' }}>
          {['280 reactivos formato CIFRHS 2025', '5 tipos de simulador', 'Simulación de plazas (18,515)', 'Simulador cronometrado 5 horas', 'Flashcards de memorización', 'Percentil estimado vs 45,000 aspirantes'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ color: '#4ade80' }}>✓</span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'left' }}>{f}</span>
            </div>
          ))}
        </div>

        <button
          style={{ width: '100%', padding: 16, backgroundColor: '#D4AF37', color: '#0f0f1a', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '1px', fontFamily: 'Georgia, serif', marginBottom: 12 }}
          onClick={() => checkout('annual')}
          disabled={loading !== null}
        >
          {loading === 'annual' ? 'Redirigiendo...' : 'PLAN ANUAL — $599 MXN/año'}
          <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'normal', marginTop: 4, color: '#1e293b' }}>
            Ahorra 50% vs mensual · Solo $49.9/mes
          </span>
        </button>

        <button
          style={{ width: '100%', padding: 16, backgroundColor: 'transparent', border: '2px solid #D4AF37', color: '#D4AF37', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '1px', fontFamily: 'Georgia, serif', marginBottom: 20 }}
          onClick={() => checkout('monthly')}
          disabled={loading !== null}
        >
          {loading === 'monthly' ? 'Redirigiendo...' : 'PLAN MENSUAL — $99 MXN/mes'}
        </button>

        <button
          onClick={() => window.location.href = '/login'}
          style={{ width: '100%', padding: 12, backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Georgia, serif' }}
        >
          Iniciar sesión con otra cuenta
        </button>
      </div>
    </main>
  )
}
