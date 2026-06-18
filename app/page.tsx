import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Root() {
  const cookieStore = await cookies()
  const session = cookieStore.get('enarm_sess')
  if (session) redirect('/home')
  return <Landing />
}

function Landing() {
  return (
    <>
      <style>{
mkdir -p app/home && cp app/page.tsx app/home/page.tsx && cat > app/page.tsx << 'ENDOFFILE'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Root() {
  const cookieStore = await cookies()
  const session = cookieStore.get('enarm_sess')
  if (session) redirect('/home')
  return <Landing />
}

function Landing() {
  return (
    <>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a14;color:#e2e8f0;font-family:'DM Sans',-apple-system,sans-serif}.btn-p{background:linear-gradient(135deg,#ff006e,#00d9ff);color:#fff;border:none;padding:16px 32px;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer}.btn-s{background:transparent;color:#e2e8f0;border:1px solid #1a1a2e;padding:14px 28px;border-radius:12px;font-size:1rem;cursor:pointer}nav{display:flex;justify-content:space-between;align-items:center;padding:20px 40px;border-bottom:1px solid #1a1a2e;position:sticky;top:0;background:#0a0a14;z-index:100}.logo{display:flex;align-items:center;gap:10px;font-size:1.3rem;font-weight:700}.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:80px 24px;text-align:center}h1{font-size:clamp(2.5rem,6vw,4rem);font-weight:700;line-height:1.15;margin-bottom:24px}.hl{background:linear-gradient(135deg,#ff006e,#00d9ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.sub{font-size:1.1rem;color:#64748b;margin-bottom:40px;line-height:1.7}.ctag{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:48px}.stats{display:flex;gap:40px;justify-content:center;flex-wrap:wrap}.snum{font-size:2rem;font-weight:700;background:linear-gradient(135deg,#ff006e,#00d9ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.slbl{color:#475569;font-size:0.82rem;margin-top:4px}section{padding:80px 24px}.si{max-width:1100px;margin:0 auto}.stag{color:#00d9ff;font-size:0.72rem;letter-spacing:3px;margin-bottom:12px}.stit{font-size:clamp(1.8rem,4vw,2.5rem);font-weight:700;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:40px}.card{background:#0f0f1a;border:1px solid #1a1a2e;border-radius:16px;padding:28px}.ctag2{font-size:0.68rem;letter-spacing:2px;margin-bottom:8px}.ctit{font-size:1rem;font-weight:600;margin-bottom:8px}.cdesc{color:#475569;font-size:0.83rem;line-height:1.6}.plans{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:40px;max-width:800px;margin-left:auto;margin-right:auto}.plan{background:#0a0a14;border:1px solid #1a1a2e;border-radius:16px;padding:32px}.planf{border-color:#00d9ff44;background:linear-gradient(135deg,#00d9ff08,#ff006e08)}.badge{background:linear-gradient(135deg,#ff006e,#00d9ff);color:#fff;font-size:0.68rem;font-weight:700;padding:4px 10px;border-radius:20px;display:inline-block;margin-bottom:12px}.pp{font-size:2.2rem;font-weight:700;margin:8px 0 4px}.pperiod{color:#475569;font-size:0.82rem;margin-bottom:16px}.pf{list-style:none;margin-bottom:20px}.pf li{color:#94a3b8;font-size:0.83rem;padding:5px 0;border-bottom:1px solid #1a1a2e22}.pf li::before{content:"✓ ";color:#00d9ff}.faq{max-width:680px;margin:40px auto 0}.faqitem{border-bottom:1px solid #1a1a2e;padding:20px 0}.faqq{font-weight:600;margin-bottom:8px}.faqa{color:#64748b;font-size:0.88rem;line-height:1.7}footer{border-top:1px solid #1a1a2e;padding:40px 24px;text-align:center}.flinks{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}.flinks a{color:#334155;font-size:0.78rem}.flegal{color:#1e293b;font-size:0.7rem;max-width:680px;margin:12px auto 0;line-height:1.6}@media(max-width:600px){nav{padding:16px 20px}.plans{grid-template-columns:1fr}.ctag{flex-direction:column;align-items:center}}`}</style>

      <nav>
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="none" stroke="#00d9ff" strokeWidth="2" opacity="0.3"/><path d="M 15 40 L 28 40 L 32 28 L 40 52 L 48 40 L 65 40" fill="none" stroke="#ff006e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="28" cy="40" r="2.5" fill="#ff006e"/><circle cx="48" cy="40" r="2.5" fill="#ff006e"/><circle cx="65" cy="40" r="2.5" fill="#ff006e"/></svg>
          Simula<span style={{color:'#00d9ff'}}>ENARM</span>
        </div>
        <a href="/register"><button className="btn-p" style={{padding:'10px 20px',fontSize:'0.85rem'}}>Empieza gratis →</button></a>
      </nav>

      <div className="hero">
        <div style={{maxWidth:800,position:'relative',zIndex:1}}>
          <p className="stag">LA PLATAFORMA DE PREPARACIÓN ENARM MÁS ACCESIBLE</p>
          <h1>Practica hoy.<br/><span className="hl">Aprueba mañana.</span></h1>
          <p className="sub">2,000 preguntas reales · 5 simuladores · Estadísticas por especialidad<br/>La alternativa inteligente a los cursos de $20,000</p>
          <div className="ctag">
            <a href="/register"><button className="btn-p">Empieza gratis 2 días →</button></a>
            <a href="#precios"><button className="btn-s">Ver planes</button></a>
          </div>
          <div className="stats">
            <div><div className="snum">2,000</div><div className="slbl">Preguntas reales</div></div>
            <div><div className="snum">5</div><div className="slbl">Simuladores</div></div>
            <div><div className="snum">$99</div><div className="slbl">MXN/mes</div></div>
            <div><div className="snum">38%</div><div className="slbl">Aprueba el ENARM</div></div>
          </div>
        </div>
      </div>

      <section style={{background:'#0f0f1a'}}>
        <div className="si" style={{textAlign:'center'}}>
          <p className="stag">EL PROBLEMA</p>
          <h2 className="stit">Cada año, 50,000 médicos presentan el ENARM.<br/>Solo el 38% obtiene plaza.</h2>
          <p style={{color:'#64748b',maxWidth:600,margin:'0 auto',lineHeight:1.7}}>La diferencia entre aprobar y repetir un año no es talento — es práctica constante. Los cursos de $20,000 no son la única opción.</p>
        </div>
      </section>

      <section>
        <div className="si">
          <p className="stag">6 SIMULADORES</p>
          <h2 className="stit">Todo lo que necesitas para aprobar.</h2>
          <div className="grid">
            {[['#ff006e','CADA 30-45 DÍAS','Diagnóstico Inicial','180 preguntas · Genera tu perfil académico completo e identifica áreas débiles.'],['#00d9ff','HOY','Simulador Diario','10 preguntas aleatorias con justificación inmediata. Hábito diario.'],['#a78bfa','A TU RITMO','Examen Personalizado','10–40 preguntas · Filtra por especialidad.'],['#ff006e','ALTA INTENSIDAD','Simulador Real ENARM','360 preguntas · Cronómetro 6 horas · Condiciones reales.'],['#00d9ff','ESTUDIO PROFUNDO','Simulador Sin Límite','360 preguntas sin cronómetro. Análisis detallado.'],['#a78bfa','REPASO RÁPIDO','Flashcards','Tarjetas anverso/reverso. Ideal entre pacientes.']].map(([c,t,ti,d])=>(
              <div key={ti} className="card">
                <p className="ctag2" style={{color:c as string}}>{t}</p>
                <h3 className="ctit">{ti}</h3>
                <p className="cdesc">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" style={{background:'#0f0f1a'}}>
        <div className="si" style={{textAlign:'center'}}>
          <p className="stag">PRECIOS</p>
          <h2 className="stit">Elige tu plan</h2>
          <p style={{color:'#64748b',marginBottom:8}}>2 días gratis · Sin tarjeta · Cancela cuando quieras</p>
          <div className="plans">
            <div className="plan">
              <p style={{color:'#475569',fontSize:'0.75rem',letterSpacing:2}}>MENSUAL</p>
              <div className="pp">$99 <span style={{fontSize:'1rem',color:'#475569'}}>MXN</span></div>
              <p className="pperiod">por mes · renovación automática</p>
              <ul className="pf"><li>2,000 preguntas reales</li><li>6 simuladores</li><li>Perfil académico</li><li>Cancela cuando quieras</li></ul>
              <a href="/register"><button className="btn-s" style={{width:'100%'}}>Empezar →</button></a>
            </div>
            <div className="plan planf">
              <span className="badge">MÁS POPULAR · AHORRA 41%</span>
              <p style={{color:'#475569',fontSize:'0.75rem',letterSpacing:2}}>ANUAL</p>
              <div className="pp">$599 <span style={{fontSize:'1rem',color:'#475569'}}>MXN</span></div>
              <p className="pperiod">por año · equivale a $50/mes</p>
              <ul className="pf"><li>Todo del plan mensual</li><li>12 meses completos</li><li>Ahorra $589 MXN</li><li>Ideal para preparación completa</li></ul>
              <a href="/register"><button className="btn-p" style={{width:'100%'}}>Empezar gratis →</button></a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="si" style={{textAlign:'center'}}>
          <p className="stag">REFERIDOS</p>
          <h2 className="stit">Gana $150 MXN por cada amigo</h2>
          <p style={{color:'#64748b',maxWidth:500,margin:'0 auto 28px',lineHeight:1.7}}>Comparte tu link único. Cuando un amigo pague, recibes $150 MXN de saldo automático. Sin límite.</p>
          <a href="/register"><button className="btn-p">Obtener mi link →</button></a>
        </div>
      </section>

      <section style={{background:'#0f0f1a'}}>
        <div className="si">
          <p className="stag" style={{textAlign:'center'}}>PREGUNTAS FRECUENTES</p>
          <h2 className="stit" style={{textAlign:'center',marginBottom:0}}>Todo lo que necesitas saber</h2>
          <div className="faq">
            {[['¿Es un curso oficial?','No. Somos una plataforma independiente de práctica. No estamos afiliados a la CIFRHS ni a la Secretaría de Salud.'],['¿Cuántas preguntas hay?','2,000 casos clínicos reales estilo ENARM con justificación detallada en 5 especialidades y 3 niveles.'],['¿Puedo cancelar?','Sí, en cualquier momento. Mantienes acceso hasta el fin del período pagado.'],['¿Hay app móvil?','Funciona en cualquier navegador móvil. App nativa próximamente.'],['¿Mis datos están seguros?','Pagos por Stripe (PCI DSS Level 1). Autenticación Firebase. Conexión HTTPS.']].map(([q,a])=>(
              <div key={q} className="faqitem"><p className="faqq">{q}</p><p className="faqa">{a}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section style={{textAlign:'center'}}>
        <p className="stag">EMPIEZA HOY</p>
        <h2 className="stit">2 días gratis. Sin tarjeta.</h2>
        <p style={{color:'#64748b',maxWidth:400,margin:'0 auto 28px',lineHeight:1.7}}>Únete a los médicos que ya se preparan de forma inteligente.</p>
        <a href="/register"><button className="btn-p" style={{fontSize:'1.1rem',padding:'18px 40px'}}>Crear cuenta gratis →</button></a>
      </section>

      <footer>
        <div className="logo" style={{justifyContent:'center',marginBottom:20}}>
          <svg width="28" height="28" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="none" stroke="#00d9ff" strokeWidth="2" opacity="0.3"/><path d="M 15 40 L 28 40 L 32 28 L 40 52 L 48 40 L 65 40" fill="none" stroke="#ff006e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="28" cy="40" r="2.5" fill="#ff006e"/><circle cx="48" cy="40" r="2.5" fill="#ff006e"/><circle cx="65" cy="40" r="2.5" fill="#ff006e"/></svg>
          <span style={{fontSize:'1.1rem',fontWeight:700}}>Simula<span style={{color:'#00d9ff'}}>ENARM</span></span>
        </div>
        <div className="flinks">
          <a href="/terminos">Términos</a>
          <a href="/privacidad">Privacidad</a>
          <a href="/aviso-privacidad">Aviso de Privacidad</a>
          <a href="/login">Acceso a la app</a>
          <a href="mailto:contacto@simulaenarm.com">contacto@simulaenarm.com</a>
        </div>
        <p style={{color:'#334155',fontSize:'0.78rem',marginBottom:8}}>© 2026 SimulaENARM ™ · Todos los derechos reservados · Cuernavaca, Morelos, México</p>
        <p className="flegal">Simula ENARM es una plataforma educativa independiente. No está afiliada, patrocinada ni avalada por la CIFRHS, la Secretaría de Salud ni ningún organismo gubernamental mexicano. El uso del término "ENARM" es meramente descriptivo. Los resultados pueden variar. La plataforma no garantiza la aprobación del examen oficial. Pagos procesados por Stripe. SimulaENARM ™ — Marca en trámite de registro ante el IMPI.</p>
      </footer>
    </>
  )
}
