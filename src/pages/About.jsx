import { useEffect, useRef, useState } from 'react'

/* ══════════════════════════════════════════
   FLOATING RUPEE ICONS WITH REPULSION
══════════════════════════════════════════ */
const RUPEE_COUNT = 14
function buildRupees() {
  return Array.from({ length: RUPEE_COUNT }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    size: 14 + Math.random() * 18,
    opacity: 0.05 + Math.random() * 0.07,
    vx: 0, vy: 0,
    bx: 0, by: 0,
    rot: Math.random() * 360,
  }))
}

function FloatingRupees({ containerRef }) {
  const [rupees]  = useState(buildRupees)
  const stateRef  = useRef(rupees.map(r => ({ ...r })))
  const domRefs   = useRef([])
  const mouseRef  = useRef({ x: -9999, y: -9999 })
  const rafRef    = useRef(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function initBase() {
      const { width, height } = container.getBoundingClientRect()
      stateRef.current.forEach(r => {
        r.bx = (r.x / 100) * width
        r.by = (r.y / 100) * height
        if (r.vx === 0 && r.vy === 0) { r.cx = r.bx; r.cy = r.by }
      })
    }
    initBase()

    function onMove(e) {
      const rect = container.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    function onLeave() { mouseRef.current = { x: -9999, y: -9999 } }

    const ro = new ResizeObserver(initBase)
    ro.observe(container)
    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', onLeave)
    stateRef.current.forEach(r => { r.cx = r.bx; r.cy = r.by })

    function tick() {
      stateRef.current.forEach((r, i) => {
        const m = mouseRef.current
        const dx = (r.cx ?? r.bx) - m.x
        const dy = (r.cy ?? r.by) - m.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const R = 80
        if (dist < R && dist > 1) {
          const str = ((R - dist) / R) * 1.8
          const ang = Math.atan2(dy, dx)
          r.vx += Math.cos(ang) * str
          r.vy += Math.sin(ang) * str
        }
        r.vx += (r.bx - (r.cx ?? r.bx)) * 0.02
        r.vy += (r.by - (r.cy ?? r.by)) * 0.02
        r.vx *= 0.82; r.vy *= 0.82
        r.cx = (r.cx ?? r.bx) + r.vx
        r.cy = (r.cy ?? r.by) + r.vy
        r.rot += r.vx * 0.5
        const el = domRefs.current[i]
        if (el) el.style.transform = `translate(${r.cx}px, ${r.cy}px) rotate(${r.rot}deg)`
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      {tooltip.visible && (
        <div style={{
          position: 'fixed', zIndex: 999,
          left: tooltip.x + 14, top: tooltip.y - 10,
          background: 'rgba(14,14,26,0.95)',
          border: '1px solid rgba(212,169,74,0.3)',
          borderRadius: 8, padding: '6px 12px',
          fontSize: 11, color: '#d4a94a',
          fontFamily: 'monospace', letterSpacing: '0.5px',
          pointerEvents: 'none', whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          Financial clarity starts with awareness.
        </div>
      )}
      {rupees.map((r, i) => (
        <div key={r.id}
          ref={el => domRefs.current[i] = el}
          onMouseEnter={e => setTooltip({ visible: true, x: e.clientX, y: e.clientY })}
          onMouseMove={e  => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
          onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
          style={{
            position: 'absolute', top: 0, left: 0,
            fontSize: r.size, color: '#d4a94a',
            opacity: r.opacity, pointerEvents: 'auto',
            userSelect: 'none', cursor: 'default',
            fontFamily: 'serif', willChange: 'transform', zIndex: 0,
          }}
        >₹</div>
      ))}
    </>
  )
}

/* ══════════════════════════════════════════
   FADE CARD
══════════════════════════════════════════ */
function FadeCard({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>{children}</div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase',
      color: 'rgba(212,169,74,0.5)', fontFamily: 'monospace',
      marginBottom: 10, marginTop: 0,
    }}>{children}</p>
  )
}

function Divider() {
  return (
    <div style={{
      width: '100%', height: 1,
      background: 'linear-gradient(90deg,transparent,rgba(212,169,74,0.15),transparent)',
      margin: '0 0 64px',
    }} />
  )
}

function DevAvatar({ size = 140 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '18px',
      overflow: 'hidden', border: '2px solid rgba(212,169,74,0.3)',
      boxShadow: '0 16px 48px rgba(0,0,0,0.5)', flexShrink: 0,
    }}>
      <img src="/khushi.jpg" alt="Khushi Shah"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
}

function Badge({ children, color = '#d4a94a' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 14px', borderRadius: 20,
      background: `${color}12`, border: `1px solid ${color}28`,
      fontSize: 11, color: color, fontFamily: 'monospace',
      letterSpacing: '0.5px', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function HoverCard({ color, icon, title, desc, delay }) {
  const [hov, setHov] = useState(false)
  return (
    <FadeCard delay={delay} style={{ flex: 1, minWidth: 0 }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          height: '100%',
          background: hov ? `radial-gradient(ellipse at 30% 30%, ${color}10, #0e0e1a)` : '#0e0e1a',
          border: `1px solid ${hov ? color + '40' : 'rgba(212,169,74,0.08)'}`,
          borderRadius: 16, padding: '28px 24px',
          transition: 'all 0.3s ease',
          transform: hov ? 'translateY(-5px)' : 'translateY(0)',
          boxShadow: hov ? `0 20px 48px rgba(0,0,0,0.35), 0 0 0 1px ${color}18` : '0 2px 16px rgba(0,0,0,0.15)',
          cursor: 'default',
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 14, filter: hov ? `drop-shadow(0 0 6px ${color}80)` : 'none', transition: 'filter 0.3s' }}>{icon}</div>
        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, marginTop: 0, color: hov ? color : '#d8d8f0', fontFamily: "'Clash Display', system-ui, sans-serif", transition: 'color 0.3s' }}>{title}</h4>
        <p style={{ fontSize: 13, color: '#6868888', lineHeight: 1.7, margin: 0, fontFamily: "'Cabinet Grotesk', system-ui, sans-serif", color: '#7878a0' }}>{desc}</p>
      </div>
    </FadeCard>
  )
}

function ContactCard({ bg, border, hoverBg, hoverBorder, hoverShadow, icon, label, labelColor, value, hint }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: hov ? hoverBg : bg,
        border: `1px solid ${hov ? hoverBorder : border}`,
        borderRadius: 14, padding: '16px 20px',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? hoverShadow : 'none',
        cursor: 'pointer', height: '100%',
      }}>
      <div style={{ flexShrink: 0, filter: hov ? 'brightness(1.15)' : 'brightness(1)', transition: 'filter 0.25s' }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: labelColor, fontFamily: 'monospace', margin: '0 0 3px' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f4', margin: '0 0 2px', fontFamily: "'Cabinet Grotesk', system-ui, sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
        <p style={{ fontSize: 10, color: '#3a3a52', fontFamily: 'monospace', margin: 0, letterSpacing: '0.3px' }}>{hint}</p>
      </div>
    </div>
  )
}

const PROBLEMS = [
  { icon: '💸', color: '#fb7185', title: 'Fragmented Financial Data', desc: 'Expenses distributed across multiple applications, payment wallets, and bank accounts make it difficult to maintain a consolidated view of personal finances.' },
  { icon: '📊', color: '#fbbf24', title: 'Lack of Spending Visibility', desc: 'Without a structured tracking system, identifying where money is allocated each month becomes a manual and error-prone process.' },
  { icon: '🔁', color: '#a78bfa', title: 'Untracked Recurring Commitments', desc: 'Subscriptions and recurring payments often go unnoticed until they appear on a statement, making proactive financial planning difficult.' },
]

const SOLUTIONS = [
  { icon: '📋', color: '#4ade9a', title: 'Unified Account Overview', desc: 'Consolidate all financial accounts in a single dashboard. View balances and activity without switching between platforms.' },
  { icon: '📈', color: '#38bdf8', title: 'Structured Expense Tracking', desc: 'Log and categorise transactions systematically. Understand spending patterns through organised, accessible records.' },
  { icon: '🎯', color: '#d4a94a', title: 'Goal-Oriented Budgeting', desc: 'Define financial goals and monitor progress with discipline. Build consistent money habits through structured planning.' },
]

/* ══════════════════════════════════════════
   MAIN ABOUT PAGE
══════════════════════════════════════════ */
export default function About() {
  const containerRef = useRef(null)
  const W = typeof window !== 'undefined' ? window.innerWidth : 1200
  const isMobile = W < 700

  const S = {
    page: { padding: '52px 40px 88px', maxWidth: 1000, margin: '0 auto', fontFamily: "'Cabinet Grotesk', system-ui, sans-serif", color: '#e8e8f4' },
    sectionGap: { marginBottom: 72 },
    h2: { fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, fontFamily: "'Clash Display', system-ui, sans-serif", margin: '0 0 8px', letterSpacing: '-0.4px', color: '#f0f0f8' },
    cardRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  }

  return (
    <div style={{ background: '#07070d', minHeight: '100vh', position: 'relative' }}>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(212,169,74,0.025)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(167,139,250,0.025)', filter: 'blur(80px)' }} />
      </div>

      {/* Floating rupees */}
      <div ref={containerRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        <FloatingRupees containerRef={containerRef} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, ...S.page }}>

        {/* ── SECTION 1: OVERVIEW ── */}
        <div style={S.sectionGap}>
          <SectionLabel>Overview</SectionLabel>

          <div style={{ display: 'flex', gap: isMobile ? 0 : 52, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
            <FadeCard delay={0}>
              <DevAvatar size={isMobile ? 96 : 140} />
            </FadeCard>

            <FadeCard delay={0.1} style={{ flex: 1 }}>
              <h1 style={{ ...S.h2, fontSize: 'clamp(26px,3.5vw,38px)', marginBottom: 8, marginTop: isMobile ? 20 : 0 }}>About MUDRA</h1>
              <p style={{ fontSize: 14, color: '#5a5a78', marginBottom: 22, fontStyle: 'italic', marginTop: 0, letterSpacing: '0.3px' }}>
                A personal finance management application built to bring clarity and structure to everyday money decisions.
              </p>
              <p style={{ fontSize: 14, color: '#8888a8', lineHeight: 1.8, margin: '0 0 14px' }}>
                MUDRA is developed by <span style={{ color: '#d4a94a', fontWeight: 600 }}>Khushi Shah</span>, a student developer with a focus on building practical, user-centred web applications.
              </p>
              <p style={{ fontSize: 14, color: '#8888a8', lineHeight: 1.8, margin: '0 0 22px' }}>
                The application addresses a common challenge — managing personal finances across multiple platforms without a unified system. MUDRA provides a structured environment for tracking accounts, monitoring expenses, setting budgets, and working toward financial goals.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge color="#4ade9a">React + Vite</Badge>
                <Badge color="#38bdf8">Supabase</Badge>
                <Badge color="#d4a94a">Vercel</Badge>
                <Badge color="#a78bfa">Claude AI</Badge>
              </div>
            </FadeCard>
          </div>
        </div>

        <Divider />

        {/* ── SECTION 2: THE PROBLEM ── */}
        <div style={S.sectionGap}>
          <FadeCard>
            <SectionLabel>Problem Statement</SectionLabel>
            <h2 style={S.h2}>The Challenge</h2>
            <p style={{ fontSize: 14, color: '#5a5a7a', marginTop: 4, marginBottom: 28, lineHeight: 1.7 }}>
              Personal finance management remains fragmented for most individuals. Three core friction points motivated the development of MUDRA.
            </p>
          </FadeCard>
          <div style={S.cardRow}>
            {PROBLEMS.map((p, i) => <HoverCard key={i} {...p} delay={i * 0.1} />)}
          </div>
        </div>

        <Divider />

        {/* ── SECTION 3: THE SOLUTION ── */}
        <div style={S.sectionGap}>
          <FadeCard>
            <SectionLabel>Solution</SectionLabel>
            <h2 style={S.h2}>What MUDRA Provides</h2>
            <p style={{ fontSize: 14, color: '#5a5a7a', marginTop: 4, marginBottom: 28, lineHeight: 1.7 }}>
              A focused set of tools designed to simplify financial awareness without complexity.
            </p>
          </FadeCard>
          <div style={S.cardRow}>
            {SOLUTIONS.map((s, i) => <HoverCard key={i} {...s} delay={i * 0.1} />)}
          </div>
        </div>

        <Divider />

        {/* ── SECTION 4: THE DEVELOPER ── */}
        <div style={S.sectionGap}>
          <FadeCard>
            <SectionLabel>Developer</SectionLabel>
            <h2 style={S.h2}>Khushi Shah</h2>
          </FadeCard>

          <FadeCard delay={0.12}>
            <div style={{
              background: 'linear-gradient(135deg, #0d0d1c, #0a0a14)',
              border: '1px solid rgba(212,169,74,0.12)',
              borderRadius: 18, padding: '32px 36px',
              display: 'flex', gap: 32,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            }}>
              <DevAvatar size={96} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 2px', fontFamily: "'Clash Display', system-ui, sans-serif", color: '#f0f0f8' }}>Khushi Shah</h3>
                <p style={{ fontSize: 11, color: '#d4a94a', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                  Student Developer
                </p>
                <p style={{ fontSize: 14, color: '#7070a0', lineHeight: 1.8, margin: '0 0 10px' }}>
                  MUDRA was developed as a practical exploration of full-stack web development, combining frontend engineering with backend services and third-party integrations.
                </p>
                <p style={{ fontSize: 14, color: '#7070a0', lineHeight: 1.8, margin: '0 0 20px' }}>
                  The project involved working with authentication systems, relational databases with row-level security, OAuth providers, deployment pipelines, and API integrations — all implemented from concept to production.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Badge color="#4ade9a">Frontend Development</Badge>
                  <Badge color="#fbbf24">Database Design</Badge>
                  <Badge color="#a78bfa">UI/UX Design</Badge>
                </div>
              </div>
            </div>
          </FadeCard>
        </div>

        <Divider />

        {/* ── SECTION 5: CLOSING STATEMENT ── */}
        <FadeCard delay={0.1}>
          <div style={{
            textAlign: 'center', padding: '52px 24px 44px',
            background: 'linear-gradient(180deg, transparent, rgba(212,169,74,0.03), transparent)',
            borderRadius: 20, border: '1px solid rgba(212,169,74,0.07)',
            marginBottom: 64,
          }}>
            <div style={{ width: 36, height: 1, margin: '0 auto 28px', background: 'linear-gradient(90deg,transparent,#d4a94a,transparent)' }} />
            <p style={{
              fontSize: 'clamp(17px,2.2vw,24px)',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 500,
              color: '#e8dcc8', lineHeight: 1.6, margin: '0 0 18px',
              letterSpacing: '0.3px',
            }}>
              "Financial clarity should not be complicated."
            </p>
            <p style={{ fontSize: 11, letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(212,169,74,0.45)', fontFamily: 'monospace', marginBottom: 0, marginTop: 0 }}>
              MUDRA — Personal Finance Manager
            </p>
            <div style={{ width: 36, height: 1, margin: '28px auto 0', background: 'linear-gradient(90deg,transparent,#d4a94a,transparent)' }} />
          </div>
        </FadeCard>

        {/* ── SECTION 6: CONTACT ── */}
        <FadeCard delay={0.1}>
          <div>
            <SectionLabel>Contact</SectionLabel>
            <h2 style={S.h2}>Get in Touch</h2>
            <p style={{ fontSize: 14, color: '#5a5a78', margin: '0 0 28px', lineHeight: 1.7 }}>
              For feedback, bug reports, or general enquiries regarding MUDRA.
            </p>

            <div style={{ display: 'flex', gap: 14, flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }}>
              <a href="mailto:khushishahs.2006@gmail.com" style={{ textDecoration: 'none', flex: 1, minWidth: isMobile ? '100%' : 260 }}>
                <ContactCard
                  bg="rgba(234,67,53,0.06)" border="rgba(234,67,53,0.18)"
                  hoverBg="rgba(234,67,53,0.11)" hoverBorder="rgba(234,67,53,0.38)"
                  hoverShadow="0 12px 32px rgba(234,67,53,0.12)"
                  icon={<svg width="28" height="28" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#EA4335"/><path d="M8 14h32v20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V14z" fill="#fff"/><path d="M8 14l16 12L40 14" fill="none" stroke="#EA4335" strokeWidth="3" strokeLinejoin="round"/></svg>}
                  label="Email" labelColor="rgba(234,67,53,0.65)"
                  value="khushishahs.2006@gmail.com" hint="Click to compose"
                />
              </a>
              <a href="https://github.com/khushishahs02" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1, minWidth: isMobile ? '100%' : 220 }}>
                <ContactCard
                  bg="rgba(240,246,252,0.04)" border="rgba(240,246,252,0.09)"
                  hoverBg="rgba(240,246,252,0.08)" hoverBorder="rgba(240,246,252,0.22)"
                  hoverShadow="0 12px 32px rgba(0,0,0,0.3)"
                  icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="#f0f6fc"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>}
                  label="GitHub" labelColor="rgba(240,246,252,0.38)"
                  value="@khushishahs02" hint="Opens in new tab"
                />
              </a>
            </div>
          </div>
        </FadeCard>

      </div>

      <style>{`
        @media (max-width: 600px) {
          .about-card-row { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}