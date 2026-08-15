import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'
import type { Page, AnalysisResult } from '../App'

interface DashboardProps {
  navigate: (p: Page) => void
  /** Opens a stored verification on the Results page. */
  onOpenResult: (r: AnalysisResult) => void
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface MediaItem {
  id:         string
  owner:      string
  media:      string
  kind:       'image' | 'video'
  metadata:   Record<string, unknown>
  /** Original upload name. Null for rows encoded before migration 005. */
  file_name?: string | null
  created_at?: string
}

/** Mirrors the `verifications` table from migration 004. */
interface VerificationItem {
  id:               string
  file_name:        string | null
  kind:             'image' | 'video' | null
  status:           'authentic' | 'tampered'
  reasons:          string[] | null
  ber:              number | null
  wm_accuracy:      number | null
  block_flag_ratio: number | null
  blocks_tampered:  number | null
  blocks_total:     number | null
  claimed_owner:    string | null
  claimed_media:    string | null
  recovered_owner:  string | null
  recovered_media:  string | null
  watermark_id:     string | null
  created_at?:      string
}

export default function Dashboard({ navigate, onOpenResult }: DashboardProps) {
  const { user, token, logout, authedFetch } = useAuth()
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [checks, setChecks] = useState<VerificationItem[] | null>(null)
  const [tab,   setTab]   = useState<'media' | 'checks'>('media')
  const [err,   setErr]   = useState('')
  /** Row whose file the server no longer holds — shows an inline explanation. */
  const [goneId, setGoneId] = useState<string | null>(null)
  /** Row with a delete in flight. */
  const [busyId, setBusyId] = useState<string | null>(null)

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

  // Best-effort. The server promises no retention: watermarked files sit on the
  // container's local disk, which is wiped on deploy or wake-from-sleep. A miss
  // is the expected case, not an error — so explain it rather than reporting a
  // bare HTTP status the user can do nothing with.
  const downloadFile = async (it: MediaItem) => {
    setGoneId(null)
    try {
      // Resolve by id, not by guessing the filename. Output format is now
      // selectable (png/webp, mkv/avi) and isn't stored on the row, so the old
      // `${id}_wm.${kind === 'video' ? 'mkv' : 'png'}` guess 404s for anything
      // encoded as WEBP or AVI even when the file is present.
      const res = await fetch(`${API_BASE}/media/${it.id}`)
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      // The server reports the real filename; fall back to the media kind's
      // default only if the header is missing.
      const served = res.headers.get('X-Output-Filename') || ''
      const ext = served.match(/\.([^.]+)$/)?.[1] || (it.kind === 'video' ? 'mkv' : 'png')
      const base = it.file_name?.replace(/\.[^.]+$/, '') || it.media || it.id
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `watermarked_${base}.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      setGoneId(it.id)
    }
  }

  // Deleting frees the media id. Encoding is deterministic — the same original
  // and media id reproduce a byte-identical file — but /encode rejects a reused
  // id, so without this a lost download burns that name permanently.
  const deleteMedia = async (it: MediaItem) => {
    const label = it.media || it.id
    if (!confirm(
      `Delete the record for "${label}"?\n\n` +
      `This frees the media ID so you can encode under it again. Copies of the ` +
      `file already shared stay watermarked, but Verify's database lookup will ` +
      `no longer recognise them.`
    )) return
    setBusyId(it.id)
    try {
      const res = await authedFetch(`${API_BASE}/me/media/${it.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
      setItems(prev => (prev ? prev.filter(m => m.id !== it.id) : prev))
      if (goneId === it.id) setGoneId(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete that record')
    } finally {
      setBusyId(null)
    }
  }

  // Rebuild a report from a stored row. Only a summary is kept, so the fields
  // backed by pixel data — spatial regions, frame timeline, watermark
  // comparison images — are left absent rather than faked; `archived` tells
  // Results to suppress those sections instead of drawing empty ones.
  //
  // ownerMatch/mediaMatch are deliberately omitted too: they aren't stored, and
  // inferring them by string-matching `reasons` would be brittle. Results hides
  // the badges when they're undefined, and `reasons` already says what failed.
  const openCheck = (c: VerificationItem) => {
    onOpenResult({
      status:          c.status,
      wmAccuracy:      c.wm_accuracy ?? 0,
      ber:             c.ber ?? 0,
      blockFlagRatio:  c.block_flag_ratio ?? undefined,
      reasons:         c.reasons ?? [],
      tamperedRegions: [],
      fileName:        c.file_name ?? '—',
      fileType:        c.kind === 'video' ? 'video' : 'image',
      ownerId:         c.recovered_owner ?? undefined,
      mediaId:         c.recovered_media ?? undefined,
      ownerLabel:      c.claimed_owner ?? undefined,
      mediaLabel:      c.claimed_media ?? undefined,
      blocksTampered:  c.blocks_tampered ?? undefined,
      blocksTotal:     c.blocks_total ?? undefined,
      archived:        true,
      checkedAt:       c.created_at,
    })
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
          {/* The tag the decoder reports back. Surfaced here so it is something
              the user already recognises by the time they see it on a report. */}
          {user.short_id && (
            <p className="text-sm text-ink-faint mt-1.5">
              Owner ID <span className="font-mono text-ink-lo">{user.short_id}</span>
              <span className="ml-2">— embedded in every file you encode</span>
            </p>
          )}
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
              <li key={it.id} className="card-lift p-5 flex flex-col gap-4">
                {/* Inline, not an alert(): the file being absent is the normal
                    state after the server restarts, so it warrants an
                    explanation attached to the row rather than a popup. */}
                {goneId === it.id && (
                  <div className="callout-warn text-sm">
                    <Icon icon="lucide:info" width="15" className="shrink-0 mt-0.5" />
                    <span>
                      This file isn't kept on the server — use the copy you downloaded when
                      encoding. Encoding is deterministic, so re-encoding the same original
                      under the same media ID reproduces an identical file; delete this
                      record first to free the ID.
                    </span>
                  </div>
                )}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start gap-4 min-w-0">
                  <span className="w-11 h-11 rounded-xl bg-white/[0.04] border border-line text-ink-lo
                                   flex items-center justify-center shrink-0">
                    <Icon icon={it.kind === 'video' ? 'lucide:video' : 'lucide:image'} width="20" />
                  </span>
                  <div className="min-w-0">
                    {/* Headline is the filename — what the user recognises.
                        The media id is the identifier the watermark actually
                        carries, so it stays visible, just demoted. Rows encoded
                        before migration 005 have no filename and fall back to
                        leading with the media id rather than inventing one. */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-base font-medium text-ink-hi break-all">
                        {it.file_name || it.media || '— no media id —'}
                      </p>
                      <span className="badge-neutral">{it.kind}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-lo mb-1">
                      {it.file_name && it.media && (
                        <span>Media ID <span className="font-mono text-ink-hi">{it.media}</span></span>
                      )}
                      {psnr && <span>PSNR <span className="font-mono text-ink-hi">{psnr} dB</span></span>}
                      {it.created_at && (
                        <span>Encoded <span className="text-ink-hi">{new Date(it.created_at).toLocaleString()}</span></span>
                      )}
                    </div>
                    <p className="meta break-all">{it.id}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button onClick={() => downloadMeta(it)} className="btn-outline btn-sm">
                    <Icon icon="lucide:file-json" width="14" /> metadata.json
                  </button>
                  <button onClick={() => downloadFile(it)} className="btn-ghost btn-sm">
                    <Icon icon="lucide:download" width="14" /> File
                  </button>
                  <button onClick={() => deleteMedia(it)} disabled={busyId === it.id}
                          className="btn-ghost btn-sm text-alert"
                          title="Delete this record and free its media ID">
                    <Icon icon={busyId === it.id ? 'lucide:loader-2' : 'lucide:trash-2'} width="14"
                          className={busyId === it.id ? 'animate-spin' : ''} />
                    Delete
                  </button>
                </div>
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
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => openCheck(c)}
                    className="card-lift w-full text-left p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                    aria-label={`Open the ${c.status} report for ${c.file_name ?? 'this file'}`}
                  >
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
                  <div className="flex items-center gap-3 shrink-0">
                    {c.watermark_id && (
                      <span className="badge-neutral"
                            title="The metadata used for this check belongs to one of your encode records. It does not mean the file passed.">
                        <Icon icon="lucide:link" width="12" /> from your encodes
                      </span>
                    )}
                    <Icon icon="lucide:chevron-right" width="18" className="text-ink-faint" />
                  </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
