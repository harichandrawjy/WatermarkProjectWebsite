import { useState, useRef, useCallback, useEffect } from 'react'
import type { Page } from '../App'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'

interface EncodeProps {
  navigate: (p: Page) => void
}

type Stage = 'idle' | 'dragging' | 'preview' | 'encoding' | 'done' | 'error'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** Mirrors MEDIA_ID_BYTES in the watermark engine — the fixed slot the media
 *  id is embedded into. The backend enforces this too; this is only so the
 *  user finds out before uploading rather than after. */
const MEDIA_ID_BYTES = 8

const ENCODE_STEPS = [
  'Reading media file...',
  'Building BCH(15,7) payload...',
  'Applying 2-level LWT to Y channel...',
  'Running 8x8 block DCT + SVD...',
  'Embedding bits via QIM on S₀...',
  'Embedding SHA-256 parity in Cb LSBs...',
  'Finalizing watermarked output...',
]

const SIDEBAR_FACTS = [
  { icon: 'lucide:eye-off',        text: 'Watermark is mathematically invisible to the human eye.' },
  { icon: 'lucide:file-archive',   text: 'Survives normal compression, resizing, and web sharing.' },
  { icon: 'lucide:alert-triangle', text: 'Fractures when pixels are maliciously altered or deepfaked.' },
  { icon: 'lucide:bar-chart-2',    text: 'Maintains PSNR visual quality securely above 28 dB.' },
]

const USE_CASES = [
  'Insurance claim photos',
  'Medical imaging',
  'Police bodycam footage',
  'Official documents',
  'News photography',
]

interface EncodeResponse {
  id: string
  kind: 'image' | 'video'
  watermarked_url: string
  metadata_url: string
  metadata: Record<string, unknown>
  psnr_db: number
}

