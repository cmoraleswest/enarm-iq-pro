'use client'

import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('enarm_cookie_consent')) {
      setShow(true)
    }
  }, [])

  function accept() {
    localStorage.setItem('enarm_cookie_consent', 'accepted')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998, backgroundColor: '#111827', borderTop: '1px solid #1e3a5f', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontFamily: 'Georgia, serif' }}>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, flex: 1, minWidth: 200 }}>
        Usamos cookies para analytics y mejorar tu experiencia. Al continuar, aceptas nuestra{' '}
        <a href="/privacidad" style={{ color: '#60a5fa', textDecoration: 'underline' }}>política de privacidad</a>.
      </p>
      <button onClick={accept} style={{ padding: '10px 24px', backgroundColor: '#D4AF37', color: '#0a0a14', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>
        Aceptar
      </button>
    </div>
  )
}
