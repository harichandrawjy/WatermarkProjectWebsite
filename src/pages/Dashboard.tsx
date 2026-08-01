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
      <div className="page-narrow pt-24 pb-32 text-center">
        <h1 className="font-display text-2xl text-ink-hi mb-5">Sign in to view your dashboard</h1>
        <button onClick={() => navigate('login')} className="btn-primary">
          <Icon icon="lucide:log-in" width="16" /> Go to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="page pb-8">

      {/* ── Header ── */}
      <header className="pt-16 pb-8 mb-8 border-b border-line flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="min-w-0">
          <span className="pill-accent mb-5">
            <Icon icon="lucide:layout-dashboard" width="13" />
            Dashboard
          </span>
          <h1 className="page-title mb-3">Your encoded media</h1>
          <p className="text-base text-ink-lo">
            Signed in as <span className="font-mono text-ink-hi">{user.email}</span>
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap shrink-0">
          <button onClick={() => navigate('encode')} className="btn-primary">
            <Icon icon="lucide:plus" width="16" /> Encode new
          </button>
          <button onClick={() => { logout(); navigate('home') }} className="btn-ghost">
            <Icon icon="lucide:log-out" width="16" /> Sign out
          </button>
        </div>
      </header>

      {err && (
        <div className="callout-alert mb-8">
          <Icon icon="lucide:alert-circle" width="15" className="text-alert shrink-0 mt-0.5" /> {err}
        </div>
      )}

      {items === null && !err && (
        <div className="card p-16 flex items-center justify-center gap-3 text-base text-ink-lo">
          <Icon icon="lucide:loader-2" width="18" className="animate-spin" /> Loading...
        </div>
      )}

      {items && items.length === 0 && (
        <div className="card p-16 text-center">
          <span className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-line text-ink-faint
                           flex items-center justify-center mx-auto mb-5">
            <Icon icon="lucide:image-off" width="26" />
          </span>
          <h2 className="font-display text-xl text-ink-hi mb-2">No encoded media yet</h2>
          <p className="text-base text-ink-lo mb-6">Encode your first file to see it here.</p>
          <button onClick={() => navigate('encode')} className="btn-primary">
            Go to encode <Icon icon="lucide:arrow-right" width="16" />
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map(it => {
            const psnrRaw = (it.metadata as { psnr_db?: unknown; psnr_y_mean_db?: unknown })?.psnr_db
                         ?? (it.metadata as { psnr_y_mean_db?: unknown })?.psnr_y_mean_db
            const psnr = typeof psnrRaw === 'number' ? psnrRaw.toFixed(1) : null
            return (
              <li key={it.id} className="card-lift p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start gap-4 min-w-0">
                  <span className="w-11 h-11 rounded-xl bg-white/[0.04] border border-line text-ink-lo
                                   flex items-center justify-center shrink-0">
                    <Icon icon={it.kind === 'video' ? 'lucide:video' : 'lucide:image'} width="20" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-base font-medium text-ink-hi break-all">
                        {it.media || '— no media id —'}
                      </p>
                      <span className="badge-neutral">{it.kind}</span>
                    </div>
                    <p className="meta break-all mb-1">{it.id}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-lo">
                      {psnr && <span>PSNR <span className="font-mono text-ink-hi">{psnr} dB</span></span>}
                      {it.created_at && (
                        <span>Encoded <span className="text-ink-hi">{new Date(it.created_at).toLocaleString()}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button onClick={() => downloadMeta(it)} className="btn-outline btn-sm">
                    <Icon icon="lucide:file-json" width="14" /> metadata.json
                  </button>
                  <button onClick={() => downloadFile(it)} className="btn-ghost btn-sm">
                    <Icon icon="lucide:download" width="14" /> File
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
