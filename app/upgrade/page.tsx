'use client'

import { useRouter } from 'next/navigation'

export default function UpgradePage() {
  const router = useRouter()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 440, backgroundColor: '#111827', borderRadius: 16, padding: '40px 32px', border: '1px solid #D4AF37', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🎓</div>
        <h1 style={{ color: '#D4AF37', fontSize: '1.6rem', margin: '0 0 8px 0', letterSpacing: 2 }}>PERÍODO DE PRUEBA FINALIZADO</h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 32, fontSize: '0.9rem' }}>
          Tu acceso gratuito ha expirado. Activa tu suscripción para seguir preparándote con las 2,000 preguntas del banco ENARM.
        </p>

        <div style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: 20, marginBottom: 28, border: '1px solid #1e3a5f' }}>
          <p style={{ color: '#60a5fa', fontSize: '0.78rem', letterSpacing: '1px', margin: '0 0 12px 0' }}>ACCESO COMPLETO INCLUYE</p>
          {[
            '2,000 preguntas reales ENARM',
            '5 tipos de examen',
            'Perfil académico y analíticas',
            'Simulador cronometrado 6 horas',
            'Flashcards de memorización',
            'Historial completo y progreso',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ color: '#4ade80', fontSize: '0.9rem' }}>✓</span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'left' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Placeholder — integrar Stripe/MercadoPago aquí */}
        <button
          style={{ width: '100%', padding: 16, backgroundColor: '#D4AF37', color: '#0f0f1a', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'Georgia, serif', marginBottom: 12 }}
          onClick={() => alert('Próximamente — integración de pagos')}
        >
          ACTIVAR SUSCRIPCIÓN →
        </button>

        <button
          onClick={() => router.push('/login')}
          style={{ width: '100%', padding: 12, backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Georgia, serif' }}
        >
          Iniciar sesión con otra cuenta
        </button>
      </div>
    </main>
  )
}
