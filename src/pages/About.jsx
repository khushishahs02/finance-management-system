import { useEffect, useRef, useState } from 'react'

/* ─── Floating ₹ background ─────────────────────────────── */
function FloatingRupees({ containerRef }) {
  const COUNT = 12
  const stateRef = useRef(
    Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      bx: 0, by: 0, cx: 0, cy: 0,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      size: 14 + Math.random() * 16,
      opacity: 0.04 + Math.random() * 0.06,
      vx: 0, vy: 0,
      rot: Math.random() * 360,
    }))
  )
  const domRefs = useRef([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    function initBase() {
      const { width, height } = container.getBoundingClientRect()
      stateRef.current.forEach(r => {
        r.bx = (r.x / 100) * width
        r.by = (r.y / 100) * height
        r.cx = r.bx; r.cy = r.by
      })
    }
    initBase()
    const ro = new ResizeObserver(initBase)
    ro.observe(container)
    const onMove = e => {
      const rect = container.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', () => { mouseRef.current = { x: -9999, y: -9999 } })
    function tick() {
      stateRef.current.forEach((r, i) => {
        const dx = r.cx - mouseRef.current.x, dy = r.cy - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy), R = 90
        if (dist < R && dist > 1) {
          const str = ((R - dist) / R) * 1.6
          r.vx += Math.cos(Math.atan2(dy, dx)) * str
          r.vy += Math.sin(Math.atan2(dy, dx)) * str
        }
        r.vx += (r.bx - r.cx) * 0.022; r.vy += (r.by - r.cy) * 0.022
        r.vx *= 0.80; r.vy *= 0.80
        r.cx += r.vx; r.cy += r.vy; r.rot += r.vx * 0.4
        const el = domRefs.current[i]
        if (el) el.style.transform = `translate(${r.cx}px,${r.cy}px) rotate(${r.rot}deg)`
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current) }
  }, [])

  return stateRef.current.map((r, i) => (
    <div key={r.id} ref={el => domRefs.current[i] = el}
      style={{
        position: 'absolute', top: 0, left: 0,
        fontSize: r.size, color: '#d4a94a', opacity: r.opacity,
        pointerEvents: 'none', userSelect: 'none', fontFamily: 'serif',
        willChange: 'transform', zIndex: 0,
      }}>₹</div>
  ))
}

/* ─── Fade-in on scroll ──────────────────────────────────── */
function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>{children}</div>
  )
}

function Label({ children }) {
  return (
    <p style={{
      fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase',
      color: 'rgba(212,169,74,0.55)', fontFamily: 'monospace',
      margin: '0 0 10px',
    }}>{children}</p>
  )
}

function HR() {
  return <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,169,74,0.15),transparent)', margin: '60px 0' }} />
}

