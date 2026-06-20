import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
        <h1 style={{ color: '#D4AF37', fontSize: '1.4rem', marginBottom: 12 }}>Página no encontrada</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 20 }}>La página que buscas no existe.</p>
        <Link href="/home" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#D4AF37', color: '#0a0a14', borderRadius: 10, fontWeight: 'bold', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
          Ir al inicio
        </Link>
      </div>
    </main>
  )
}
