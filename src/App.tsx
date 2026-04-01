import { useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Encode from './pages/Encode'
import Verify from './pages/Verify'
import Results from './pages/Results'
import About from './pages/About'

export type Page = 'home' | 'encode' | 'verify' | 'results' | 'about'

export interface TamperedRegion {
  x: number; y: number; w: number; h: number; label: string
}

export interface FrameResult {
  frame: number
  status: 'tampered' | 'authentic'
  confidence: number
}

export interface AnalysisResult {
  status: 'tampered' | 'authentic'
  confidence: number
  psnr: number
  wmAccuracy: number
  ber: number
  tamperedRegions: TamperedRegion[]
  frameResults?: FrameResult[]
  fileName: string
  fileType: 'image' | 'video'
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const navigate = (p: Page) => { 
    setPage(p)
    window.scrollTo(0, 0) 
  }

  const handleVerifyComplete = (r: AnalysisResult) => {
    setResult(r)
    navigate('results')
  }

  return (
    // 1. Applied the global dark theme background, text colors, and custom selection color
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-slate-300 font-sans selection:bg-cyan-500/30">
      
      <Navbar currentPage={page} navigate={navigate} />
      
      {/* 2. Conditional padding: 
        Home stretches to the absolute top (0 padding) so it sits behind the transparent navbar.
        Other pages get pt-[72px] so their content doesn't hide behind the navbar.
      */}
      <main className={`flex-1 ${page === 'home' ? '' : 'pt-[72px]'}`}>
        {page === 'home'    && <Home navigate={navigate} />}
        {page === 'encode'  && <Encode />}
        {page === 'verify'  && <Verify onComplete={handleVerifyComplete} />}
        {page === 'results' && <Results result={result} navigate={navigate} />}
        {page === 'about'   && <About />}
      </main>
      
    </div>
  )
}