export default function Encode({ navigate }: EncodeProps) {
  const { user, token, loading: authLoading, authedFetch } = useAuth()
  const [stage,       setStage]      = useState<Stage>('idle')
  const [file,        setFile]       = useState<File | null>(null)
  const [preview,     setPreview]    = useState<string | null>(null)
  const [stepIdx,     setStepIdx]    = useState(0)
  const [progress,    setProgress]   = useState(0)
  const [wmPreview,   setWmPreview]  = useState<string | null>(null)
  const [psnr,        setPsnr]       = useState(0)
  const [mediaId,     setMediaId]    = useState('')
  // The engine embeds media_id into a fixed 8-BYTE slot. Anything longer used
  // to be silently truncated — "foto_jokowi" became "foto_jok" with no warning,
  // and the verify screen then showed an "extracted" value that looked wrong.
  // Constraining the input means what you type is what lands in the pixels.
  const mediaBytes = new TextEncoder().encode(mediaId).length
  const [encodedId,   setEncodedId]  = useState<string | null>(null)
  const [encodedKind, setEncodedKind] = useState<'image' | 'video'>('image')
  // The 8-char owner tag the backend assigned and embedded in the pixels —
  // not the email, which is too long to fit the watermark's owner slot.
  const [ownerTag,    setOwnerTag]   = useState<string | null>(null)
  const [errorMsg,    setErrorMsg]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStage('preview')
  }

  const onDrop     = useCallback((e: React.DragEvent) => { e.preventDefault(); setStage('idle'); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [])
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setStage('dragging') }

  // Real elapsed-time tick + step-label hint cycle while the request is
  // in-flight.  We do NOT fake a "% done" — the backend doesn't stream
  // progress, so anything more precise than "still working" would be a lie.
  // `progress` here is repurposed as elapsed seconds (used only by display).
  useEffect(() => {
    if (stage !== 'encoding') return
    const started = Date.now()
    setStepIdx(0)
    setProgress(0)

    const tick = setInterval(() => {
      setProgress(Math.floor((Date.now() - started) / 1000))
    }, 1000)

    // Cycle the step labels every ~1.5s so the user sees the conceptual
    // pipeline.  Labels are hints, not commitments — we never mark earlier
    // ones "done" until the response actually arrives.
    const cycle = setInterval(() => {
      setStepIdx(i => (i + 1) % ENCODE_STEPS.length)
    }, 1500)

    return () => { clearInterval(tick); clearInterval(cycle) }
  }, [stage])

  const startEncoding = async () => {
    if (!file) return
    if (!token) {
      setErrorMsg('You must be signed in to encode.')
      return
    }
    if (!mediaId.trim()) {
      setErrorMsg('Media ID is required.')
      return
    }
    setErrorMsg('')
    setStage('encoding')

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('media_id', mediaId.trim())

      const res = await authedFetch(`${API_BASE}/encode`, {
        method: 'POST',
        body:   fd,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Server returned ${res.status}: ${text || res.statusText}`)
      }
      const data: EncodeResponse = await res.json()

      localStorage.setItem(`wm_meta_${data.id}`, JSON.stringify(data.metadata))
      localStorage.setItem('wm_last_id', data.id)

      setWmPreview(`${API_BASE}${data.watermarked_url}`)
      setPsnr(data.psnr_db)
      setEncodedId(data.id)
      setEncodedKind(data.kind)
      const tag = (data.metadata as { owner_id?: unknown })?.owner_id
      setOwnerTag(typeof tag === 'string' ? tag : null)
      setProgress(100)
      setStepIdx(ENCODE_STEPS.length - 1)
      setStage('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Encoding failed')
      setStage('error')
    }
  }

  const handleDownload = async () => {
    if (!wmPreview || !file) return
    const res = await fetch(wmPreview)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const ext = encodedKind === 'video' ? 'mkv' : 'png'
    const base = file.name.replace(/\.[^.]+$/, '')
    const a = document.createElement('a')
    a.href = url
    a.download = `watermarked_${base}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadMeta = () => {
    if (!encodedId) return
    const raw = localStorage.getItem(`wm_meta_${encodedId}`)
    if (!raw) return
    const blob = new Blob([raw], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `metadata_${encodedId}.json`
    a.click()
  }

  const reset = () => {
    setFile(null); setPreview(null); setWmPreview(null)
    setStage('idle'); setProgress(0); setStepIdx(0); setPsnr(0)
    setEncodedId(null); setOwnerTag(null); setErrorMsg('')
  }

  // Sign-in gate: encode now requires an authenticated user so we can tie
  // the watermark to a real account instead of a free-text owner string.
  if (authLoading) {
    return (
      <div className="page-narrow pt-24 pb-32 flex items-center justify-center gap-3 text-base text-ink-lo">
        <Icon icon="lucide:loader-2" width="18" className="animate-spin" /> Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page-narrow pt-24 pb-32 text-center">
        <span className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent-line text-accent
                         flex items-center justify-center mx-auto mb-6">
          <Icon icon="lucide:lock" width="24" />
        </span>
        <h1 className="font-display text-2xl text-ink-hi mb-3">Sign in to encode</h1>
        <p className="text-base text-ink-lo leading-relaxed mb-8">
          Encoding ties each watermark to your account so ownership can be verified later.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('login')} className="btn-primary">
            <Icon icon="lucide:log-in" width="16" /> Sign in
          </button>
          <button onClick={() => navigate('register')} className="btn-ghost">
            <Icon icon="lucide:user-plus" width="16" /> Create account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page pb-8">

      {/* ── Header ── */}
      <header className="pt-16 pb-12 max-w-2xl">
        <span className="pill-accent mb-5">
          <Icon icon="lucide:layers" width="13" />
          Step 1 — watermark embedding
        </span>
        <h1 className="page-title mb-4">Encode watermark</h1>
        <p className="page-lead">
          Upload your original image or video. We'll embed an invisible semi-fragile
          watermark so any future tampering can be detected and localized.
        </p>
      </header>

      {/* ── Progress rail ── */}
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5 pb-12 mb-12 border-b border-line">
        {[
          { n: '01', title: 'Upload original', desc: 'Your clean, unmodified media' },
          { n: '02', title: 'Embed watermark', desc: 'LWT + DCT + SVD with QIM payload' },
          { n: '03', title: 'Download secure', desc: 'Use or share the protected file' },
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

          {/* ── DONE ── */}
          {stage === 'done' && wmPreview && file ? (
            <div className="card overflow-hidden animate-fade-up">

              <div className="card-strip border-b flex items-center gap-3.5 px-6 py-4">
                <span className="w-9 h-9 rounded-lg bg-ok-soft border border-ok-line text-ok
                                 flex items-center justify-center shrink-0">
                  <Icon icon="lucide:check" width="18" strokeWidth="2.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-medium text-ink-hi">Watermark embedded</p>
                  <p className="text-xs text-ink-lo font-mono truncate">
                    psnr {psnr.toFixed(1)} dB · id {encodedId}
                    {ownerTag && <> · owner {ownerTag}</>}
                  </p>
                </div>
              </div>

              {/* Side-by-side preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line">
                <figure className="flex flex-col">
                  <figcaption className="label px-5 py-3 border-b border-line">Original</figcaption>
                  <div className="bg-surface-inset p-4 flex-1 flex items-center justify-center">
                    {file.type.startsWith('video/')
                      ? <video src={preview!} controls className="max-w-full max-h-[280px] object-contain rounded-lg" />
                      : <img src={preview!} alt="original" className="max-w-full max-h-[280px] object-contain rounded-lg" />}
                  </div>
                </figure>
                <figure className="flex flex-col">
                  <figcaption className="label px-5 py-3 border-b border-line flex items-center gap-2 text-accent">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Protected
                  </figcaption>
                  <div className="bg-surface-inset p-4 flex-1 flex items-center justify-center">
                    {encodedKind === 'video'
                      ? <video src={wmPreview} controls className="max-w-full max-h-[280px] object-contain rounded-lg" />
                      : <img src={wmPreview} alt="watermarked" className="max-w-full max-h-[280px] object-contain rounded-lg" />}
                  </div>
                </figure>
              </div>

              {/* Metadata row */}
              <dl className="grid grid-cols-3 divide-x divide-line border-y border-line card-strip">
                {[
                  { label: 'PSNR',      value: `${psnr.toFixed(1)} dB` },
                  { label: 'Watermark', value: 'Embedded' },
                  { label: 'File',      value: file.name.length > 16 ? file.name.slice(0, 13) + '…' : file.name },
                ].map(m => (
                  <div key={m.label} className="px-5 py-4">
                    <dt className="label mb-1.5">{m.label}</dt>
                    <dd className="text-base font-medium text-ink-hi truncate">{m.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="p-6 flex flex-col sm:flex-row gap-3">
                <button onClick={handleDownload} className="btn-primary btn-lg flex-1">
                  <Icon icon="lucide:download" width="17" />
                  Download protected file
                </button>
                <button onClick={handleDownloadMeta} className="btn-outline btn-lg">
                  <Icon icon="lucide:file-json" width="17" />
                  metadata.json
                </button>
                <button onClick={reset} className="btn-ghost btn-lg">
                  Encode another
                </button>
              </div>

              <div className="px-6 pb-6 flex flex-col gap-3">
                {/* Stated at the one moment the user still has the file. The
                    server keeps no copy — see the retention note in main.py —
                    so this is the download that counts. */}
                <div className="callout-warn">
                  <Icon icon="lucide:download" className="shrink-0 mt-0.5" width="16" />
                  <p>
                    <strong className="text-ink-hi font-medium">Download it now — this is your copy.</strong>{' '}
                    We don't keep your media on the server, only the metadata needed to verify it.
                    Your metadata stays available from the Dashboard; the file itself does not.
                  </p>
                </div>
                <div className="callout-accent">
                  <Icon icon="lucide:info" className="text-accent shrink-0 mt-0.5" width="16" />
                  <p>
                    <strong className="text-ink-hi font-medium">Keep the original safe.</strong>{' '}
                    Share or distribute this protected version. If it gets tampered with, upload it to the{' '}
                    <button type="button" onClick={() => navigate('verify')}
                            className="text-accent font-medium hover:underline">Verify</button>{' '}
                    page to detect and localize modifications.
                  </p>
                </div>
              </div>
            </div>

          ) : stage === 'encoding' ? (
            /* ── ENCODING ── */
            <div className="card p-12 flex flex-col items-center gap-6 text-center">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-line border-t-accent animate-spin" />
                <span className="absolute inset-2.5 rounded-full border-2 border-line border-b-accent/50 animate-spin-slow" />
              </div>

              <div>
                <h2 className="font-display text-2xl text-ink-hi mb-1.5">Embedding watermark</h2>
                <p className="text-base text-accent font-mono min-h-[24px]">{ENCODE_STEPS[stepIdx]}</p>
              </div>

              {/* Indeterminate progress: real backend timing isn't streamed,
                  so we show an honest moving stripe + elapsed seconds rather
                  than a fake percentage that lies about progress. */}
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
                {ENCODE_STEPS.map((s, i) => (
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
                <h2 className="font-display text-xl text-ink-hi mb-1.5">Encoding failed</h2>
                <p className="text-sm text-ink-lo max-w-md break-words font-mono">{errorMsg || 'Unknown error'}</p>
              </div>
              <button onClick={reset} className="btn-ghost">Try again</button>
            </div>

          ) : stage === 'preview' && file ? (
            /* ── PREVIEW ── */
            <div className="card overflow-hidden animate-fade-up">
              <div className="card-strip border-b flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <Icon icon="lucide:file-image" className="text-ink-lo shrink-0" width="17" />
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

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-line">
                <div className="field">
                  <div className="flex items-baseline justify-between">
                    <label className="label">Owner</label>
                    {/* Shown before encoding, not after: this tag is what the
                        decoder reports back on the Results page, so seeing it
                        here first stops it reading as a decoding error. */}
                    {user?.short_id && (
                      <span className="text-xs text-ink-faint">
                        Owner ID <span className="font-mono text-ink-lo">{user.short_id}</span>
                      </span>
                    )}
                  </div>
                  <div className="input-static">
                    <Icon icon="lucide:lock" width="14" className="text-accent shrink-0" />
                    <span className="font-mono truncate">{user?.email ?? '—'}</span>
                  </div>
                  <p className="text-xs text-ink-faint mt-1.5">
                    {user?.short_id
                      ? <>Your files carry <span className="font-mono">{user.short_id}</span>, not your email — the slot is 8 bytes.</>
                      : 'Derived from your account and embedded automatically.'}
                  </p>
                </div>
                <div className="field">
                  <div className="flex items-baseline justify-between">
                    <label className="label" htmlFor="media-id">Media ID</label>
                    {/* Byte count, not character count: the watermark slot is 8
                        BYTES, and one non-ASCII character can occupy up to 4 of
                        them. maxLength alone would let "文件測試" through at
                        4 characters and 12 bytes. */}
                    <span className={`text-xs font-mono ${mediaBytes > MEDIA_ID_BYTES ? 'text-alert' : 'text-ink-faint'}`}>
                      {mediaBytes}/{MEDIA_ID_BYTES}
                    </span>
                  </div>
                  <input
                    id="media-id"
                    type="text"
                    value={mediaId}
                    onChange={e => setMediaId(e.target.value)}
                    maxLength={MEDIA_ID_BYTES}
                    placeholder="img_001"
                    className="input font-mono"
                  />
                  <p className="text-xs text-ink-faint mt-1.5">
                    Up to {MEDIA_ID_BYTES} characters — this is embedded in the file exactly as typed.
                  </p>
                </div>
                {errorMsg && (
                  <p className="sm:col-span-2 text-sm text-alert flex items-center gap-2">
                    <Icon icon="lucide:alert-circle" width="14" /> {errorMsg}
                  </p>
                )}
              </div>

              <div className="p-6">
                <button onClick={startEncoding} className="btn-primary btn-lg btn-block">
                  <Icon icon="lucide:layers" width="17" />
                  Initialize encoder
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
                <Icon icon="lucide:upload-cloud" width="30" strokeWidth="1.5" />
              </span>

              <h2 className="font-display text-2xl text-ink-hi mb-2">Select or drop media</h2>
              <p className="text-base text-ink-lo mb-6">Upload a clean file to begin the encoding process</p>

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
              <Icon icon="lucide:shield-check" className="text-accent" width="16" />
              What happens next?
            </h3>
            <ul className="flex flex-col gap-3.5">
              {SIDEBAR_FACTS.map(item => (
                <li key={item.text} className="flex items-start gap-3 text-sm text-ink-lo leading-relaxed">
                  <Icon icon={item.icon} className="text-ink-faint shrink-0 mt-0.5" width="15" />
                  {item.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="card border-accent-line bg-accent-soft p-5">
            <h3 className="text-base font-medium text-accent mb-2">Post-processing</h3>
            <p className="text-sm text-ink leading-relaxed mb-4">
              After downloading the watermarked file, distribute it freely. If you suspect it
              gets manipulated later, upload it to the{' '}
              <strong className="text-ink-hi font-medium">Verify</strong> suite to run spatial analysis.
            </p>
            <button onClick={() => navigate('verify')}
                    className="text-sm font-semibold text-accent hover:text-accent-hover flex items-center gap-1.5 transition-colors">
              Go to Verify <Icon icon="lucide:arrow-right" width="14" />
            </button>
          </section>

          <section className="card p-5">
            <h3 className="text-base font-medium text-ink-hi mb-4">Common use cases</h3>
            <ul className="flex flex-col gap-2.5">
              {USE_CASES.map(u => (
                <li key={u} className="flex items-center gap-2.5 text-sm text-ink-lo">
                  <span className="w-1 h-1 rounded-full bg-ink-faint shrink-0" />{u}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
