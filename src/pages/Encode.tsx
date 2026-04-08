import { useState, useRef, useCallback } from 'react'
import type { Page } from '../App'
import { Icon } from '@iconify/react'

interface EncodeProps {
  navigate: (p: Page) => void
}

type Stage = 'idle' | 'dragging' | 'preview' | 'encoding' | 'done'

const ENCODE_STEPS = [
  'Reading media file...',
  'Generating watermark payload...',
  'Running HIDDeN encoder...',
  'Applying attention bottleneck...',
  'Embedding semi-fragile layer...',
  'Finalizing watermarked output...',
]

export default function Encode({ navigate }: EncodeProps) {
  const [stage,       setStage]      = useState<Stage>('idle')
  const [file,        setFile]       = useState<File | null>(null)
  const [preview,     setPreview]    = useState<string | null>(null)
  const [stepIdx,     setStepIdx]    = useState(0)
  const [progress,    setProgress]   = useState(0)
  const [wmPreview,   setWmPreview]  = useState<string | null>(null)
  const [psnr,        setPsnr]       = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStage('preview')
  }

  const onDrop     = useCallback((e: React.DragEvent) => { e.preventDefault(); setStage('idle'); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [])
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setStage('dragging') }

  const startEncoding = async () => {
    if (!file) return
    setStage('encoding')
    setStepIdx(0); setProgress(0)

    for (let i = 0; i < ENCODE_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400))
      setStepIdx(i)
      setProgress(Math.round(((i + 1) / ENCODE_STEPS.length) * 100))
    }

    // Mock: reuse the original as the "watermarked" preview
    // In production, this would be the URL returned by your FastAPI endpoint
    setWmPreview(preview)
    setPsnr(28 + Math.random() * 5)
    setStage('done')
  }

  const handleDownload = () => {
    if (!wmPreview || !file) return
    const a = document.createElement('a')
    a.href = wmPreview
    a.download = `watermarked_${file.name}`
    a.click()
  }

  const reset = () => {
    setFile(null); setPreview(null); setWmPreview(null)
    setStage('idle'); setProgress(0); setStepIdx(0); setPsnr(0)
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
                  <p className="text-[12.5px] text-emerald-400/70">PSNR: {psnr.toFixed(1)} dB — image quality preserved</p>
                </div>
              </div>

              {/* Side-by-side preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10">
                <div className="bg-[#0a0a0c] flex flex-col">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-5 py-3 border-b border-white/5 bg-[#111318]">Original</p>
                  <div className="p-4 flex-1 flex items-center justify-center">
                    <img src={preview!} alt="original" className="max-w-full max-h-[300px] object-contain rounded-lg shadow-2xl" />
                  </div>
                </div>
                <div className="bg-[#0a0a0c] flex flex-col">
                  <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest px-5 py-3 border-b border-white/5 bg-[#111318] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                    Protected
                  </p>
                  <div className="p-4 flex-1 flex items-center justify-center">
                    <img src={wmPreview} alt="watermarked" className="max-w-full max-h-[300px] object-contain rounded-lg shadow-2xl" />
                  </div>
                </div>
              </div>

              {/* Metadata row */}
              <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 bg-[#111318]">
                {[
                  { label: 'PSNR', value: `${psnr.toFixed(1)} dB` },
                  { label: 'Watermark', value: 'Embedded ✓' },
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