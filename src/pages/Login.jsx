import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

/* ─────────────────────────────────────────
   PASSWORD STRENGTH
───────────────────────────────────────── */
function getPasswordStrength(pwd) {
  if (!pwd) return null
  const len = pwd.length
  const has = {
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    num:   /[0-9]/.test(pwd),
    sym:   /[^A-Za-z0-9]/.test(pwd),
  }
  const score = [len >= 8, len >= 12, has.upper, has.lower, has.num, has.sym].filter(Boolean).length
  if (score <= 1) return { color: '#ef4444', bar: '16%',  msg: "Your ex could guess this 😬" }
  if (score === 2) return { color: '#f97316', bar: '33%',  msg: "Even your roommate might crack this 🤔" }
  if (score === 3) return { color: '#fbbf24', bar: '50%',  msg: "Getting there. Your bank deserves better 💸" }
  if (score === 4) return { color: '#84cc16', bar: '72%',  msg: "Solid! Your vault is taking shape 🔒" }
  if (score === 5) return { color: '#22c55e', bar: '88%',  msg: "Now that's a vault 💪" }
  return            { color: '#4ade9a', bar: '100%', msg: "Even hackers need chai for this one ☕" }
}

/* ─────────────────────────────────────────
   CURRENCY NOTE SVG
───────────────────────────────────────── */
const NOTES_DATA = [
  { denom: '₹2000', bg: '#f0b8d0', stripe: '#d4558a', accent: '#7a1a4a', w: 180, h: 90 },
  { denom: '₹500',  bg: '#b8d4f0', stripe: '#4a90d9', accent: '#1a3a7a', w: 168, h: 84 },
  { denom: '₹200',  bg: '#f5d890', stripe: '#e8a030', accent: '#7a4800', w: 158, h: 80 },
  { denom: '₹100',  bg: '#b8e8bc', stripe: '#4caf50', accent: '#1a5020', w: 163, h: 82 },
  { denom: '₹50',   bg: '#fef3a0', stripe: '#f0c000', accent: '#6a5000', w: 153, h: 77 },
  { denom: '₹20',   bg: '#ffd8a0', stripe: '#ff9800', accent: '#7a3600', w: 148, h: 74 },
  { denom: '₹10',   bg: '#e0b8f0', stripe: '#9c27b0', accent: '#4a0068', w: 143, h: 72 },
]

function CurrencyNote({ note, uid }) {
  const { denom, bg, stripe, accent, w, h } = note
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15)
  const gradId = `g_${uid}`
  const filtId = `f_${uid}`
  return (
    <svg
      width={w} height={h}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={bg} />
          <stop offset="100%" stopColor={bg} stopOpacity="0.78" />
        </linearGradient>
        <filter id={filtId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodOpacity="0.55" floodColor="#000" />
        </filter>
      </defs>
      {/* Base */}
      <rect rx="6" ry="6" width={w} height={h}
        fill={`url(#${gradId})`} filter={`url(#${filtId})`} />
      {/* Left colour band */}
      <rect x="0"      y="0" width="20" height={h} rx="6" ry="0" fill={stripe} opacity="0.88" />
      <rect x="20"     y="0" width="4"  height={h} fill={stripe} opacity="0.22" />
      {/* Right colour band */}
      <rect x={w - 20} y="0" width="20" height={h} fill={stripe} opacity="0.88" />
      {/* Ashoka chakra */}
      <circle cx="44" cy={h/2} r="15" fill="none" stroke={accent} strokeWidth="1.6" opacity="0.65" />
      <circle cx="44" cy={h/2} r="9"  fill="none" stroke={accent} strokeWidth="0.8" opacity="0.45" />
      {spokes.map((a, i) => (
        <line key={i}
          x1={44 + Math.cos(a * Math.PI / 180) * 5.5}
          y1={h/2 + Math.sin(a * Math.PI / 180) * 5.5}
          x2={44 + Math.cos(a * Math.PI / 180) * 14}
          y2={h/2 + Math.sin(a * Math.PI / 180) * 14}
          stroke={accent} strokeWidth="0.9" opacity="0.5"
        />
      ))}
      {/* RBI text */}
      <text x="30" y={h/2 - 17} fontSize="4.8" fill={accent} fontWeight="700" opacity="0.75" fontFamily="serif">
        भारतीय रिज़र्व बैंक
      </text>
      <text x="30" y={h/2 - 10} fontSize="4.2" fill={accent} opacity="0.6" fontFamily="serif">
        RESERVE BANK OF INDIA
      </text>
      {/* Gandhi silhouette */}
      <ellipse cx={w - 46} cy={h/2 - 3}  rx="14" ry="17" fill={accent} opacity="0.10" />
      <ellipse cx={w - 46} cy={h/2 - 19} rx="8"  ry="9"  fill={accent} opacity="0.15" />
      {/* Denomination */}
      <text x="62" y={h/2 + 6}  fontSize="24" fontWeight="900" fill={accent} opacity="0.88" fontFamily="serif">
        {denom}
      </text>
      <text x="62" y={h/2 + 18} fontSize="7.5" fill={accent} opacity="0.5" fontFamily="sans-serif" letterSpacing="1">
        {denom.replace('₹', '')} RUPEES
      </text>
      {/* Security thread */}
      <rect x={w * 0.42} y="0" width="2.5" height={h} fill={accent} opacity="0.18" />
      {/* Watermark lines */}
      <line x1="28" y1={h - 14} x2={w - 28} y2={h - 14} stroke={accent} strokeWidth="0.5" opacity="0.15" />
      <line x1="28" y1={h - 10} x2={w - 28} y2={h - 10} stroke={accent} strokeWidth="0.5" opacity="0.1"  />
    </svg>
  )
}

