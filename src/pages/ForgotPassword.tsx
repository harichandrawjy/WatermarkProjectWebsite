import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'
import type { Page } from '../App'

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

  const shell = (children: React.ReactNode) => (
    <div className="max-w-md mx-auto px-7 pt-24 pb-32 relative z-10">
      <div className="absolute top-[10%] left-[20%] w-[60%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      {children}
    </div>
  )

  // ── Password changed ──
  if (done) return shell(
    <div className="bg-[#111318] border border-emerald-500/30 rounded-3xl p-8 text-center shadow-xl">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-5">
        <Icon icon="lucide:check" width="26" strokeWidth="2.5" />
      </div>
      <h1 className="font-display text-[1.6rem] text-white mb-2">Password updated</h1>
      <p className="text-slate-400 text-[14px] mb-7">You can now sign in with your new password.</p>
      <button onClick={() => navigate('login')}
        className="w-full px-6 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-[15px]">
        Go to Sign In
      </button>
    </div>
  )

  // ── Arrived from the emailed link: choose a new password ──
  if (recoveryToken) return shell(
    <>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[12px] font-semibold rounded-full mb-5 backdrop-blur-md">
          <Icon icon="lucide:key-round" width="14" />
          Password Reset
        </div>
        <h1 className="font-display text-[clamp(2rem,4vw,2.6rem)] text-white font-normal mb-3 leading-tight tracking-tight">Choose a new password</h1>
        <p className="text-slate-400 text-[14.5px]">This link works once, and only for a short while.</p>
      </div>

      <form onSubmit={submitNewPassword} className="bg-[#111318] border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col gap-5">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">New password</label>
          <input
            type="password" required autoComplete="new-password"
            value={pw1} onChange={e => setPw1(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Confirm new password</label>
          <input
            type="password" required autoComplete="new-password"
            value={pw2} onChange={e => setPw2(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {err && (
          <div className="px-4 py-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[13px] text-rose-300 flex items-start gap-2">
            <Icon icon="lucide:alert-circle" width="14" className="mt-0.5 shrink-0" /> {err}
          </div>
        )}

        <button type="submit" disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all text-[15px] disabled:opacity-50 disabled:cursor-not-allowed">
          {busy
            ? <Icon icon="lucide:loader-2" width="18" className="animate-spin" />
            : <Icon icon="lucide:key-round" width="18" />}
          {busy ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </>
  )

  // ── Ask for the reset email ──
  return shell(
    <>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[12px] font-semibold rounded-full mb-5 backdrop-blur-md">
          <Icon icon="lucide:mail" width="14" />
          Password Reset
        </div>
        <h1 className="font-display text-[clamp(2rem,4vw,2.6rem)] text-white font-normal mb-3 leading-tight tracking-tight">Forgot your password?</h1>
        <p className="text-slate-400 text-[14.5px]">We'll email you a link to set a new one.</p>
      </div>

      {sent ? (
        <div className="bg-[#111318] border border-emerald-500/30 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-5">
            <Icon icon="lucide:mail-check" width="26" />
          </div>
          <h2 className="font-display text-[1.4rem] text-white mb-2">Check your inbox</h2>
          <p className="text-slate-400 text-[13.5px] leading-relaxed mb-2">
            If <span className="font-mono text-cyan-400 break-all">{email}</span> has an account,
            a reset link is on its way.
          </p>
          <p className="text-slate-500 text-[12.5px] leading-relaxed mb-7">
            It can take a minute to arrive, and it may land in spam.
          </p>
          <button onClick={() => navigate('login')}
            className="w-full px-6 py-4 border border-white/10 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-[14.5px]">
            Back to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={requestLink} className="bg-[#111318] border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col gap-5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Email</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          {err && (
            <div className="px-4 py-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[13px] text-rose-300 flex items-start gap-2">
              <Icon icon="lucide:alert-circle" width="14" className="mt-0.5 shrink-0" /> {err}
            </div>
          )}

          <button type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all text-[15px] disabled:opacity-50 disabled:cursor-not-allowed">
            {busy
              ? <Icon icon="lucide:loader-2" width="18" className="animate-spin" />
              : <Icon icon="lucide:send" width="18" />}
            {busy ? 'Sending...' : 'Send Reset Link'}
          </button>

          <p className="text-center text-[13px] text-slate-400">
            Remembered it?{' '}
            <button type="button" onClick={() => navigate('login')} className="text-cyan-400 font-semibold hover:underline">
              Back to sign in
            </button>
          </p>
        </form>
      )}
    </>
  )
}
