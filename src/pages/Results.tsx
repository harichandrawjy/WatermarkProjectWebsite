import { useState } from 'react'
import type { AnalysisResult, Page } from '../App'
import { Icon } from '@iconify/react'

interface ResultsProps {
  result: AnalysisResult | null
  navigate: (p: Page) => void
}

interface MetricProps {
  label: string; value: string; sub?: string; tone?: 'alert' | 'ok' | 'neutral'
}

/** A single readout in the metrics strip.
 *
 * Deliberately flat — no hover lift, no glow. On a forensics report the numbers
 * are the content; decorating each one competes with the verdict for attention. */
function Metric({ label, value, sub, tone = 'neutral' }: MetricProps) {
  const valueTone =
    tone === 'alert' ? 'text-alert' :
    tone === 'ok'    ? 'text-ok'    : 'text-ink-hi'
  return (
    <div className="px-5 py-5">
      <p className="label mb-2.5">{label}</p>
      <p className={`font-display text-2xl leading-none mb-2 ${valueTone}`}>{value}</p>
      {sub && <p className="text-xs text-ink-lo leading-snug">{sub}</p>}
    </div>
  )
}

/** Section heading used down the length of the report. */
function SectionHead({ icon, tone, title, sub }: { icon: string; tone: string; title: string; sub: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <Icon icon={icon} className={`${tone} shrink-0 mt-0.5`} width="20" />
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="section-sub">{sub}</p>
      </div>
    </div>
  )
}

/** Render a recovered id safely.
 *
 * A corrupted payload decodes to arbitrary bytes — the decoder happily returns
 * things like `7nnzgb\x0ed`. Control characters draw as invisible gaps, which
 * reads as a broken page rather than as evidence of damage, so escape them.
 */
function printable(s: string): string {
  return Array.from(s).map(ch => {
    const c = ch.codePointAt(0)!
    return (c < 0x20 || c === 0x7f)
      ? `\\x${c.toString(16).padStart(2, '0')}`
      : ch                       // U+FFFD already renders visibly as a glyph
  }).join('')
}

interface ExtractedLineProps {
  /** The human-readable value from the metadata — what we expected to find. */
  expected?: string
  /** What the decoder actually pulled out of the pixels. */
  recovered?: string
  matched?: boolean
}

/** The small mono line under each identity card.
 *
 * The card's headline shows the readable label (an email, a media name). That
 * label comes from the metadata you supplied, so on its own it is not evidence
 * of anything. This line shows what was genuinely extracted from the file —
 * and on a mismatch, shows it next to the expected value so a corrupted
 * payload is visible rather than hidden behind a "Mismatch" badge.
 */
function ExtractedLine({ expected, recovered, matched }: ExtractedLineProps) {
  if (!recovered) {
    return <p className="meta mt-2">nothing recovered from the file</p>
  }
  // Only worth showing both when they actually differ — when the label IS the
  // recovered value there's nothing to compare.
  const showBoth = matched === false && expected && expected !== recovered
  return (
    <p className="meta mt-2 break-all">
      {showBoth && <>expected <span className="text-ink">{expected}</span> · </>}
      extracted{' '}
      <span className={matched === false ? 'text-alert' : 'text-ok'}>{printable(recovered)}</span>
    </p>
  )
}