/* ─────────────────────────────────────────
   RIGHT PANEL — SCATTERED NOTES
   Contained strictly inside the right panel.
   Mouse tracking relative to right panel only.
───────────────────────────────────────── */
const NOTE_COUNT = 18

function buildNotes() {
  return Array.from({ length: NOTE_COUNT }, (_, i) => {
    const nd = NOTES_DATA[i % NOTES_DATA.length]
    return {
      id:      i,
      nd,
      pctX:    3  + Math.random() * 88,   // % of container width
      pctY:    3  + Math.random() * 88,   // % of container height
      baseRot: -60 + Math.random() * 120,
      rot:     -60 + Math.random() * 120,
      scale:   0.55 + Math.random() * 0.72,
      z:       Math.floor(Math.random() * 20) + 1,
      vx: 0, vy: 0,
      x: 0, y: 0, baseX: 0, baseY: 0,
    }
  })
}

function RightPanel() {
  const panelRef = useRef(null)
  const [notes]  = useState(buildNotes)
  const stateRef = useRef(notes.map(n => ({ ...n })))
  const domRefs  = useRef([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef   = useRef(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    function setBase() {
      const { width, height } = panel.getBoundingClientRect()
      stateRef.current.forEach(n => {
        n.baseX = (n.pctX / 100) * width
        n.baseY = (n.pctY / 100) * height
        // Only init position on first call
        if (n.x === 0 && n.y === 0) { n.x = n.baseX; n.y = n.baseY }
      })
    }
    setBase()

    function onMove(e) {
      const r = panel.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    function onLeave() { mouseRef.current = { x: -9999, y: -9999 } }

    const ro = new ResizeObserver(setBase)
    ro.observe(panel)
    panel.addEventListener('mousemove', onMove)
    panel.addEventListener('mouseleave', onLeave)

    function tick() {
      const m = mouseRef.current
      stateRef.current.forEach((n, i) => {
        const dx   = n.x - m.x
        const dy   = n.y - m.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const R    = 150

        // Repulsion — gentle, distance-weighted
        if (dist < R && dist > 1) {
          const strength = ((R - dist) / R) * 2.2
          const ang = Math.atan2(dy, dx)
          n.vx += Math.cos(ang) * strength
          n.vy += Math.sin(ang) * strength
        }

        // Slow spring back to base position
        n.vx += (n.baseX - n.x) * 0.022
        n.vy += (n.baseY - n.y) * 0.022

        // High damping = floaty, slow return
        n.vx *= 0.80
        n.vy *= 0.80

        n.x += n.vx
        n.y += n.vy

        // Subtle rotation proportional to velocity
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy)
        n.rot += (n.vx - n.vy) * 0.10
        // Drift rotation back toward base angle
        n.rot += (n.baseRot - n.rot) * 0.025

        const el = domRefs.current[i]
        if (el) {
          el.style.transform = `translate(${n.x}px,${n.y}px) rotate(${n.rot}deg) scale(${n.scale})`
        }
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      panel.removeEventListener('mousemove', onMove)
      panel.removeEventListener('mouseleave', onLeave)
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={panelRef}
      style={{
        position: 'relative',
        width: '100%', height: '100%',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 35% 45%, rgba(212,169,74,0.07) 0%, transparent 65%), #07070d',
        cursor: 'crosshair',
      }}
    >
      {/* ── Notes layer ── */}
      {notes.map((n, i) => (
        <div key={n.id}
          ref={el => domRefs.current[i] = el}
          style={{
            position: 'absolute', top: 0, left: 0,
            zIndex: n.z,
            willChange: 'transform',
            transformOrigin: 'center center',
            opacity: 0.82,
            filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.6))',
            pointerEvents: 'none',
          }}
        >
          <CurrencyNote note={n.nd} uid={`${n.id}`} />
        </div>
      ))}

      {/* ── Gradient vignette overlay for depth ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none',
        background: [
          'linear-gradient(to right,  rgba(7,7,13,0.35) 0%, transparent 18%)',
          'linear-gradient(to bottom, rgba(7,7,13,0.3)  0%, transparent 20%)',
          'linear-gradient(to top,    rgba(7,7,13,0.55) 0%, transparent 35%)',
        ].join(', '),
      }} />

      {/* ── Concept text overlay ── */}
      <div style={{
        position: 'absolute', bottom: '44px', left: '36px', right: '36px',
        zIndex: 30, pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(7,7,13,0.78)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(212,169,74,0.2)',
          borderRadius: '18px',
          padding: '22px 26px',
        }}>
          <p style={{
            fontSize: '18px', fontWeight: 700, lineHeight: 1.3,
            color: '#f5e6c8', marginBottom: '10px',
            fontFamily: "'Clash Display', system-ui, sans-serif",
            letterSpacing: '-0.3px',
          }}>
            Your money shouldn't look like this.
          </p>
          <p style={{
            fontSize: '13px', color: '#9090b0', lineHeight: 1.65,
            fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
            marginBottom: '14px',
          }}>
            Scattered expenses. Forgotten subscriptions.<br />
            Money moving everywhere without direction.
          </p>
          <p style={{
            fontSize: '12px',
            background: 'linear-gradient(135deg, #d4a94a, #f5e6c8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 600, fontFamily: "'Cabinet Grotesk', sans-serif",
            letterSpacing: '0.3px',
          }}>
            MUDRA brings order to the chaos. →
          </p>
        </div>
      </div>

      {/* ── Cursor hint top-right ── */}
      <div style={{
        position: 'absolute', top: '28px', right: '28px',
        zIndex: 30, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', gap: '7px',
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#d4a94a', opacity: 0.7,
          animation: 'pulseDot 2s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: '10px', color: 'rgba(212,169,74,0.55)',
          fontFamily: 'monospace', letterSpacing: '1.5px', textTransform: 'uppercase',
        }}>Move cursor to interact</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MUDRA LOGO MARK
───────────────────────────────────────── */
function MudraLogo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="mlg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#d4a94a" />
          <stop offset="100%" stopColor="#f5e6c8" />
        </linearGradient>
      </defs>
      <polygon
        points="24,2 44,13 44,35 24,46 4,35 4,13"
        fill="url(#mlg)" fillOpacity="0.13"
        stroke="url(#mlg)" strokeWidth="1.5"
      />
      <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle"
        fontSize="22" fontWeight="900"
        fill="url(#mlg)" fontFamily="Georgia, serif">₹</text>
    </svg>
  )
}

/* ─────────────────────────────────────────
   LEFT PANEL — AUTH
───────────────────────────────────────── */
function LeftPanel() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode]         = useState('login')
  const [form, setForm]         = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [gLoad, setGLoad]       = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [focused, setFocused]   = useState(null)

  const strength = getPasswordStrength(form.password)

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError(''); setSuccess('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'forgot') {
        if (!form.email) throw new Error('Enter your email address')
        await resetPassword(form.email)
        setSuccess('Reset link sent! Check your inbox.')
        return
      }
      if (mode === 'login') {
        await signIn(form.email, form.password)
      } else {
        if (!form.name.trim()) throw new Error('Name is required')
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters')
        await signUp(form.email, form.password, form.name)
        // Show confirmation message — don't navigate, user must verify email first
        setMode('confirm')
        setSuccess('Account created! Please check your email and click the confirmation link before signing in.')
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function onGoogle() {
    setGLoad(true); setError('')
    try {
      await signInWithGoogle()
      // signInWithGoogle redirects the browser — setGLoad(false) won't be reached on success
    } catch (err) {
      setError('Google sign-in failed: ' + err.message)
      setGLoad(false)
    }
  }

  const inpStyle = (f) => ({
    width: '100%', background: '#0e0e1a',
    border: `1px solid ${focused === f ? '#d4a94a' : 'rgba(212,169,74,0.18)'}`,
    boxShadow: focused === f ? '0 0 0 3px rgba(212,169,74,0.1)' : 'none',
    borderRadius: '12px', padding: '11px 16px',
    fontSize: '14px', color: '#f0f0f8', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  })

  const labelStyle = {
    display: 'block', fontSize: '10px', fontWeight: 700,
    color: '#707088', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '1.2px',
  }

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      background: 'linear-gradient(160deg, #0c0c18 0%, #080810 100%)',
      borderRight: '1px solid rgba(212,169,74,0.1)',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '40px 44px',
      fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '36px' }}>
        <MudraLogo size={64} />
        <div>
          <div style={{
            fontFamily: "'Clash Display', system-ui, sans-serif",
            fontWeight: 900, fontSize: '32px', letterSpacing: '5px', lineHeight: 1,
            background: 'linear-gradient(135deg,#d4a94a,#f5e6c8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>MUDRA</div>
          <div style={{
            fontSize: '10px', color: 'rgba(212,169,74,0.45)',
            letterSpacing: '2.5px', textTransform: 'uppercase',
            fontFamily: 'monospace', marginTop: '4px',
          }}>Finance Manager</div>
        </div>
      </div>

      {/* Heading */}
      {mode === 'confirm' ? (
        /* ── Email confirmation screen ── */
        <div style={{
          textAlign: 'center', padding: '24px 0 32px',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
            background: 'rgba(74,222,154,0.1)', border: '1px solid rgba(74,222,154,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>📧</div>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#f0f0f8', marginBottom: '8px', fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.3px' }}>Check your inbox!</p>
          <p style={{ fontSize: '13px', color: '#5a5a78', marginBottom: '20px', lineHeight: 1.7 }}>
            We sent a confirmation link to<br />
            <span style={{ color: '#d4a94a', fontWeight: 600 }}>{form.email}</span>
          </p>
          <div style={{
            background: 'rgba(74,222,154,0.06)', border: '1px solid rgba(74,222,154,0.18)',
            borderRadius: 12, padding: '14px 16px', marginBottom: '24px', textAlign: 'left',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#4ade9a', fontWeight: 600 }}>What to do next:</p>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#5a5a78' }}>1. Open your email app</p>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#5a5a78' }}>2. Find the email from MUDRA</p>
            <p style={{ margin: 0,         fontSize: 12, color: '#5a5a78' }}>3. Click <strong style={{ color: '#f0f0f8' }}>"Confirm your email"</strong> — then sign in</p>
          </div>
          <button
            type="button"
            onClick={() => { setMode('login'); setSuccess(''); setError('') }}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg,#d4a94a,#b8902a)',
              border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: 700, color: '#07070d',
              cursor: 'pointer', fontFamily: "'Clash Display', system-ui, sans-serif",
              letterSpacing: '0.5px',
            }}
          >
            Go to Sign In →
          </button>
          <p style={{ fontSize: 11, color: '#303048', marginTop: 12 }}>
            Didn't get it? Check spam, or{' '}
            <button
              type="button"
              onClick={() => { setMode('signup'); setSuccess(''); setError('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#d4a94a', textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}
            >
              try again
            </button>
          </p>
        </div>
      ) : mode === 'forgot' ? (
        <>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#f0f0f8', marginBottom: '4px', fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.3px' }}>Reset Password</p>
          <p style={{ fontSize: '13px', color: '#5a5a78', marginBottom: '28px', lineHeight: 1.5 }}>We'll send a link to your inbox.</p>
        </>
      ) : mode === 'login' ? (
        <>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#f0f0f8', marginBottom: '4px', fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.3px' }}>Welcome back.</p>
          <p style={{ fontSize: '13px', color: '#5a5a78', marginBottom: '28px', lineHeight: 1.5 }}>Let's make your money work smarter.</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#f0f0f8', marginBottom: '4px', fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.3px' }}>Join MUDRA.</p>
          <p style={{ fontSize: '13px', color: '#5a5a78', marginBottom: '28px', lineHeight: 1.5 }}>Take control of your financial life today.</p>
        </>
      )}

      {/* Tabs */}
      {mode !== 'forgot' && mode !== 'confirm' && (
        <div style={{
          display: 'flex', background: '#0a0a14',
          border: '1px solid rgba(212,169,74,0.12)',
          borderRadius: '12px', padding: '4px', marginBottom: '26px',
        }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1, padding: '9px', borderRadius: '9px',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: mode === m ? 'linear-gradient(135deg,#d4a94a,#b8902a)' : 'transparent',
                color: mode === m ? '#07070d' : '#5a5a78',
                transition: 'all 0.2s',
              }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>
      )}

      {/* Alerts */}
      {mode !== 'confirm' && error && (
        <div style={{
          display: 'flex', gap: '9px', alignItems: 'flex-start',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)',
          borderRadius: '10px', padding: '11px 14px', marginBottom: '16px',
          fontSize: '13px', color: '#fca5a5',
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{error}
        </div>
      )}
      {success && (
        <div style={{
          display: 'flex', gap: '9px', alignItems: 'flex-start',
          background: 'rgba(74,222,154,0.08)', border: '1px solid rgba(74,222,154,0.28)',
          borderRadius: '10px', padding: '11px 14px', marginBottom: '16px',
          fontSize: '13px', color: '#4ade9a',
        }}>
          <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />{success}
        </div>
      )}

      {/* Form */}
      {mode !== 'confirm' && <form onSubmit={onSubmit}>
        {mode === 'signup' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Full Name</label>
            <input name="name" type="text" placeholder="Arjun Mehta"
              value={form.name} onChange={onChange}
              onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
              style={inpStyle('name')} required />
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Email</label>
          <input name="email" type="email" placeholder="you@example.com"
            value={form.email} onChange={onChange}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
            style={inpStyle('email')} required />
        </div>

        {mode !== 'forgot' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input name="password"
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                value={form.password} onChange={onChange}
                onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                style={{ ...inpStyle('pass'), paddingRight: '44px' }} required />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: '13px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: '#505068', padding: 0,
                }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Strength meter */}
            {mode === 'signup' && form.password && strength && (
              <>
                <div style={{ height: '3px', background: '#1a1a2e', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '2px', width: strength.bar, background: strength.color, transition: 'width 0.4s ease, background 0.4s ease' }} />
                </div>
                <p style={{ fontSize: '11px', marginTop: '5px', color: strength.color, fontStyle: 'italic' }}>{strength.msg}</p>
              </>
            )}
          </div>
        )}

        {/* Remember + Forgot */}
        {mode === 'login' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
              <input type="checkbox" checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: '#d4a94a', width: '14px', height: '14px' }} />
              <span style={{ fontSize: '12px', color: '#5a5a78' }}>Remember me</span>
            </label>
            <button type="button"
              onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#d4a94a', textDecoration: 'underline', fontFamily: 'inherit' }}>
              Forgot password?
            </button>
          </div>
        )}
        {mode === 'forgot' && (
          <button type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#d4a94a', textDecoration: 'underline', fontFamily: 'inherit', marginBottom: '16px', display: 'block' }}>
            ← Back to Sign In
          </button>
        )}

        {/* Submit button */}
        <button type="submit" disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: loading ? 'rgba(212,169,74,0.35)' : 'linear-gradient(135deg,#d4a94a,#b8902a)',
            border: 'none', borderRadius: '12px',
            fontSize: '14px', fontWeight: 700,
            color: loading ? 'rgba(7,7,13,0.5)' : '#07070d',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontFamily: "'Clash Display', system-ui, sans-serif",
            letterSpacing: '0.5px', transition: 'opacity 0.2s',
          }}>
          {loading
            ? <><Spinner />Processing...</>
            : mode === 'login'  ? 'Sign In to MUDRA'
            : mode === 'signup' ? 'Create Account'
            : 'Send Reset Link'}
        </button>
      </form>}

      {/* Google */}
      {mode !== 'forgot' && mode !== 'confirm' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(212,169,74,0.1)' }} />
            <span style={{ fontSize: '11px', color: '#303048' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(212,169,74,0.1)' }} />
          </div>
          <GoogleBtn onClick={onGoogle} loading={gLoad} />
        </>
      )}

      <p style={{ fontSize: '10px', color: '#252535', marginTop: '22px', textAlign: 'center' }}>
        Secured with Supabase RLS · Your data stays private
      </p>
    </div>
  )
}

