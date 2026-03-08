import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Target,
  PieChart, RefreshCw, LogOut, Menu, X, Info, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/accounts',     label: 'Accounts',     icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets',      label: 'Budgets',      icon: PieChart },
  { to: '/goals',        label: 'Goals',        icon: Target },
  { to: '/recurring',    label: 'Recurring',    icon: RefreshCw },
]
const BOTTOM_NAV_ITEMS = [{ to: '/about', label: 'About', icon: Info }]

function MudraLogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a94a" />
          <stop offset="100%" stopColor="#f5e6c8" />
        </linearGradient>
      </defs>
      <polygon points="24,2 44,13 44,35 24,46 4,35 4,13"
        fill="url(#lg1)" opacity="0.15" stroke="url(#lg1)" strokeWidth="1.5" />
      <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle"
        fontSize="22" fontWeight="900" fill="url(#lg1)" fontFamily="Georgia, serif">₹</text>
    </svg>
  )
}

export default function Layout() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  // Desktop: collapsed = icon-only rail, expanded = full sidebar
  const [collapsed, setCollapsed] = useState(false)
  // Mobile: drawer open/closed
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const displayName = profile?.name ?? user?.user_metadata?.name ?? user?.email ?? '—'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07070d' }}>

      {/* ═══════════════════════════════════════
          DESKTOP SIDEBAR (sticky, collapsible)
          Hidden on mobile via media query style
      ═══════════════════════════════════════ */}
      <style>{`
        @media (max-width: 1023px) {
          #desktop-sidebar { display: none !important; width: 0 !important; }
        }
        @media (min-width: 1024px) {
          #mobile-drawer { display: none !important; }
          #mobile-overlay { display: none !important; }
          #mobile-header { display: none !important; }
        }
      `}</style>

      <aside id="desktop-sidebar" style={{
        width: collapsed ? '64px' : '224px',
        flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #0a0a14 0%, #07070d 100%)',
        borderRight: '1px solid rgba(212,169,74,0.1)',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
        zIndex: 20,
      }}>

        {/* Logo row */}
        <div style={{
          padding: collapsed ? '20px 0' : '22px 18px 18px',
          borderBottom: '1px solid rgba(212,169,74,0.1)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          transition: 'padding 0.25s',
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MudraLogoMark size={32} />
              <div>
                <div style={{
                  fontFamily: "'Clash Display', sans-serif", fontWeight: 900,
                  fontSize: '20px', letterSpacing: '5px',
                  background: 'linear-gradient(135deg, #d4a94a, #f5e6c8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                }}>MUDRA</div>
                <div style={{ fontSize: '8px', color: 'rgba(212,169,74,0.45)', letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: 'monospace', marginTop: 2 }}>Finance Manager</div>
              </div>
            </div>
          )}
          {collapsed && <MudraLogoMark size={30} />}

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(212,169,74,0.4)', padding: 4, display: 'flex',
            alignItems: 'center', borderRadius: 6, flexShrink: 0,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#d4a94a'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(212,169,74,0.4)'}
          >
            <ChevronRight size={15} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: collapsed ? '10px 8px' : '10px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <DesktopNavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px 8px 18px', borderTop: '1px solid rgba(212,169,74,0.08)' }}>
          {BOTTOM_NAV_ITEMS.map(item => (
            <DesktopNavItem key={item.to} {...item} collapsed={collapsed} />
          ))}

          <div style={{ height: 1, margin: '8px 4px', background: 'rgba(212,169,74,0.06)' }} />

          {/* Signed in as */}
          {!collapsed && (
            <div style={{ padding: '6px 10px', marginBottom: 4 }}>
              <p style={{ fontSize: 9, color: 'rgba(212,169,74,0.4)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 2px' }}>Signed in as</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#e8e8f4', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
            </div>
          )}

          {/* Sign out */}
          <button onClick={handleSignOut} title="Sign Out" style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '10px 10px',
            borderRadius: 10, background: 'none', border: '1px solid transparent',
            cursor: 'pointer', fontSize: 13, color: '#9090b0',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.background = 'rgba(251,113,133,0.08)'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9090b0'; e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent' }}
          >
            <LogOut size={15} strokeWidth={2} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MOBILE OVERLAY
      ═══════════════════════════════════════ */}
      <div id="mobile-overlay" onClick={() => setDrawerOpen(false)} style={{
        position: 'fixed', inset: 0, zIndex: 40,
        background: 'rgba(7,7,13,0.85)', backdropFilter: 'blur(4px)',
        opacity: drawerOpen ? 1 : 0,
        pointerEvents: drawerOpen ? 'all' : 'none',
        transition: 'opacity 0.25s',
      }} />

      {/* ═══════════════════════════════════════
          MOBILE DRAWER (slides in from left)
      ═══════════════════════════════════════ */}
      <aside id="mobile-drawer" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '240px', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #0a0a14 0%, #07070d 100%)',
        borderRight: '1px solid rgba(212,169,74,0.12)',
        fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        overflowY: 'auto',
      }}>

        {/* Drawer header */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(212,169,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MudraLogoMark size={28} />
            <div style={{
              fontFamily: "'Clash Display', sans-serif", fontWeight: 900,
              fontSize: '20px', letterSpacing: '4px',
              background: 'linear-gradient(135deg, #d4a94a, #f5e6c8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>MUDRA</div>
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9090b0', padding: 6, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer nav */}
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          {NAV_ITEMS.map(item => (
            <MobileNavItem key={item.to} {...item} onClose={() => setDrawerOpen(false)} />
          ))}
        </nav>

        {/* Drawer bottom */}
        <div style={{ padding: '8px 8px 20px', borderTop: '1px solid rgba(212,169,74,0.08)' }}>
          {BOTTOM_NAV_ITEMS.map(item => (
            <MobileNavItem key={item.to} {...item} onClose={() => setDrawerOpen(false)} />
          ))}
          <div style={{ height: 1, margin: '8px 4px', background: 'rgba(212,169,74,0.06)' }} />
          <div style={{ padding: '6px 10px', marginBottom: 4 }}>
            <p style={{ fontSize: 9, color: 'rgba(212,169,74,0.4)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 2px' }}>Signed in as</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#e8e8f4', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
          </div>
          <button onClick={handleSignOut} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px', borderRadius: 10,
            background: 'none', border: '1px solid transparent',
            cursor: 'pointer', fontSize: 13, color: '#9090b0',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.background = 'rgba(251,113,133,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9090b0'; e.currentTarget.style.background = 'none' }}
          >
            <LogOut size={14} strokeWidth={2} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile top bar */}
        <header id="mobile-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px',
          background: 'rgba(8,8,16,0.98)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(212,169,74,0.1)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MudraLogoMark size={26} />
            <div>
              <span style={{
                fontFamily: "'Clash Display', sans-serif", fontWeight: 900,
                fontSize: '20px', letterSpacing: '4px',
                background: 'linear-gradient(135deg, #d4a94a, #f5e6c8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                display: 'block', lineHeight: 1.1,
              }}>MUDRA</span>
              <span style={{ fontSize: '10px', color: 'rgba(212,169,74,0.5)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                {displayName}
              </span>
            </div>
          </div>

          <button onClick={() => setDrawerOpen(o => !o)} style={{
            background: drawerOpen ? 'rgba(212,169,74,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${drawerOpen ? 'rgba(212,169,74,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8, cursor: 'pointer',
            color: drawerOpen ? '#d4a94a' : '#9090b0',
            padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main style={{ flex: 1, overflow: 'auto', background: '#07070d' }}>
          <FadeOutlet />
        </main>
      </div>
    </div>
  )
}


/* Smooth fade transition between pages */
function FadeOutlet() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [opacity, setOpacity] = useState(1)
  const timerRef = useRef(null)

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Fade out
      setOpacity(0)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setDisplayLocation(location)
        setOpacity(1)
      }, 120)
    }
    return () => clearTimeout(timerRef.current)
  }, [location])

  return (
    <div style={{
      opacity,
      transition: 'opacity 0.12s ease',
      minHeight: '100%',
    }}>
      <Outlet />
    </div>
  )
}