export default function Results({ result, navigate }: ResultsProps) {
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)

  // Empty state
  if (!result) return (
    <div className="page-narrow flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <span className="w-16 h-16 rounded-2xl bg-surface border border-line text-ink-faint flex items-center justify-center">
        <Icon icon="lucide:file-search" width="28" strokeWidth="1.5" />
      </span>
      <div>
        <h1 className="font-display text-2xl text-ink-hi mb-2">No analysis yet</h1>
        <p className="text-base text-ink-lo">
          Upload a watermarked file and run the detection pipeline to view the integrity report.
        </p>
      </div>
      <button onClick={() => navigate('verify')} className="btn-primary btn-lg">
        Go to verification
        <Icon icon="lucide:arrow-right" width="16" />
      </button>
    </div>
  )

  const { status, wmAccuracy, ber, reasons, tamperedRegions, frameResults, fileName, fileType, imageWidth, imageHeight,
          watermarkFound, ownerMatch, mediaMatch, ownerId, mediaId, ownerLabel, mediaLabel,
          watermarkOriginal, watermarkExtracted,
          missingFrames, reordered, duplicateFrames, framesTruncated } = result
  const tampered = status === 'tampered'

  // If the backend didn't explicitly say, infer "found" from whether anything
  // was actually recovered from the pixels — NOT from the supplied metadata,
  // which is present whether or not the file contains a watermark.
  const wmFound = watermarkFound ?? (wmAccuracy >= 0.5 || Boolean(ownerId || mediaId))

  // For video, the spatial heatmap reflects whichever frame is selected;
  // image results use the single top-level tamperedRegions array.
  const activeFrame = fileType === 'video' && frameResults
    ? (frameResults.find(f => f.frame === selectedFrame) ?? frameResults[0])
    : null
  const heatmapRegions = activeFrame
    ? (activeFrame.tamperedRegions ?? [])
    : tamperedRegions

  // Fragile-watermark comparison images: for video they come from the
  // selected frame (every frame carries them); for images they're the single
  // top-level pair.  Deleted frames have an "original" but nothing extracted.
  const wmOrig = fileType === 'video' ? activeFrame?.watermarkOriginal : watermarkOriginal
  const wmExt  = fileType === 'video' ? activeFrame?.watermarkExtracted : watermarkExtracted
  const activeIsDeleted = fileType === 'video' && activeFrame?.status === 'deleted'

  // Temporal anomalies (video only) — deletions / reorders / truncation that
  // the decoder localized without cascading across later frames.
  const hasTemporalAnomaly = fileType === 'video' && (
    (missingFrames?.length ?? 0) > 0 ||
    (duplicateFrames?.length ?? 0) > 0 ||
    Boolean(reordered) ||
    (framesTruncated ?? 0) > 2
  )

  return (
    <div className="page pb-8">

      {/* ── Header + verdict ── */}
      <header className="pt-16 pb-10">
        <button onClick={() => navigate('verify')} className="btn-quiet btn-sm -ml-3.5 mb-6 group">
          <Icon icon="lucide:arrow-left" width="14"
                className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          New analysis
        </button>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="min-w-0">
            <h1 className="page-title mb-4">Analysis report</h1>
            <p className="meta flex items-center gap-2 min-w-0">
              <Icon icon="lucide:file-terminal" width="15" className="text-ink-faint shrink-0" />
              <span className="truncate">{fileName}</span>
            </p>
          </div>

          {/* The one element on the page that earns a glow. */}
          <div className={`flex items-center gap-5 px-7 py-5 rounded-2xl border shrink-0
            ${tampered
              ? 'bg-alert-soft border-alert-line shadow-glow-alert'
              : 'bg-ok-soft border-ok-line shadow-glow-ok'}`}>
            <span className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0
              ${tampered ? 'border-alert-line text-alert' : 'border-ok-line text-ok'}`}>
              <Icon icon={tampered ? 'lucide:shield-alert' : 'lucide:shield-check'} width="26" />
            </span>
            <div>
              <p className="label mb-1">Final verdict</p>
              <p className={`font-display text-3xl leading-none mb-1.5 ${tampered ? 'text-alert' : 'text-ok'}`}>
                {tampered ? 'Tampered' : 'Authentic'}
              </p>
              {/* The reason it was flagged, not a synthesised confidence
                  percentage. A tampered file can be pixel-clean (identity
                  destroyed by re-encoding, or a frame deleted), so a score
                  derived from cleanliness used to read "100% confidence"
                  on exactly the cases that most needed explaining. */}
              <p className="text-xs text-ink-lo">
                {tampered
                  ? (reasons?.length ? reasons[0] : 'integrity check failed')
                  : 'all integrity checks passed'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Why it was flagged ──
          A tampered verdict is a single boolean OR'd from unrelated signals,
          so the verdict alone can't say whether the file was edited, re-encoded
          past recovery, or had frames removed. Listing the triggers is both
          truthful and more actionable than a percentage. */}
      {tampered && (reasons?.length ?? 0) > 0 && (
        <div className="card p-5 mb-6 border-alert-line bg-alert-soft">
          <p className="label mb-3 text-alert">Why this was flagged</p>
          <ul className="flex flex-col gap-2">
            {reasons!.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                <Icon icon="lucide:alert-triangle" width="15"
                      className="text-alert shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Metrics ── */}
      <div className="card grid grid-cols-2 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-line mb-14 overflow-hidden">
        <Metric label="Detection" value={tampered ? 'Tampered' : 'Authentic'}
                sub="Watermark integrity check" tone={tampered ? 'alert' : 'ok'} />
        <Metric label="WM accuracy" value={`${(wmAccuracy * 100).toFixed(1)}%`}
                sub="Watermark bit recovery rate" />
        <Metric label="Bit error rate" value={ber.toFixed(4)}
                sub="Fragile-layer parity bits flipped" />
        <Metric label="Regions flagged" value={String(heatmapRegions.length)}
                sub={activeFrame
                  ? `In frame ${activeFrame.frame}`
                  : (tampered ? 'Areas of concern localized' : 'No regions flagged')}
                tone={heatmapRegions.length > 0 ? 'alert' : 'neutral'} />
        <Metric label="Media type" value={fileType === 'video' ? 'Video' : 'Image'}
                sub="Analyzed file container" />
      </div>

      {/* ── Watermark identity ── */}
      <section className="mb-14">
        <SectionHead
          icon="lucide:fingerprint"
          tone={wmFound ? 'text-accent' : 'text-alert'}
          title="Watermark identity"
          sub={wmFound
            ? 'Embedded ownership signature recovered from the media'
            : 'No recoverable watermark signature was found in this file'}
        />

        <div className={`card p-6 ${wmFound ? '' : 'border-alert-line'}`}>
          <span className={`${wmFound ? 'pill-ok' : 'pill-alert'} mb-5`}>
            <Icon icon={wmFound ? 'lucide:check-circle-2' : 'lucide:x-circle'} width="13" />
            {wmFound ? 'Media ID and owner ID found' : 'Media ID and owner ID not found'}
          </span>

          {wmFound ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: 'lucide:hash', label: 'Media ID', match: mediaMatch,
                  display: mediaLabel || mediaId, expected: mediaLabel, recovered: mediaId },
                { icon: 'lucide:user', label: 'Owner ID', match: ownerMatch,
                  display: ownerLabel || ownerId, expected: ownerLabel, recovered: ownerId },
              ].map(f => (
                <div key={f.label} className="well px-5 py-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="label flex items-center gap-1.5">
                      <Icon icon={f.icon} width="12" /> {f.label}
                    </span>
                    {typeof f.match === 'boolean' && (
                      <span className={f.match ? 'badge-ok' : 'badge-alert'}>
                        {f.match ? 'Match' : 'Mismatch'}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-md text-ink-hi break-all">
                    {f.display || <span className="text-ink-faint">— not provided —</span>}
                  </p>
                  <ExtractedLine expected={f.expected} recovered={f.recovered} matched={f.match} />
                </div>
              ))}
            </div>
          ) : (
            <div className="callout-alert">
              <Icon icon="lucide:alert-triangle" className="text-alert shrink-0 mt-0.5" width="16" />
              <p>
                The decoder could not recover a valid watermark payload. This usually means the
                file was never protected with our Encode pipeline, or the watermark was destroyed
                by heavy re-encoding or cropping.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Tampered regions ── */}
      {tampered && tamperedRegions.length > 0 && (
        <section className="mb-14">
          <SectionHead
            icon="lucide:focus" tone="text-alert"
            title="Spatial localization"
            sub="Coordinates of detected malicious manipulation"
          />

          <div className="card overflow-hidden">
            {/* Scrolls vertically when there are many regions; the thead stays
                pinned via `sticky top-0` so column headers remain visible. */}
            <div className="overflow-auto max-h-[380px] scrollbar-dark">
              <table className="w-full text-base border-collapse min-w-[620px]">
                <thead className="sticky top-0 z-10 card-strip">
                  <tr>
                    {['#','Classification','Coordinates (x, y)','Dimensions (w × h)','Status'].map(h => (
                      <th key={h} className="label text-left px-5 py-3.5 border-b border-line whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tamperedRegions.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-mono text-sm text-ink-faint">{(i + 1).toString().padStart(2, '0')}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-alert bg-alert-soft border border-alert-line px-2 py-1 rounded">
                          {r.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-sm text-ink">[{r.x}, {r.y}]</td>
                      <td className="px-5 py-3.5 font-mono text-sm text-ink">{r.w} × {r.h}</td>
                      <td className="px-5 py-3.5"><span className="badge-alert">Altered</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Frame timeline (video only) ── */}
      {fileType === 'video' && frameResults && (
        <section className="mb-14">
          <SectionHead
            icon="lucide:film" tone="text-accent"
            title="Temporal analysis"
            sub="Per-frame tampering detection across the timeline"
          />

          <div className="card p-6">
            <div className="flex flex-wrap gap-1.5 mb-5">
              {frameResults.map(f => {
                const isDeleted = f.status === 'deleted'
                const isT = f.status === 'tampered'
                const isActive = (activeFrame?.frame ?? frameResults[0]?.frame) === f.frame
                return (
                  <button key={f.frame}
                    type="button"
                    onClick={() => setSelectedFrame(f.frame)}
                    title={isDeleted
                      ? `Frame ${f.frame}: DELETED — click to view its expected watermark`
                      : `Frame ${f.frame}: ${f.status.toUpperCase()}${
                          f.blocksTotal ? ` — ${f.blocksTampered}/${f.blocksTotal} blocks flagged` : ''
                        } — click to view spatial map`}
                    className={`w-11 h-11 rounded-lg flex items-center justify-center font-mono text-xs
                                border transition-colors duration-150
                      ${isDeleted
                        ? 'bg-alert-soft text-alert border-dashed border-alert-line hover:bg-alert/20'
                        : isT
                        ? 'bg-alert-soft text-alert border-alert-line hover:bg-alert/20'
                        : 'bg-ok-soft text-ok border-ok-line hover:bg-ok/20'}
                      ${isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}`}>
                    {isDeleted ? <Icon icon="lucide:trash-2" width="15" /> : f.frame}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5">
              {[
                { cls: 'bg-ok-soft border-ok-line',                       text: 'Authentic frame' },
                { cls: 'bg-alert-soft border-alert-line',                 text: 'Tampered frame' },
                { cls: 'bg-alert-soft border-dashed border-alert-line',   text: 'Deleted frame' },
              ].map(l => (
                <span key={l.text} className="flex items-center gap-2 label">
                  <span className={`w-3 h-3 rounded border ${l.cls}`} /> {l.text}
                </span>
              ))}
            </div>

            {/* Temporal integrity — deletions / reorders localized to specific
                frame_ids without cascading across later frames. */}
            <div className="border-t border-line pt-5 mt-5">
              {hasTemporalAnomaly ? (
                <div className="flex flex-col gap-2.5">
                  {(missingFrames?.length ?? 0) > 0 && (
                    <div className="callout-alert">
                      <Icon icon="lucide:trash-2" className="text-alert shrink-0 mt-0.5" width="15" />
                      <p>
                        <strong className="text-alert font-medium">{missingFrames!.length} frame(s) deleted</strong>
                        {' '}— missing frame ID{missingFrames!.length > 1 ? 's' : ''}:{' '}
                        <span className="font-mono text-alert">{missingFrames!.join(', ')}</span>.
                        Surviving frames remain authentic (no cascade).
                      </p>
                    </div>
                  )}
                  {reordered && (
                    <div className="callout-warn">
                      <Icon icon="lucide:shuffle" className="text-warn shrink-0 mt-0.5" width="15" />
                      <p>
                        <strong className="text-warn font-medium">Frames reordered</strong> — the
                        recovered frame-ID sequence is not monotonic.
                      </p>
                    </div>
                  )}
                  {(duplicateFrames?.length ?? 0) > 0 && (
                    <div className="callout-warn">
                      <Icon icon="lucide:copy" className="text-warn shrink-0 mt-0.5" width="15" />
                      <p>
                        <strong className="text-warn font-medium">Duplicate frames (replay)</strong> — frame ID(s):{' '}
                        <span className="font-mono text-warn">{duplicateFrames!.join(', ')}</span>.
                      </p>
                    </div>
                  )}
                  {(framesTruncated ?? 0) > 2 && (
                    <div className="callout-alert">
                      <Icon icon="lucide:scissors" className="text-alert shrink-0 mt-0.5" width="15" />
                      <p>
                        <strong className="text-alert font-medium">{framesTruncated} frame(s) truncated</strong>
                        {' '}from the end of the clip.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="flex items-center gap-2.5 text-sm text-ok">
                  <Icon icon="lucide:check-circle-2" width="15" />
                  Temporal integrity intact — no deletion, reorder, or truncation detected.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Extracted fragile watermark ── */}
      {wmOrig && (wmExt || activeIsDeleted) && (
        <section className="mb-14">
          <SectionHead
            icon="lucide:git-compare" tone="text-accent"
            title="Extracted watermark"
            sub={<>
              The fragile pattern that should be present vs. what was actually extracted
              {fileType === 'video' && activeFrame ? ` from frame ${activeFrame.frame}` : ' from this file'} —
              red bits mark where it was corrupted by tampering
            </>}
          />

          <div className="card p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <figure className="flex flex-col items-center gap-3">
                <figcaption className="pill-ok">
                  <Icon icon="lucide:badge-check" width="12" /> Original
                </figcaption>
                <div className="w-full max-w-[280px] aspect-square well overflow-hidden">
                  <img src={wmOrig} alt="original watermark"
                       className="w-full h-full object-contain"
                       style={{ imageRendering: 'pixelated' }} />
                </div>
                <p className="text-xs text-ink-lo">Expected pattern</p>
              </figure>

              <figure className="flex flex-col items-center gap-3">
                <figcaption className="pill-alert">
                  <Icon icon={activeIsDeleted ? 'lucide:trash-2' : 'lucide:alert-triangle'} width="12" />
                  {activeIsDeleted ? 'Deleted' : 'Extracted'}
                </figcaption>
                <div className="w-full max-w-[280px] aspect-square well overflow-hidden flex items-center justify-center">
                  {activeIsDeleted ? (
                    <div className="flex flex-col items-center gap-2 text-alert px-4 text-center">
                      <Icon icon="lucide:image-off" width="36" strokeWidth="1.5" />
                      <span className="text-xs">Frame deleted —<br />nothing to extract</span>
                    </div>
                  ) : (
                    <img src={wmExt} alt="extracted watermark"
                         className="w-full h-full object-contain"
                         style={{ imageRendering: 'pixelated' }} />
                  )}
                </div>
                <p className="text-xs text-ink-lo">
                  {activeIsDeleted
                    ? <span className="text-alert">This frame is missing from the clip</span>
                    : <>Recovered from file · <span className="text-alert">red = corrupted</span></>}
                </p>
              </figure>
            </div>

            <p className="text-sm text-ink-lo max-w-[640px] mx-auto mt-7 pt-6 border-t border-line text-center leading-relaxed">
              The fragile watermark is a pseudo-random parity pattern keyed to the media's
              identity, so it looks like noise — but any region that was edited flips its bits,
              surfacing as red blocks that pinpoint exactly where the tampering happened.
              {fileType === 'video' && ' Select a tampered (red) frame above to inspect its watermark.'}
            </p>
          </div>
        </section>
      )}

      {/* ── Sub-block parity map ── */}
      <section className="mb-14">
        <SectionHead
          icon="lucide:activity" tone="text-accent"
          title="Sub-block parity map"
          sub={activeFrame
            ? `Frame ${activeFrame.frame} · ${activeFrame.status === 'tampered' ? 'tampered' : 'authentic'} · click any frame above to switch`
            : 'Chroma sub-blocks where the SHA-256 LSB parity did not match'}
        />

        <div className="card p-6 flex flex-col md:flex-row items-center gap-8">

          {/* 32×32 grid scaled to actual image coordinates */}
          <div className="w-full max-w-[460px] p-2 well shrink-0">
            {(() => {
              const COLS = 32
              const ROWS = 32
              // Fallback: if backend didn't send image dimensions, assume square sized
              // by the largest tampered-region extent. Avoids false aspect-ratio distortion.
              const fallbackMax = heatmapRegions.length > 0
                ? Math.max(...heatmapRegions.flatMap(r => [r.x + r.w, r.y + r.h]))
                : 320
              const maxX = imageWidth  ?? fallbackMax
              const maxY = imageHeight ?? fallbackMax

              const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
                const col = i % COLS
                const row = Math.floor(i / COLS)
                const cellX    = (col / COLS) * maxX
                const cellXEnd = ((col + 1) / COLS) * maxX
                const cellY    = (row / ROWS) * maxY
                const cellYEnd = ((row + 1) / ROWS) * maxY

                const hits = heatmapRegions.filter(r =>
                  r.x < cellXEnd && (r.x + r.w) > cellX &&
                  r.y < cellYEnd && (r.y + r.h) > cellY
                ).length
                const inRegion = hits > 0
                const heat = inRegion ? Math.min(0.55 + hits * 0.15, 1) : 1

                return (
                  <div key={i} style={{
                    backgroundColor: inRegion
                      ? `rgba(244, 63, 94, ${heat})`
                      : 'rgba(255, 255, 255, 0.045)',
                  }} />
                )
              })

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  gap: '1px',
                  aspectRatio: `${maxX} / ${maxY}`,
                }}>
                  {cells}
                </div>
              )
            })()}
          </div>

          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-2.5 text-sm text-ink">
              <span className="w-3.5 h-3.5 rounded-sm bg-alert" /> High disruption (tampered)
            </span>
            <span className="flex items-center gap-2.5 text-sm text-ink">
              <span className="w-3.5 h-3.5 rounded-sm bg-white/[0.06] border border-line" /> Stable signal (authentic)
            </span>
            <p className="text-sm text-ink-lo max-w-[320px] mt-3 pl-4 border-l border-line leading-relaxed">
              A fixed 32×32 grid scaled to the image, so one cell covers a region rather than a
              single block. Red marks where flagged 32×32 blocks fall — those are blocks whose
              regenerated SHA-256 parity disagreed with the parity extracted from the chroma
              channel.
            </p>
          </div>
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('verify')} className="btn-primary btn-lg">
          <Icon icon="lucide:scan-line" width="17" />
          Analyze another file
        </button>
        <button onClick={() => {
          const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
          a.download = `aegis_report_${Date.now()}.json`; a.click()
        }} className="btn-ghost btn-lg">
          <Icon icon="lucide:download" width="17" />
          Download raw JSON report
        </button>
      </div>
    </div>
  )
}
