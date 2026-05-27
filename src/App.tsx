import { useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Encode from './pages/Encode'
import Verify from './pages/Verify'
import Results from './pages/Results'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './context/auth'

export type Page =
  | 'home' | 'encode' | 'verify' | 'results' | 'about'
  | 'login' | 'register' | 'dashboard'

export interface TamperedRegion {
  x: number; y: number; w: number; h: number; label: string
}

export interface FrameResult {
  frame: number
  status: 'tampered' | 'authentic'
  confidence: number
  tamperedRegions?: TamperedRegion[]
}

export interface AnalysisResult {
  status: 'tampered' | 'authentic'
  confidence: number
  wmAccuracy: number
  ber: number
  tamperedRegions: TamperedRegion[]
  frameResults?: FrameResult[]
  fileName: string
  fileType: 'image' | 'video'
  watermarkFound?: boolean
  ownerMatch?: boolean
  mediaMatch?: boolean
  ownerId?: string
  mediaId?: string
  framesChecked?: number
  frameTamperRate?: number
  imageWidth?: number
  imageHeight?: number
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
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-slate-300 font-sans selection:bg-cyan-500/30">

        <Navbar currentPage={page} navigate={navigate} />

        {/* Home stretches edge-to-edge under the transparent navbar; other
            pages get pt-[72px] so the fixed nav doesn't cover their content. */}
        <main className={`flex-1 ${page === 'home' ? '' : 'pt-[72px]'}`}>
          {page === 'home'      && <Home navigate={navigate} />}
          {page === 'encode'    && <Encode navigate={navigate} />}
          {page === 'verify'    && <Verify onComplete={handleVerifyComplete} />}
          {page === 'results'   && <Results result={result} navigate={navigate} />}
          {page === 'about'     && <About />}
          {page === 'login'     && <Login navigate={navigate} />}
          {page === 'register'  && <Register navigate={navigate} />}
          {page === 'dashboard' && <Dashboard navigate={navigate} />}
        </main>

      </div>
    </AuthProvider>
  )
}