/* Desktop nav item — shows icon + label when expanded, icon only when collapsed */
function DesktopNavItem({ to, label, icon: Icon, collapsed }) {
  return (
    <NavLink to={to} title={collapsed ? label : undefined}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '11px 0' : '10px 10px',
        borderRadius: 10, marginBottom: 2,
        fontSize: 13, fontWeight: isActive ? 600 : 500,
        textDecoration: 'none', transition: 'all 0.15s',
        background: isActive ? 'rgba(212,169,74,0.12)' : 'transparent',
        color: isActive ? '#d4a94a' : '#9090b0',
        border: isActive ? '1px solid rgba(212,169,74,0.2)' : '1px solid transparent',
        fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
        whiteSpace: 'nowrap', overflow: 'hidden',
      })}
    >
      <Icon size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
      {!collapsed && <span style={{ opacity: 1, transition: 'opacity 0.2s' }}>{label}</span>}
    </NavLink>
  )
}

/* Mobile nav item — full label always shown inside drawer */
function MobileNavItem({ to, label, icon: Icon, onClose }) {
  return (
    <NavLink to={to} onClick={onClose}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 12px', borderRadius: 10, marginBottom: 2,
        fontSize: 14, fontWeight: isActive ? 600 : 500,
        textDecoration: 'none', transition: 'all 0.15s',
        background: isActive ? 'rgba(212,169,74,0.12)' : 'transparent',
        color: isActive ? '#d4a94a' : '#9090b0',
        border: isActive ? '1px solid rgba(212,169,74,0.2)' : '1px solid transparent',
        fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
      })}
    >
      <Icon size={17} strokeWidth={2} />
      {label}
    </NavLink>
  )
}