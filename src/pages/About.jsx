import { useEffect, useRef, useState } from 'react'

/* ══════════════════════════════════════════
   FLOATING RUPEE ICONS WITH REPULSION
══════════════════════════════════════════ */
const RUPEE_COUNT = 14
function buildRupees() {
  return Array.from({ length: RUPEE_COUNT }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,   // % of container
    y: 5 + Math.random() * 90,
    size: 14 + Math.random() * 18,
    opacity: 0.06 + Math.random() * 0.1,
    vx: 0, vy: 0,
    bx: 0, by: 0,
    rot: Math.random() * 360,
  }))
}

function FloatingRupees({ containerRef }) {
  const [rupees]   = useState(buildRupees)
  const stateRef   = useRef(rupees.map(r => ({ ...r })))
  const domRefs    = useRef([])
  const mouseRef   = useRef({ x: -9999, y: -9999 })
  const rafRef     = useRef(null)
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

    // Init positions
    stateRef.current.forEach(r => { r.cx = r.bx; r.cy = r.by })

    function tick() {
      const m = mouseRef.current
      let anyNear = false
      stateRef.current.forEach((r, i) => {
        const dx   = (r.cx ?? r.bx) - m.x
        const dy   = (r.cy ?? r.by) - m.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const R    = 80

        if (dist < R && dist > 1) {
          anyNear = true
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
        if (el) {
          el.style.transform =
            `translate(${r.cx}px, ${r.cy}px) rotate(${r.rot}deg)`
        }
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
      {/* Tooltip */}
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
          Even the money runs away if you don't track it.
        </div>
      )}

      {/* Rupee nodes */}
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
            fontFamily: 'serif', willChange: 'transform',
            zIndex: 0,
          }}
        >₹</div>
      ))}
    </>
  )
}

/* ══════════════════════════════════════════
   ANIMATED CARD — fades up on scroll
══════════════════════════════════════════ */
function FadeCard({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true) },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════ */
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase',
      color: 'rgba(212,169,74,0.5)', fontFamily: 'monospace',
      marginBottom: 10, marginTop: 0,
    }}>{children}</p>
  )
}

