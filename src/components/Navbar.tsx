import { useState, useEffect, useRef } from 'react'
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
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close the account dropdown whenever the page changes.
  useEffect(() => { setAccountOpen(false) }, [currentPage])

  // ...and on an outside click or Escape, which the previous version left open
  // until you happened to navigate.
  useEffect(() => {
    if (!accountOpen) return
    const onDown = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAccountOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen])

  const navBtn = (active: boolean) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
      active ? 'text-ink-hi bg-white/[0.06]' : 'text-ink-lo hover:text-ink-hi hover:bg-white/[0.04]'
    }`

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 h-16 border-b transition-colors duration-300
      ${scrolled || menuOpen
        ? 'bg-canvas/85 backdrop-blur-xl border-line'
        : 'bg-transparent border-transparent'}`}>

      <div className="page h-full flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <button
          onClick={() => navigate('home')}
          className="group flex items-center gap-2.5 font-display text-lg text-ink-hi shrink-0"
        >
          <Icon icon="lucide:shield-check" width="21" strokeWidth={1.9}
                className="text-accent transition-transform duration-200 group-hover:scale-110" />
          Aegis
        </button>

        {/* ── Desktop links ── */}
        <ul className="hidden md:flex items-center gap-1 list-none absolute left-1/2 -translate-x-1/2">
          {LINKS.map(({ label, page }) => (
            <li key={page}>
              <button onClick={() => navigate(page)} className={navBtn(currentPage === page)}>
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* ── Auth area (desktop) ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(o => !o)}
                aria-expanded={accountOpen}
                className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border transition-colors duration-150
                  ${accountOpen
                    ? 'bg-white/[0.06] border-line-strong text-ink-hi'
                    : 'border-line text-ink hover:bg-white/[0.04] hover:text-ink-hi'}`}
              >
                <span className="w-6 h-6 rounded-lg bg-accent text-accent-ink flex items-center justify-center text-xs font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-mono max-w-[150px] truncate">{user.email}</span>
                <Icon icon="lucide:chevron-down" width="14"
                      className={`text-ink-lo transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`} />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface-raised border border-line-strong rounded-xl shadow-lift overflow-hidden animate-fade-in">
                  <button
                    onClick={() => navigate('dashboard')}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-white/[0.05] hover:text-ink-hi flex items-center gap-3 transition-colors"
                  >
                    <Icon icon="lucide:layout-dashboard" width="15" className="text-ink-lo" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('encode')}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-white/[0.05] hover:text-ink-hi flex items-center gap-3 transition-colors"
                  >
                    <Icon icon="lucide:plus" width="15" className="text-ink-lo" />
                    Encode new
                  </button>
                  <button
                    onClick={() => { logout(); navigate('home') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-alert hover:bg-alert-soft flex items-center gap-3 transition-colors border-t border-line"
                  >
                    <Icon icon="lucide:log-out" width="15" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => navigate('login')} className={navBtn(currentPage === 'login')}>
                Sign in
              </button>
              <button onClick={() => navigate('register')} className="btn-primary btn-sm">
                Sign up
              </button>
            </>
          )}
        </div>

        {/* ── Mobile burger ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-[5px] p-2 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`block w-5 h-[1.5px] bg-ink rounded-full transition-transform duration-300 ${menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}`} />
          <span className={`block w-5 h-[1.5px] bg-ink rounded-full transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-[1.5px] bg-ink rounded-full transition-transform duration-300 ${menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <div className={`md:hidden absolute top-16 inset-x-0 bg-canvas/95 backdrop-blur-xl border-b border-line overflow-hidden transition-[max-height,opacity] duration-300
        ${menuOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="page py-4 flex flex-col gap-1">
          {LINKS.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => { navigate(page); setMenuOpen(false) }}
              className={`text-left px-3 py-2.5 rounded-lg text-base font-medium transition-colors
                ${currentPage === page
                  ? 'text-ink-hi bg-white/[0.06]'
                  : 'text-ink-lo hover:text-ink-hi hover:bg-white/[0.04]'}`}
            >
              {label}
            </button>
          ))}

          <div className="border-t border-line mt-3 pt-3 flex flex-col gap-1">
            {user ? (
              <>
                <p className="label px-3 mb-1">Signed in as</p>
                <p className="px-3 text-sm text-ink font-mono truncate mb-2">{user.email}</p>
                <button
                  onClick={() => { navigate('dashboard'); setMenuOpen(false) }}
                  className={`text-left px-3 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-3
                    ${currentPage === 'dashboard'
                      ? 'text-ink-hi bg-white/[0.06]'
                      : 'text-ink-lo hover:text-ink-hi hover:bg-white/[0.04]'}`}
                >
                  <Icon icon="lucide:layout-dashboard" width="16" /> Dashboard
                </button>
                <button
                  onClick={() => { logout(); navigate('home'); setMenuOpen(false) }}
                  className="text-left px-3 py-2.5 rounded-lg text-base font-medium text-alert hover:bg-alert-soft transition-colors flex items-center gap-3"
                >
                  <Icon icon="lucide:log-out" width="16" /> Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { navigate('login'); setMenuOpen(false) }}
                  className="text-left px-3 py-2.5 rounded-lg text-base font-medium text-ink-lo hover:text-ink-hi hover:bg-white/[0.04] transition-colors flex items-center gap-3"
                >
                  <Icon icon="lucide:log-in" width="16" /> Sign in
                </button>
                <button
                  onClick={() => { navigate('register'); setMenuOpen(false) }}
                  className="btn-primary mt-1"
                >
                  <Icon icon="lucide:user-plus" width="16" /> Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
