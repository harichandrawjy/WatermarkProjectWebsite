import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY    = 'wm_token'
const REFRESH_KEY  = 'wm_refresh'
const USER_KEY     = 'wm_user'
const ACTIVITY_KEY = 'wm_last_activity'

// Auto-logout after this many ms of no user activity. Change here to tune.
// Activity = click, keypress, scroll, touch — *not* mouse-move (too noisy).
// The deadline is persisted to localStorage, so closing the tab and coming
// back later still logs the user out if too much time has passed.
const IDLE_LIMIT_MS = 15 * 60 * 1000   // 15 minutes

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
  /**
   * Set when the user arrived via a password-recovery link
   * (`#access_token=...&type=recovery`). While this is non-null the app shows
   * the "choose a new password" form. Cleared once the reset succeeds.
   */
  recoveryToken: string | null
  clearRecovery: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [token,   setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null)

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
    localStorage.removeItem(ACTIVITY_KEY)
    tokenRef.current   = null
    refreshRef.current = null
    setToken(null)
    setUser(null)
  }

  // Stamp "now" as the last activity time. Used both by the persistence
  // check on mount and by the live idle-timer reset while the tab is open.
  const stampActivity = () => {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
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
      const linkType     = params.get('type')
      if (!accessToken) return false

      // Password-recovery links use this same hash shape as signup
      // confirmation, differing only by `type=recovery`. Without this branch
      // the token would be consumed as an ordinary sign-in and scrubbed from
      // the URL below — logging the user in but silently discarding the one
      // credential that lets them actually set a new password.
      if (linkType === 'recovery') setRecoveryToken(accessToken)

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
      if (fromHash) {
        stampActivity()
      } else {
        const t  = localStorage.getItem(TOKEN_KEY)
        const rt = localStorage.getItem(REFRESH_KEY)
        const u  = localStorage.getItem(USER_KEY)
        const lastActivity = Number(localStorage.getItem(ACTIVITY_KEY) ?? 0)

        // Idle-too-long guard: if the stored deadline has passed (e.g. the
        // user closed the tab yesterday and re-opened today), don't restore.
        const idleTooLong = lastActivity > 0 && (Date.now() - lastActivity) > IDLE_LIMIT_MS

        if (t && u && !idleTooLong) {
          try {
            tokenRef.current   = t
            refreshRef.current = rt
            setToken(t)
            setUser(JSON.parse(u))
            stampActivity()
          } catch {
            clearSession()
          }
        } else if (idleTooLong) {
          clearSession()
        }
      }
      setLoading(false)
    }
    run()
  }, [])

  // Live idle timer: while logged in, watch real user activity (clicks, keys,
  // scroll, touch — not mouse-move, which would never let the timer fire).
  // On each event we update the stored timestamp and reset a setTimeout that
  // calls logout() when it finally elapses without interruption.
  useEffect(() => {
    if (!token) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const armTimer = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        clearSession()
      }, IDLE_LIMIT_MS)
    }

    const onActivity = () => {
      stampActivity()
      armTimer()
    }

    // If the tab was hidden then re-shown, check whether the deadline lapsed
    // *while we weren't running the timer*. (Background tabs often have their
    // timers throttled by the browser, so we can't rely on `timer` alone.)
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      const last = Number(localStorage.getItem(ACTIVITY_KEY) ?? 0)
      if (last > 0 && (Date.now() - last) > IDLE_LIMIT_MS) {
        clearSession()
      } else {
        armTimer()
      }
    }

    const events: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)

    armTimer()

    return () => {
      if (timer) clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, onActivity))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [token])

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
    stampActivity()
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
      stampActivity()
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
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout, authedFetch,
      recoveryToken, clearRecovery: () => setRecoveryToken(null),
    }}>
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
