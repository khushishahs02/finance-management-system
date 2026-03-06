import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Recurring from './pages/Recurring'
import About from './pages/About'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#07070d',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '2px solid rgba(212,169,74,0.2)',
        borderTopColor: '#d4a94a',
        animation: 'mudra-spin 0.8s linear infinite',
      }} />
      <p style={{
        fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase',
        color: 'rgba(212,169,74,0.4)', fontFamily: 'monospace',
      }}>Loading MUDRA</p>
      <style>{`@keyframes mudra-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function RootRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return <Landing />
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public: landing page with hero + features + login */}
      <Route path="/"      element={<RootRoute />} />
      <Route path="/login" element={<RootRoute />} />

      {/* Protected app shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="accounts"     element={<Accounts />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets"      element={<Budgets />} />
        <Route path="goals"        element={<Goals />} />
        <Route path="recurring"    element={<Recurring />} />
        <Route path="about"        element={<About />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}