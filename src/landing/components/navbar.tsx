"use client"

import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLoginClick = () => {
    window.location.assign("/app/auth")
  }

  const handleSignUpClick = () => {
    window.location.assign("/app/auth?tab=signup")
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen ? "border-b border-white/5 bg-zinc-950/80 backdrop-blur-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 5.5L8 18.5" stroke="black" strokeWidth="2.25" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white tracking-tight">MyTradeLog</span>
        </div>

        <div className="hidden lg:flex items-center gap-8 text-xs font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">
            The Truth
          </a>
          <a href="#highlights" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
          <a href="#mobile" className="hover:text-white transition-colors">
            Mobile
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            Excuses
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/app/auth"
            onClick={handleLoginClick}
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
          >
            Log in
          </a>
          <a
            href="/app/auth?tab=signup"
            onClick={handleSignUpClick}
            className="group relative overflow-hidden bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-medium px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-105 hidden sm:block"
          >
            Sign Up
            <span className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-500" />
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div
        className={`lg:hidden overflow-hidden transition-[max-height] duration-300 ease-out ${
          mobileMenuOpen ? "max-h-[500px]" : "max-h-0"
        }`}
      >
        <div
          className={`px-4 sm:px-6 py-4 bg-zinc-950/80 backdrop-blur-md border-t border-white/5 transition-opacity duration-200 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col gap-4">
            <a
              href="#features"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
            >
              The Truth
            </a>
            <a
              href="#highlights"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
            >
              Pricing
            </a>
            <a
              href="#mobile"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
            >
              Mobile
            </a>
            <a
              href="#faq"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
            >
              Excuses
            </a>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <a
                href="/app/auth?tab=signup"
                onClick={() => {
                  handleLinkClick()
                  handleSignUpClick()
                }}
                className="flex-1 bg-white hover:bg-zinc-100 text-zinc-950 text-sm font-medium px-4 py-3 rounded-xl text-center transition-all"
              >
                Sign Up
              </a>
              <a
                href="/app/auth"
                onClick={() => {
                  handleLinkClick()
                  handleLoginClick()
                }}
                className="flex-1 bg-transparent border border-zinc-700 hover:border-zinc-500 text-white text-sm font-medium px-4 py-3 rounded-xl text-center transition-all"
              >
                Log in
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