/* small helpers */
function Spinner() {
  return (
    <span style={{
      width: 14, height: 14,
      border: '2px solid rgba(7,7,13,0.25)',
      borderTopColor: '#07070d',
      borderRadius: '50%', display: 'inline-block',
      animation: 'mudra-spin 0.7s linear infinite',
    }} />
  )
}

function GoogleBtn({ onClick, loading }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '11px',
        background: 'transparent',
        border: `1px solid ${hov ? 'rgba(212,169,74,0.4)' : 'rgba(212,169,74,0.18)'}`,
        borderRadius: '12px', fontSize: '13px', fontWeight: 500,
        color: hov ? '#f0f0f8' : '#9090b0',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
        transition: 'all 0.2s', opacity: loading ? 0.55 : 1,
      }}>
      <svg width="16" height="16" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.9 13.2l7.8 6C12.5 13 17.8 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.4 37.5 46.5 31.4 46.5 24.5z"/>
        <path fill="#FBBC05" d="M10.7 28.8A14.5 14.5 0 0 1 9.5 24c0-1.7.3-3.3.8-4.8l-7.8-6A23.8 23.8 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.2-6z"/>
        <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.2 0-11.5-4.2-13.4-9.8l-8.2 6C6.7 42.6 14.7 48 24 48z"/>
      </svg>
      {loading ? 'Redirecting...' : 'Continue with Google'}
    </button>
  )
}

