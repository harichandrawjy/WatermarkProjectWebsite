import { useState, useRef, useCallback, useEffect } from 'react'
import type { AnalysisResult } from '../App'
import { Icon } from '@iconify/react'

interface VerifyProps {
  onComplete: (r: AnalysisResult) => void
}

type Stage = 'idle' | 'dragging' | 'preview' | 'verifying' | 'error'
type MetaSource = 'last' | 'id' | 'file'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const VERIFY_STEPS = [
  'Reading watermarked file...',
  'Extracting watermark bits...',
  'Running HIDDeN decoder...',
  'Comparing against reference...',
  'Computing BER per region...',
  'Running EfficientNet-B4 + ViT...',
  'Localizing tampered regions...',
  'Generating report...',
]

const DETECT_ITEMS = [
  'Face swapping / deepfake',
  'Object removal',
  'Inpainting / copy-move',
  'Splicing attacks',
  'Frame insertion / deletion',
  'Pixel-level manipulation',
]

export default function Verify({ onComplete }: VerifyProps) {
  const [stage,        setStage]        = useState<Stage>('idle')
  const [file,         setFile]         = useState<File | null>(null)
  const [preview,      setPreview]      = useState<string | null>(null)
  const [stepIdx,      setStepIdx]      = useState(0)
  const [progress,     setProgress]     = useState(0)
  const [metaSource,   setMetaSource]   = useState<MetaSource>('last')
  const [manualId,     setManualId]     = useState('')
  const [metaFile,     setMetaFile]     = useState<File | null>(null)
  const [lastId,       setLastId]       = useState<string | null>(null)
  const [errorMsg,     setErrorMsg]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const metaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLastId(localStorage.getItem('wm_last_id'))
  }, [])

  // Animate the step indicator while the request is in-flight.
  useEffect(() => {
    if (stage !== 'verifying') return
    let i = 0
    setStepIdx(0)
    setProgress(5)
    const t = setInterval(() => {
      i = Math.min(i + 1, VERIFY_STEPS.length - 1)
      setStepIdx(i)
      setProgress(p => Math.min(p + 10, 92))
    }, 500)
    return () => clearInterval(t)
  }, [stage])

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStage('preview')
  }

  const onDrop     = useCallback((e: React.DragEvent) => { e.preventDefault(); setStage('idle'); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [])
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setStage('dragging') }

  const resolveMetadata = async (): Promise<string> => {
    if (metaSource === 'file') {
      if (!metaFile) throw new Error('Please attach a metadata.json file.')
      const text = await metaFile.text()
      JSON.parse(text)
      return text
    }
    const id = metaSource === 'id' ? manualId.trim() : (lastId ?? '')
    if (!id) throw new Error(metaSource === 'id'
      ? 'Enter the encode ID.'
      : 'No previous encode found in this browser. Encode a file first or attach metadata.json.')
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

      const res = await fetch(`${API_BASE}/verify`, { method: 'POST', body: fd })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Server returned ${res.status}: ${text || res.statusText}`)
      }
      const raw = await res.json() as Partial<AnalysisResult>
      const data: AnalysisResult = {
        status: raw.status ?? 'tampered',
        confidence: raw.confidence ?? 0,
        wmAccuracy: raw.wmAccuracy ?? 0,
        ber: raw.ber ?? 0,
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
  }

  return (
    <div className="max-w-[1100px] mx-auto px-7 pb-20 relative z-10 font-sans text-slate-300">

      {/* Background Ambient Glow */}
      <div className="absolute top-[10%] left-[60%] w-[40%] h-[30%] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center pt-16 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[12px] font-semibold rounded-full mb-5 backdrop-blur-md">
          <Icon icon="lucide:shield-alert" width="16" />
          Step 2 — Integrity Verification
        </div>
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] text-white font-normal mb-4 leading-tight tracking-tight">Verify Integrity</h1>
        <p className="text-slate-400 text-[1.05rem] max-w-lg mx-auto leading-relaxed">
          Upload your watermarked image or video. We'll extract the neural signal to detect
          exactly where and when any malicious tampering occurred.
        </p>
      </div>

      {/* How it works strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { n: '01', title: 'Upload media', desc: 'The previously protected file' },
          { n: '02', title: 'Extract & Verify',     desc: 'Decoder checks pixel regions' },
          { n: '03', title: 'Review Report',     desc: 'View localized tampering data' },
        ].map((s, i) => (
          <div key={i} className="bg-[#111318]/80 backdrop-blur-sm border border-white/5 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-[12px] font-bold shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.1)]">{s.n}</div>
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

          {stage === 'verifying' ? (
            /* ── VERIFYING progress ── */
            <div className="bg-[#111318] border border-white/5 rounded-3xl p-12 flex flex-col items-center gap-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -ml-20 -mt-20 pointer-events-none" />

              <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                <div className="absolute inset-0 border-[3px] border-white/5 border-t-rose-400 rounded-full animate-spin" />
                <div className="absolute inset-2 border-[3px] border-white/5 border-b-amber-400 rounded-full animate-spin-slow opacity-70" />
              </div>

              <div>
                <h3 className="font-display text-[1.8rem] text-white font-normal mb-1">Analyzing Media</h3>
                <p className="text-rose-400 text-[14px] font-medium min-h-[20px]">{VERIFY_STEPS[stepIdx]}</p>
              </div>

              <div className="w-full max-w-sm mt-2">
                <div className="flex justify-between text-[12px] font-bold text-slate-400 mb-2">
                  <span>Processing...</span>
                  <span className="text-white">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-sm mt-6 text-left border-t border-white/5 pt-6">
                {VERIFY_STEPS.map((s, i) => {
                  const isDone = i < stepIdx;
                  const isCurrent = i === stepIdx;
                  return (
                    <div key={i} className={`flex items-center gap-3 text-[13px] transition-colors duration-300
                      ${isDone ? 'text-amber-400' : isCurrent ? 'text-white font-medium' : 'text-slate-600'}`}>
                      <span className="w-5 shrink-0 flex justify-center">
                        {isDone ? <Icon icon="lucide:check-circle-2" width="16" /> :
                         isCurrent ? <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e] animate-pulse" /> :
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
                <h3 className="font-display text-[1.4rem] text-white mb-1">Verification failed</h3>
                <p className="text-[13px] text-rose-300/80 max-w-md break-words">{errorMsg || 'Unknown error'}</p>
              </div>
              <button onClick={reset} className="px-6 py-3 border border-white/10 text-white font-medium rounded-xl hover:bg-white/5 transition-all text-[14px]">
                Try Again
              </button>
            </div>

          ) : stage === 'preview' && file ? (
            /* ── PREVIEW before verifying ── */
            <div className="bg-[#111318] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 gap-3 bg-white/[0.02]">
                <div className="flex items-center gap-3 flex-wrap">
                  <Icon icon="lucide:file-search" className="text-slate-400" width="18" />
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

              {/* Metadata source picker */}
              <div className="p-6 border-b border-white/5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Encode Metadata Source</label>
                <div className="flex gap-2 flex-wrap mb-4">
                  {[
                    { k: 'last' as const, label: 'Last encoded', disabled: !lastId },
                    { k: 'id'   as const, label: 'Specific ID',  disabled: false },
                    { k: 'file' as const, label: 'Upload JSON',  disabled: false },
                  ].map(o => (
                    <button
                      key={o.k}
                      type="button"
                      disabled={o.disabled}
                      onClick={() => setMetaSource(o.k)}
                      className={`px-4 py-2 rounded-lg text-[12.5px] font-medium border transition-all
                        ${metaSource === o.k
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                          : 'border-white/10 text-slate-400 hover:bg-white/5'}
                        ${o.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      {o.label}
                    </button>
                  ))}
                </div>

                {metaSource === 'last' && (
                  <p className="text-[12.5px] text-slate-400">
                    {lastId
                      ? <>Using <span className="font-mono text-cyan-400">{lastId}</span> from this browser's last encode.</>
                      : <>No previous encode found here. Switch to <strong className="text-white">Specific ID</strong> or <strong className="text-white">Upload JSON</strong>.</>}
                  </p>
                )}

                {metaSource === 'id' && (
                  <input
                    type="text"
                    value={manualId}
                    onChange={e => setManualId(e.target.value)}
                    placeholder="Encode ID (e.g. abc123)"
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 transition-colors font-mono"
                  />
                )}

                {metaSource === 'file' && (
                  <div>
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
                      className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-white/15 hover:border-rose-500/40 hover:bg-white/[0.02] transition-all text-[13.5px] flex items-center gap-3 text-slate-300">
                      <Icon icon="lucide:file-json" width="18" className="text-rose-400" />
                      {metaFile ? <span className="font-mono">{metaFile.name}</span> : <span className="text-slate-500">Choose metadata.json…</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="mx-6 mt-6 px-5 py-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <Icon icon="lucide:alert-triangle" className="text-amber-400 shrink-0 mt-0.5" width="18" />
                <p className="text-[13px] text-slate-300 leading-relaxed">
                  Make sure this file was previously watermarked using our <strong className="text-white font-semibold">Encode</strong> suite.
                  Verifying an unprotected, standard file will always return a <strong className="text-rose-400 font-semibold">Tampered</strong> result.
                </p>
              </div>

              {errorMsg && (
                <div className="mx-6 mt-4 px-5 py-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[12.5px] text-rose-300 flex items-start gap-2">
                  <Icon icon="lucide:alert-circle" width="14" className="mt-0.5 shrink-0" /> {errorMsg}
                </div>
              )}

              <div className="p-6">
                <button onClick={startVerify}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all text-[15px]">
                  <Icon icon="lucide:scan" width="18" />
                  Run Integrity Verification
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
                  ? 'border-rose-400 bg-rose-500/5 shadow-[0_0_30px_rgba(244,63,94,0.1)] scale-[1.01]'
                  : 'border-white/20 bg-[#111318] hover:border-rose-500/50 hover:bg-white/[0.02]'}`}>

              <div className={`absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 transition-opacity duration-300 ${stage === 'dragging' ? 'opacity-100' : 'group-hover:opacity-100'}`} />

              <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />

              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 relative z-10
                ${stage === 'dragging' ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-white/5 text-slate-400 group-hover:bg-rose-500/10 group-hover:text-rose-400'}`}>
                <Icon icon="lucide:file-search" width="36" height="36" strokeWidth="1.5" />
              </div>

              <h3 className="font-display text-[1.6rem] text-white font-normal mb-2 relative z-10">Select or drop file</h3>
              <p className="text-slate-400 text-[14px] mb-6 relative z-10">Upload a watermarked file to run analysis</p>

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
              <Icon icon="lucide:target" className="text-rose-400" width="18" />
              What we detect
            </h4>
            <ul className="flex flex-col gap-4">
              {DETECT_ITEMS.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[13px] text-slate-400 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 shadow-[0_0_8px_#f43f5e]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#111318] border border-white/5 rounded-3xl p-6 shadow-lg">
            <h4 className="font-medium text-[14px] mb-5 text-white flex items-center gap-2">
              <Icon icon="lucide:file-text" className="text-cyan-400" width="18" />
              What you get back
            </h4>
            <ul className="flex flex-col gap-4">
              {[
                { icon: 'lucide:badge-check', text: 'Authentic / Tampered verdict with confidence score' },
                { icon: 'lucide:map-pin', text: 'Exact spatial pixel regions that were altered' },
                { icon: 'lucide:film', text: 'Per-frame timeline analysis for video files' },
                { icon: 'lucide:activity', text: 'Visual attention heatmap of watermark signal' },
                { icon: 'lucide:download-cloud', text: 'Downloadable structured JSON report' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-slate-400 leading-relaxed">
                  <Icon icon={item.icon} className="text-slate-500 shrink-0 mt-0.5" width="16" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/5 to-[#111318] border border-emerald-500/20 rounded-3xl p-6">
            <h4 className="font-medium text-[14px] mb-3 text-emerald-400 flex items-center gap-2">
              <Icon icon="lucide:lock" width="16" />
              Privacy Notice
            </h4>
            <p className="text-[12.5px] text-slate-300 leading-relaxed">
              Uploaded files are processed securely in memory for analysis only and are deleted immediately after the report is generated. No media is stored on our servers.
            </p>
          </div>

        </aside>
      </div>
    </div>
  )
}
