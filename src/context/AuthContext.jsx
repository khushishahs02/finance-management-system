import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

const SHEET_WEBHOOK = 'https://script.google.com/macros/s/AKfycbyBNIAT-5GP3dumoXuPD3hscnQta2mGMngBn1HaIn8obKXFaWmJtCLXfr8FkA2lXnrT7g/exec'

// Uses GET + query params — the only reliable way to call Apps Script from a browser
// POST with no-cors drops the body silently; this avoids that entirely
async function logUserToSheet(user) {
  try {
    const params = new URLSearchParams({
      name:       user.user_metadata?.name ?? user.email ?? 'Unknown',
      email:      user.email ?? '',
      signedUpAt: user.created_at ?? '',
      lastLogin:  new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      provider:   user.app_metadata?.provider ?? 'email',
    })
    const url = `${SHEET_WEBHOOK}?${params.toString()}`

    // Use an Image tag trick — works cross-origin, no CORS preflight, no blocked headers
    const img = new Image()
    img.src = url
    console.log('📊 Sheet ping sent for:', user.email)
  } catch (err) {
    console.warn('Sheet log failed silently:', err)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    // First try to get existing profile
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()

    // If name is missing (common for email signups), upsert it from auth metadata
    if (data && !data.name) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const metaName = authUser?.user_metadata?.name ?? authUser?.user_metadata?.full_name ?? null
      if (metaName) {
        const { data: updated } = await supabase
          .from('users')
          .update({ name: metaName })
          .eq('id', userId)
          .select()
          .single()
        setProfile(updated ?? data)
        setLoading(false)
        return
      }
    }
    setProfile(data)
    setLoading(false)
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    })
    if (error) throw error
    await logUserToSheet(data.user)
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await logUserToSheet(data.user)
    return data
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
    if (error) throw error
    return data
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/dashboard',
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = { user, profile, loading, signUp, signIn, signInWithGoogle, resetPassword, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}