import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { AnalysisResult } from '../App'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'

interface VerifyProps {
  onComplete: (r: AnalysisResult) => void
}

type Stage = 'idle' | 'dragging' | 'preview' | 'verifying' | 'error'
type MetaSource = 'auto' | 'id' | 'file'

interface HistoryItem {
  id:          string
  media:       string | null
  kind:        'image' | 'video'
  created_at?: string
  metadata:    Record<string, unknown>
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const VERIFY_STEPS = [
  'Reading watermarked file...',
  'Applying LWT + 8x8 DCT + SVD...',
  'Extracting bits via QIM detector...',
  'Decoding BCH(15,7) + majority vote...',
  'Matching owner / media / frame IDs...',
  'Regenerating SHA-256 parity per sub-block...',
  'Comparing parities, locating mismatches...',
  'Generating integrity report...',
]

const DETECT_ITEMS = [
  'Face swapping / deepfake',
  'Object removal',
  'Inpainting / copy-move',
  'Splicing attacks',
  'Frame insertion / deletion',
  'Pixel-level manipulation',
]

const REPORT_ITEMS = [
  { icon: 'lucide:badge-check',    text: 'Authentic / tampered verdict, with the reason it was flagged' },
  { icon: 'lucide:map-pin',        text: 'Exact spatial pixel regions that were altered' },
  { icon: 'lucide:film',           text: 'Per-frame timeline analysis for video files' },
  { icon: 'lucide:activity',       text: 'Visual sub-block parity mismatch heatmap' },
  { icon: 'lucide:download-cloud', text: 'Downloadable structured JSON report' },
]

export default function Verify({ onComplete }: VerifyProps) {
  const { token, authedFetch } = useAuth()
  const [stage,        setStage]        = useState<Stage>('idle')
  const [file,         setFile]         = useState<File | null>(null)
  const [preview,      setPreview]      = useState<string | null>(null)
  const [stepIdx,      setStepIdx]      = useState(0)
  const [progress,     setProgress]     = useState(0)
  const [metaSource,   setMetaSource]   = useState<MetaSource>('auto')
  const [manualId,     setManualId]     = useState('')
  const [metaFile,     setMetaFile]     = useState<File | null>(null)
  const [errorMsg,     setErrorMsg]     = useState('')
  const [metaInfo,     setMetaInfo]     = useState<{ owner: string; mediaId: string } | null>(null)
  const [autoMeta,     setAutoMeta]     = useState<string | null>(null)
  const [autoLooking,  setAutoLooking]  = useState(false)
  const [autoFound,    setAutoFound]    = useState<boolean | null>(null)
  const [history,      setHistory]      = useState<HistoryItem[]>([])
  const [historyOpen,  setHistoryOpen]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const metaInputRef = useRef<HTMLInputElement>(null)

  // Pull the user's encode history once they're logged in.  Used to power
  // the "Specific ID / History" combobox so they can search past encodes
  // by media_id and pick from the list — no need to remember the raw ID.
  useEffect(() => {
    if (!token) { setHistory([]); return }
    let cancelled = false
    authedFetch(`${API_BASE}/me/media`)
      .then(r => r.ok ? r.json() as Promise<{ items: HistoryItem[] }> : null)
      .then(d => { if (!cancelled && d) setHistory(d.items ?? []) })
      .catch(() => { /* silent — history is best-effort */ })
    return () => { cancelled = true }
  }, [token])

  // Filtered list shown below the input — newest first, capped at 20 rows.
  const filteredHistory = useMemo(() => {
    const q = manualId.trim().toLowerCase()
    if (!q) return history.slice(0, 20)
    return history.filter(h =>
      h.id.toLowerCase().includes(q) ||
      (h.media ?? '').toLowerCase().includes(q)
    ).slice(0, 20)
  }, [history, manualId])

  // Pull owner + media id out of whichever metadata source the user picked,
  // so we can surface them before they click Verify.
  useEffect(() => {
    const extract = (raw: string): { owner: string; mediaId: string } | null => {
      try {
        const obj = JSON.parse(raw) as Record<string, unknown>
        const pick = (...keys: string[]) => {
          for (const k of keys) {
            const v = obj[k]
            if (typeof v === 'string' && v.trim()) return v
            if (typeof v === 'number') return String(v)
          }
          return ''
        }
        return {
          // `owner_email` first: since the short_id change, `owner_id` holds
          // the 8-char tag that was embedded, not a readable address.
          owner:   pick('owner_email', 'owner', 'owner_id', 'ownerId'),
          mediaId: pick('media', 'media_id', 'mediaId', 'id'),
        }
      } catch { return null }
    }

    let cancelled = false
    const run = async () => {
      if (metaSource === 'file') {
        if (!metaFile) { setMetaInfo(null); return }
        try {
          const text = await metaFile.text()
          if (!cancelled) setMetaInfo(extract(text))
        } catch { if (!cancelled) setMetaInfo(null) }
        return
      }
      if (metaSource !== 'id') { setMetaInfo(null); return }
      const id = manualId.trim()
      if (!id) { setMetaInfo(null); return }
      // Prefer the in-memory server history (covers cross-device encodes),
      // fall back to localStorage (covers offline / different browser).
      const fromHistory = history.find(h => h.id === id)
      if (fromHistory) { setMetaInfo(extract(JSON.stringify(fromHistory.metadata))); return }
      const raw = localStorage.getItem(`wm_meta_${id}`)
      setMetaInfo(raw ? extract(raw) : null)
    }
    run()
    return () => { cancelled = true }
  }, [metaSource, manualId, metaFile, history])

  // Real elapsed-time tick + step-label hint cycle while the request is
  // in-flight.  `progress` now stores elapsed seconds (not a fake percent).
  useEffect(() => {
    if (stage !== 'verifying') return
    const started = Date.now()
    setStepIdx(0)
    setProgress(0)

    const tick = setInterval(() => {
      setProgress(Math.floor((Date.now() - started) / 1000))
    }, 1000)

    const cycle = setInterval(() => {
      setStepIdx(i => (i + 1) % VERIFY_STEPS.length)
    }, 1500)

    return () => { clearInterval(tick); clearInterval(cycle) }
  }, [stage])

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStage('preview')
    if (metaSource === 'auto') lookupFromDb(f)
  }

