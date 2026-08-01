import type { Page } from '../App'
import { Icon } from '@iconify/react'

interface HomeProps { navigate: (p: Page) => void }

const USE_CASES = [
  { icon: 'lucide:hospital',       label: 'Medical Imaging', desc: 'Protect X-rays and ultrasound videos' },
  { icon: 'lucide:scale',          label: 'Legal Evidence',  desc: 'Verify footage chain-of-custody' },
  { icon: 'lucide:newspaper',      label: 'News Media',      desc: 'Authenticate photojournalism' },
  { icon: 'lucide:graduation-cap', label: 'Education',       desc: 'Secure academic transcripts' },
  { icon: 'lucide:shield-check',   label: 'Insurance',       desc: 'Validate accident documentation' },
  { icon: 'lucide:smartphone',     label: 'Social Media',    desc: 'Combat deepfake misinformation' },
]

const STATS = [
  { val: '29–31', unit: 'dB', label: 'PSNR quality' },
  { val: '62',    unit: '%',  label: 'WM accuracy'  },
  { val: '2',     unit: '',   label: 'Media types'  },
]

const PIPELINE = [
  { n: '01', title: 'Upload original',  desc: 'Clean, unmodified media' },
  { n: '02', title: 'Embed watermark',  desc: 'LWT + DCT + SVD with QIM' },
  { n: '03', title: 'Detect tampering', desc: 'QIM detector + BCH(15,7) decode' },
  { n: '04', title: 'Localize changes', desc: 'Per-sub-block SHA-256 parity check' },
]

