import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Encode from './pages/Encode'
import Verify from './pages/Verify'
import Results from './pages/Results'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import { AuthProvider, useAuth } from './context/auth'

export type Page =
  | 'home' | 'encode' | 'verify' | 'results' | 'about'
  | 'login' | 'register' | 'dashboard' | 'forgot'

export interface TamperedRegion {
  x: number; y: number; w: number; h: number; label: string
}

export interface FrameResult {
  frame: number
  status: 'tampered' | 'authentic' | 'deleted'
  /** Measured fragile-layer bit error rate for this frame. null on a deleted
   *  frame — there is nothing left to measure. */
  ber?: number | null
  blocksTampered?: number
  blocksTotal?: number
  tamperedRegions?: TamperedRegion[]
  // Per-frame fragile-watermark comparison (only present for tampered frames).
  watermarkOriginal?: string
  watermarkExtracted?: string
}

export interface AnalysisResult {
  status: 'tampered' | 'authentic'
  /** Fraction of fragile-watermark parity bits recovered intact (1 - ber). */
  wmAccuracy: number
  /** Real bit error rate: fraction of parity bits that flipped. */
  ber: number
  /** Fraction of 32x32 blocks flagged — a localisation ratio, not a bit rate.
   *  Kept separate from `ber` because conflating the two is what made the old
   *  "Bit Error Rate" metric misleading. */
  blockFlagRatio?: number
  /** Why the verdict was `tampered`, in plain language. Empty when authentic.
   *  Replaces the old synthesised "confidence" score, which measured
   *  cleanliness and so inverted on a tampered verdict. */
  reasons?: string[]
  tamperedRegions: TamperedRegion[]
  frameResults?: FrameResult[]
  fileName: string
  fileType: 'image' | 'video'
  watermarkFound?: boolean
  ownerMatch?: boolean
  mediaMatch?: boolean
  // Recovered: the raw strings actually extracted from the watermark. Present
  // even when they don't match, so the UI can show what was really in the file.
  ownerId?: string
  mediaId?: string
  // Expected: the human-readable labels from the metadata / database record.
  // Display only — never evidence of what the file contains.
  ownerLabel?: string
  mediaLabel?: string
  /** The 8-char owner tag the metadata says should be embedded. Distinct from
   *  `ownerLabel` (an email) — this is the value `ownerId` is comparable to,
   *  so both can be shown side by side rather than asserting a match. */
  ownerExpected?: string
  /**
   * Rebuilt from a stored verification record rather than produced by a live
   * check. Only a summary is kept — the heatmap, watermark comparison and
   * frame timeline all derive from pixels the server deliberately does not
   * retain — so those sections are suppressed rather than rendered empty.
   */
  archived?: boolean
  /** When the archived check was originally run. */
  checkedAt?: string
  /** Flagged / total 32x32 spatial blocks for an image check. */
  blocksTampered?: number
  blocksTotal?: number
  framesChecked?: number
  frameTamperRate?: number
  imageWidth?: number
  imageHeight?: number
  // Temporal localization for video: deletions/reorders surfaced as discrete
  // events instead of cascading across every later frame.
  missingFrames?: number[]
  framesDeleted?: number
  reordered?: boolean
  duplicateFrames?: number[]
  framesTruncated?: number
  // PNG data URLs of the fragile watermark: the expected pattern vs. the one
  // extracted from this file (tampered bits highlighted red) — for the
  // side-by-side comparison on the Results page.
  watermarkOriginal?: string
  watermarkExtracted?: string
}

export default function App() {
  // AppShell is a separate component because it calls useAuth(), which only
  // works beneath the provider.
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

function AppShell() {
  const { recoveryToken } = useAuth()
  const [page, setPage] = useState<Page>('home')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const navigate = (p: Page) => {
    setPage(p)
    window.scrollTo(0, 0)
  }

  // A recovery link lands on whatever page the app opens at, with the token in
  // the URL hash. Once the provider has picked it up, take the user straight
  // to the reset form — otherwise they'd sit on the home page holding a valid
  // one-shot token with nothing prompting them to use it.
  useEffect(() => {
    if (recoveryToken) {
      setPage('forgot')
      window.scrollTo(0, 0)
    }
  }, [recoveryToken])

  const handleVerifyComplete = (r: AnalysisResult) => {
    setResult(r)
    navigate('results')
  }

  return (
    <div className="min-h-screen flex flex-col">

      <Navbar currentPage={page} navigate={navigate} />

      {/* Home stretches edge-to-edge under the transparent navbar; other
          pages get pt-16 so the fixed nav doesn't cover their content.
          `key` restarts the enter animation on every navigation. */}
      <main key={page} className={`flex-1 animate-fade-in ${page === 'home' ? '' : 'pt-16'}`}>
        {page === 'home'      && <Home navigate={navigate} />}
        {page === 'encode'    && <Encode navigate={navigate} />}
        {page === 'verify'    && <Verify onComplete={handleVerifyComplete} />}
        {page === 'results'   && <Results result={result} navigate={navigate} />}
        {page === 'about'     && <About />}
        {page === 'login'     && <Login navigate={navigate} />}
        {page === 'register'  && <Register navigate={navigate} />}
        {page === 'dashboard' && <Dashboard navigate={navigate} onOpenResult={handleVerifyComplete} />}
        {page === 'forgot'    && <ForgotPassword navigate={navigate} />}
      </main>

      <Footer navigate={navigate} />
    </div>
  )
}