  useEffect(() => {
    if (metaSource === 'auto' && file) lookupFromDb(file)
  }, [metaSource])

  const lookupFromDb = async (f: File) => {
    setAutoLooking(true)
    setAutoFound(null)
    setAutoMeta(null)
    setMetaInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch(`${API_BASE}/lookup`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('not found')
      const data = await res.json() as { metadata: Record<string, unknown>; owner?: string; media?: string }
      const metaStr = JSON.stringify(data.metadata)
      setAutoMeta(metaStr)
      setAutoFound(true)
      setMetaInfo({
        owner: data.owner ?? (data.metadata.owner as string) ?? '',
        mediaId: data.media ?? (data.metadata.media as string) ?? '',
      })
    } catch {
      setAutoFound(false)
      setAutoMeta(null)
    } finally {
      setAutoLooking(false)
    }
  }

  const onDrop     = useCallback((e: React.DragEvent) => { e.preventDefault(); setStage('idle'); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [])
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setStage('dragging') }

  const resolveMetadata = async (): Promise<string> => {
    if (metaSource === 'auto') {
      if (autoLooking) throw new Error('Still searching database, please wait...')
      if (!autoMeta) throw new Error('No matching record found in database. Try manual options instead.')
      return autoMeta
    }
    if (metaSource === 'file') {
      if (!metaFile) throw new Error('Please attach a metadata.json file.')
      const text = await metaFile.text()
      JSON.parse(text)
      return text
    }
    // metaSource === 'id' — either picked from history, or pasted directly.
    const id = manualId.trim()
    if (!id) throw new Error('Pick an entry from your history or paste an encode ID.')
    const fromHistory = history.find(h => h.id === id)
    if (fromHistory) return JSON.stringify(fromHistory.metadata)
    const raw = localStorage.getItem(`wm_meta_${id}`)
    if (!raw) throw new Error(`No metadata stored for ID "${id}". Try the file fallback.`)
    return raw
  }