export default function Home({ navigate }: HomeProps) {
  return (
    <div className="relative overflow-hidden">

      {/* A single, restrained ambient wash behind the hero. The old design had
          two competing coloured orbs on every page; one is enough to give the
          canvas depth without turning the background into a light show. */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px]
                      bg-accent/[0.07] blur-[130px] rounded-full pointer-events-none" />

      {/* ── Hero ── */}
      <section className="page relative pt-28 pb-24 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-16 items-center">
        <div className="animate-fade-up">
          <span className="pill-accent mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Fragile watermarking
          </span>

          <h1 className="page-title mb-5">
            Protect &amp; verify<br />
            <span className="text-accent">your digital media</span>
          </h1>

          <p className="page-lead max-w-[460px] mb-9">
            Embed an invisible watermark into your photos and videos. If they're ever
            tampered with, come back to detect exactly what changed — down to the pixel
            and the frame.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <button onClick={() => navigate('encode')} className="btn-primary btn-lg">
              <Icon icon="lucide:layers" width="17" />
              Encode a watermark
            </button>
            <button onClick={() => navigate('verify')} className="btn-ghost btn-lg">
              <Icon icon="lucide:scan-search" width="17" />
              Verify integrity
            </button>
          </div>

          {/* Stats — hairline dividers instead of a bordered glass slab. */}
          <dl className="flex flex-wrap gap-x-10 gap-y-6">
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col gap-1">
                <dd className="stat-value">
                  {s.val}
                  {s.unit && <span className="text-base text-ink-lo font-sans ml-1">{s.unit}</span>}
                </dd>
                <dt className="label">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Hero visual: the analysis viewport ── */}
        <div className="hidden lg:block animate-fade-in">
          <div className="card-lift overflow-hidden shadow-lift">

            {/* Window chrome */}
            <div className="card-strip border-b flex items-center gap-3 px-4 h-10">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/15" />
                <span className="w-2 h-2 rounded-full bg-white/15" />
                <span className="w-2 h-2 rounded-full bg-white/15" />
              </div>
              <span className="text-2xs font-mono text-ink-faint tracking-wide">analysis_result.json</span>
            </div>

            <div className="relative aspect-[4/3] bg-surface-inset bg-grid flex items-center justify-center overflow-hidden">

              {/* Subject silhouette */}
              <div className="relative w-44 h-60 rounded-full border border-line bg-gradient-to-b from-white/[0.04] to-transparent">
                {/* Detection box — the one place alert-red is earned */}
                <div className="absolute top-[22%] left-[20%] w-28 h-28 rounded-lg border border-alert bg-alert/10 shadow-glow-alert">
                  <span className="absolute -top-6 left-0 text-2xs font-mono font-medium text-alert
                                   bg-canvas/90 border border-alert-line px-2 py-0.5 rounded whitespace-nowrap">
                    face_swap
                  </span>
                  <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-alert" />
                  <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-alert" />
                </div>
              </div>

              {/* Scan line */}
              <div className="absolute inset-x-0 top-0 h-px bg-accent shadow-glow-accent animate-[scan_3.4s_ease-in-out_infinite]" />
              <style>{`
                @keyframes scan {
                  0%, 100% { transform: translateY(8px);   opacity: 0.25; }
                  50%      { transform: translateY(300px); opacity: 1; }
                }
              `}</style>

              {/* Readout */}
              <div className="absolute bottom-3 right-3 bg-canvas/90 backdrop-blur border border-line rounded-lg px-3 py-2.5 font-mono text-2xs leading-relaxed">
                <div className="text-accent mb-1">status: analyzing</div>
                <div className="text-ink-lo">psnr <span className="text-ink-hi">29.5 dB</span></div>
                <div className="text-ink-lo">confidence <span className="text-alert">94.3%</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two-step flow ── */}
      <section className="border-y border-line bg-white/[0.012] py-24">
        <div className="page">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink-hi mb-12 max-w-lg">
            Two simple steps to protect your media
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[
              {
                step: 'Step 1', title: 'Encode watermark', icon: 'lucide:layers', page: 'encode' as Page,
                desc: "Upload your original image or video. We embed an invisible semi-fragile watermark using a LWT + DCT + SVD + QIM pipeline. Download the protected file and share it freely.",
                points: ['Invisible to the human eye', 'Survives normal compression', 'PSNR quality above 28 dB'],
              },
              {
                step: 'Step 2', title: 'Verify integrity', icon: 'lucide:scan-search', page: 'verify' as Page,
                desc: "Upload a watermarked file you suspect was tampered with. Our system extracts the watermark signal and localizes any modifications — spatially and temporally.",
                points: ['Detects face swap, inpainting & splicing', 'Highlights exact tampered regions', 'Per-frame analysis for video'],
              },
            ].map(c => (
              <button
                key={c.title}
                onClick={() => navigate(c.page)}
                className="card-lift p-7 flex flex-col gap-5 text-left group hover:border-accent-line"
              >
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-xl bg-accent-soft border border-accent-line text-accent flex items-center justify-center">
                    <Icon icon={c.icon} width="21" />
                  </span>
                  <span className="label">{c.step}</span>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-ink-hi mb-2">{c.title}</h3>
                  <p className="text-sm text-ink-lo leading-relaxed">{c.desc}</p>
                </div>

                <ul className="flex flex-col gap-2.5 mt-auto pt-2">
                  {c.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-ink">
                      <Icon icon="lucide:check" width="15" className="text-accent shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>

                <span className="flex items-center gap-1.5 text-sm font-semibold text-accent mt-1">
                  Go to {c.title.split(' ')[0]}
                  <Icon icon="lucide:arrow-right" width="15"
                        className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section className="page py-24">
        <div className="text-center mb-14">
          <p className="eyebrow mb-3">Full pipeline</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink-hi">
            From upload to result in seconds
          </h2>
        </div>

        <ol className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {PIPELINE.map(s => (
            <li key={s.n} className="relative pt-5 border-t border-line">
              {/* The step number doubles as the tick mark on the rule above it. */}
              <span className="absolute -top-px left-0 w-10 h-px bg-accent" />
              <span className="block font-mono text-2xs text-accent mb-3">{s.n}</span>
              <h3 className="text-base font-medium text-ink-hi mb-1.5">{s.title}</h3>
              <p className="text-sm text-ink-lo leading-relaxed">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Use cases ── */}
      <section className="border-t border-line bg-white/[0.012] py-24">
        <div className="page">
          <div className="text-center mb-14">
            <p className="eyebrow mb-3">Applications</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-hi">
              Built for real-world integrity needs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map(u => (
              <div key={u.label} className="card-lift flex items-center gap-4 px-5 py-4">
                <span className="w-10 h-10 rounded-lg bg-white/[0.04] border border-line
                                 flex items-center justify-center text-ink-lo shrink-0">
                  <Icon icon={u.icon} width="19" />
                </span>
                <div>
                  <div className="text-base font-medium text-ink-hi">{u.label}</div>
                  <div className="text-xs text-ink-lo leading-snug mt-0.5">{u.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="page py-24">
        <div className="card relative overflow-hidden px-8 py-16 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-40 bg-accent/[0.10] blur-[90px] pointer-events-none" />

          <h2 className="font-display text-3xl sm:text-4xl text-ink-hi mb-4 relative">
            Start protecting your media today
          </h2>
          <p className="page-lead max-w-md mx-auto mb-9 relative">
            Encode a watermark in seconds. Verify integrity anytime, anywhere.
          </p>
          <div className="flex justify-center gap-3 flex-wrap relative">
            <button onClick={() => navigate('encode')} className="btn-primary btn-lg">
              Encode watermark
              <Icon icon="lucide:arrow-right" width="16" />
            </button>
            <button onClick={() => navigate('verify')} className="btn-ghost btn-lg">
              Verify a file
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
