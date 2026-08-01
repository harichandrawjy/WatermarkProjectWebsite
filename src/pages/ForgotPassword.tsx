import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'
import type { Page } from '../App'
import AuthShell, { AuthError, AuthNotice } from '../components/AuthShell'

interface ForgotPasswordProps {
  navigate: (p: Page) => void
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/**
 * Both halves of the password-reset flow.
 *
 * Which half renders depends on whether the user got here from an emailed
 * recovery link: `recoveryToken` set means they already have a token and just
 * need to pick a new password; otherwise they're asking for the email.
 */
export default function ForgotPassword({ navigate }: ForgotPasswordProps) {
  const { recoveryToken, clearRecovery } = useAuth()

  const [email,    setEmail]    = useState('')
  const [pw1,      setPw1]      = useState('')
  const [pw2,      setPw2]      = useState('')
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')
  const [sent,     setSent]     = useState(false)
  const [done,     setDone]     = useState(false)

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setSent(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not send the reset email')
    } finally {
      setBusy(false)
    }
  }

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    // Checked here because it's the one rule the server genuinely cannot
    // verify — it only ever receives the single value. Everything else
    // (length, reuse, expiry) is Supabase's policy to enforce and report.
    if (pw1 !== pw2) { setErr('The two passwords do not match.'); return }
    setBusy(true)
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ access_token: recoveryToken, new_password: pw1 }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        let msg = `Reset failed (${res.status})`
        try { msg = (JSON.parse(text) as { detail?: string }).detail ?? msg } catch { /* keep default */ }
        throw new Error(msg)
      }
      setDone(true)
      clearRecovery()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update the password')
    } finally {
      setBusy(false)
    }
  }

  // ── Password changed ──
  if (done) return (
    <div className="page-narrow pt-24 pb-32 animate-fade-up">
      <AuthNotice
        icon="lucide:check"
        title="Password updated"
        action={{ label: 'Go to sign in', onClick: () => navigate('login') }}
      >
        You can now sign in with your new password.
      </AuthNotice>
    </div>
  )

  // ── Arrived from the emailed link: choose a new password ──
  if (recoveryToken) return (
    <AuthShell
      icon="lucide:key-round"
      eyebrow="Password reset"
      title="Choose a new password"
      lead="This link works once, and only for a short while."
    >
      <form onSubmit={submitNewPassword} className="card p-7 flex flex-col gap-5">
        <div className="field">
          <label className="label" htmlFor="pw-new">New password</label>
          <input
            id="pw-new"
            type="password" required autoComplete="new-password"
            value={pw1} onChange={e => setPw1(e.target.value)}
            placeholder="••••••••"
            className="input"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="pw-confirm">Confirm new password</label>
          <input
            id="pw-confirm"
            type="password" required autoComplete="new-password"
            value={pw2} onChange={e => setPw2(e.target.value)}
            placeholder="••••••••"
            className="input"
          />
        </div>

        {err && <AuthError message={err} />}

        <button type="submit" disabled={busy} className="btn-primary btn-lg btn-block">
          <Icon icon={busy ? 'lucide:loader-2' : 'lucide:key-round'} width="17"
                className={busy ? 'animate-spin' : ''} />
          {busy ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  )

  // ── Ask for the reset email ──
  if (sent) return (
    <div className="page-narrow pt-24 pb-32 animate-fade-up">
      <AuthNotice
        icon="lucide:mail-check"
        title="Check your inbox"
        action={{ label: 'Back to sign in', onClick: () => navigate('login') }}
      >
        <p className="mb-2">
          If <span className="font-mono text-ink-hi break-all">{email}</span> has an account,
          a reset link is on its way.
        </p>
        <p className="text-sm text-ink-faint">
          It can take a minute to arrive, and it may land in spam.
        </p>
      </AuthNotice>
    </div>
  )

  return (
    <AuthShell
      icon="lucide:mail"
      eyebrow="Password reset"
      title="Forgot your password?"
      lead="We'll email you a link to set a new one."
    >
      <form onSubmit={requestLink} className="card p-7 flex flex-col gap-5">
        <div className="field">
          <label className="label" htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email" required autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>

        {err && <AuthError message={err} />}

        <button type="submit" disabled={busy} className="btn-primary btn-lg btn-block">
          <Icon icon={busy ? 'lucide:loader-2' : 'lucide:send'} width="17"
                className={busy ? 'animate-spin' : ''} />
          {busy ? 'Sending...' : 'Send reset link'}
        </button>

        <p className="text-center text-sm text-ink-lo">
          Remembered it?{' '}
          <button type="button" onClick={() => navigate('login')}
                  className="text-accent font-medium hover:text-accent-hover transition-colors">
            Back to sign in
          </button>
        </p>
      </form>
    </AuthShell>
  )
}
