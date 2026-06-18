'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PagoExitoso() {
  const router = useRouter()
  useEffect(() => { setTimeout(() => router.push('/home'), 4000) }, [router])
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
        <h1 style={{ color: '#D4AF37', fontSize: '1.8rem', marginBottom: 12 }}>¡Pago exitoso!</h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: 8 }}>Tu acceso Pro está activo.</p>
        <p style={{ color: '#60a5fa', fontSize: '0.85rem' }}>Redirigiendo en unos segundos...</p>
      </div>
    </main>
  )
}
