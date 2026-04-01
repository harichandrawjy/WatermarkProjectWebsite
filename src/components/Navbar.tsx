import { useState, useEffect } from 'react'
import type { Page } from '../App'

interface NavbarProps {
  currentPage: Page
  navigate: (p: Page) => void
}

const LINKS: { label: string; page: Page }[] = [
  { label: 'Home',   page: 'home'   },
  { label: 'Encode', page: 'encode' },
  { label: 'Verify', page: 'verify' },
  { label: 'About',  page: 'about'  },
]

export default function Navbar({ currentPage, navigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 h-[72px] transition-all duration-300 border-b
      ${scrolled 
        ? 'bg-[#0a0a0c]/80 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]' 
        : 'bg-transparent border-transparent'}`}>

      <div className="max-w-[1100px] mx-auto px-7 h-full flex items-center justify-between">

        {/* ── Logo ── */}
        <button 
          onClick={() => navigate('home')}
          className="group flex items-center gap-2.5 font-display font-semibold text-[17px] text-white shrink-0 transition-opacity"
        >
          <span className="text-cyan-400 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.6)] group-hover:scale-105">
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="1" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M6 11h10M11 6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="11" cy="11" r="2.5" fill="currentColor"/>
            </svg>
          </span>
          <span className="tracking-wide">WaterGuard</span>
        </button>

        {/* ── Desktop Links ── */}
        <ul className="hidden md:flex items-center gap-2 list-none">
          {LINKS.map(({ label, page }) => {
            const isActive = currentPage === page
            return (
              <li key={page}>
                <button 
                  onClick={() => navigate(page)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold tracking-widest uppercase transition-all duration-200 border
                    ${isActive 
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                      : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                    }`}
                >
                  {label}
                </button>
              </li>
            )
          })}
        </ul>

        {/* ── Mobile Burger ── */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-[5px] p-2 rounded-lg hover:bg-white/5 transition-colors" 
          aria-label="Toggle Menu"
        >
          <span className={`block w-6 h-[2px] bg-slate-300 rounded-full transition-all duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45 bg-cyan-400' : ''}`} />
          <span className={`block w-6 h-[2px] bg-slate-300 rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-[2px] bg-slate-300 rounded-full transition-all duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45 bg-cyan-400' : ''}`} />
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div className={`md:hidden absolute top-[72px] left-0 right-0 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 overflow-hidden ${menuOpen ? 'max-h-[300px] opacity-100 border-opacity-100' : 'max-h-0 opacity-0 border-opacity-0'}`}>
        <div className="flex flex-col px-5 py-4 gap-2">
          {LINKS.map(({ label, page }) => {
            const isActive = currentPage === page
            return (
              <button 
                key={page} 
                onClick={() => { navigate(page); setMenuOpen(false) }}
                className={`text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 flex items-center gap-3
                  ${isActive 
                    ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' 
                    : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
                  }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />}
                {label}
              </button>
            )
          })}
        </div>
      </div>
      
    </nav>
  )
}