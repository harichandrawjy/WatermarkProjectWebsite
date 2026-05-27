import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'
import type { Page } from '../App'

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
    <div className="max-w-md mx-auto px-7 pt-24 pb-32 relative z-10">
      <div className="absolute top-[10%] left-[20%] w-[60%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[12px] font-semibold rounded-full mb-5 backdrop-blur-md">
          <Icon icon="lucide:log-in" width="14" />
          Sign In
        </div>
        <h1 className="font-display text-[clamp(2rem,4vw,2.6rem)] text-white font-normal mb-3 leading-tight tracking-tight">Welcome back</h1>
        <p className="text-slate-400 text-[14.5px]">Log in to access your encoded media.</p>
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
            type="password" required autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
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
            : <Icon icon="lucide:log-in" width="18" />}
          {busy ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-center text-[13px] text-slate-400">
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('register')} className="text-cyan-400 font-semibold hover:underline">
            Create one
          </button>
        </p>
      </form>
    </div>
  )
}
