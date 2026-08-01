import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'
import type { Page } from '../App'
import AuthShell, { AuthError, AuthNotice } from '../components/AuthShell'

interface RegisterProps {
  navigate: (p: Page) => void
}

export default function Register({ navigate }: RegisterProps) {
  const { register } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')
  const [sent,     setSent]     = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (password !== confirm)     { setErr('Passwords do not match.'); return }
    if (password.length < 6)      { setErr('Password must be at least 6 characters.'); return }

    setBusy(true)
    try {
      const { needsConfirmation } = await register(email, password)
      if (needsConfirmation) setSent(true)
      else                   navigate('dashboard')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="page-narrow pt-24 pb-32 animate-fade-up">
        <AuthNotice
          icon="lucide:mail-check"
          title="Confirm your email"
          action={{ label: 'Go to sign in', onClick: () => navigate('login') }}
        >
          We've sent a confirmation link to{' '}
          <strong className="text-ink-hi font-medium break-all">{email}</strong>.
          Click the link, then come back and sign in.
        </AuthNotice>
      </div>
    )
  }

  return (
    <AuthShell
      icon="lucide:user-plus"
      eyebrow="Create account"
      title="Join Aegis"
      lead="Encode and track your protected media."
    >
      <form onSubmit={submit} className="card p-7 flex flex-col gap-5">
        <div className="field">
          <label className="label" htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email" required autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password" required autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="input"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="reg-confirm">Confirm password</label>
          <input
            id="reg-confirm"
            type="password" required autoComplete="new-password"
            value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="input"
          />
        </div>

        {err && <AuthError message={err} />}

        <button type="submit" disabled={busy} className="btn-primary btn-lg btn-block">
          <Icon icon={busy ? 'lucide:loader-2' : 'lucide:user-plus'} width="17"
                className={busy ? 'animate-spin' : ''} />
          {busy ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-ink-lo">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('login')}
                  className="text-accent font-medium hover:text-accent-hover transition-colors">
            Sign in
          </button>
        </p>
      </form>
    </AuthShell>
  )
}
