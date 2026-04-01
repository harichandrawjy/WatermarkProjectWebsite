import type { Page } from '../App'
import { Icon } from '@iconify/react'

interface HomeProps { navigate: (p: Page) => void }

const CODE_SAMPLE = `{
  "status": "tampered",
  "confidence": 0.943,
  "psnr": 29.5,
  "wm_accuracy": 0.562,
  "tampered_regions": [
    {
      "frame": 12,
      "x": 102, "y": 84,
      "w": 210, "h": 198,
      "label": "face_swap"
    }
  ]
}`

// Swapped emojis for Iconify strings (using the Lucide set for a clean UI)
const USE_CASES = [
  { icon: 'lucide:hospital',        label: 'Medical Imaging',  desc: 'Protect X-rays and ultrasound videos' },
  { icon: 'lucide:scale',           label: 'Legal Evidence',   desc: 'Verify footage chain-of-custody' },
  { icon: 'lucide:newspaper',       label: 'News Media',       desc: 'Authenticate photojournalism' },
  { icon: 'lucide:graduation-cap',  label: 'Education',        desc: 'Secure academic transcripts' },
  { icon: 'lucide:shield-check',    label: 'Insurance',        desc: 'Validate accident documentation' },
  { icon: 'lucide:smartphone',      label: 'Social Media',     desc: 'Combat deepfake misinformation' },
]

