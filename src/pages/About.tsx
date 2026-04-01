import { Icon } from '@iconify/react'

const TEAM = [
  { name: '彭定康', id: 'D1229568', role: 'Embedder / Extractor',    initial: '彭' },
  { name: '張志成', id: 'D1231400', role: 'Website / API',       initial: '張' },
  { name: '吳尚恩', id: 'D1249268', role: 'Website / API',   initial: '吳' },
  { name: '鄭建良', id: 'D1231150', role: 'Embedder / Extractor',      initial: '鄭' },
]

const TECH = [
  { cat: 'Watermarking',  items: ['HIDDeN', 'Attention Bottleneck', 'OpenCV', 'NumPy', 'FFmpeg'] },
  { cat: 'ML / Training', items: ['PyTorch', 'Torchvision', 'EfficientNet-B4', 'ViT', 'Albumentations'] },
  { cat: 'Backend / API', items: ['FastAPI', 'Python', 'MySQL', 'REST API', 'JSON'] },
  { cat: 'Frontend',      items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'] },
]

const PHASES = [
  { period: 'Mar – Apr', pct: '25%', title: 'Foundation', tasks: ['Dataset collection', 'Encoder + Decoder prototype'], s: 'done' },
  { period: 'Apr – May', pct: '50%', title: 'Detection',  tasks: ['Tamper Detection module', 'Deepfake Detection integration'], s: 'active' },
  { period: 'Jun – Jul', pct: '75%', title: 'Integration',tasks: ['Full system integration', 'Website + API development'], s: 'upcoming' },
  { period: 'Jul – Sep', pct: '100%',title: 'Completion', tasks: ['Result packaging', 'Final evaluation', 'Demo deployment'], s: 'upcoming' },
]

const OBJECTIVES = [
  { icon: 'lucide:lock',           title: 'Semi-Fragile Watermarking', desc: 'Survive normal compression and processing, but break under malicious manipulation.' },
  { icon: 'lucide:scan',           title: 'Spatial Localization',      desc: 'Identify exactly which pixel regions in a frame were tampered with.' },
  { icon: 'lucide:clock-4',        title: 'Temporal Verification',     desc: 'For video, detect which frames were altered and trace edits across the timeline.' },
  { icon: 'lucide:network',        title: 'REST API Interface',        desc: 'Clean FastAPI backend with JSON responses for easy third-party integration.' },
]

export default function About() {
  return (
    <div className="max-w-[1100px] mx-auto px-7 pb-32 relative z-10 font-sans text-slate-300">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[5%] left-[10%] w-[30%] h-[20%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[10%] w-[30%] h-[20%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Page header */}
      <div className="text-center pt-20 pb-16">
        <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] text-white font-semibold mb-6 tracking-tight">
          About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">WaterGuard</span>
        </h1>
        <p className="text-slate-400 text-[1.1rem] max-w-2xl mx-auto leading-relaxed">
          Next-generation multimedia tamper detection utilizing invisible semi-fragile watermarking and deep-learning spatio-temporal localization.
        </p>
      </div>

      {/* ── Background ── */}
      <section className="mb-24">
        <div className="bg-[#111318]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center shadow-2xl relative overflow-hidden">
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPgo8L3N2Zz4=')] opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <p className="text-[11px] font-bold tracking-widest uppercase text-cyan-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              Project Background
            </p>
            <h2 className="text-3xl font-semibold text-white mb-6 leading-tight">Why proactive tamper detection matters</h2>
            <p className="text-slate-400 text-[14.5px] leading-relaxed mb-5">
              With the rapid advancement of AI technologies such as generative deepfakes, digital images and videos
              can be manipulated with unprecedented ease. Fake content spreads misinformation, undermines
              trust, and can have devastating legal, medical, and social consequences.
            </p>
            <p className="text-slate-400 text-[14.5px] leading-relaxed">
              Existing passive detection methods struggle with accuracy and rarely pinpoint exactly which
              pixels were altered. Our approach uses a <strong className="text-white font-medium">proactive</strong> strategy —
              embedding an imperceptible semi-fragile watermark <em>before</em> content is distributed.
            </p>
          </div>

          {/* Animated Pipeline Diagram */}
          <div className="relative z-10 flex flex-col items-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">System Architecture Flow</p>
            
            <div className="w-full max-w-[320px] flex flex-col relative">
              {/* Connecting line behind blocks */}
              <div className="absolute left-1/2 top-4 bottom-4 w-[2px] -translate-x-1/2 bg-gradient-to-b from-white/10 via-cyan-500/50 to-emerald-500/50 -z-10" />
              
              {/* Animated data packet */}
              <div className="absolute left-1/2 top-0 w-2 h-8 -translate-x-1/2 bg-cyan-400 blur-[2px] rounded-full z-0 animate-[scan_3s_ease-in-out_infinite]" />

              <style>{`
                @keyframes scan {
                  0% { top: 5%; opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { top: 95%; opacity: 0; }
                }
              `}</style>

              {[
                { label: 'Original Media',   icon: 'lucide:image',         color: 'bg-[#0a0a0c] border-white/10 text-slate-300' },
                { label: 'HIDDeN Encoder',   icon: 'lucide:cpu',           color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' },
                { label: 'Protected Media',  icon: 'lucide:shield-check',  color: 'bg-[#0a0a0c] border-white/10 text-slate-300' },
                { label: 'CNN Decoder',      icon: 'lucide:microscope',    color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' },
                { label: 'Tamper Result',    icon: 'lucide:file-check-2',  color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' },
              ].map((node, i) => (
                <div key={i} className={`relative z-10 w-full px-5 py-4 border rounded-2xl flex items-center justify-center gap-3 text-[14px] font-medium backdrop-blur-md mb-4 last:mb-0 transition-transform hover:scale-[1.02] ${node.color}`}>
                  <Icon icon={node.icon} width="18" className="opacity-80" />
                  {node.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Objectives ── */}
      <section className="mb-24">
        <div className="flex flex-col items-center text-center mb-12">
          <p className="text-[11px] font-bold tracking-widest uppercase text-cyan-400 mb-3">Core Objectives</p>
          <h2 className="text-3xl font-semibold text-white">What we set out to build</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {OBJECTIVES.map((o, i) => (
            <div key={i} className="bg-[#111318] border border-white/5 rounded-3xl p-8 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.05)] transition-all group">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-cyan-400 mb-6 group-hover:bg-cyan-500/10 group-hover:scale-110 transition-all">
                <Icon icon={o.icon} width="24" />
              </div>
              <h3 className="text-[16px] font-medium text-white mb-3">{o.title}</h3>
              <p className="text-slate-400 text-[13px] leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className="mb-24">
        <div className="flex flex-col items-center text-center mb-12">
          <p className="text-[11px] font-bold tracking-widest uppercase text-cyan-400 mb-3">Methodology</p>
          <h2 className="text-3xl font-semibold text-white">Technical Approach</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Watermark Embedding',
              body: 'The original media passes through a HIDDeN encoder with an Attention Bottleneck. The encoder generates an imperceptible perturbation embedding a binary watermark string. A noise layer simulates real-world degradation while remaining sensitive to tampering.',
            },
            {
              step: '02',
              title: 'Integrity Verification',
              body: 'A CNN-based decoder extracts watermark bits from the media. The recovered bits are compared with the original watermark via an Integrity Verification Module. A high Bit Error Rate (BER) in specific regions signals potential manipulation.',
            },
            {
              step: '03',
              title: 'Tamper Localization',
              body: 'When tampering is detected, EfficientNet-B4 combined with a Vision Transformer (ViT) performs fine-grained spatial localization. Modified regions are highlighted, and a frame-level temporal analysis is generated for video content.',
            },
          ].map((m, i) => (
            <div key={i} className="bg-[#111318] border border-white/5 border-t-[3px] border-t-cyan-500 rounded-3xl p-8 hover:-translate-y-1 transition-transform shadow-lg">
              <div className="text-[10px] font-bold text-cyan-500 mb-4 bg-cyan-500/10 inline-block px-3 py-1 rounded-full uppercase tracking-widest">Phase {m.step}</div>
              <h3 className="text-[18px] font-medium text-white mb-4">{m.title}</h3>
              <p className="text-slate-400 text-[14px] leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="mb-24">
        <div className="flex flex-col items-center text-center mb-12">
          <p className="text-[11px] font-bold tracking-widest uppercase text-cyan-400 mb-3">Engineering</p>
          <h2 className="text-3xl font-semibold text-white">Tech Stack</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TECH.map((t, i) => (
            <div key={i} className="bg-[#111318] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.02] transition-colors">
              <h4 className="text-[14px] font-medium text-white mb-5 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-cyan-400 rounded-full" />
                {t.cat}
              </h4>
              <div className="flex flex-wrap gap-2">
                {t.items.map((item, j) => (
                  <span key={j} className="px-3 py-1.5 bg-[#0a0a0c] border border-white/10 text-slate-300 text-[12px] rounded-lg shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="mb-24">
        <div className="flex flex-col items-center text-center mb-16">
          <p className="text-[11px] font-bold tracking-widest uppercase text-cyan-400 mb-3">Roadmap</p>
          <h2 className="text-3xl font-semibold text-white">Project Timeline</h2>
        </div>
        <div className="max-w-3xl mx-auto flex flex-col gap-0">
          {PHASES.map((phase, i) => {
            const isDone = phase.s === 'done';
            const isActive = phase.s === 'active';
            const isUpcoming = phase.s === 'upcoming';
            
            return (
              <div key={i} className="grid grid-cols-[40px_1fr] gap-6 items-start relative group">
                
                {/* Indicator */}
                <div className="flex flex-col items-center pt-8 h-full">
                  <div className={`w-4 h-4 rounded-full border-2 z-10 flex-shrink-0 transition-all duration-300
                    ${isDone   ? 'bg-emerald-400 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' :
                      isActive ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-pulse' :
                      'bg-[#111318] border-white/20'}`} 
                  />
                  {i < PHASES.length - 1 && (
                    <div className={`w-[2px] flex-1 min-h-[40px] mt-2 rounded-full
                      ${isDone ? 'bg-gradient-to-b from-emerald-400 to-cyan-400' : 
                        isActive ? 'bg-gradient-to-b from-cyan-400 to-white/10 border-dashed' : 
                        'bg-white/10'}`} 
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`bg-[#111318] border border-white/5 rounded-3xl p-6 mb-6 transition-all duration-300
                  ${isUpcoming ? 'opacity-50 hover:opacity-100' : 'hover:border-white/20 hover:shadow-xl'}
                  ${isActive ? 'border-cyan-500/30 bg-cyan-500/[0.02]' : ''}`}>
                  
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                    <span className="text-[13px] text-slate-400 font-mono tracking-wide">{phase.period}</span>
                    <span className={`px-3 py-1 text-[11px] font-bold tracking-widest uppercase rounded-lg border
                      ${isDone   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        isActive ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        'bg-white/5 text-slate-500 border-white/10'}`}>
                      {phase.pct} Complete
                    </span>
                  </div>
                  <h4 className={`text-[18px] font-medium mb-4 ${isDone || isActive ? 'text-white' : 'text-slate-300'}`}>{phase.title}</h4>
                  <ul className="flex flex-col gap-2.5">
                    {phase.tasks.map((t, j) => (
                      <li key={j} className="flex items-start gap-3 text-[14px] text-slate-400">
                        <Icon icon={isDone ? "lucide:check-circle-2" : isActive ? "lucide:circle-dashed" : "lucide:circle"} 
                              className={`shrink-0 mt-0.5 ${isDone ? 'text-emerald-400' : isActive ? 'text-cyan-400' : 'text-slate-600'}`} width="16" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Team ── */}
      <section>
        <div className="flex flex-col items-center text-center mb-16">
          <p className="text-[11px] font-bold tracking-widest uppercase text-cyan-400 mb-3">The Team</p>
          <h2 className="text-3xl font-semibold text-white">Meet the Developers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((m, i) => (
            <div key={i} className="bg-[#111318] border border-white/5 rounded-3xl p-8 text-center hover:-translate-y-2 hover:border-cyan-500/30 hover:shadow-[0_10px_40px_-10px_rgba(34,211,238,0.15)] transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-emerald-400 text-[#0a0a0c] rounded-2xl flex items-center justify-center font-display text-[1.5rem] font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                {m.initial}
              </div>
              <div className="font-medium text-white text-[18px] mb-1">{m.name}</div>
              <div className="font-mono text-[12px] text-cyan-400 mb-3 bg-cyan-400/10 inline-block px-2 py-0.5 rounded">{m.id}</div>
              <div className="text-[13px] text-slate-400 leading-snug">{m.role}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}