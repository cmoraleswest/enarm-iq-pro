'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
        <h1 style={{ color: '#D4AF37', fontSize: '1.4rem', marginBottom: 12 }}>Error</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 20 }}>{error.message || 'Ocurrió un error inesperado'}</p>
        <button onClick={reset} style={{ padding: '12px 24px', backgroundColor: '#D4AF37', color: '#0a0a14', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          Reintentar
        </button>
      </div>
    </main>
  )
}
