import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import type { Page } from '../App'
import { useAuth } from '../context/auth'

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
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close the account dropdown whenever the page changes.
  useEffect(() => { setAccountOpen(false) }, [currentPage])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 h-[72px] transition-all duration-300 border-b
      ${scrolled
        ? 'bg-[#0a0a0c]/80 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]'
        : 'bg-transparent border-transparent'}`}>

      <div className="max-w-[1100px] mx-auto px-7 h-full flex items-center justify-between gap-4">

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

        {/* ── Auth area (desktop) ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen(o => !o)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold tracking-widest uppercase border transition-all
                  ${accountOpen
                    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                    : 'text-slate-300 border-white/10 hover:bg-white/5 hover:text-white'}`}
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-[#0a0a0c] flex items-center justify-center text-[11px] font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </span>
                <span className="font-mono normal-case tracking-normal max-w-[140px] truncate">{user.email}</span>
                <Icon icon="lucide:chevron-down" width="14" className={`transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0c]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  <button
                    onClick={() => navigate('dashboard')}
                    className="w-full text-left px-4 py-3 text-[13px] text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <Icon icon="lucide:layout-dashboard" width="16" className="text-cyan-400" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('encode')}
                    className="w-full text-left px-4 py-3 text-[13px] text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors border-t border-white/5"
                  >
                    <Icon icon="lucide:plus" width="16" className="text-cyan-400" />
                    Encode New
                  </button>
                  <button
                    onClick={() => { logout(); navigate('home') }}
                    className="w-full text-left px-4 py-3 text-[13px] text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 flex items-center gap-3 transition-colors border-t border-white/5"
                  >
                    <Icon icon="lucide:log-out" width="16" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('login')}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold tracking-widest uppercase transition-all border
                  ${currentPage === 'login'
                    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                    : 'text-slate-300 border-transparent hover:text-white hover:bg-white/5'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('register')}
                className="px-4 py-2 rounded-xl text-[12px] font-bold tracking-widest uppercase bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

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
      <div className={`md:hidden absolute top-[72px] left-0 right-0 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 overflow-hidden ${menuOpen ? 'max-h-[500px] opacity-100 border-opacity-100' : 'max-h-0 opacity-0 border-opacity-0'}`}>
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

          <div className="border-t border-white/10 mt-2 pt-3 flex flex-col gap-2">
            {user ? (
              <>
                <p className="px-4 text-[11px] uppercase tracking-widest text-slate-500 mb-1">Signed in as</p>
                <p className="px-4 text-[13px] text-cyan-400 font-mono truncate">{user.email}</p>
                <button
                  onClick={() => { navigate('dashboard'); setMenuOpen(false) }}
                  className={`text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all flex items-center gap-3
                    ${currentPage === 'dashboard'
                      ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                      : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'}`}
                >
                  <Icon icon="lucide:layout-dashboard" width="16" /> Dashboard
                </button>
                <button
                  onClick={() => { logout(); navigate('home'); setMenuOpen(false) }}
                  className="text-left px-4 py-3 rounded-xl text-[14px] font-medium text-rose-300 hover:bg-rose-500/10 transition-all flex items-center gap-3 border border-transparent"
                >
                  <Icon icon="lucide:log-out" width="16" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { navigate('login'); setMenuOpen(false) }}
                  className="text-left px-4 py-3 rounded-xl text-[14px] font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center gap-3 border border-transparent"
                >
                  <Icon icon="lucide:log-in" width="16" /> Sign In
                </button>
                <button
                  onClick={() => { navigate('register'); setMenuOpen(false) }}
                  className="text-left px-4 py-3 rounded-xl text-[14px] font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center gap-3"
                >
                  <Icon icon="lucide:user-plus" width="16" /> Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>

    </nav>
  )
}
