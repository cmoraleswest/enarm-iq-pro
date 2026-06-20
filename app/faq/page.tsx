import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes — Simula ENARM',
  description: 'Respuestas a las preguntas más comunes sobre Simula ENARM.',
}

const faqs = [
  { q: '¿Cuántas preguntas tiene el banco?', a: 'Más de 2,000 preguntas reales distribuidas en 5 especialidades: Medicina Interna, Pediatría, Ginecología, Cirugía y Urgencias. Incluye 30 preguntas en inglés como exige el CIFRHS.' },
  { q: '¿El simulador sigue el formato CIFRHS 2025?', a: 'Sí. 280 reactivos, 5 horas de tiempo límite, 4 opciones por pregunta, casos clínicos seriados y percentil estimado contra 45,000 aspirantes.' },
  { q: '¿Cuánto cuesta?', a: 'Plan Mensual: $99 MXN/mes. Plan Anual: $599 MXN/año (ahorro del 50%). Puedes cancelar en cualquier momento.' },
  { q: '¿Puedo cancelar mi suscripción?', a: 'Sí, en cualquier momento. Tu acceso continuará hasta el final del periodo pagado. No hay reembolsos parciales.' },
  { q: '¿Cómo funciona el simulador cronometrado?', a: 'Simula las condiciones reales del ENARM: 280 preguntas en 5 horas. Al terminar recibes tu calificación por especialidad y percentil estimado.' },
  { q: '¿Puedo usar la app en mi celular?', a: 'Sí. Simula ENARM es una PWA (Progressive Web App) que puedes instalar en tu celular desde el navegador. Funciona offline.' },
  { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, AMEX) a través de Stripe. El pago es seguro y encriptado.' },
  { q: '¿Cómo elimino mi cuenta?', a: 'Ve a tu Perfil → Eliminar cuenta. Se borrarán todos tus datos de forma permanente.' },
  { q: '¿Tienen cupones de descuento?', a: 'Sí. Busca códigos de promoción con nuestros influencers en TikTok e Instagram. Se aplican directamente al momento del pago.' },
  { q: '¿Necesito ayuda, cómo los contacto?', a: 'Escríbenos a contacto@simulaenarm.com. Respondemos en menos de 24 horas.' },
]

export default function FAQ() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', padding: '48px 24px', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link href="/home" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: 24, minHeight: 44, lineHeight: '44px' }}>
          ← Volver
        </Link>
        <h1 style={{ color: '#D4AF37', fontSize: '1.6rem', marginBottom: 32, letterSpacing: 1 }}>Preguntas Frecuentes</h1>

        {faqs.map((faq, i) => (
          <div key={i} style={{ marginBottom: 24, padding: '20px 24px', backgroundColor: '#111827', borderRadius: 12, border: '1px solid #1e3a5f' }}>
            <h2 style={{ color: '#e2e8f0', fontSize: '1rem', margin: '0 0 10px 0', fontWeight: 600 }}>{faq.q}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
          </div>
        ))}

        <div style={{ marginTop: 32, padding: 20, backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid #334155', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 8px 0' }}>¿No encontraste tu respuesta?</p>
          <a href="mailto:contacto@simulaenarm.com" style={{ color: '#60a5fa', fontSize: '0.9rem' }}>contacto@simulaenarm.com</a>
        </div>
      </div>
    </main>
  )
}
