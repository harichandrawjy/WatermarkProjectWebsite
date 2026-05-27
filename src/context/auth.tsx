import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'wm_token'
const USER_KEY  = 'wm_user'

export interface AuthUser {
  id:    string
  email: string
}

interface AuthContextValue {
  user:     AuthUser | null
  token:    string | null
  loading:  boolean
  login:    (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  logout:   () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [token,   setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    const u = localStorage.getItem(USER_KEY)
    if (t && u) {
      try {
        setToken(t)
        setUser(JSON.parse(u))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  const persist = (t: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(parseError(text) ?? `Login failed (${res.status})`)
    }
    const data = await res.json() as { access_token: string; user: AuthUser }
    persist(data.access_token, data.user)
  }

  const register = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(parseError(text) ?? `Registration failed (${res.status})`)
    }
    const data = await res.json() as {
      access_token: string | null
      user: AuthUser
      needs_confirmation: boolean
    }
    if (data.access_token) {
      persist(data.access_token, data.user)
      return { needsConfirmation: false }
    }
    return { needsConfirmation: true }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

function parseError(text: string): string | null {
  if (!text) return null
  try {
    const obj = JSON.parse(text) as { detail?: string }
    if (typeof obj.detail === 'string') return obj.detail
  } catch { /* fall through */ }
  return text
}