  const startVerify = async () => {
    if (!file) return
    setErrorMsg('')

    let metadataJson: string
    try {
      metadataJson = await resolveMetadata()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      return
    }

    setStage('verifying')

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('metadata', metadataJson)

      // authedFetch, not fetch: /verify stays public, but sending the token
      // when we have one lets the backend record the run to the user's
      // verification history. Signed out, this behaves exactly as before.
      const res = await authedFetch(`${API_BASE}/verify`, { method: 'POST', body: fd })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Server returned ${res.status}: ${text || res.statusText}`)
      }
      const raw = await res.json() as Partial<AnalysisResult>
      const data: AnalysisResult = {
        status: raw.status ?? 'tampered',
        wmAccuracy: raw.wmAccuracy ?? 0,
        ber: raw.ber ?? 0,
        blockFlagRatio: raw.blockFlagRatio,
        reasons: raw.reasons,
        tamperedRegions: raw.tamperedRegions ?? [],
        frameResults: raw.frameResults,
        fileName: raw.fileName ?? file.name,
        fileType: raw.fileType ?? (file.type.startsWith('video/') ? 'video' : 'image'),
        watermarkFound: raw.watermarkFound,
        ownerMatch: raw.ownerMatch,
        mediaMatch: raw.mediaMatch,
        framesChecked: raw.framesChecked,
        frameTamperRate: raw.frameTamperRate,
        imageWidth: raw.imageWidth,
        imageHeight: raw.imageHeight,
        missingFrames: raw.missingFrames,
        framesDeleted: raw.framesDeleted,
        reordered: raw.reordered,
        duplicateFrames: raw.duplicateFrames,
        framesTruncated: raw.framesTruncated,
        // No `?? metaInfo` fallback here: these are what the decoder pulled
        // out of the pixels. Falling back to the supplied metadata would make
        // an unrecoverable watermark look like a successfully recovered one.
        ownerId:    raw.ownerId,
        mediaId:    raw.mediaId,
        ownerLabel: metaInfo?.owner,
        mediaLabel: metaInfo?.mediaId,
        watermarkOriginal: raw.watermarkOriginal,
        watermarkExtracted: raw.watermarkExtracted,
      }
      setProgress(100)
      setStepIdx(VERIFY_STEPS.length - 1)
      onComplete(data)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed')
      setStage('error')
    }
  }

  const reset = () => {
    setFile(null); setPreview(null); setStage('idle')
    setProgress(0); setStepIdx(0); setErrorMsg('')
    setAutoMeta(null); setAutoFound(null); setAutoLooking(false)
  }

  return (
    <div className="page pb-8">

      {/* ── Header ── */}
      <header className="pt-16 pb-12 max-w-2xl">
        <span className="pill-accent mb-5">
          <Icon icon="lucide:scan-search" width="13" />
          Step 2 — integrity verification
        </span>
        <h1 className="page-title mb-4">Verify integrity</h1>
        <p className="page-lead">
          Upload your watermarked image or video. We'll extract the embedded payload and
          compare per-sub-block parity to detect exactly where and when any malicious
          tampering occurred.
        </p>
      </header>

      {/* ── Progress rail ── */}
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5 pb-12 mb-12 border-b border-line">
        {[
          { n: '01', title: 'Upload media',     desc: 'The previously protected file' },
          { n: '02', title: 'Extract & verify', desc: 'Decoder checks pixel regions' },
          { n: '03', title: 'Review report',    desc: 'View localized tampering data' },
        ].map(s => (
          <li key={s.n} className="flex items-start gap-3.5">
            <span className="font-mono text-2xs text-accent pt-0.5">{s.n}</span>
            <div>
              <div className="text-base font-medium text-ink-hi">{s.title}</div>
              <div className="text-sm text-ink-lo">{s.desc}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_296px] gap-6 items-start">

        {/* ── Main area ── */}
        <div className="min-w-0">

          {stage === 'verifying' ? (
            /* ── VERIFYING ── */
            <div className="card p-12 flex flex-col items-center gap-6 text-center">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-line border-t-accent animate-spin" />
                <span className="absolute inset-2.5 rounded-full border-2 border-line border-b-accent/50 animate-spin-slow" />
              </div>

              <div>
                <h2 className="font-display text-2xl text-ink-hi mb-1.5">Analyzing media</h2>
                <p className="text-base text-accent font-mono min-h-[24px]">{VERIFY_STEPS[stepIdx]}</p>
              </div>

              {/* Indeterminate progress bar + real elapsed clock. */}
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-2xs mb-2">
                  <span className="label">Working</span>
                  <span className="font-mono text-ink-hi">
                    {String(Math.floor(progress / 60)).padStart(2, '0')}:{String(progress % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full w-2/5 bg-accent rounded-full animate-indeterminate" />
                </div>
              </div>

              <ol className="flex flex-col gap-2.5 w-full max-w-sm mt-4 pt-6 border-t border-line text-left">
                {VERIFY_STEPS.map((s, i) => (
                  <li key={s} className={`flex items-center gap-3 text-sm transition-colors duration-300
                    ${i === stepIdx ? 'text-ink-hi' : 'text-ink-faint'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300
                      ${i === stepIdx ? 'bg-accent' : 'bg-white/15'}`} />
                    {s}
                  </li>
                ))}
              </ol>
            </div>

          ) : stage === 'error' ? (
            /* ── ERROR ── */
            <div className="card border-alert-line p-10 flex flex-col items-center text-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-alert-soft border border-alert-line text-alert
                               flex items-center justify-center">
                <Icon icon="lucide:alert-octagon" width="22" />
              </span>
              <div>
                <h2 className="font-display text-xl text-ink-hi mb-1.5">Verification failed</h2>
                <p className="text-sm text-ink-lo max-w-md break-words font-mono">{errorMsg || 'Unknown error'}</p>
              </div>
              <button onClick={reset} className="btn-ghost">Try again</button>
            </div>

          ) : stage === 'preview' && file ? (
            /* ── PREVIEW ── */
            <div className="card overflow-hidden animate-fade-up">
              <div className="card-strip border-b flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <Icon icon="lucide:file-search" className="text-ink-lo shrink-0" width="17" />
                  <span className="text-base font-medium text-ink-hi truncate">{file.name}</span>
                  <span className="badge-neutral">{file.type.startsWith('video/') ? 'Video' : 'Image'}</span>
                  <span className="meta">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button onClick={reset} className="btn-quiet btn-sm shrink-0 hover:text-alert">
                  <Icon icon="lucide:x" width="14" /> Remove
                </button>
              </div>

              <div className="bg-surface-inset p-6 flex justify-center border-b border-line">
                {preview && (
                  file.type.startsWith('video/')
                    ? <video className="w-full max-h-[380px] object-contain rounded-lg" src={preview} controls />
                    : <img   className="w-full max-h-[380px] object-contain rounded-lg" src={preview} alt="preview" />
                )}
              </div>

              {/* ── Metadata source ── */}
              <div className="p-6 border-b border-line">
                <p className="label mb-3">Encode metadata source</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {[
                    { k: 'auto' as const, label: 'Auto (database)' },
                    { k: 'id'   as const, label: 'Specific ID / history' },
                    { k: 'file' as const, label: 'Upload JSON' },
                  ].map(o => (
                    <button
                      key={o.k}
                      type="button"
                      onClick={() => setMetaSource(o.k)}
                      className={`segment ${metaSource === o.k ? 'segment-on' : ''}`}>
                      {o.label}
                    </button>
                  ))}
                </div>

                {metaSource === 'auto' && (
                  <>
                    {autoLooking ? (
                      <p className="text-sm text-warn flex items-center gap-2">
                        <Icon icon="lucide:loader-2" width="14" className="animate-spin" />
                        Searching database for matching record...
                      </p>
                    ) : autoFound === true ? (
                      <div className="callout-ok">
                        <Icon icon="lucide:database" width="15" className="text-ok shrink-0 mt-0.5" />
                        <div>
                          <p className="text-ok font-medium mb-1">Record found in database</p>
                          {metaInfo && (
                            <p className="text-ink-lo font-mono text-xs break-all">
                              owner <span className="text-ink-hi">{metaInfo.owner || '—'}</span>
                              {' · '}media <span className="text-ink-hi">{metaInfo.mediaId || '—'}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : autoFound === false ? (
                      <div className="callout-warn">
                        <Icon icon="lucide:alert-triangle" width="15" className="text-warn shrink-0 mt-0.5" />
                        <div>
                          <p className="text-warn font-medium mb-1">No matching record found</p>
                          <p className="text-ink-lo">
                            This file may not be in the database. Try{' '}
                            <strong className="text-ink-hi font-medium">Specific ID</strong> or{' '}
                            <strong className="text-ink-hi font-medium">Upload JSON</strong> instead.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-ink-lo">
                        Upload a file above — we'll automatically search the database for its metadata.
                      </p>
                    )}
                  </>
                )}

                {metaSource === 'id' && (
                  <div className="relative">
                    <input
                      type="text"
                      value={manualId}
                      onChange={e => { setManualId(e.target.value); setHistoryOpen(true) }}
                      onFocus={() => setHistoryOpen(true)}
                      onBlur={() => setTimeout(() => setHistoryOpen(false), 150)}
                      placeholder={token
                        ? 'Search your encode history or paste an ID...'
                        : 'Encode ID (e.g. abc123)'}
                      className="input font-mono"
                    />

                    {/* Searchable history dropdown — only when logged in and
                        there's something to show.  Click an item to fill the
                        input with its encode ID. */}
                    {historyOpen && token && filteredHistory.length > 0 && (
                      <ul className="absolute z-20 inset-x-0 mt-2 bg-surface-raised border border-line-strong
                                     rounded-xl shadow-lift overflow-auto max-h-[280px] scrollbar-dark">
                        {filteredHistory.map(h => {
                          const selected = manualId.trim() === h.id
                          return (
                            <li
                              key={h.id}
                              onMouseDown={e => {
                                e.preventDefault()        // keep focus on input
                                setManualId(h.id)
                                setHistoryOpen(false)
                              }}
                              className={`px-4 py-3 cursor-pointer flex items-center gap-3 border-b border-line
                                          last:border-b-0 transition-colors
                                ${selected ? 'bg-accent-soft' : 'hover:bg-white/[0.04]'}`}>
                              <Icon icon={h.kind === 'video' ? 'lucide:video' : 'lucide:image'}
                                    width="15" className="text-ink-lo shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-ink-hi truncate">
                                  {h.media || <span className="text-ink-faint">— no media id —</span>}
                                </div>
                                <div className="meta truncate">
                                  {h.id}{h.created_at ? ` · ${new Date(h.created_at).toLocaleDateString()}` : ''}
                                </div>
                              </div>
                              {selected && <Icon icon="lucide:check" width="14" className="text-accent shrink-0" />}
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    {token && history.length === 0 && (
                      <p className="mt-2 text-xs text-ink-lo">
                        Your encode history is empty — paste an encode ID directly.
                      </p>
                    )}

                    {!token && (
                      <p className="mt-2 text-xs text-ink-lo">
                        Sign in to browse your encode history, or paste an ID directly.
                      </p>
                    )}
                  </div>
                )}

                {metaSource === 'file' && (
                  <>
                    <input
                      ref={metaInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={e => setMetaFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      onClick={() => metaInputRef.current?.click()}
                      className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-line-strong
                                 hover:border-accent-line hover:bg-white/[0.02] transition-colors
                                 text-base flex items-center gap-3">
                      <Icon icon="lucide:file-json" width="17" className="text-accent shrink-0" />
                      {metaFile
                        ? <span className="font-mono text-ink-hi truncate">{metaFile.name}</span>
                        : <span className="text-ink-faint">Choose metadata.json…</span>}
                    </button>
                  </>
                )}
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="callout-warn">
                  <Icon icon="lucide:alert-triangle" className="text-warn shrink-0 mt-0.5" width="16" />
                  <p>
                    Make sure this file was previously watermarked using our{' '}
                    <strong className="text-ink-hi font-medium">Encode</strong> suite. Verifying an
                    unprotected, standard file will always return a{' '}
                    <strong className="text-alert font-medium">tampered</strong> result.
                  </p>
                </div>

                {errorMsg && (
                  <div className="callout-alert">
                    <Icon icon="lucide:alert-circle" width="15" className="text-alert shrink-0 mt-0.5" />
                    {errorMsg}
                  </div>
                )}

                <button onClick={startVerify} className="btn-primary btn-lg btn-block">
                  <Icon icon="lucide:scan" width="17" />
                  Run integrity verification
                </button>
              </div>
            </div>

          ) : (
            /* ── DROP ZONE ── */
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={() => setStage('idle')}
              className={`rounded-2xl border border-dashed p-16 text-center cursor-pointer group
                          transition-colors duration-200
                ${stage === 'dragging'
                  ? 'border-accent bg-accent-soft'
                  : 'border-line-strong bg-surface hover:border-accent-line hover:bg-surface-raised'}`}>

              <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />

              <span className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6
                                transition-colors duration-200
                ${stage === 'dragging'
                  ? 'bg-accent-soft text-accent'
                  : 'bg-white/[0.04] text-ink-lo group-hover:text-accent'}`}>
                <Icon icon="lucide:file-search" width="30" strokeWidth="1.5" />
              </span>

              <h2 className="font-display text-2xl text-ink-hi mb-2">Select or drop file</h2>
              <p className="text-base text-ink-lo mb-6">Upload a watermarked file to run analysis</p>

              <div className="flex gap-1.5 justify-center flex-wrap mb-4">
                {['JPG','PNG','MP4','AVI','MOV'].map(t => (
                  <span key={t} className="badge-neutral">{t}</span>
                ))}
              </div>
              <p className="meta">Max file size 100 MB</p>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="flex flex-col gap-4">

          <section className="card p-5">
            <h3 className="text-base font-medium text-ink-hi flex items-center gap-2 mb-4">
              <Icon icon="lucide:target" className="text-alert" width="16" />
              What we detect
            </h3>
            <ul className="flex flex-col gap-3">
              {DETECT_ITEMS.map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-ink-lo">
                  <span className="w-1 h-1 rounded-full bg-alert shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h3 className="text-base font-medium text-ink-hi flex items-center gap-2 mb-4">
              <Icon icon="lucide:file-text" className="text-accent" width="16" />
              What you get back
            </h3>
            <ul className="flex flex-col gap-3.5">
              {REPORT_ITEMS.map(item => (
                <li key={item.text} className="flex items-start gap-3 text-sm text-ink-lo leading-relaxed">
                  <Icon icon={item.icon} className="text-ink-faint shrink-0 mt-0.5" width="15" />
                  {item.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h3 className="text-base font-medium text-ok flex items-center gap-2 mb-3">
              <Icon icon="lucide:lock" width="15" />
              Privacy notice
            </h3>
            <p className="text-sm text-ink-lo leading-relaxed">
              Files you upload here are used only to produce this report, and are deleted from
              the server as soon as it has been generated — including if the analysis fails.
            </p>
            <p className="text-sm text-ink-lo leading-relaxed mt-3">
              Watermarked files you create in{' '}
              <strong className="text-ink-hi font-medium">Encode</strong> are kept, so you can
              re-download them from your Dashboard.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
