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

interface VerificationItem {
  id:               string
  file_name:        string | null
  kind:             'image' | 'video' | null
  status:           'authentic' | 'tampered'
  reasons:          string[] | null
  ber:              number | null
  blocks_tampered:  number | null
  blocks_total:     number | null
  claimed_media:    string | null
  recovered_owner:  string | null
  watermark_id:     string | null
  created_at?:      string
}

export default function Dashboard({ navigate }: DashboardProps) {
  const { user, token, logout, authedFetch } = useAuth()
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [checks, setChecks] = useState<VerificationItem[] | null>(null)
  const [tab,   setTab]   = useState<'media' | 'checks'>('media')
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

  // Verification history is a secondary panel, so a failure here is silent —
  // it must never replace the encode list with an error.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    authedFetch(`${API_BASE}/me/verifications`)
      .then(r => (r.ok ? (r.json() as Promise<{ items: VerificationItem[] }>) : null))
      .then(d => { if (!cancelled) setChecks(d?.items ?? []) })
      .catch(() => { if (!cancelled) setChecks([]) })
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
          <h1 className="page-title mb-3">
            {tab === 'media' ? 'Your encoded media' : 'Your verifications'}
          </h1>
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

      {/* ── Tabs ──
          Counts live on the tab itself so the other list's state is visible
          without switching — otherwise you cannot tell an empty history from
          one you simply are not looking at. */}
      <div role="tablist" aria-label="Dashboard sections"
           className="flex items-center gap-1 border-b border-line mb-8 -mt-2">
        {([
          { key: 'media'  as const, label: 'Encoded media',      icon: 'lucide:image',   count: items?.length },
          { key: 'checks' as const, label: 'Verification history', icon: 'lucide:history', count: checks?.length },
        ]).map(t => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                ${active
                  ? 'border-accent text-ink-hi'
                  : 'border-transparent text-ink-lo hover:text-ink-hi'}`}
            >
              <Icon icon={t.icon} width="15" />
              {t.label}
              {typeof t.count === 'number' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md
                  ${active ? 'bg-white/[0.08] text-ink-hi' : 'bg-white/[0.04] text-ink-faint'}`}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {err && (
        <div className="callout-alert mb-8">
          <Icon icon="lucide:alert-circle" width="15" className="text-alert shrink-0 mt-0.5" /> {err}
        </div>
      )}

      {tab === 'media' && items === null && !err && (
        <div className="card p-16 flex items-center justify-center gap-3 text-base text-ink-lo">
          <Icon icon="lucide:loader-2" width="18" className="animate-spin" /> Loading...
        </div>
      )}

      {tab === 'media' && items && items.length === 0 && (
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

      {tab === 'media' && items && items.length > 0 && (
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

      {/* ── Verification history ──
          Encodes have always been recoverable; verifications left no trace.
          For the use cases this targets — insurance photos, medical imaging,
          bodycam footage — the audit trail is arguably the point. Only a
          summary is stored, never the report: full results carry base64
          watermark comparisons, two per frame for video. */}
      {tab === 'checks' && checks === null && (
        <div className="card p-16 flex items-center justify-center gap-3 text-base text-ink-lo">
          <Icon icon="lucide:loader-2" width="18" className="animate-spin" /> Loading...
        </div>
      )}

      {tab === 'checks' && checks && (
        <section>
          <p className="text-sm text-ink-lo mb-5">Integrity checks you have run, newest first</p>

          {checks.length === 0 && (
            <div className="card p-10 text-center">
              <span className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-line text-ink-faint
                               flex items-center justify-center mx-auto mb-4">
                <Icon icon="lucide:file-search" width="22" />
              </span>
              <p className="text-base text-ink-hi mb-1.5">No verifications yet</p>
              <p className="text-sm text-ink-lo mb-5">
                Checks you run while signed in are recorded here.
              </p>
              <button onClick={() => navigate('verify')} className="btn-outline btn-sm">
                <Icon icon="lucide:scan" width="14" /> Verify a file
              </button>
            </div>
          )}

          <ul className="flex flex-col gap-3">
            {checks.map(c => {
              const tampered = c.status === 'tampered'
              return (
                <li key={c.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <span className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0
                      ${tampered ? 'border-alert-line text-alert bg-alert-soft'
                                 : 'border-ok-line text-ok bg-ok-soft'}`}>
                      <Icon icon={tampered ? 'lucide:shield-alert' : 'lucide:shield-check'} width="20" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-base font-medium text-ink-hi break-all">
                          {c.file_name || '— unnamed file —'}
                        </p>
                        <span className={tampered ? 'badge-alert' : 'badge-ok'}>
                          {tampered ? 'Tampered' : 'Authentic'}
                        </span>
                      </div>

                      {/* The reason, not a score — same rationale as Results. */}
                      {tampered && (c.reasons?.length ?? 0) > 0 && (
                        <p className="text-sm text-ink-lo mb-1">{c.reasons!.join(' · ')}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-lo">
                        {c.claimed_media && (
                          <span>Media <span className="font-mono text-ink-hi">{c.claimed_media}</span></span>
                        )}
                        {typeof c.ber === 'number' && (
                          <span>BER <span className="font-mono text-ink-hi">{c.ber.toFixed(4)}</span></span>
                        )}
                        {typeof c.blocks_total === 'number' && c.blocks_total > 0 && (
                          <span>Blocks <span className="font-mono text-ink-hi">{c.blocks_tampered}/{c.blocks_total}</span></span>
                        )}
                        {c.created_at && (
                          <span>Checked <span className="text-ink-hi">{new Date(c.created_at).toLocaleString()}</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deliberately NOT "matched encode". This resolves the
                      metadata that was SUPPLIED for the check, not anything
                      recovered from the pixels — so it stays true on a file
                      that failed verification outright. Wording it as a match
                      contradicted the reasons listed right beside it. */}
                  {c.watermark_id && (
                    <span className="badge-neutral shrink-0"
                          title="The metadata used for this check belongs to one of your encode records. It does not mean the file passed.">
                      <Icon icon="lucide:link" width="12" /> from your encodes
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
