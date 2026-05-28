import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'
import type { Page } from '../App'

interface DashboardProps {
  navigate: (p: Page) => void
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface MediaItem {
  id:         string
  owner:      string
  media:      string
  kind:       'image' | 'video'
  metadata:   Record<string, unknown>
  created_at?: string
}

export default function Dashboard({ navigate }: DashboardProps) {
  const { user, token, logout, authedFetch } = useAuth()
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [err,   setErr]   = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    authedFetch(`${API_BASE}/me/media`)
      .then(async r => {
        if (!r.ok) {
          const text = await r.text().catch(() => '')
          throw new Error(text || `Failed (${r.status})`)
        }
        return r.json() as Promise<{ items: MediaItem[] }>
      })
      .then(d => { if (!cancelled) setItems(d.items) })
      .catch(e => { if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load') })
    return () => { cancelled = true }
  }, [token])

  const downloadMeta = (it: MediaItem) => {
    const blob = new Blob([JSON.stringify(it.metadata, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `metadata_${it.id}.json`
    a.click()
  }

  const downloadFile = async (it: MediaItem) => {
    const ext = it.kind === 'video' ? 'mkv' : 'png'
    const url = `${API_BASE}/files/${it.id}_wm.${ext}`
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `watermarked_${it.media || it.id}.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      alert(`Watermarked file not available: ${e instanceof Error ? e.message : 'error'}`)
    }
  }

  if (!user || !token) {
    return (
      <div className="max-w-md mx-auto px-7 pt-24 pb-32 text-center">
        <h2 className="font-display text-[1.6rem] text-white mb-3">Sign in to view your dashboard</h2>
        <button
          onClick={() => navigate('login')}
          className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-[14px] mt-4"
        >
          Go to Sign In →
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto px-7 pb-20 relative z-10">
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="pt-16 pb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-white/5 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[12px] font-semibold rounded-full mb-4 backdrop-blur-md">
            <Icon icon="lucide:layout-dashboard" width="14" />
            Dashboard
          </div>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] text-white font-semibold leading-tight mb-3 tracking-tight">Your encoded media</h1>
          <p className="text-slate-400 text-[14.5px]">
            Signed in as <span className="font-mono text-cyan-400">{user.email}</span>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('encode')}
            className="px-5 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-[14px] flex items-center gap-2"
          >
            <Icon icon="lucide:plus" width="16" /> Encode New
          </button>
          <button
            onClick={() => { logout(); navigate('home') }}
            className="px-5 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all text-[14px] flex items-center gap-2"
          >
            <Icon icon="lucide:log-out" width="16" /> Sign Out
          </button>
        </div>
      </div>

      {err && (
        <div className="px-4 py-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[13.5px] text-rose-300 flex items-start gap-2 mb-8">
          <Icon icon="lucide:alert-circle" width="14" className="mt-0.5 shrink-0" /> {err}
        </div>
      )}

      {items === null && !err && (
        <div className="bg-[#111318] border border-white/5 rounded-3xl p-16 text-center text-slate-500 flex items-center justify-center gap-3">
          <Icon icon="lucide:loader-2" width="18" className="animate-spin" /> Loading...
        </div>
      )}

      {items && items.length === 0 && (
        <div className="bg-[#111318] border border-white/5 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 text-slate-500 flex items-center justify-center mx-auto mb-5">
            <Icon icon="lucide:image-off" width="28" />
          </div>
          <h3 className="font-display text-[1.4rem] text-white mb-2">No encoded media yet</h3>
          <p className="text-slate-400 text-[14px] mb-6">Encode your first file to see it here.</p>
          <button
            onClick={() => navigate('encode')}
            className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-[14px]"
          >
            Go to Encode →
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {items.map(it => {
            const psnrRaw = (it.metadata as { psnr_db?: unknown; psnr_y_mean_db?: unknown })?.psnr_db
                         ?? (it.metadata as { psnr_y_mean_db?: unknown })?.psnr_y_mean_db
            const psnr = typeof psnrRaw === 'number' ? psnrRaw.toFixed(1) : null
            return (
              <div key={it.id} className="bg-[#111318] border border-white/5 rounded-3xl p-6 hover:border-cyan-500/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center shrink-0">
                      <Icon icon={it.kind === 'video' ? 'lucide:video' : 'lucide:image'} width="22" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-white text-[15px] break-all">{it.media || '— no media id —'}</p>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 text-[10px] uppercase tracking-widest font-bold rounded-md">
                          {it.kind}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 font-mono mb-1 break-all">id: {it.id}</p>
                      <div className="text-[12px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                        {psnr && (
                          <span>PSNR: <span className="text-white font-mono">{psnr} dB</span></span>
                        )}
                        {it.created_at && (
                          <span>Encoded: <span className="text-white">{new Date(it.created_at).toLocaleString()}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => downloadMeta(it)}
                      className="flex items-center gap-2 px-4 py-2.5 border border-cyan-500/30 text-cyan-400 font-medium rounded-xl hover:bg-cyan-500/10 transition-all text-[13px]"
                    >
                      <Icon icon="lucide:file-json" width="15" /> metadata.json
                    </button>
                    <button
                      onClick={() => downloadFile(it)}
                      className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-[13px]"
                    >
                      <Icon icon="lucide:download" width="15" /> File
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
