import { Icon } from '@iconify/react'

const TEAM = [
  { name: '彭定康', id: 'D1229568', role: 'Embedder / Extractor', initial: '彭' },
  { name: '張志成', id: 'D1231400', role: 'Website / API',        initial: '張' },
  { name: '吳尚恩', id: 'D1249268', role: 'Website / API',        initial: '吳' },
  { name: '鄭建良', id: 'D1231150', role: 'Embedder / Extractor', initial: '鄭' },
]

const TECH = [
  { cat: 'Watermarking',      items: ['LWT', 'DCT', 'SVD', 'QIM', 'BCH(15,7)', 'SHA-256'] },
  { cat: 'Signal Processing', items: ['NumPy', 'OpenCV', 'PyWavelets', 'SciPy', 'galois', 'FFmpeg'] },
  { cat: 'Backend / API',     items: ['FastAPI', 'Python', 'Supabase', 'REST API', 'JSON'] },
  { cat: 'Frontend',          items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'] },
]

const PHASES = [
  { period: 'Mar – Apr', pct: '25%',  title: 'Foundation',  tasks: ['Dataset collection', 'Encoder + Decoder prototype'], s: 'done' },
  { period: 'Apr – May', pct: '50%',  title: 'Detection',   tasks: ['Tamper Detection module', 'Deepfake Detection integration'], s: 'active' },
  { period: 'Jun – Jul', pct: '75%',  title: 'Integration', tasks: ['Full system integration', 'Website + API development'], s: 'upcoming' },
  { period: 'Jul – Sep', pct: '100%', title: 'Completion',  tasks: ['Result packaging', 'Final evaluation', 'Demo deployment'], s: 'upcoming' },
]

const OBJECTIVES = [
  { icon: 'lucide:lock',    title: 'Semi-fragile watermarking', desc: 'Survive normal compression and processing, but break under malicious manipulation.' },
  { icon: 'lucide:scan',    title: 'Spatial localization',      desc: 'Identify exactly which pixel regions in a frame were tampered with.' },
  { icon: 'lucide:clock-4', title: 'Temporal verification',     desc: 'For video, detect which frames were altered and trace edits across the timeline.' },
  { icon: 'lucide:network', title: 'REST API interface',        desc: 'Clean FastAPI backend with JSON responses for easy third-party integration.' },
]

const METHOD = [
  {
    step: '01',
    title: 'Watermark embedding',
    body: 'The Y (luminance) channel is decomposed by a 2-level Lifting Wavelet Transform; the LLLL sub-band is divided into 8×8 blocks, each transformed by DCT then SVD. The BCH(15,7)-coded payload bits — owner / media / frame / chain IDs — are embedded by Quantization Index Modulation on the largest singular value S₀, then the inverse transforms reconstruct the watermarked frame.',
  },
  {
    step: '02',
    title: 'Integrity verification',
    body: 'Verification re-runs the LWT → 8×8 DCT → SVD chain on the Y channel, extracts payload bits via a QIM detector, and decodes them with BCH(15,7) + majority vote. The recovered owner / media / frame / chain IDs are matched against the stored record to confirm ownership and detect temporal anomalies (deleted, duplicated, or reordered frames).',
  },
  {
    step: '03',
    title: 'Tamper localization',
    body: 'In parallel, the Cb chroma channel carries a fragile layer: a SHA-256 parity over (signature, frame_id) is embedded in the LSB of each 16×16 sub-block mean. During verification this parity is regenerated and compared per sub-block — any mismatch pinpoints the exact altered region, giving fine-grained spatial localization plus per-frame temporal analysis for video.',
  },
]

const FLOW = [
  { label: 'Original media',     icon: 'lucide:image',        active: false },
  { label: 'LWT + DCT + SVD',    icon: 'lucide:cpu',          active: true  },
  { label: 'Protected media',    icon: 'lucide:shield-check', active: false },
  { label: 'QIM detector + BCH', icon: 'lucide:microscope',   active: true  },
  { label: 'Tamper result',      icon: 'lucide:file-check-2', active: false },
]

/** Centred eyebrow + heading, repeated for each section. */
function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center mb-12">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-display text-3xl text-ink-hi">{title}</h2>
    </div>
  )
}

