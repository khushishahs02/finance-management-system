import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Target,
  PieChart, RefreshCw, LogOut, Menu, X, Info
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/accounts',     label: 'Accounts',     icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets',      label: 'Budgets',      icon: PieChart },
  { to: '/goals',        label: 'Goals',        icon: Target },
  { to: '/recurring',    label: 'Recurring',    icon: RefreshCw },
]

// Shown above Sign Out
const BOTTOM_NAV_ITEMS = [
  { to: '/about', label: 'About', icon: Info },
]

function MudraLogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sideLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a94a" />
          <stop offset="100%" stopColor="#f5e6c8" />
        </linearGradient>
      </defs>
      <polygon points="24,2 44,13 44,35 24,46 4,35 4,13"
        fill="url(#sideLogoGrad)" opacity="0.15"
        stroke="url(#sideLogoGrad)" strokeWidth="1.5" />
      <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle"
        fontSize="22" fontWeight="900" fill="url(#sideLogoGrad)"
        fontFamily="Georgia, serif">₹</text>
    </svg>
  )
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const sidebarStyle = {
    width: '220px', flexShrink: 0,
    background: 'linear-gradient(180deg, #0a0a14 0%, #07070d 100%)',
    borderRight: '1px solid rgba(212,169,74,0.1)',
    display: 'flex', flexDirection: 'column',
    fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07070d' }}>

      {/* Desktop sidebar */}
      <aside style={{
        ...sidebarStyle,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}
        className="hidden lg:flex flex-col"
      >
        <SidebarContent
          profile={profile}
          handleSignOut={handleSignOut}
          setMobileOpen={setMobileOpen}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(7,7,13,0.85)', backdropFilter: 'blur(4px)',
        }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar — only rendered on small screens */}
      <aside
        className="lg:hidden"
        style={{
          ...sidebarStyle,
          position: 'fixed', inset: '0 auto 0 0', zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
        }}>
        <SidebarContent
          profile={profile}
          handleSignOut={handleSignOut}
          setMobileOpen={setMobileOpen}
        />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212,169,74,0.1)',
          position: 'sticky', top: 0, zIndex: 30,
        }} className="lg:hidden">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MudraLogoMark size={26} />
            <div>
              <span style={{
                fontFamily: "'Clash Display', sans-serif", fontWeight: 800,
                fontSize: '16px', letterSpacing: '3px',
                background: 'linear-gradient(135deg, #d4a94a, #f5e6c8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                display: 'block',
              }}>MUDRA</span>
              {profile?.name && (
                <span style={{
                  fontSize: '10px', color: 'rgba(212,169,74,0.5)',
                  fontFamily: 'monospace', letterSpacing: '1px',
                }}>
                  {profile.name}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setMobileOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9090b0', padding: '6px' }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main style={{ flex: 1, overflow: 'auto', background: '#07070d' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', borderRadius: '10px', marginBottom: '2px',
        fontSize: '13px', fontWeight: isActive ? 600 : 500,
        textDecoration: 'none', transition: 'all 0.15s',
        background: isActive ? 'rgba(212,169,74,0.12)' : 'transparent',
        color: isActive ? '#d4a94a' : '#9090b0',
        border: isActive ? '1px solid rgba(212,169,74,0.2)' : '1px solid transparent',
        fontFamily: "'Cabinet Grotesk', system-ui, sans-serif",
      })}
    >
      <Icon size={15} strokeWidth={2} />
      {label}
    </NavLink>
  )
}

function SidebarContent({ profile, handleSignOut, setMobileOpen }) {
  return (
    <>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid rgba(212,169,74,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MudraLogoMark size={32} />
          <div>
            <div style={{
              fontFamily: "'Clash Display', sans-serif", fontWeight: 800,
              fontSize: '18px', letterSpacing: '4px',
              background: 'linear-gradient(135deg, #d4a94a, #f5e6c8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>MUDRA</div>
            <div style={{
              fontSize: '9px', color: 'rgba(212,169,74,0.5)',
              letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'monospace',
            }}>Finance Manager</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      {/* Bottom section: About + Sign Out */}
      <div style={{
        padding: '8px 10px 20px',
        borderTop: '1px solid rgba(212,169,74,0.08)',
      }}>
        {/* About link */}
        {BOTTOM_NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
        ))}

        {/* Thin divider between About and Sign Out */}
        <div style={{
          height: 1, margin: '8px 12px',
          background: 'rgba(212,169,74,0.06)',
        }} />

        {/* Signed in as */}
        <div style={{ padding: '6px 12px', marginBottom: '4px' }}>
          <p style={{
            fontSize: '9px', color: 'rgba(212,169,74,0.4)',
            fontFamily: 'monospace', textTransform: 'uppercase',
            letterSpacing: '1.5px', marginBottom: '3px', marginTop: 0,
          }}>Signed in as</p>
          <p style={{
            fontSize: '13px', fontWeight: 600, color: '#e8e8f4',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            margin: 0,
          }}>{profile?.name ?? profile?.email ?? '—'}</p>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            background: 'none', border: '1px solid transparent',
            cursor: 'pointer', fontSize: '13px', color: '#9090b0',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#fb7185'
            e.currentTarget.style.background = 'rgba(251,113,133,0.08)'
            e.currentTarget.style.borderColor = 'rgba(251,113,133,0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#9090b0'
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <LogOut size={15} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </>
  )
}