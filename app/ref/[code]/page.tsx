'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ReferralPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  useEffect(() => {
    if (code) localStorage.setItem('referralCode', code.toUpperCase())
    router.push('/register')
  }, [code, router])
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎓</div>
        <p style={{ color: '#D4AF37', fontSize: '1rem' }}>Cargando tu invitación...</p>
      </div>
    </main>
  )
}
