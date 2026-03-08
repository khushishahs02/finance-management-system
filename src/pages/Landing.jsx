import { useEffect, useRef, useState, useCallback } from 'react'
import Login from './Login'

/* ═══════════════════════════════════════════════════
   CURRENCY NOTE SVG  (standalone, used in hero)
═══════════════════════════════════════════════════ */
const NOTES_META = [
  { denom:'₹2000', bg:'#f0b8d0', stripe:'#d4558a', accent:'#7a1a4a', w:170, h:86 },
  { denom:'₹500',  bg:'#b8d4f0', stripe:'#4a90d9', accent:'#1a3a7a', w:160, h:80 },
  { denom:'₹200',  bg:'#f5d890', stripe:'#e8a030', accent:'#7a4800', w:150, h:76 },
  { denom:'₹100',  bg:'#b8e8bc', stripe:'#4caf50', accent:'#1a5020', w:155, h:78 },
  { denom:'₹50',   bg:'#fef3a0', stripe:'#f0c000', accent:'#6a5000', w:145, h:73 },
  { denom:'₹20',   bg:'#ffd8a0', stripe:'#ff9800', accent:'#7a3600', w:140, h:70 },
  { denom:'₹10',   bg:'#e0b8f0', stripe:'#9c27b0', accent:'#4a0068', w:135, h:68 },
]