/* ─────────────────────────────────────────
   ROOT — strict two-column grid
───────────────────────────────────────── */
export default function Login() {
  return (
    <>
      <style>{`
        @keyframes mudra-spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        .mudra-login-root {
          display: grid;
          grid-template-columns: 42% 58%;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .mudra-login-root {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            height: auto;
            min-height: 100vh;
          }
          .mudra-right-col {
            height: 60vw;
            min-height: 300px;
          }
        }
        @media (max-width: 600px) {
          .mudra-right-col { height: 55vw; min-height: 260px; }
        }
        /* Thin custom scrollbar for left panel */
        .mudra-left-col::-webkit-scrollbar { width: 4px; }
        .mudra-left-col::-webkit-scrollbar-track { background: transparent; }
        .mudra-left-col::-webkit-scrollbar-thumb { background: rgba(212,169,74,0.2); border-radius: 2px; }
      `}</style>

      <div className="mudra-login-root">
        {/* LEFT — auth */}
        <div className="mudra-left-col" style={{ overflow: 'hidden' }}>
          <LeftPanel />
        </div>

        {/* RIGHT — interactive notes, strictly contained */}
        <div className="mudra-right-col" style={{ position: 'relative', overflow: 'hidden' }}>
          <RightPanel />
        </div>
      </div>
    </>
  )
}