export default function About() {
  return (
    <div className="page pb-8">

      {/* ── Header ── */}
      <header className="text-center pt-20 pb-16 max-w-2xl mx-auto">
        <h1 className="page-title mb-5">
          About <span className="text-accent">Aegis</span>
        </h1>
        <p className="page-lead">
          Multimedia tamper detection using invisible semi-fragile watermarking with
          LWT + DCT + SVD payload encoding and per-sub-block parity localization.
        </p>
      </header>

      {/* ── Background ── */}
      <section className="mb-24">
        <div className="card p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="eyebrow mb-4">Project background</p>
            <h2 className="font-display text-2xl text-ink-hi mb-5 leading-snug">
              Why proactive tamper detection matters
            </h2>
            <p className="text-base text-ink-lo leading-relaxed mb-4">
              With the rapid advancement of AI technologies such as generative deepfakes,
              digital images and videos can be manipulated with unprecedented ease. Fake
              content spreads misinformation, undermines trust, and can have devastating
              legal, medical, and social consequences.
            </p>
            <p className="text-base text-ink-lo leading-relaxed">
              Existing passive detection methods struggle with accuracy and rarely pinpoint
              exactly which pixels were altered. Our approach uses a{' '}
              <strong className="text-ink-hi font-medium">proactive</strong> strategy —
              embedding an imperceptible semi-fragile watermark <em>before</em> content is
              distributed.
            </p>
          </div>

          {/* Pipeline diagram */}
          <div className="flex flex-col items-center">
            <p className="label mb-6">System architecture flow</p>
            <ol className="w-full max-w-[300px] flex flex-col gap-2.5">
              {FLOW.map((node, i) => (
                <li key={node.label}>
                  <div className={`w-full px-4 py-3 border rounded-xl flex items-center gap-3 text-base
                    ${node.active
                      ? 'bg-accent-soft border-accent-line text-accent'
                      : 'bg-surface-inset border-line text-ink'}`}>
                    <Icon icon={node.icon} width="17" className="shrink-0" />
                    {node.label}
                  </div>
                  {i < FLOW.length - 1 && (
                    <div className="h-2.5 w-px bg-line mx-auto my-0.5" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Objectives ── */}
      <section className="mb-24">
        <SectionHead eyebrow="Core objectives" title="What we set out to build" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OBJECTIVES.map(o => (
            <div key={o.title} className="card-lift p-6">
              <span className="w-11 h-11 rounded-xl bg-white/[0.04] border border-line text-accent
                               flex items-center justify-center mb-5">
                <Icon icon={o.icon} width="21" />
              </span>
              <h3 className="text-base font-medium text-ink-hi mb-2">{o.title}</h3>
              <p className="text-sm text-ink-lo leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className="mb-24">
        <SectionHead eyebrow="Methodology" title="Technical approach" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {METHOD.map(m => (
            <div key={m.step} className="card-lift p-6">
              <span className="font-mono text-2xs text-accent block mb-4">Phase {m.step}</span>
              <h3 className="text-lg font-medium text-ink-hi mb-3">{m.title}</h3>
              <p className="text-sm text-ink-lo leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section className="mb-24">
        <SectionHead eyebrow="Engineering" title="Tech stack" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TECH.map(t => (
            <div key={t.cat} className="card p-5">
              <h3 className="label mb-4">{t.cat}</h3>
              <div className="flex flex-wrap gap-1.5">
                {t.items.map(item => (
                  <span key={item} className="px-2.5 py-1 bg-surface-inset border border-line
                                              text-xs font-mono text-ink rounded-lg">
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
        <SectionHead eyebrow="Roadmap" title="Project timeline" />
        <ol className="max-w-3xl mx-auto">
          {PHASES.map((phase, i) => {
            const isDone   = phase.s === 'done'
            const isActive = phase.s === 'active'
            return (
              <li key={phase.title} className="grid grid-cols-[16px_1fr] gap-5">
                {/* Rail */}
                <div className="flex flex-col items-center">
                  <span className={`w-3 h-3 rounded-full mt-6 shrink-0 border
                    ${isDone   ? 'bg-ok border-ok' :
                      isActive ? 'bg-accent border-accent shadow-glow-accent' :
                                 'bg-surface border-line-strong'}`} />
                  {i < PHASES.length - 1 && <span className="w-px flex-1 bg-line my-1.5" />}
                </div>

                {/* Content */}
                <div className={`card p-5 mb-4 ${isActive ? 'border-accent-line' : ''} ${phase.s === 'upcoming' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between gap-3 mb-3.5 pb-3.5 border-b border-line">
                    <span className="meta">{phase.period}</span>
                    <span className={isDone ? 'badge-ok' : isActive ? 'badge-accent' : 'badge-neutral'}>
                      {phase.pct} complete
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-ink-hi mb-3">{phase.title}</h3>
                  <ul className="flex flex-col gap-2">
                    {phase.tasks.map(t => (
                      <li key={t} className="flex items-start gap-2.5 text-sm text-ink-lo">
                        <Icon
                          icon={isDone ? 'lucide:check-circle-2' : isActive ? 'lucide:circle-dashed' : 'lucide:circle'}
                          className={`shrink-0 mt-0.5 ${isDone ? 'text-ok' : isActive ? 'text-accent' : 'text-ink-faint'}`}
                          width="15" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ── Team ── */}
      <section>
        <SectionHead eyebrow="The team" title="Meet the developers" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map(m => (
            <div key={m.id} className="card-lift p-6 text-center">
              <span className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent-line text-accent
                               flex items-center justify-center font-display text-2xl mx-auto mb-5">
                {m.initial}
              </span>
              <div className="text-lg font-medium text-ink-hi mb-1.5">{m.name}</div>
              <div className="meta mb-2.5">{m.id}</div>
              <div className="text-sm text-ink-lo">{m.role}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