function NoteSVG({ meta, uid }) {
  const { denom, bg, stripe, accent, w, h } = meta
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display:'block' }}>
      <defs>
        <linearGradient id={`hg${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={bg} />
          <stop offset="100%" stopColor={bg} stopOpacity="0.75" />
        </linearGradient>
        <filter id={`hf${uid}`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.5" floodColor="#000" />
        </filter>
      </defs>
      <rect rx="6" width={w} height={h} fill={`url(#hg${uid})`} filter={`url(#hf${uid})`} />
      <rect x="0"    y="0" width="18" height={h} rx="5" fill={stripe} opacity="0.85" />
      <rect x="18"   y="0" width="3"  height={h}        fill={stripe} opacity="0.2"  />
      <rect x={w-18} y="0" width="18" height={h}        fill={stripe} opacity="0.85" />
      <circle cx="40" cy={h/2} r="13" fill="none" stroke={accent} strokeWidth="1.4" opacity="0.6" />
      <circle cx="40" cy={h/2} r="8"  fill="none" stroke={accent} strokeWidth="0.7" opacity="0.4" />
      {spokes.map((a,i)=>(
        <line key={i}
          x1={40+Math.cos(a*Math.PI/180)*5} y1={h/2+Math.sin(a*Math.PI/180)*5}
          x2={40+Math.cos(a*Math.PI/180)*12} y2={h/2+Math.sin(a*Math.PI/180)*12}
          stroke={accent} strokeWidth="0.8" opacity="0.5"
        />
      ))}
      <text x="26" y={h/2-15} fontSize="4.5" fill={accent} fontWeight="700" opacity="0.7" fontFamily="serif">भारतीय रिज़र्व बैंक</text>
      <text x="26" y={h/2- 9} fontSize="4"   fill={accent}               opacity="0.55" fontFamily="serif">RESERVE BANK OF INDIA</text>
      <text x="58" y={h/2+ 5} fontSize="20"  fill={accent} fontWeight="900" opacity="0.88" fontFamily="serif">{denom}</text>
      <text x="58" y={h/2+16} fontSize="6.5" fill={accent} opacity="0.5" fontFamily="sans-serif" letterSpacing="1">{denom.replace('₹','')} RUPEES</text>
      <rect x={w*0.42} y="0" width="2" height={h} fill={accent} opacity="0.15" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════
   HERO PHYSICS NOTES
   50 notes on desktop, 20 on mobile
   Cursor repulsion, slow spring return
   Scroll drives stacking animation
═══════════════════════════════════════════════════ */

// Stack target positions: 7 stacks evenly spaced
function getStackTargets(W, H) {
  const stacks = NOTES_META.length  // 7
  return Array.from({ length: stacks }, (_, i) => ({
    x: (W / (stacks + 1)) * (i + 1),
    y: H * 0.52,
    rot: -3 + i * 1,
  }))
}

function buildHeroNotes(W, H, count) {
  return Array.from({ length: count }, (_, i) => {
    const meta = NOTES_META[i % NOTES_META.length]
    return {
      id:      i,
      meta,
      stackIdx: i % NOTES_META.length,
      // scatter across full viewport with some margin
      baseX:   60 + Math.random() * (W - 200),
      baseY:   40 + Math.random() * (H - 160),
      baseRot: -65 + Math.random() * 130,
      x: 0, y: 0, rot: 0,
      vx: 0, vy: 0,
      scale: 0.55 + Math.random() * 0.7,
      z: Math.floor(Math.random() * 30),
    }
  })
}

function HeroNotes({ scrollProgress }) {
  const containerRef  = useRef(null)
  const notesRef      = useRef([])
  const domRefs       = useRef([])
  const mouseRef      = useRef({ x:-9999, y:-9999 })
  const rafRef        = useRef(null)
  const scrollRef     = useRef(0)
  const stacksRef     = useRef([])
  const isMobile      = useRef(window.innerWidth < 700)
  const COUNT         = isMobile.current ? 20 : 50

  // Init notes once
  useEffect(() => {
    const W = window.innerWidth
    const H = window.innerHeight
    const notes = buildHeroNotes(W, H, COUNT)
    notes.forEach(n => { n.x = n.baseX; n.y = n.baseY; n.rot = n.baseRot })
    notesRef.current = notes
    stacksRef.current = getStackTargets(W, H)

    function onResize() {
      const W2 = window.innerWidth
      const H2 = window.innerHeight
      isMobile.current = W2 < 700
      stacksRef.current = getStackTargets(W2, H2)
      notesRef.current.forEach(n => {
        n.baseX = 60 + Math.random() * (W2 - 200)
        n.baseY = 40 + Math.random() * (H2 - 160)
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Mouse tracking on hero section
  useEffect(() => {
    function onMove(e) { mouseRef.current = { x: e.clientX, y: e.clientY } }
    function onLeave() { mouseRef.current = { x:-9999, y:-9999 } }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // Sync scroll progress into ref
  useEffect(() => { scrollRef.current = scrollProgress }, [scrollProgress])

  // Animation loop
  useEffect(() => {
    function tick() {
      const m  = mouseRef.current
      const sp = scrollRef.current   // 0 = chaos, 1 = fully stacked
      const notes  = notesRef.current
      const stacks = stacksRef.current

      notes.forEach((n, i) => {
        // Interpolate target between base (scatter) and stack position
        const st = stacks[n.stackIdx]
        // Stack position: notes pile up with small offset per note in same stack
        const sameStackNotes = notes.filter(nn => nn.stackIdx === n.stackIdx)
        const posInStack = sameStackNotes.indexOf(n)
        const stackOffsetY = posInStack * -2.5   // slight vertical stagger in stack

        const targetX   = n.baseX   + (st.x - n.baseX)   * sp
        const targetY   = n.baseY   + (st.y + stackOffsetY - n.baseY) * sp
        const targetRot = n.baseRot + (st.rot - n.baseRot) * sp

        // Cursor repulsion (only active when not stacked)
        const repelFactor = 1 - sp * 0.95
        const dx   = n.x - m.x
        const dy   = n.y - m.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        const R    = 160
        if (dist < R && dist > 1 && repelFactor > 0.05) {
          const str = ((R - dist) / R) * 2.5 * repelFactor
          const ang = Math.atan2(dy, dx)
          n.vx += Math.cos(ang) * str
          n.vy += Math.sin(ang) * str
        }

        // Spring toward target
        n.vx += (targetX - n.x) * (0.02 + sp * 0.06)
        n.vy += (targetY - n.y) * (0.02 + sp * 0.06)

        // Damping
        const damp = 0.78 + sp * 0.1
        n.vx *= damp
        n.vy *= damp

        n.x += n.vx
        n.y += n.vy

        // Rotation
        n.rot += (n.vx - n.vy) * 0.08 * (1 - sp)
        n.rot += (targetRot - n.rot) * (0.025 + sp * 0.08)

        // Apply to DOM
        const el = domRefs.current[i]
        if (el) {
          el.style.transform =
            `translate3d(${n.x}px,${n.y}px,0) rotate(${n.rot}deg) scale(${n.scale})`
          // Reduce opacity slightly when stacked (depth effect)
          el.style.opacity = sp > 0.5
            ? (0.82 - posInStack * 0.05).toString()
            : '0.82'
        }
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Render placeholder divs — COUNT notes
  const placeholders = Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    meta: NOTES_META[i % NOTES_META.length],
    z: Math.floor(Math.random() * 30),
  }))

  return (
    <div ref={containerRef} style={{
      position:'absolute', inset:0,
      pointerEvents:'none', overflow:'hidden',
    }}>
      {placeholders.map((p,i) => (
        <div key={p.id} ref={el => domRefs.current[i]=el}
          style={{
            position:'absolute', top:0, left:0,
            transformOrigin:'center center',
            willChange:'transform',
            zIndex: p.z,
            filter:'drop-shadow(0 8px 18px rgba(0,0,0,0.5))',
          }}
        >
          <NoteSVG meta={p.meta} uid={`h${p.id}`} />
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MUDRA LOGO SVG
═══════════════════════════════════════════════════ */
function MudraLogoMark({ size=52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="lmlg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#d4a94a" />
          <stop offset="100%" stopColor="#f5e6c8" />
        </linearGradient>
      </defs>
      <polygon points="24,2 44,13 44,35 24,46 4,35 4,13"
        fill="url(#lmlg)" fillOpacity="0.13"
        stroke="url(#lmlg)" strokeWidth="1.5" />
      <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle"
        fontSize="22" fontWeight="900"
        fill="url(#lmlg)" fontFamily="Georgia,serif">₹</text>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════════════════ */
function HeroSection({ scrollProgress, heroRef }) {
  // Text fades out as stacking begins
  const textOpacity  = Math.max(0, 1 - scrollProgress * 3)
  const stackOpacity = Math.min(1, (scrollProgress - 0.2) * 4)

  return (
    <section ref={heroRef} style={{
      position:'relative',
      width:'100%', height:'100vh',
      overflow:'hidden',
      background:'radial-gradient(ellipse at 50% 40%, #0f0f22 0%, #07070d 70%)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {/* Colorful ambient glows */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:1 }}>
        <div style={{ position:'absolute', top:'10%',  left:'15%', width:340, height:340, borderRadius:'50%', background:'rgba(212,169,74,0.06)',  filter:'blur(80px)' }} />
        <div style={{ position:'absolute', top:'30%',  right:'10%',width:280, height:280, borderRadius:'50%', background:'rgba(74,144,217,0.07)',  filter:'blur(70px)' }} />
        <div style={{ position:'absolute', bottom:'10%',left:'30%', width:320, height:320, borderRadius:'50%', background:'rgba(156,39,176,0.05)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', top:'60%',  left:'55%', width:260, height:260, borderRadius:'50%', background:'rgba(76,175,80,0.05)',   filter:'blur(70px)' }} />
      </div>

      {/* Notes layer */}
      <div style={{ position:'absolute', inset:0, zIndex:2 }}>
        <HeroNotes scrollProgress={scrollProgress} />
      </div>

      {/* Gradient overlay — centre readable area */}
      <div style={{
        position:'absolute', inset:0, zIndex:3, pointerEvents:'none',
        background:'radial-gradient(ellipse at 50% 48%, rgba(7,7,13,0.55) 0%, rgba(7,7,13,0.1) 60%)',
      }} />

      {/* Center branding — fades as scroll starts */}
      <div style={{
        position:'relative', zIndex:4,
        textAlign:'center', userSelect:'none',
        opacity: textOpacity,
        transform: `translateY(${scrollProgress * -40}px)`,
        transition:'none',
        pointerEvents: textOpacity < 0.05 ? 'none' : 'auto',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:16 }}>
          <MudraLogoMark size={56} />
          <h1 style={{
            fontSize:'clamp(52px,8vw,96px)',
            fontWeight:900, letterSpacing:'8px',
            fontFamily:"'Clash Display',system-ui,sans-serif",
            background:'linear-gradient(135deg,#d4a94a 0%,#f5e6c8 50%,#d4a94a 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text', lineHeight:1, margin:0,
          }}>MUDRA</h1>
        </div>
        <p style={{
          fontSize:'clamp(18px,2.5vw,26px)',
          color:'rgba(210,210,220,0.95)',
          fontFamily:"'Cormorant Garamond',Georgia,serif",
          fontStyle:'italic', letterSpacing:'2px',
          marginBottom:36,
          textShadow:'0 2px 12px rgba(0,0,0,0.6)',
        }}>
          Organize your money before it organizes you.
        </p>

        {/* Scroll hint */}
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          animation:'heroFloat 2.2s ease-in-out infinite',
        }}>
          <span style={{ fontSize:13, letterSpacing:'3px', textTransform:'uppercase', color:'rgba(212,169,74,0.85)', fontFamily:'monospace' }}>
            scroll to organize
          </span>
          <div style={{ width:1, height:32, background:'linear-gradient(to bottom, rgba(212,169,74,0.6), transparent)' }} />
        </div>
      </div>

      {/* "Stacking" label — appears during scroll transition */}
      <div style={{
        position:'absolute', zIndex:4,
        bottom:60, left:'50%', transform:'translateX(-50%)',
        opacity: stackOpacity,
        pointerEvents:'none',
        textAlign:'center',
      }}>
        <p style={{
          fontSize:13, letterSpacing:'3px', textTransform:'uppercase',
          color:'rgba(212,169,74,0.7)', fontFamily:'monospace',
          marginBottom:6,
        }}>MUDRA is organizing your money</p>
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          {NOTES_META.map((n,i) => (
            <div key={i} style={{
              width:28, height:16, borderRadius:3,
              background:n.stripe, opacity:0.8,
              transform:`rotate(-${2-i*0.5}deg)`,
              boxShadow:'0 2px 8px rgba(0,0,0,0.4)',
              transition:'transform 0.3s',
            }} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   FEATURES SECTION
═══════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="18" width="5" height="10" rx="2" fill="#4ade9a" opacity="0.9"/>
        <rect x="11" y="12" width="5" height="16" rx="2" fill="#38bdf8" opacity="0.9"/>
        <rect x="19" y="6"  width="5" height="22" rx="2" fill="#d4a94a" opacity="0.9"/>
        <path d="M4 22 L13 14 L21 9 L28 5" stroke="#f5e6c8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
        <circle cx="28" cy="5" r="2" fill="#f5e6c8" opacity="0.6"/>
      </svg>
    ),
    color: '#4ade9a',
    glow: 'rgba(74,222,154,0.15)',
    title: 'Expense Tracking',
    desc: 'Track where every rupee goes. Categorize, visualize, and understand your spending in real time.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="18" rx="4" stroke="#d4a94a" strokeWidth="1.8" fill="none"/>
        <rect x="4" y="12" width="24" height="4" fill="#d4a94a" opacity="0.15"/>
        <circle cx="9" cy="20" r="2.5" fill="#d4a94a" opacity="0.8"/>
        <rect x="14" y="19" width="10" height="2" rx="1" fill="#d4a94a" opacity="0.4"/>
        <path d="M16 4 L16 8" stroke="#d4a94a" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10 4 L10 8" stroke="#d4a94a" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M22 4 L22 8" stroke="#d4a94a" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: '#d4a94a',
    glow: 'rgba(212,169,74,0.15)',
    title: 'Smart Budgeting',
    desc: 'Plan your monthly spending with intelligent insights. Know before you overspend, not after.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="11" stroke="#a78bfa" strokeWidth="1.8" fill="none"/>
        <path d="M16 5 A11 11 0 0 1 27 16" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <circle cx="16" cy="16" r="3" fill="#a78bfa" opacity="0.9"/>
        <path d="M16 16 L16 9" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M16 16 L21 16" stroke="#f5e6c8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.15)',
    title: 'Financial Clarity',
    desc: 'Understand your money patterns and make smarter decisions. Your financial story, clearly told.',
  },
]

function FeatureCard({ feat, index }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  const [hov, setHov] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true) },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex:'1', minWidth:'min(280px, 100%)',
        background: hov
          ? `radial-gradient(ellipse at 30% 30%, ${feat.glow}, rgba(14,14,26,0.95))`
          : 'rgba(14,14,26,0.8)',
        border: `1px solid ${hov ? feat.color+'44' : 'rgba(212,169,74,0.1)'}`,
        borderRadius:24,
        padding:'clamp(20px,4vw,36px) clamp(16px,4vw,32px)',
        backdropFilter:'blur(16px)',
        boxShadow: hov
          ? `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${feat.color}22`
          : '0 8px 32px rgba(0,0,0,0.3)',
        cursor:'default',
        opacity: vis ? 1 : 0,
        transform: vis
          ? `translateY(${hov ? -8 : 0}px)`
          : 'translateY(40px)',
        transition: `opacity 0.7s ease ${index*0.15}s, transform 0.7s ease ${index*0.15}s, box-shadow 0.3s, border-color 0.3s, background 0.3s`,
      }}
    >
      <div style={{
        width:60, height:60, borderRadius:16, marginBottom:20,
        background:`${feat.glow}`,
        border:`1px solid ${feat.color}33`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: hov ? `0 0 20px ${feat.glow}` : 'none',
        transition:'box-shadow 0.3s',
      }}>
        {feat.icon}
      </div>
      <h3 style={{
        fontSize:20, fontWeight:700, marginBottom:10,
        fontFamily:"'Clash Display',system-ui,sans-serif",
        color: feat.color, letterSpacing:'-0.3px',
      }}>{feat.title}</h3>
      <p style={{
        fontSize:14, lineHeight:1.7,
        color:'#c8c8dc', fontFamily:"'Cabinet Grotesk',system-ui,sans-serif",
      }}>{feat.desc}</p>
    </div>
  )
}

function FeaturesSection({ featRef }) {
  const [btnHov, setBtnHov] = useState(false)

  function scrollToLogin() {
    document.getElementById('mudra-login-section')?.scrollIntoView({ behavior:'smooth' })
  }

  return (
    <section ref={featRef} style={{
      width:'100%', padding:'100px 0 80px',
      background:'linear-gradient(180deg, #07070d 0%, #0a0a18 50%, #07070d 100%)',
      position:'relative', overflow:'hidden',
    }}>
      {/* Background grid lines */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', opacity:0.03,
        backgroundImage:'linear-gradient(rgba(212,169,74,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,169,74,1) 1px, transparent 1px)',
        backgroundSize:'60px 60px',
      }} />

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 clamp(16px,4vw,40px)' }}>
        {/* Section heading */}
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <p style={{
            fontSize:11, letterSpacing:'4px', textTransform:'uppercase',
            color:'rgba(212,169,74,0.75)', fontFamily:'monospace', marginBottom:14,
          }}>What MUDRA does</p>
          <h2 style={{
            fontSize:'clamp(22px,5vw,48px)', fontWeight:800,
            fontFamily:"'Clash Display',system-ui,sans-serif",
            color:'#f0f0f8', letterSpacing:'-0.5px', lineHeight:1.15,
            margin:0,
          }}>
            Everything your money<br />
            <span style={{
              background:'linear-gradient(135deg,#d4a94a,#f5e6c8)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text',
            }}>needs to behave.</span>
          </h2>
        </div>

        {/* Feature cards */}
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {FEATURES.map((f,i) => <FeatureCard key={i} feat={f} index={i} />)}
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center', marginTop:56 }}>
          <button
            onClick={scrollToLogin}
            onMouseEnter={() => setBtnHov(true)}
            onMouseLeave={() => setBtnHov(false)}
            style={{
              padding:'14px 44px',
              background: btnHov
                ? 'linear-gradient(135deg,#f5e6c8,#d4a94a)'
                : 'linear-gradient(135deg,#d4a94a,#b8902a)',
              border:'none', borderRadius:14,
              fontSize:15, fontWeight:700, color:'#07070d',
              cursor:'pointer', letterSpacing:'0.5px',
              fontFamily:"'Clash Display',system-ui,sans-serif",
              boxShadow: btnHov
                ? '0 12px 40px rgba(212,169,74,0.4)'
                : '0 6px 20px rgba(212,169,74,0.2)',
              transform: btnHov ? 'translateY(-2px)' : 'translateY(0)',
              transition:'all 0.25s ease',
            }}>
            Get Started with MUDRA →
          </button>
          <p style={{ fontSize:12, color:'rgba(212,169,74,0.55)', marginTop:12, fontFamily:'monospace', letterSpacing:'1px' }}>
            Free · No credit card required
          </p>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   LOGIN SECTION WRAPPER
═══════════════════════════════════════════════════ */
function LoginSection() {
  return (
    <section id="mudra-login-section" style={{ width:'100%', minHeight:'100vh' }}>
      <Login />
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   LANDING ROOT — scroll orchestration
═══════════════════════════════════════════════════ */
export default function Landing() {
  const [scrollProgress, setScrollProgress] = useState(0)
  // scrollProgress: 0 = top of hero, 1 = hero fully stacked (features visible)
  const heroRef    = useRef(null)
  const featRef    = useRef(null)
  const lockedRef  = useRef(false)
  const lockAnimRef= useRef(null)

  // Cinematic lock: when user starts scrolling in hero,
  // we briefly lock scroll to let the stacking animation play
  useEffect(() => {
    let lockStart    = null
    let isLocked     = false
    const LOCK_DURATION = 1400  // ms for cinematic transition

    function onScroll(e) {
      const hero = heroRef.current
      if (!hero) return
      const heroBottom = hero.getBoundingClientRect().bottom

      // Only intercept scroll while hero is in view
      if (heroBottom > window.innerHeight * 0.5 && !isLocked) {
        const scrollY = window.scrollY
        const heroH   = hero.offsetHeight
        const raw     = Math.max(0, Math.min(1, scrollY / (heroH * 0.7)))
        setScrollProgress(raw)
      }
    }

    window.addEventListener('scroll', onScroll, { passive:true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        @keyframes heroFloat {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(6px); }
        }
        @keyframes mudra-spin { to { transform:rotate(360deg); } }
        @keyframes pulseDot {
          0%,100% { opacity:0.4; transform:scale(1); }
          50%     { opacity:1;   transform:scale(1.4); }
        }
        html { scroll-behavior: smooth; }
        * { box-sizing:border-box; }
        body { margin:0; background:#07070d; }

        /* Feature section responsive */
        @media (max-width:768px) {
          .mudra-feat-grid { flex-direction:column !important; }
        }
      `}</style>

      {/* 1 — Hero */}
      <HeroSection
        scrollProgress={scrollProgress}
        heroRef={heroRef}
      />

      {/* 2 — Features */}
      <FeaturesSection featRef={featRef} />

      {/* 3 — Login */}
      <LoginSection />
    </>
  )
}