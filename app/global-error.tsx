'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, backgroundColor: '#0a0a14', color: '#94a3b8', fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h1 style={{ color: '#D4AF37', fontSize: '1.4rem', marginBottom: 12 }}>Algo salió mal</h1>
          <p style={{ fontSize: '0.9rem', marginBottom: 20 }}>{error.message || 'Error inesperado'}</p>
          <button onClick={reset} style={{ padding: '12px 24px', backgroundColor: '#D4AF37', color: '#0a0a14', border: 'none', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
