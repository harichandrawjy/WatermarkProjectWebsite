import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'
import type { Page } from '../App'
import AuthShell, { AuthError } from '../components/AuthShell'

interface LoginProps {
  navigate: (p: Page) => void
}

export default function Login({ navigate }: LoginProps) {
  const { login } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('dashboard')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      icon="lucide:log-in"
      eyebrow="Sign in"
      title="Welcome back"
      lead="Log in to access your encoded media."
    >
      <form onSubmit={submit} className="card p-7 flex flex-col gap-5">
        <div className="field">
          <label className="label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email" required autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>

        <div className="field">
          <div className="flex items-baseline justify-between gap-3">
            <label className="label" htmlFor="login-password">Password</label>
            <button type="button" onClick={() => navigate('forgot')}
                    className="text-xs text-accent hover:text-accent-hover transition-colors">
              Forgot password?
            </button>
          </div>
          <input
            id="login-password"
            type="password" required autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input"
          />
        </div>

        {err && <AuthError message={err} />}

        <button type="submit" disabled={busy} className="btn-primary btn-lg btn-block">
          <Icon icon={busy ? 'lucide:loader-2' : 'lucide:log-in'} width="17"
                className={busy ? 'animate-spin' : ''} />
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-ink-lo">
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('register')}
                  className="text-accent font-medium hover:text-accent-hover transition-colors">
            Create one
          </button>
        </p>
      </form>
    </AuthShell>
  )
}
