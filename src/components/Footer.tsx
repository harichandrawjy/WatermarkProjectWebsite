import { Icon } from '@iconify/react'
import type { Page } from '../App'

interface FooterProps { navigate: (p: Page) => void }

const COLUMNS: { heading: string; links: { label: string; page: Page }[] }[] = [
  {
    heading: 'Pipeline',
    links: [
      { label: 'Encode',    page: 'encode' },
      { label: 'Verify',    page: 'verify' },
      { label: 'Report',    page: 'results' },
    ],
  },
  {
    heading: 'Project',
    links: [
      { label: 'Overview',  page: 'home' },
      { label: 'About',     page: 'about' },
      { label: 'Dashboard', page: 'dashboard' },
    ],
  },
]

export default function Footer({ navigate }: FooterProps) {
  return (
    <footer className="border-t border-line mt-24">
      <div className="page py-14 grid grid-cols-2 md:grid-cols-4 gap-10">

        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-2.5 text-ink-hi font-display text-lg mb-3">
            <Icon icon="lucide:shield-check" width="20" className="text-accent" />
            Aegis
          </div>
          <p className="text-sm text-ink-lo leading-relaxed max-w-xs">
            Invisible semi-fragile watermarking for media provenance — embed once,
            verify integrity down to the pixel and frame.
          </p>
        </div>

        {COLUMNS.map(col => (
          <nav key={col.heading}>
            <p className="label mb-4">{col.heading}</p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map(l => (
                <li key={l.label}>
                  <button
                    onClick={() => navigate(l.page)}
                    className="text-sm text-ink-lo hover:text-ink-hi transition-colors"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="page border-t border-line py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          Graduation project · LWT + DCT + SVD + QIM · BCH(15,7)
        </p>
        <p className="text-xs text-ink-faint font-mono">
          Lossless output only — PNG / MKV FFV1
        </p>
      </div>
    </footer>
  )
}