function Card({ color = '#d4a94a', icon, title, desc, delay = 0 }) {
  const [hov, setHov] = useState(false)
  return (
    <FadeIn delay={delay} style={{ flex: 1, minWidth: 240 }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
        height: '100%', padding: '26px 22px', borderRadius: 14,
        background: hov ? `radial-gradient(ellipse at 20% 20%,${color}0e,#0e0e1a)` : '#0e0e1a',
        border: `1px solid ${hov ? color + '44' : 'rgba(212,169,74,0.08)'}`,
        transform: hov ? 'translateY(-4px)' : 'none',
        transition: 'all 0.3s ease', cursor: 'default',
      }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>{icon}</div>
        <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: hov ? color : '#d8d8f0', fontFamily: "'Clash Display',system-ui,sans-serif", transition: 'color 0.3s' }}>{title}</h4>
        <p style={{ fontSize: 13, color: '#7878a0', lineHeight: 1.7, margin: 0, fontFamily: "'Cabinet Grotesk',system-ui,sans-serif" }}>{desc}</p>
      </div>
    </FadeIn>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function About() {
  const bgRef = useRef(null)

  return (
    <div style={{ background: '#07070d', minHeight: '100vh', position: 'relative' }}>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '5%', left: '15%', width: 420, height: 420, borderRadius: '50%', background: 'rgba(212,169,74,0.02)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(167,139,250,0.02)', filter: 'blur(80px)' }} />
      </div>

      {/* Floating rupees */}
      <div ref={bgRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <FloatingRupees containerRef={bgRef} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 960, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,4vw,48px) 80px', fontFamily: "'Cabinet Grotesk',system-ui,sans-serif", color: '#e8e8f4' }}>

        {/* ══ SECTION 1: INTRODUCTION ══ */}
        <FadeIn delay={0}>
          <Label>Introduction</Label>
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 0 }}>

            {/* Photo — large, once */}
            <div style={{
              width: 180, height: 180, borderRadius: 20, flexShrink: 0,
              overflow: 'hidden',
              border: '2px solid rgba(212,169,74,0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 4px rgba(212,169,74,0.04)',
            }}>
              <img src="/khushi.jpg" alt="Khushi Shah"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <h1 style={{
                fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800,
                fontFamily: "'Clash Display',system-ui,sans-serif",
                margin: '0 0 6px', letterSpacing: '-0.5px', color: '#f0f0f8',
              }}>Hi, I'm Khushi Shah.</h1>
              <p style={{ fontSize: 13, color: '#d4a94a', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Student · Developer · Creator of MUDRA
              </p>
              <p style={{ fontSize: 15, color: '#9898b8', lineHeight: 1.85, margin: '0 0 14px' }}>
                I built MUDRA because I was tired of not knowing where my money was going. Expenses were scattered across different apps, subscriptions were invisible until they hit my account, and I had no real picture of my financial health at any point in the month.
              </p>
              <p style={{ fontSize: 15, color: '#9898b8', lineHeight: 1.85, margin: 0 }}>
                I wanted something clean, simple, and actually useful — so I built it myself.
              </p>
            </div>
          </div>
        </FadeIn>

        <HR />

        {/* ══ SECTION 2: THE PROBLEM ══ */}
        <div style={{ marginBottom: 0 }}>
          <FadeIn>
            <Label>Why I built this</Label>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, fontFamily: "'Clash Display',system-ui,sans-serif", margin: '0 0 8px', color: '#f0f0f8' }}>
              The Problem
            </h2>
            <p style={{ fontSize: 14, color: '#5a5a7a', margin: '0 0 32px', lineHeight: 1.7 }}>
              Three things kept bothering me about managing money personally.
            </p>
          </FadeIn>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Card icon="💸" color="#fb7185" title="Money Was Everywhere" desc="Bank app, UPI, wallet, cash — tracking across all of them manually was exhausting and I always missed something." delay={0} />
            <Card icon="📊" color="#fbbf24" title="No Real Visibility" desc="At the end of every month I had no idea where the money actually went. The numbers never added up to a clear picture." delay={0.1} />
            <Card icon="🔁" color="#a78bfa" title="Forgotten Subscriptions" desc="Recurring charges would appear out of nowhere. I had no system to track what was renewing, when, or for how much." delay={0.2} />
          </div>
        </div>

        <HR />

        {/* ══ SECTION 3: THE SOLUTION ══ */}
        <div style={{ marginBottom: 0 }}>
          <FadeIn>
            <Label>What MUDRA does</Label>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, fontFamily: "'Clash Display',system-ui,sans-serif", margin: '0 0 8px', color: '#f0f0f8' }}>
              The Solution
            </h2>
            <p style={{ fontSize: 14, color: '#5a5a7a', margin: '0 0 32px', lineHeight: 1.7 }}>
              MUDRA brings everything into one place without overcomplicating it.
            </p>
          </FadeIn>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Card icon="📋" color="#4ade9a" title="All Accounts, One View" desc="See every account balance and transaction in one dashboard. No more switching between five apps." delay={0} />
            <Card icon="📈" color="#38bdf8" title="Track Every Rupee" desc="Log income and expenses by category. Over time, patterns emerge — and you actually understand your spending." delay={0.1} />
            <Card icon="🎯" color="#d4a94a" title="Budget With Purpose" desc="Set budgets and goals that matter to you. MUDRA tracks your progress so you stay on course without constant manual effort." delay={0.2} />
          </div>
        </div>

        <HR />

        {/* ══ SECTION 4: WHAT I LEARNED ══ */}
        <FadeIn>
          <Label>What I learned</Label>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, fontFamily: "'Clash Display',system-ui,sans-serif", margin: '0 0 18px', color: '#f0f0f8' }}>
            Building MUDRA Changed How I Think
          </h2>

          <div style={{
            background: 'linear-gradient(135deg,#0d0d1c,#0a0a14)',
            border: '1px solid rgba(212,169,74,0.1)',
            borderRadius: 18, padding: 'clamp(24px,4vw,40px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          }}>
            <p style={{ fontSize: 15, color: '#9898b8', lineHeight: 1.9, margin: '0 0 16px' }}>
              I started this project to get hands-on experience. I didn't know much going in — and that was the whole point. MUDRA pushed me to learn things I would never have picked up from a course alone.
            </p>
            <p style={{ fontSize: 15, color: '#9898b8', lineHeight: 1.9, margin: '0 0 24px' }}>
              I learned how to work with <span style={{ color: '#4ade9a', fontWeight: 600 }}>Supabase</span> for authentication and databases, how to handle <span style={{ color: '#38bdf8', fontWeight: 600 }}>API keys</span> and connect services securely, how to integrate <span style={{ color: '#fbbf24', fontWeight: 600 }}>Google OAuth</span> and wire up a live webhook to Google Sheets, how to build <span style={{ color: '#a78bfa', fontWeight: 600 }}>physics-based animations</span> with requestAnimationFrame, and how to take a project from concept all the way to a deployed website on <span style={{ color: '#d4a94a', fontWeight: 600 }}>Vercel</span>.
            </p>
            <p style={{ fontSize: 15, color: '#9898b8', lineHeight: 1.9, margin: 0 }}>
              The idea and design are entirely mine. The implementation was built with the help of <span style={{ color: '#d4a94a', fontWeight: 600 }}>Claude AI</span> — and honestly, I'm a different person after making this app.
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
              {['React + Vite','Supabase','Google OAuth','Vercel','Google Sheets API','Claude AI','Physics Animations','Row Level Security'].map(tag => (
                <span key={tag} style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(212,169,74,0.08)',
                  border: '1px solid rgba(212,169,74,0.2)',
                  fontSize: 11, color: '#d4a94a',
                  fontFamily: 'monospace', letterSpacing: '0.5px',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </FadeIn>

        <HR />

        {/* ══ SECTION 6: CONTACT ══ */}
        <FadeIn delay={0.1}>
          <Label>Contact</Label>
          <h2 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, fontFamily: "'Clash Display',system-ui,sans-serif", margin: '0 0 8px', color: '#f0f0f8' }}>
            Get in Touch
          </h2>
          <p style={{ fontSize: 14, color: '#5a5a78', margin: '0 0 24px', lineHeight: 1.7 }}>
            For feedback, bug reports, or just to say the app helped you.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="mailto:khushishahs.2006@gmail.com" style={{ textDecoration: 'none', flex: 1, minWidth: 240 }}>
              <ContactCard
                bg="rgba(234,67,53,0.05)" hoverBg="rgba(234,67,53,0.1)"
                border="rgba(234,67,53,0.15)" hoverBorder="rgba(234,67,53,0.35)"
                shadow="0 12px 32px rgba(234,67,53,0.1)"
                icon={<svg width="26" height="26" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#EA4335"/><path d="M8 14h32v20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V14z" fill="#fff"/><path d="M8 14l16 12L40 14" fill="none" stroke="#EA4335" strokeWidth="3" strokeLinejoin="round"/></svg>}
                label="Email" labelColor="rgba(234,67,53,0.6)"
                value="khushishahs.2006@gmail.com" hint="Click to compose an email"
              />
            </a>
            <a href="https://github.com/khushishahs02" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1, minWidth: 200 }}>
              <ContactCard
                bg="rgba(240,246,252,0.03)" hoverBg="rgba(240,246,252,0.07)"
                border="rgba(240,246,252,0.08)" hoverBorder="rgba(240,246,252,0.2)"
                shadow="0 12px 32px rgba(0,0,0,0.3)"
                icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="#f0f6fc"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>}
                label="GitHub" labelColor="rgba(240,246,252,0.35)"
                value="@khushishahs02" hint="Opens in a new tab"
              />
            </a>
          </div>
        </FadeIn>

      </div>
    </div>
  )
}

function ContactCard({ bg, hoverBg, border, hoverBorder, shadow, icon, label, labelColor, value, hint }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: hov ? hoverBg : bg,
      border: `1px solid ${hov ? hoverBorder : border}`,
      borderRadius: 12, padding: '14px 18px',
      transform: hov ? 'translateY(-3px)' : 'none',
      boxShadow: hov ? shadow : 'none',
      transition: 'all 0.25s ease', cursor: 'pointer',
    }}>
      {icon}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: labelColor, fontFamily: 'monospace', margin: '0 0 3px' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f4', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
        <p style={{ fontSize: 10, color: '#3a3a52', fontFamily: 'monospace', margin: 0 }}>{hint}</p>
      </div>
    </div>
  )
}