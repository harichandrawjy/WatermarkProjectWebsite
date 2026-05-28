import { useState, useRef, useCallback, useEffect } from 'react'
import type { Page } from '../App'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/auth'

interface EncodeProps {
  navigate: (p: Page) => void
}

type Stage = 'idle' | 'dragging' | 'preview' | 'encoding' | 'done' | 'error'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const ENCODE_STEPS = [
  'Reading media file...',
  'Generating watermark payload...',
  'Running HIDDeN encoder...',
  'Applying attention bottleneck...',
  'Embedding semi-fragile layer...',
  'Finalizing watermarked output...',
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
  const [encodedId,   setEncodedId]  = useState<string | null>(null)
  const [encodedKind, setEncodedKind] = useState<'image' | 'video'>('image')
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

  // Animate the step indicator on a loop while the request is in-flight.
  useEffect(() => {
    if (stage !== 'encoding') return
    let i = 0
    setStepIdx(0)
    setProgress(5)
    const t = setInterval(() => {
      i = Math.min(i + 1, ENCODE_STEPS.length - 1)
      setStepIdx(i)
      setProgress(p => Math.min(p + 12, 92))
    }, 600)
    return () => clearInterval(t)
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
    setEncodedId(null); setErrorMsg('')
  }

  // Sign-in gate: encode now requires an authenticated user so we can tie
  // the watermark to a real account instead of a free-text owner string.
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-7 pt-24 pb-32 text-center text-slate-500 flex items-center justify-center gap-3">
        <Icon icon="lucide:loader-2" width="18" className="animate-spin" /> Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-7 pt-24 pb-32 text-center relative z-10">
        <div className="absolute top-[10%] left-[20%] w-[60%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-6">
          <Icon icon="lucide:lock" width="28" />
        </div>
        <h1 className="font-display text-[1.8rem] text-white font-medium mb-3">Sign in to encode</h1>
        <p className="text-slate-400 text-[14.5px] mb-8 leading-relaxed">
          Encoding ties each watermark to your account so ownership can be verified later.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('login')}
            className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-[14px] flex items-center gap-2">
            <Icon icon="lucide:log-in" width="16" /> Sign In
          </button>
          <button onClick={() => navigate('register')}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all text-[14px] flex items-center gap-2">
            <Icon icon="lucide:user-plus" width="16" /> Create Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto px-7 pb-20 relative z-10">

      {/* Background Ambient Glow */}
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center pt-16 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[12px] font-semibold rounded-full mb-5 backdrop-blur-md">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></svg>
          Step 1 — Watermark Embedding
        </div>
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] text-white font-normal mb-4 leading-tight tracking-tight">Encode Watermark</h1>
        <p className="text-slate-400 text-[1.05rem] max-w-lg mx-auto leading-relaxed">
          Upload your original image or video. We'll embed an invisible semi-fragile watermark
          so any future tampering can be detected and localized.
        </p>
      </div>

      {/* How it works strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { n: '01', title: 'Upload original', desc: 'Your clean, unmodified media' },
          { n: '02', title: 'Embed watermark', desc: 'HIDDeN adds invisible signal' },
          { n: '03', title: 'Download secure', desc: 'Use or share the protected file' },
        ].map((s, i) => (
          <div key={i} className="bg-[#111318]/80 backdrop-blur-sm border border-white/5 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-[12px] font-bold shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.1)]">{s.n}</div>
            <div>
              <div className="font-medium text-white text-[13.5px] mb-0.5">{s.title}</div>
              <div className="text-[12px] text-slate-400">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

        {/* Main area */}
        <div className="w-full">

          {/* ── DONE: show result ── */}
          {stage === 'done' && wmPreview && file ? (
            <div className="bg-[#111318] border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)]">

              {/* Success banner */}
              <div className="flex items-center gap-4 px-6 py-4 bg-emerald-500/10 border-b border-emerald-500/20">
                <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Icon icon="lucide:check" width="20" height="20" strokeWidth="3" />
                </div>
                <div>
                  <p className="font-semibold text-[14px] text-emerald-400">Watermark embedded successfully</p>
                  <p className="text-[12.5px] text-emerald-400/70">PSNR: {psnr.toFixed(1)} dB · ID: {encodedId}</p>
                </div>
              </div>

              {/* Side-by-side preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10">
                <div className="bg-[#0a0a0c] flex flex-col">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-5 py-3 border-b border-white/5 bg-[#111318]">Original</p>
                  <div className="p-4 flex-1 flex items-center justify-center">
                    {file.type.startsWith('video/')
                      ? <video src={preview!} controls className="max-w-full max-h-[300px] object-contain rounded-lg shadow-2xl" />
                      : <img src={preview!} alt="original" className="max-w-full max-h-[300px] object-contain rounded-lg shadow-2xl" />}
                  </div>
                </div>
                <div className="bg-[#0a0a0c] flex flex-col">
                  <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest px-5 py-3 border-b border-white/5 bg-[#111318] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                    Protected
                  </p>
                  <div className="p-4 flex-1 flex items-center justify-center">
                    {encodedKind === 'video'
                      ? <video src={wmPreview} controls className="max-w-full max-h-[300px] object-contain rounded-lg shadow-2xl" />
                      : <img src={wmPreview} alt="watermarked" className="max-w-full max-h-[300px] object-contain rounded-lg shadow-2xl" />}
                  </div>
                </div>
              </div>

              {/* Metadata row */}
              <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 bg-[#111318]">
                {[
                  { label: 'PSNR', value: `${psnr.toFixed(1)} dB` },
                  { label: 'Watermark', value: 'Embedded' },
                  { label: 'File', value: file.name.length > 15 ? file.name.slice(0, 12) + '…' : file.name },
                ].map((m, i) => (
                  <div key={i} className="px-5 py-4 text-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{m.label}</div>
                    <div className="font-medium text-[14px] text-white">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-white/5 bg-[#111318]">
                <button onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all text-[14.5px]">
                  <Icon icon="lucide:download" width="18" height="18" />
                  Download Protected File
                </button>
                <button onClick={handleDownloadMeta}
                  className="flex items-center justify-center gap-2 px-6 py-4 border border-cyan-500/30 text-cyan-400 font-medium rounded-xl hover:bg-cyan-500/10 transition-all text-[14.5px]">
                  <Icon icon="lucide:file-json" width="18" height="18" />
                  metadata.json
                </button>
                <button onClick={reset}
                  className="px-6 py-4 border border-white/10 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-[14.5px]">
                  Encode Another
                </button>
              </div>

              {/* Reminder */}
              <div className="mx-6 mb-6 px-5 py-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl flex items-start gap-3">
                <Icon icon="lucide:info" className="text-cyan-400 shrink-0 mt-0.5" width="18" height="18" />
                <p className="text-[13px] text-slate-300 leading-relaxed">
                  <strong className="text-white font-semibold">Keep the original safe.</strong> Share or distribute this protected version.
                  If it gets tampered with, upload it to the <button type="button" className="text-cyan-400 font-semibold cursor-pointer hover:underline" onClick={() => navigate('verify')}>Verify</button> page to detect and localize modifications.
                </p>
              </div>

            </div>

          ) : stage === 'encoding' ? (
            /* ── ENCODING progress ── */
            <div className="bg-[#111318] border border-white/5 rounded-3xl p-12 flex flex-col items-center gap-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

              <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                <div className="absolute inset-0 border-[3px] border-white/5 border-t-cyan-400 rounded-full animate-spin" />
                <div className="absolute inset-2 border-[3px] border-white/5 border-b-emerald-400 rounded-full animate-spin-slow opacity-70" />
              </div>

              <div>
                <h3 className="font-display text-[1.8rem] text-white font-normal mb-1">Embedding Watermark</h3>
                <p className="text-cyan-400 text-[14px] font-medium min-h-[20px]">{ENCODE_STEPS[stepIdx]}</p>
              </div>

              <div className="w-full max-w-sm mt-2">
                <div className="flex justify-between text-[12px] font-bold text-slate-400 mb-2">
                  <span>Processing...</span>
                  <span className="text-white">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-sm mt-6 text-left border-t border-white/5 pt-6">
                {ENCODE_STEPS.map((s, i) => {
                  const isDone = i < stepIdx;
                  const isCurrent = i === stepIdx;
                  return (
                    <div key={i} className={`flex items-center gap-3 text-[13px] transition-colors duration-300
                      ${isDone ? 'text-emerald-400' : isCurrent ? 'text-white font-medium' : 'text-slate-600'}`}>
                      <span className="w-5 shrink-0 flex justify-center">
                        {isDone ? <Icon icon="lucide:check-circle-2" width="16" /> :
                         isCurrent ? <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" /> :
                         <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                      </span>
                      {s}
                    </div>
                  )
                })}
              </div>
            </div>

          ) : stage === 'error' ? (
            /* ── ERROR ── */
            <div className="bg-[#111318] border border-rose-500/30 rounded-3xl p-10 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Icon icon="lucide:alert-octagon" width="24" />
              </div>
              <div>
                <h3 className="font-display text-[1.4rem] text-white mb-1">Encoding failed</h3>
                <p className="text-[13px] text-rose-300/80 max-w-md break-words">{errorMsg || 'Unknown error'}</p>
              </div>
              <button onClick={reset} className="px-6 py-3 border border-white/10 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-[14px]">
                Try Again
              </button>
            </div>

          ) : stage === 'preview' && file ? (
            /* ── PREVIEW before encoding ── */
            <div className="bg-[#111318] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 gap-3 bg-white/[0.02]">
                <div className="flex items-center gap-3 flex-wrap">
                  <Icon icon="lucide:file-image" className="text-slate-400" width="18" />
                  <span className="font-medium text-[14px] text-white">{file.name}</span>
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 text-[10px] uppercase tracking-widest font-bold rounded-md">
                    {file.type.startsWith('video/') ? 'Video' : 'Image'}
                  </span>
                  <span className="text-[12px] text-slate-500 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button onClick={reset}
                  className="text-[13px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
                  <Icon icon="lucide:x" width="14" /> Remove
                </button>
              </div>

              <div className="bg-[#0a0a0c] p-6 flex justify-center border-b border-white/5">
                {preview && (
                  file.type.startsWith('video/')
                    ? <video className="w-full max-h-[400px] object-contain rounded-lg border border-white/10 shadow-2xl" src={preview} controls />
                    : <img   className="w-full max-h-[400px] object-contain rounded-lg border border-white/10 shadow-2xl" src={preview} alt="preview" />
                )}
              </div>

              {/* Owner (from auth) + Media ID */}
              <div className="p-6 border-b border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Owner</label>
                  <div className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-slate-300 flex items-center gap-2">
                    <Icon icon="lucide:lock" width="14" className="text-cyan-400" />
                    <span className="font-mono truncate">{user?.email ?? '—'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Media ID</label>
                  <input
                    type="text"
                    value={mediaId}
                    onChange={e => setMediaId(e.target.value)}
                    placeholder="e.g. project-2026-001"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                {errorMsg && (
                  <div className="sm:col-span-2 text-[12.5px] text-rose-400 flex items-center gap-2">
                    <Icon icon="lucide:alert-circle" width="14" /> {errorMsg}
                  </div>
                )}
              </div>

              <div className="p-6">
                <button onClick={startEncoding}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all text-[15px]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></svg>
                  Initialize Encoder
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
              className={`border-[1.5px] border-dashed rounded-3xl p-20 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group
                ${stage === 'dragging'
                  ? 'border-cyan-400 bg-cyan-500/5 shadow-[0_0_30px_rgba(34,211,238,0.1)] scale-[1.01]'
                  : 'border-white/20 bg-[#111318] hover:border-cyan-500/50 hover:bg-white/[0.02]'}`}>

              <div className={`absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 ${stage === 'dragging' ? 'opacity-100' : 'group-hover:opacity-100'}`} />

              <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />

              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 relative z-10
                ${stage === 'dragging' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'bg-white/5 text-slate-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-400'}`}>
                <Icon icon="lucide:upload-cloud" width="36" height="36" strokeWidth="1.5" />
              </div>

              <h3 className="font-display text-[1.6rem] text-white font-normal mb-2 relative z-10">Select or drop media</h3>
              <p className="text-slate-400 text-[14px] mb-6 relative z-10">Upload a clean file to begin the encoding process</p>

              <div className="flex gap-2 justify-center flex-wrap mb-4 relative z-10">
                {['JPG','PNG','MP4','AVI','MOV'].map(t => (
                  <span key={t} className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold tracking-widest rounded-md uppercase">{t}</span>
                ))}
              </div>
              <p className="text-[12px] text-slate-500 font-mono relative z-10">Max file size: 100 MB</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-5 w-full">

          <div className="bg-[#111318] border border-white/5 rounded-3xl p-6 shadow-lg">
            <h4 className="font-medium text-[14px] mb-5 text-white flex items-center gap-2">
              <Icon icon="lucide:shield-check" className="text-cyan-400" width="18" />
              What happens next?
            </h4>
            <ul className="flex flex-col gap-4">
              {[
                { icon: 'lucide:eye-off', text: 'Watermark is mathematically invisible to the human eye.' },
                { icon: 'lucide:file-archive', text: 'Survives normal compression, resizing, and web sharing.' },
                { icon: 'lucide:alert-triangle', text: 'Fractures when pixels are maliciously altered or deepfaked.' },
                { icon: 'lucide:bar-chart-2', text: 'Maintains PSNR visual quality securely above 28 dB.' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-slate-400 leading-relaxed">
                  <Icon icon={item.icon} className="text-slate-500 shrink-0 mt-0.5" width="16" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-[#111318] border border-cyan-500/20 rounded-3xl p-6 shadow-[0_0_15px_rgba(34,211,238,0.05)]">
            <h4 className="font-medium text-[14px] mb-2 text-cyan-400">Post-Processing</h4>
            <p className="text-[13px] text-slate-300 leading-relaxed mb-4">
              After downloading the watermarked file, distribute it freely. If you suspect it gets manipulated later, upload it to the <strong className="text-white font-semibold">Verify</strong> suite to run spatial analysis.
            </p>
            <button onClick={() => navigate('verify')} className="text-[12px] font-bold tracking-widest uppercase text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
              Go to Verify <Icon icon="lucide:arrow-right" width="14" />
            </button>
          </div>

          <div className="bg-[#111318] border border-white/5 rounded-3xl p-6 shadow-lg">
            <h4 className="font-medium text-[14px] mb-4 text-white">Common Use Cases</h4>
            <div className="flex flex-col gap-3">
              {['Insurance claim photos', 'Medical imaging', 'Police bodycam footage', 'Official documents', 'News photography'].map((u, i) => (
                <div key={i} className="flex items-center gap-3 text-[13px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 shrink-0" />{u}
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}