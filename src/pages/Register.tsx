import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'
import type { Page } from '../App'

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
      <div className="max-w-md mx-auto px-7 pt-24 pb-32 text-center relative z-10">
        <div className="absolute top-[10%] left-[20%] w-[60%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-6">
          <Icon icon="lucide:mail-check" width="28" />
        </div>
        <h1 className="font-display text-[1.8rem] text-white font-medium mb-3">Confirm your email</h1>
        <p className="text-slate-400 text-[14.5px] mb-8 leading-relaxed">
          We've sent a confirmation link to <strong className="text-white">{email}</strong>.
          Click the link, then come back and sign in.
        </p>
        <button
          onClick={() => navigate('login')}
          className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-[14px]"
        >
          Go to Sign In →
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-7 pt-24 pb-32 relative z-10">
      <div className="absolute top-[10%] left-[20%] w-[60%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[12px] font-semibold rounded-full mb-5 backdrop-blur-md">
          <Icon icon="lucide:user-plus" width="14" />
          Create Account
        </div>
        <h1 className="font-display text-[clamp(2rem,4vw,2.6rem)] text-white font-normal mb-3 leading-tight tracking-tight">Join WaterGuard</h1>
        <p className="text-slate-400 text-[14.5px]">Encode and track your protected media.</p>
      </div>

      <form onSubmit={submit} className="bg-[#111318] border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col gap-5">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Email</label>
          <input
            type="email" required autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Password</label>
          <input
            type="password" required autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Confirm Password</label>
          <input
            type="password" required autoComplete="new-password"
            value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {err && (
          <div className="px-4 py-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[13px] text-rose-300 flex items-start gap-2">
            <Icon icon="lucide:alert-circle" width="14" className="mt-0.5 shrink-0" /> {err}
          </div>
        )}

        <button
          type="submit" disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy
            ? <Icon icon="lucide:loader-2" width="18" className="animate-spin" />
            : <Icon icon="lucide:user-plus" width="18" />}
          {busy ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-center text-[13px] text-slate-400">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('login')} className="text-cyan-400 font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </form>
    </div>
  )
}