/* ══════════════════════════════════════════
   DEVELOPER PHOTO PLACEHOLDER
   (A stylized avatar since no real photo)
══════════════════════════════════════════ */
function DevAvatar({ size = 320}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "18px",
        overflow: "hidden",
        border: "3px solid rgba(212,169,74,0.4)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}
    >
      <img
        src="/khushi.jpg"
        alt="Khushi - Mudra Developer"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════
   BADGE
══════════════════════════════════════════ */
function Badge({ children, color = '#d4a94a' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 20,
      background: `${color}14`,
      border: `1px solid ${color}30`,
      fontSize: 11, color: color, fontFamily: 'monospace',
      letterSpacing: '0.5px', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

/* ══════════════════════════════════════════
   PROBLEM CARD
══════════════════════════════════════════ */
const PROBLEMS = [
  {
    icon: '💸', color: '#fb7185',
    title: 'Money Chaos',
    desc: 'Expenses scattered across apps, wallets, and subscriptions — impossible to keep track.',
  },
  {
    icon: '🔍', color: '#fbbf24',
    title: 'No Financial Clarity',
    desc: 'Most people don\'t know exactly where their money goes. It just... goes.',
  },
  {
    icon: '🧠', color: '#a78bfa',
    title: 'Mental Accounting',
    desc: 'Trying to remember expenses instead of tracking them. Your brain has better things to do.',
  },
]

/* ══════════════════════════════════════════
   SOLUTION CARD
══════════════════════════════════════════ */
const SOLUTIONS = [
  {
    icon: '📊', color: '#4ade9a',
    title: 'Track Accounts',
    desc: 'See all your balances clearly in one place. No more app-switching.',
  },
  {
    icon: '🎯', color: '#38bdf8',
    title: 'Understand Spending',
    desc: 'Visualize exactly where your money goes. Charts that actually make sense.',
  },
  {
    icon: '🏦', color: '#d4a94a',
    title: 'Financial Discipline',
    desc: 'Build smarter money habits with budgets, goals, and recurring trackers.',
  },
]

function HoverCard({ color, icon, title, desc, delay }) {
  const [hov, setHov] = useState(false)
  return (
    <FadeCard delay={delay} style={{ flex: 1, minWidth: 0 }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          height: '100%',
          background: hov
            ? `radial-gradient(ellipse at 30% 30%, ${color}12, #0e0e1a)`
            : '#0e0e1a',
          border: `1px solid ${hov ? color + '44' : 'rgba(212,169,74,0.1)'}`,
          borderRadius: 18,
          padding: '28px 24px',
          transition: 'all 0.3s ease',
          transform: hov ? 'translateY(-6px)' : 'translateY(0)',
          boxShadow: hov
            ? `0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px ${color}22`
            : '0 4px 20px rgba(0,0,0,0.2)',
          cursor: 'default',
        }}
      >
        <div style={{
          fontSize: 28, marginBottom: 14,
          filter: hov ? `drop-shadow(0 0 8px ${color}88)` : 'none',
          transition: 'filter 0.3s',
        }}>{icon}</div>
        <h4 style={{
          fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 0,
          color: hov ? color : '#e8e8f4',
          fontFamily: "'Clash Display', system-ui, sans-serif",
          transition: 'color 0.3s',
        }}>{title}</h4>
        <p style={{
          fontSize: 13, color: '#6b6b88', lineHeight: 1.65,
          margin: 0, fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
        }}>{desc}</p>
      </div>
    </FadeCard>
  )
}

/* ══════════════════════════════════════════
   MAIN ABOUT PAGE
══════════════════════════════════════════ */
export default function About() {
  const containerRef = useRef(null)
  const W = typeof window !== 'undefined' ? window.innerWidth : 1200
  const isMobile = W < 700

  const S = {
    page: {
      padding: '48px 40px 80px',
      maxWidth: 1000, margin: '0 auto',
      fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
      color: '#e8e8f4',
    },
    sectionGap: { marginBottom: 72 },
    h2: {
      fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800,
      fontFamily: "'Clash Display', system-ui, sans-serif",
      margin: '0 0 6px', letterSpacing: '-0.4px', color: '#f0f0f8',
    },
    h3: {
      fontSize: 20, fontWeight: 700, margin: '0 0 6px',
      fontFamily: "'Clash Display', system-ui, sans-serif", color: '#f0f0f8',
    },
    divider: {
      width: '100%', height: 1,
      background: 'linear-gradient(90deg,transparent,rgba(212,169,74,0.2),transparent)',
      margin: '0 0 72px',
    },
    cardRow: {
      display: 'flex', gap: 16, flexWrap: 'wrap',
    },
  }

  return (
    <div style={{ background: '#07070d', minHeight: '100vh', position: 'relative' }}>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position:'absolute', top:'10%', left:'20%', width:400, height:400, borderRadius:'50%', background:'rgba(212,169,74,0.03)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', bottom:'20%', right:'15%', width:300, height:300, borderRadius:'50%', background:'rgba(167,139,250,0.03)', filter:'blur(80px)' }} />
      </div>

      {/* Floating rupee layer — covers full page */}
      <div ref={containerRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:1 }}>
        <FloatingRupees containerRef={containerRef} />
      </div>

      {/* Page content */}
      <div style={{ position: 'relative', zIndex: 2, ...S.page }}>

        {/* ── SECTION 1: HERO ── */}
        <div style={{ ...S.sectionGap }}>
          <SectionLabel>About</SectionLabel>

          <div style={{
            display: 'flex', gap: isMobile ? 0 : 48,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
          }}>
            {/* Left — avatar */}
            <FadeCard delay={0}>
              <DevAvatar size={isMobile ? 220: 320} />
            </FadeCard>

            {/* Right — text */}
            <FadeCard delay={0.1} style={{ flex: 1 }}>
              <h1 style={{
                ...S.h2,
                fontSize: 'clamp(26px,3.5vw,40px)',
                marginBottom: 8, marginTop: isMobile ? 20 : 0,
              }}>About Mudra</h1>
              <p style={{ fontSize: 14, color: '#7070a0', marginBottom: 20, fontStyle: 'italic', marginTop: 0 }}>
                The story behind the app — and the slightly sleep-deprived developer who built it.
              </p>
              <p style={{ fontSize: 14, color: '#9090b0', lineHeight: 1.75, margin: '0 0 12px' }}>
                Hi, I'm <span style={{ color: '#d4a94a', fontWeight: 600 }}>Khushi</span> — the developer behind Mudra.
              </p>
              <p style={{ fontSize: 14, color: '#9090b0', lineHeight: 1.75, margin: '0 0 8px' }}>
                I built Mudra after realizing two things:
              </p>
              <div style={{
                background: '#0e0e1a', border: '1px solid rgba(212,169,74,0.12)',
                borderRadius: 12, padding: '14px 18px', marginBottom: 16,
              }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: '#b0b0c8' }}>
                  <span style={{ color: '#d4a94a', fontWeight: 700, marginRight: 8 }}>1.</span>
                  Money disappears faster than expected.
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#b0b0c8' }}>
                  <span style={{ color: '#d4a94a', fontWeight: 700, marginRight: 8 }}>2.</span>
                  Excel sheets are not fun.
                </p>
              </div>
              <p style={{ fontSize: 14, color: '#9090b0', lineHeight: 1.75, margin: 0 }}>
                Mudra is designed to bring <span style={{ color: '#f0f0f8', fontWeight: 500 }}>clarity and structure</span> to personal finances — without the headache.
              </p>
            </FadeCard>
          </div>
        </div>

        <div style={S.divider} />

        {/* ── SECTION 2: THE PROBLEM ── */}
        <div style={S.sectionGap}>
          <FadeCard>
            <SectionLabel>Why Mudra exists</SectionLabel>
            <h2 style={S.h2}>The Problem</h2>
            <p style={{ fontSize: 14, color: '#6b6b88', marginTop: 4, marginBottom: 28 }}>
              Sound familiar? You're not alone.
            </p>
          </FadeCard>

          <div style={S.cardRow}>
            {PROBLEMS.map((p, i) => (
              <HoverCard key={i} {...p} delay={i * 0.1} />
            ))}
          </div>

          <FadeCard delay={0.35}>
            <div style={{
              marginTop: 20, padding: '14px 20px',
              background: 'rgba(167,139,250,0.06)',
              border: '1px solid rgba(167,139,250,0.15)',
              borderRadius: 12, display: 'inline-block',
            }}>
              <p style={{
                margin: 0, fontSize: 13,
                color: '#a78bfa', fontFamily: 'monospace',
                letterSpacing: '0.3px',
              }}>
                💡 "Your brain deserves better RAM management."
              </p>
            </div>
          </FadeCard>
        </div>

        <div style={S.divider} />

        {/* ── SECTION 3: THE SOLUTION ── */}
        <div style={S.sectionGap}>
          <FadeCard>
            <SectionLabel>What Mudra does</SectionLabel>
            <h2 style={S.h2}>Enter Mudra</h2>
            <p style={{ fontSize: 14, color: '#6b6b88', marginTop: 4, marginBottom: 28 }}>
              Simple tools for financial clarity.
            </p>
          </FadeCard>

          <div style={S.cardRow}>
            {SOLUTIONS.map((s, i) => (
              <HoverCard key={i} {...s} delay={i * 0.1} />
            ))}
          </div>
        </div>

        <div style={S.divider} />

        {/* ── SECTION 4: THE DEVELOPER ── */}
        <div style={S.sectionGap}>
          <FadeCard>
            <SectionLabel>The human behind the code</SectionLabel>
            <h2 style={S.h2}>The Developer</h2>
          </FadeCard>

          <FadeCard delay={0.15}>
            <div style={{
              background: 'linear-gradient(135deg, #0e0e1a, #0a0a14)',
              border: '1px solid rgba(212,169,74,0.15)',
              borderRadius: 20, padding: '32px 36px',
              display: 'flex', gap: 32,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}>
              <DevAvatar size={160} />
              <div style={{ flex: 1 }}>
                <h3 style={{ ...S.h3, marginBottom: 2 }}>Khushi</h3>
                <p style={{
                  fontSize: 11, color: '#d4a94a', fontFamily: 'monospace',
                  letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px',
                }}>Creator of Mudra</p>
                <p style={{ fontSize: 14, color: '#7070a0', lineHeight: 1.75, margin: '0 0 20px' }}>
                  Mudra started as a project to explore how technology can make personal finance
                  simpler and more transparent. What began as "I need to track my spending" turned into
                  a full-featured finance management app.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Badge color="#4ade9a">🔬 Built with curiosity</Badge>
                  <Badge color="#fbbf24">☕ Powered by coffee</Badge>
                  <Badge color="#a78bfa">🌙 Debugged at 2AM</Badge>
                </div>
              </div>
            </div>
          </FadeCard>
        </div>

        <div style={S.divider} />

        

        {/* ══════════════════════════════════════════
            ── SECTION 6: CONTACT ── (newly added)
        ══════════════════════════════════════════ */}
        <FadeCard delay={0.1}>
          <div style={{ marginTop: 64 }}>

            {/* Section header */}
            <SectionLabel>Get in touch</SectionLabel>
            <h2 style={{
              fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800,
              fontFamily: "'Clash Display', system-ui, sans-serif",
              margin: '0 0 6px', letterSpacing: '-0.4px', color: '#f0f0f8',
            }}>Contact Me</h2>
            <p style={{
              fontSize: 14, color: '#5a5a78', margin: '0 0 32px',
              fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
            }}>
              Have feedback, spotted a bug, or just want to talk about money?
            </p>

            {/* Contact cards */}
            <div style={{
              display: 'flex', gap: 16,
              flexDirection: isMobile ? 'column' : 'row',
              flexWrap: 'wrap',
            }}>

              {/* ── Gmail card ── */}
              <a
                href="mailto:khushishahs.2006@gmail.com"
                style={{ textDecoration: 'none', flex: 1, minWidth: isMobile ? '100%' : 260 }}
              >
                <ContactCard
                  bg="rgba(234,67,53,0.07)"
                  border="rgba(234,67,53,0.2)"
                  hoverBg="rgba(234,67,53,0.13)"
                  hoverBorder="rgba(234,67,53,0.45)"
                  hoverShadow="0 16px 40px rgba(234,67,53,0.15)"
                  icon={
                    <svg width="32" height="32" viewBox="0 0 48 48">
                      <rect width="48" height="48" rx="8" fill="#EA4335" />
                      <path d="M8 14h32v20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V14z" fill="#fff" />
                      <path d="M8 14l16 12L40 14" fill="none" stroke="#EA4335" strokeWidth="3" strokeLinejoin="round" />
                    </svg>
                  }
                  label="Email"
                  labelColor="rgba(234,67,53,0.7)"
                  value="khushishahs.2006@gmail.com"
                  hint="Click to open mail client"
                />
              </a>

              {/* ── GitHub card ── */}
              <a
                href="https://github.com/khushishahs02"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', flex: 1, minWidth: isMobile ? '100%' : 240 }}
              >
                <ContactCard
                  bg="rgba(240,246,252,0.04)"
                  border="rgba(240,246,252,0.1)"
                  hoverBg="rgba(240,246,252,0.09)"
                  hoverBorder="rgba(240,246,252,0.28)"
                  hoverShadow="0 16px 40px rgba(0,0,0,0.35)"
                  icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#f0f6fc">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  }
                  label="GitHub"
                  labelColor="rgba(240,246,252,0.4)"
                  value="@khushishahs02"
                  hint="Opens in new tab"
                />
              </a>

            </div>

            {/* Footer quip */}
            <p style={{
              fontSize: 11, color: '#2a2a3a', fontFamily: 'monospace',
              letterSpacing: '0.5px', marginTop: 20, textAlign: 'center',
            }}>
              Response time: faster than your monthly budget review 😄
            </p>
          </div>
        </FadeCard>

      </div>{/* end page content */}

      <style>{`
        @media (max-width: 600px) {
          .about-card-row { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}

/* ══════════════════════════════════════════
   CONTACT CARD — reusable hover card
══════════════════════════════════════════ */
function ContactCard({ bg, border, hoverBg, hoverBorder, hoverShadow, icon, label, labelColor, value, hint }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: hov ? hoverBg : bg,
        border: `1px solid ${hov ? hoverBorder : border}`,
        borderRadius: 16, padding: '18px 22px',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hov ? hoverShadow : 'none',
        cursor: 'pointer',
        height: '100%',
      }}
    >
      {/* Icon */}
      <div style={{
        flexShrink: 0,
        filter: hov ? 'brightness(1.15)' : 'brightness(1)',
        transition: 'filter 0.25s',
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase',
          color: labelColor, fontFamily: 'monospace',
          margin: '0 0 3px',
        }}>{label}</p>
        <p style={{
          fontSize: 13, fontWeight: 600, color: '#e8e8f4',
          margin: '0 0 2px',
          fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{value}</p>
        <p style={{
          fontSize: 10, color: '#3a3a52', fontFamily: 'monospace',
          margin: 0, letterSpacing: '0.3px',
        }}>{hint}</p>
      </div>
    </div>
  )
}