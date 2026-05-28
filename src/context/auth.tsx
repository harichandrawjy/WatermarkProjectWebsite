import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY   = 'wm_token'
const REFRESH_KEY = 'wm_refresh'
const USER_KEY    = 'wm_user'

export interface AuthUser {
  id:    string
  email: string
}

interface AuthContextValue {
  user:        AuthUser | null
  token:       string | null
  loading:     boolean
  login:       (email: string, password: string) => Promise<void>
  register:    (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  logout:      () => void
  /** Fetch wrapper that injects the Bearer token and auto-refreshes once on 401. */
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [token,   setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Keep latest token/refresh in a ref so `authedFetch` (returned as a stable
  // closure) always sees the current values without going stale.
  const tokenRef   = useRef<string | null>(null)
  const refreshRef = useRef<string | null>(null)

  const persist = (access: string, refresh: string | null, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    tokenRef.current   = access
    refreshRef.current = refresh ?? refreshRef.current
    setToken(access)
    setUser(u)
  }

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    tokenRef.current   = null
    refreshRef.current = null
    setToken(null)
    setUser(null)
  }

  // Exchange the stored refresh_token for a fresh access_token. Returns the
  // new access_token on success, or null on failure (which means the user
  // must log in again).
  const refreshAccess = async (): Promise<string | null> => {
    const rt = refreshRef.current
    if (!rt) return null
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh_token: rt }),
      })
      if (!res.ok) return null
      const data = await res.json() as {
        access_token:  string
        refresh_token: string
        user:          AuthUser
      }
      persist(data.access_token, data.refresh_token, data.user)
      return data.access_token
    } catch {
      return null
    }
  }

  useEffect(() => {
    // 1) Email-confirmation redirect: Supabase lands the user at
    //    `<SiteURL>/#access_token=...&refresh_token=...&type=signup`.
    //    Parse the hash, resolve the user via /auth/me, persist, then
    //    scrub the tokens out of the URL so they're not in the back-button.
    const consumeHashToken = async (): Promise<boolean> => {
      const hash = window.location.hash
      if (!hash.includes('access_token=')) return false

      const params       = new URLSearchParams(hash.replace(/^#/, ''))
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (!accessToken) return false

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) throw new Error(`/auth/me returned ${res.status}`)
        const me = await res.json() as AuthUser
        persist(accessToken, refreshToken, me)
        return true
      } catch {
        return false
      } finally {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }

    const run = async () => {
      const fromHash = await consumeHashToken()
      if (!fromHash) {
        const t  = localStorage.getItem(TOKEN_KEY)
        const rt = localStorage.getItem(REFRESH_KEY)
        const u  = localStorage.getItem(USER_KEY)
        if (t && u) {
          try {
            tokenRef.current   = t
            refreshRef.current = rt
            setToken(t)
            setUser(JSON.parse(u))
          } catch {
            clearSession()
          }
        }
      }
      setLoading(false)
    }
    run()
  }, [])

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
    const data = await res.json() as {
      access_token:  string
      refresh_token: string
      user:          AuthUser
    }
    persist(data.access_token, data.refresh_token, data.user)
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
      access_token:       string | null
      refresh_token:      string | null
      user:               AuthUser
      needs_confirmation: boolean
    }
    if (data.access_token) {
      persist(data.access_token, data.refresh_token, data.user)
      return { needsConfirmation: false }
    }
    return { needsConfirmation: true }
  }

  const logout = clearSession

  // authedFetch: inject Bearer, and on 401 try one refresh + replay.
  const authedFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const withAuth = (t: string): RequestInit => ({
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${t}` },
    })

    const current = tokenRef.current
    if (!current) return fetch(input, init)

    let res = await fetch(input, withAuth(current))
    if (res.status !== 401) return res

    const fresh = await refreshAccess()
    if (!fresh) {
      // Refresh failed → session is dead. Wipe local state so the UI
      // reflects "logged out" instead of showing stale email/avatar.
      clearSession()
      return res
    }
    res = await fetch(input, withAuth(fresh))
    return res
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authedFetch }}>
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
