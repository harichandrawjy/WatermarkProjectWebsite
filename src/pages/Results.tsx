import type { AnalysisResult, Page } from '../App'
import { Icon } from '@iconify/react'

interface ResultsProps {
  result: AnalysisResult | null
  navigate: (p: Page) => void
}

interface MetricCardProps {
  label: string; value: string; sub?: string; danger?: boolean; highlight?: boolean
}

function MetricCard({ label, value, sub, danger, highlight }: MetricCardProps) {
  return (
    <div className={`rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group
      ${danger ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_10px_30px_-10px_rgba(244,63,94,0.15)]' : 
        highlight ? 'bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-[0_10px_30px_-10px_rgba(34,211,238,0.15)]' : 
        'bg-[#111318] border-white/5 hover:border-white/20'}`}>
      
      {/* Background ambient glow on hover */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
        ${danger ? 'bg-rose-500/10' : highlight ? 'bg-cyan-500/10' : 'bg-white/5'}`} />

      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 relative z-10">{label}</p>
      <p className={`font-display text-[2rem] font-medium leading-none mb-2 relative z-10
        ${danger ? 'text-rose-400' : highlight ? 'text-cyan-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[12px] text-slate-400 relative z-10">{sub}</p>}
    </div>
  )
}

export default function Results({ result, navigate }: ResultsProps) {
  
  // Empty State
  if (!result) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-7 text-center relative z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="w-20 h-20 rounded-full bg-[#111318] border border-white/5 flex items-center justify-center text-slate-600 shadow-xl">
        <Icon icon="lucide:file-search" width="32" strokeWidth="1.5" />
      </div>
      <div>
        <h2 className="font-display text-[2rem] text-white font-medium mb-2">No Analysis Yet</h2>
        <p className="text-slate-400 max-w-[320px] mx-auto text-[15px]">Upload a watermarked file and run the detection pipeline to view the integrity report.</p>
      </div>
      <button onClick={() => navigate('verify')}
        className="px-8 py-4 mt-2 bg-cyan-500 text-slate-950 rounded-xl font-bold hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">
        Go to Verification →
      </button>
    </div>
  )

  const { status, confidence, wmAccuracy, ber, tamperedRegions, frameResults, fileName, fileType, imageWidth, imageHeight } = result
  const tampered = status === 'tampered'

  return (
    <div className="max-w-[1100px] mx-auto px-7 pb-32 relative z-10">
      
      {/* Background Ambient Glows */}
      <div className={`absolute top-[0%] right-[10%] w-[30%] h-[20%] blur-[120px] rounded-full pointer-events-none -z-10 transition-colors duration-1000 ${tampered ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`} />

      {/* Header */}
      <div className="pt-16 pb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 border-b border-white/5 mb-10">
        <div>
          <button onClick={() => navigate('verify')}
            className="flex items-center gap-2 text-[12px] font-bold tracking-widest uppercase text-cyan-400 hover:text-cyan-300 mb-6 transition-colors group">
            <Icon icon="lucide:arrow-left" width="14" className="group-hover:-translate-x-1 transition-transform" /> 
            New Analysis
          </button>
          <h1 className="font-display text-[clamp(2.5rem,4vw,3.5rem)] text-white font-semibold leading-tight mb-3 tracking-tight">Analysis Report</h1>
          <p className="flex items-center gap-2 text-[14px] text-slate-400 font-mono bg-white/5 inline-flex px-3 py-1.5 rounded-lg border border-white/5">
            <Icon icon="lucide:file-terminal" width="16" className="text-cyan-400" />
            {fileName}
          </p>
        </div>

        {/* Verdict Badge */}
        <div className={`flex items-center gap-5 px-8 py-6 rounded-3xl border shadow-2xl backdrop-blur-md
          ${tampered ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_10px_40px_-10px_rgba(244,63,94,0.2)]' : 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)]'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${tampered ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
            <Icon icon={tampered ? "lucide:shield-alert" : "lucide:shield-check"} width="28" strokeWidth="2" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Final Verdict</p>
            <p className={`font-display text-[1.8rem] font-bold tracking-wide leading-none mb-1 ${tampered ? 'text-rose-400' : 'text-emerald-400'}`}>
              {tampered ? 'TAMPERED' : 'AUTHENTIC'}
            </p>
            <p className={`text-[13px] font-medium ${tampered ? 'text-rose-400/70' : 'text-emerald-400/70'}`}>
              {(confidence * 100).toFixed(1)}% confidence score
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
        <MetricCard label="Detection Status" value={tampered ? 'Tampered' : 'Authentic'} sub="Watermark integrity check" danger={tampered} highlight={!tampered} />
        <MetricCard label="WM Accuracy" value={`${(wmAccuracy * 100).toFixed(1)}%`} sub="Watermark bit recovery rate" />
        <MetricCard label="Bit Error Rate" value={ber.toFixed(4)} sub="BER (lower = better integrity)" />
        <MetricCard label="Regions Flagged" value={String(tamperedRegions.length)} sub={tampered ? 'Areas of concern localized' : 'No regions flagged'} danger={tampered && tamperedRegions.length > 0} />
        <MetricCard label="Media Type" value={fileType === 'video' ? 'Video' : 'Image'} sub="Analyzed file format container" />
      </div>

      {/* Tampered Regions Table */}
      {tampered && tamperedRegions.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Icon icon="lucide:focus" className="text-rose-400" width="24" />
            <div>
              <h2 className="text-[22px] font-medium text-white leading-none mb-1">Spatial Localization</h2>
              <p className="text-slate-400 text-[14px]">Coordinates of detected malicious manipulation</p>
            </div>
          </div>
          
          <div className="bg-[#111318] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-[14px] border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/10">
                    {['ID','Classification','Coordinates (x, y)','Dimensions (w × h)','Status'].map(h => (
                      <th key={h} className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tamperedRegions.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 text-slate-500 font-mono">{(i + 1).toString().padStart(2, '0')}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[12px] bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-md text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.05)]">
                          {r.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono">[{r.x}, {r.y}]</td>
                      <td className="px-6 py-4 text-slate-300 font-mono">{r.w}px × {r.h}px</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold tracking-widest uppercase rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          Altered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Frame Timeline (Video Only) */}
      {fileType === 'video' && frameResults && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Icon icon="lucide:film" className="text-cyan-400" width="24" />
            <div>
              <h2 className="text-[22px] font-medium text-white leading-none mb-1">Temporal Analysis</h2>
              <p className="text-slate-400 text-[14px]">Per-frame tampering detection across the timeline</p>
            </div>
          </div>
          
          <div className="bg-[#111318] border border-white/10 rounded-3xl p-8 shadow-xl">
            <div className="flex flex-wrap gap-2 mb-6">
              {frameResults.map(f => {
                const isT = f.status === 'tampered'
                return (
                  <div key={f.frame}
                    title={`Frame ${f.frame}: ${f.status.toUpperCase()} (${(f.confidence * 100).toFixed(0)}%)`}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-[12px] font-mono font-bold cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-1
                      ${isT 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:bg-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-500/20'}`}>
                    {f.frame}
                  </div>
                )
              })}
            </div>
            
            <div className="flex gap-6 text-[12px] font-bold tracking-widest uppercase text-slate-500 border-t border-white/5 pt-6 mt-2">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500/50 border border-emerald-500" /> Authentic Frame</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-rose-500/50 border border-rose-500" /> Tampered Frame</span>
            </div>
          </div>
        </section>
      )}

      {/* Attention Heatmap */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Icon icon="lucide:activity" className="text-cyan-400" width="24" />
          <div>
            <h2 className="text-[22px] font-medium text-white leading-none mb-1">Signal Attention Map</h2>
            <p className="text-slate-400 text-[14px]">Regions where the neural watermark signal was disrupted</p>
          </div>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center gap-10">
          
          {/* Signal Attention Heatmap — 32×32 grid scaled to actual image coordinates */}
          <div className="w-full max-w-[480px] p-2 bg-[#0a0a0c] rounded-2xl border border-white/5 shadow-inner">
            {(() => {
              const COLS = 32
              const ROWS = 32
              // Fallback: if backend didn't send image dimensions, assume square sized
              // by the largest tampered-region extent. Avoids false aspect-ratio distortion.
              const fallbackMax = tamperedRegions.length > 0
                ? Math.max(...tamperedRegions.flatMap(r => [r.x + r.w, r.y + r.h]))
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

                const hits = tamperedRegions.filter(r =>
                  r.x < cellXEnd && (r.x + r.w) > cellX &&
                  r.y < cellYEnd && (r.y + r.h) > cellY
                ).length
                const inRegion = hits > 0
                const heat = inRegion ? Math.min(0.5 + hits * 0.15, 1) : 0.15

                return (
                  <div key={i} style={{
                    backgroundColor: inRegion ? `rgba(244, 63, 94, ${heat})` : `rgba(34, 211, 238, ${heat * 0.25})`,
                    boxShadow: inRegion ? `0 0 ${4 * heat}px rgba(244, 63, 94, ${heat * 0.4})` : 'none',
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
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[13px] text-slate-300">
              <div className="w-4 h-4 rounded bg-rose-500/80 border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
              <span className="font-medium">High Disruption (Tampered)</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-slate-300">
              <div className="w-4 h-4 rounded bg-cyan-500/20 border border-cyan-500/30" />
              <span className="font-medium">Stable Signal (Authentic)</span>
            </div>
            <p className="text-[13px] text-slate-500 max-w-[300px] mt-4 leading-relaxed border-l-2 border-white/10 pl-4">
              The neural decoder highlights grid cells where the expected HIDDeN bit payload deviates significantly from the extracted payload, indicating spatial manipulation.
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 pt-4">
        <button onClick={() => navigate('verify')}
          className="px-8 py-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all text-[15px] flex items-center gap-2">
          <Icon icon="lucide:scan-line" width="18" />
          Analyze Another File
        </button>
        <button onClick={() => {
          const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
          a.download = `waterguard_report_${Date.now()}.json`; a.click()
        }} className="px-8 py-4 bg-[#111318] border border-white/10 text-white font-medium rounded-xl hover:bg-white/5 hover:border-white/20 transition-all text-[15px] flex items-center gap-2">
          <Icon icon="lucide:download" width="18" />
          Download Raw JSON Report
        </button>
      </div>

    </div>
  )
}