export default function Home({ navigate }: HomeProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* ── Custom Animations ── */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(240px); }
        }
        .animate-scan { animation: scan 3s ease-in-out infinite; }
        
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* ── Background Glows ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Hero ── */}
      <section className="relative max-w-[1100px] mx-auto px-7 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[12px] font-semibold rounded-full mb-6 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Fragile Watermarking Technology
          </div>

          <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] text-white font-normal leading-[1.12] tracking-tight mb-5">
            Protect &amp; Verify<br />
            <em className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 not-italic">Your Digital Media</em>
          </h1>

          <p className="text-[1.05rem] text-slate-400 leading-relaxed max-w-[460px] mb-10">
            Embed an invisible watermark into your photos and videos. If they're ever
            tampered with, come back to detect exactly what changed — down to the pixel and frame.
          </p>

          {/* Two clear CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <button 
              onClick={() => navigate('encode')}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 hover:-translate-y-px hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all text-[15px]"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></svg>
              Encode a Watermark
              <span className="ml-1 inline-flex items-center whitespace-nowrap px-3 py-1 leading-none bg-black/20 text-black text-[10px] font-black tracking-wide rounded-full">STEP 1</span>
            </button>
            <button 
              onClick={() => navigate('verify')}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 hover:-translate-y-px transition-all text-[15px]"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Verify Integrity
              <span className="ml-1 inline-flex items-center whitespace-nowrap px-3 py-1 leading-none bg-white/10 text-white text-[10px] font-bold tracking-wide rounded-full">STEP 2</span>
            </button>
          </div>

          {/* Stats */}
          <div className="inline-flex flex-wrap items-center gap-6 px-6 py-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
            {[
              { val: '29–31', unit: 'dB', label: 'PSNR Quality' },
              { val: '62',    unit: '%',  label: 'WM Accuracy'  },
              { val: '2',     unit: '',   label: 'Media Types'  },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-6">
                {i > 0 && <div className="w-px h-9 bg-white/10 hidden sm:block" />}
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-white text-[1.5rem] leading-none">
                    {s.val}<small className="text-[0.85rem] text-slate-400 font-body ml-1">{s.unit}</small>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual: The Scanner + Original JSON */}
        <div className="hidden lg:flex justify-center relative w-full">
          <div className="relative w-full aspect-[4/3] bg-[#111318] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
            
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-50" />
            
            {/* Fake UI Header */}
            <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/10 bg-[#0a0a0c]/80 backdrop-blur flex items-center px-4 gap-2 z-20">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28ca41]" />
              </div>
              <div className="ml-4 text-[10px] font-mono text-slate-500 tracking-wider">analysis_result.json</div>
            </div>

            {/* Subject (Abstract silhouette) */}
            <div className="relative w-48 h-64 border border-white/5 bg-gradient-to-b from-white/5 to-transparent rounded-full mt-10">
              {/* Tamper Bounding Box */}
              <div className="absolute top-1/4 left-1/4 w-28 h-28 border-2 border-rose-500 bg-rose-500/10 rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.3)] z-10 flex items-start">
                <span className="absolute -top-6 -left-0.5 text-[9px] font-mono font-bold text-rose-300 bg-rose-950/90 border border-rose-500/50 px-2 py-0.5 rounded backdrop-blur">
                  LABEL: FACE_SWAP
                </span>
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-rose-400" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-rose-400" />
              </div>
            </div>

            {/* Scanning Laser Line */}
            <div className="absolute top-12 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-scan z-20">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/40 to-transparent h-10 blur-sm -top-10" />
            </div>

            {/* Floating Data Card */}
              <div className="absolute bottom-4 right-4 bg-[#0a0a0c]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg font-mono text-[10px] z-30 shadow-xl hidden sm:block">
                <div className="text-cyan-400 mb-1">Status: Analyzing...</div>
                <div className="text-slate-400">PSNR Quality: <span className="text-white">29.5 dB</span></div>
                <div className="text-slate-400">Confidence: <span className="text-rose-400">94.3%</span></div>
              </div>
          </div>
        </div>
      </section>

      {/* ── Two-step flow ── */}
      <section className="relative z-10 py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-[1100px] mx-auto px-7">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-cyan-400 mb-3">How It Works</p>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] text-white font-normal mb-12 max-w-xl leading-tight">
            Two simple steps to protect your media
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Encode card */}
            <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 flex flex-col gap-5 hover:border-cyan-500/30 transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => navigate('encode')}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-cyan-500/10 transition-colors" />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                </div>
                <span className="text-[11px] font-bold tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20">STEP 1</span>
              </div>
              <div className="relative z-10">
                <h3 className="font-display text-[1.4rem] text-white font-normal mb-2">Encode Watermark</h3>
                <p className="text-slate-400 text-[14px] leading-relaxed">
                  Upload your original image or video. We embed an invisible semi-fragile watermark
                  using the HIDDeN encoder. Download the protected file and share it freely.
                </p>
              </div>
              <ul className="relative z-10 flex flex-col gap-3 mt-auto pt-4">
                {['Invisible to the human eye', 'Survives normal compression', 'PSNR quality above 28 dB'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[13px] text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_#22d3ee]" />{f}
                  </li>
                ))}
              </ul>
              <button className="relative z-10 flex items-center gap-2 text-cyan-400 text-[13.5px] font-semibold group-hover:gap-3 transition-all mt-2">
                Go to Encode →
              </button>
            </div>

            {/* Verify card */}
            <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 flex flex-col gap-5 hover:border-rose-500/30 transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => navigate('verify')}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-rose-500/10 transition-colors" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="text-[11px] font-bold tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">STEP 2</span>
              </div>
              <div className="relative z-10">
                <h3 className="font-display text-[1.4rem] text-white font-normal mb-2">Verify Integrity</h3>
                <p className="text-slate-400 text-[14px] leading-relaxed">
                  Upload a watermarked file you suspect was tampered with. Our system extracts the
                  watermark signal and localizes any modifications — spatially and temporally.
                </p>
              </div>
              <ul className="relative z-10 flex flex-col gap-3 mt-auto pt-4">
                {['Detects face swap, inpainting & splicing', 'Highlights exact tampered regions', 'Per-frame analysis for video'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[13px] text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 shadow-[0_0_8px_#f43f5e]" />{f}
                  </li>
                ))}
              </ul>
              <button className="relative z-10 flex items-center gap-2 text-rose-400 text-[13.5px] font-semibold group-hover:gap-3 transition-all mt-2">
                Go to Verify →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section className="relative z-10 py-24">
        <div className="max-w-[1100px] mx-auto px-7">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-cyan-400 mb-3 text-center">Full Pipeline</p>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] text-white text-center font-normal mb-16 leading-tight">
            From upload to result in seconds
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: '01', title: 'Upload original',   desc: 'Clean, unmodified media' },
              { n: '02', title: 'Embed watermark',   desc: 'HIDDeN encoder + noise layer' },
              { n: '03', title: 'Detect tampering',  desc: 'Decoder checks integrity' },
              { n: '04', title: 'Localize changes',  desc: 'EfficientNet-B4 + ViT output' },
            ].map((s, i) => (
              <div key={i} className="text-center relative group">
                <div className="w-16 h-16 bg-[#111318] border border-white/10 text-white rounded-2xl flex items-center justify-center font-display text-xl mx-auto mb-5 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all">
                  {s.n}
                </div>
                <h4 className="font-semibold text-white text-[15px] mb-2">{s.title}</h4>
                <p className="text-[13px] text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases (Updated with Iconify) ── */}
      <section className="relative z-10 py-24 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-[1100px] mx-auto px-7">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-cyan-400 mb-3 text-center">Applications</p>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] text-white text-center font-normal mb-16 leading-tight">
            Built for real-world integrity needs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map((u, i) => (
              <div key={i} className="bg-[#111318] border border-white/5 rounded-2xl flex items-center gap-5 px-6 py-5 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-xl transition-all">
                {/* Replaced emoji with Iconify component */}
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-cyan-400 shrink-0 border border-white/5">
                  <Icon icon={u.icon} width="22" height="22" />
                </div>
                <div>
                  <div className="font-medium text-white text-[14px] mb-1">{u.label}</div>
                  <div className="text-[12.5px] text-slate-400 leading-snug">{u.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-24">
        <div className="max-w-[1100px] mx-auto px-7">
          <div className="relative bg-gradient-to-b from-cyan-900/40 to-[#111318] border border-cyan-500/20 rounded-[32px] px-8 py-16 text-center overflow-hidden">
            {/* CTA Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
            
            <h2 className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-normal text-white mb-4 relative z-10">
              Start protecting your media today
            </h2>
            <p className="text-slate-300 text-[15.5px] mb-10 max-w-md mx-auto relative z-10">
              Encode a watermark in seconds. Verify integrity anytime, anywhere.
            </p>
            <div className="flex justify-center gap-4 flex-wrap relative z-10">
              <button onClick={() => navigate('encode')}
                className="px-8 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all text-[15px] shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                Encode Watermark →
              </button>
              <button onClick={() => navigate('verify')}
                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all text-[15px]">
                Verify a File
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}