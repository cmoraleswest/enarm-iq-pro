'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EliminarCuentaPage() {
  const router = useRouter()
  const [confirmacion, setConfirmacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const eliminar = async () => {
    if (confirmacion !== 'ELIMINAR') return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Error desconocido')
      }

      localStorage.removeItem('enarm_user_info')
      localStorage.removeItem('enarm_simulador_stats')
      localStorage.removeItem('enarm_flashcard_stats')
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuenta.')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 440, backgroundColor: '#111827', borderRadius: 16, padding: '40px 32px', border: '1px solid #dc2626', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚠️</div>
        <h1 style={{ color: '#dc2626', fontSize: '1.4rem', margin: '0 0 8px 0', letterSpacing: 2 }}>ELIMINAR CUENTA</h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 24, fontSize: '0.9rem' }}>
          Esta acción es permanente e irreversible. Se borrarán todos tus datos: perfil, historial de exámenes y estadísticas.
        </p>

        <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: 16 }}>
          Escribe <strong>ELIMINAR</strong> para confirmar:
        </p>

        <input
          type="text"
          value={confirmacion}
          onChange={e => setConfirmacion(e.target.value)}
          placeholder="ELIMINAR"
          style={{
            width: '100%', padding: 14, borderRadius: 10,
            border: '1px solid #334155', backgroundColor: '#0f172a',
            color: '#e2e8f0', fontSize: '1rem', textAlign: 'center',
            fontFamily: 'Georgia, serif', marginBottom: 16,
            boxSizing: 'border-box',
          }}
        />

        {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>}

        <button
          onClick={eliminar}
          disabled={confirmacion !== 'ELIMINAR' || loading}
          style={{
            width: '100%', padding: 16, borderRadius: 12,
            border: 'none', fontSize: '1rem', fontWeight: 'bold',
            cursor: confirmacion === 'ELIMINAR' && !loading ? 'pointer' : 'not-allowed',
            backgroundColor: confirmacion === 'ELIMINAR' ? '#dc2626' : '#334155',
            color: confirmacion === 'ELIMINAR' ? '#fff' : '#64748b',
            fontFamily: 'Georgia, serif', marginBottom: 12,
          }}
        >
          {loading ? 'Eliminando...' : 'ELIMINAR MI CUENTA'}
        </button>

        <button
          onClick={() => router.push('/perfil')}
          style={{
            width: '100%', padding: 12, backgroundColor: 'transparent',
            border: '1px solid #334155', color: '#64748b', borderRadius: 10,
            cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Georgia, serif',
          }}
        >
          Cancelar
        </button>
      </div>
    </main>
  )
}
