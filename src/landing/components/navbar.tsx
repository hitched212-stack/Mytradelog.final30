"use client"

import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("features")

  const handleLoginClick = () => {
    window.location.assign("/app/auth")
  }

  const handleSignUpClick = () => {
    window.location.assign("/app/auth?tab=signup")
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // Determine active section based on scroll position
      const sections = ["features", "highlights", "pricing", "approach", "mobile", "faq"]
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          // Trigger when section is within viewport, checking from top to bottom
          if (rect.top <= window.innerHeight * 0.3 && rect.bottom >= window.innerHeight * 0.3) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Call once on mount
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const sectionId = href.substring(1) // Remove # from href
    const isActive = activeSection === sectionId
    
    const handleClick = () => {
      setActiveSection(sectionId)
    }
    
    return (
      <a 
        href={href}
        onClick={handleClick}
        className={`group relative overflow-hidden px-3 py-1.5 text-sm font-medium transition-all duration-500 rounded-full ${
          isActive 
            ? "text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600" 
            : "text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600"
        }`}
      >
        <span className="flex items-center justify-center relative overflow-hidden h-5">
          <span className="transition-all duration-500 group-hover:translate-y-[-100%]">{label}</span>
          <span className="absolute top-[100%] left-0 transition-all duration-500 group-hover:translate-y-[-100%]">{label}</span>
        </span>
        <span className={`absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 transition-opacity duration-700 ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}></span>
      </a>
    )
  }

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen ? "bg-zinc-950/80 backdrop-blur-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <img 
            src="/images/landing-page-logo.png" 
            alt="MyTradeLog" 
            className="h-10 w-auto object-contain"
          />
        </a>

        <div className="hidden md:flex items-center gap-1 lg:gap-2 bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-full px-3 lg:px-6 py-2 lg:py-2.5 shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
          <NavLink href="#features" label="The System" />
          <NavLink href="#highlights" label="Features" />
          <NavLink href="#pricing" label="Pricing" />
          <NavLink href="#approach" label="Our Approach" />
          <NavLink href="#mobile" label="Mobile" />
          <NavLink href="#faq" label="Excuses" />
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-full px-2 py-2 shadow-lg animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
          <a
            href="/app/auth"
            onClick={handleLoginClick}
            className="group relative overflow-hidden px-4 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-all duration-300 rounded-full hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600"
          >
            <span className="flex items-center justify-center relative overflow-hidden h-5">
              <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Log in</span>
              <span className="absolute top-[100%] left-0 transition-all duration-500 group-hover:translate-y-[-100%]">Log in</span>
            </span>
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </a>
          <a
            href="/app/auth?tab=signup"
            onClick={handleSignUpClick}
            className="group relative overflow-hidden bg-white hover:bg-white/90 text-zinc-950 text-sm font-bold px-5 py-1.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <span className="flex items-center justify-center relative overflow-hidden h-5">
              <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Sign Up</span>
              <span className="absolute top-[100%] left-0 transition-all duration-500 group-hover:translate-y-[-100%]">Sign Up</span>
            </span>
            <span className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-500"></span>
          </a>
        </div>

        <div className="hidden">
          <a
            href="/app/auth"
            onClick={handleLoginClick}
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Log in
          </a>
          <a
            href="/app/auth?tab=signup"
            onClick={handleSignUpClick}
            className="group relative overflow-hidden bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-medium px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-105"
          >
            Sign Up
            <span className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-500" />
          </a>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-out ${
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
              className="text-sm font-medium text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 py-2 px-3 rounded-lg"
            >
              The System
            </a>
            <a
              href="#highlights"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 py-2 px-3 rounded-lg"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 py-2 px-3 rounded-lg"
            >
              Pricing
            </a>
            <a
              href="#approach"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 py-2 px-3 rounded-lg"
            >
              Our Approach
            </a>
            <a
              href="#mobile"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 py-2 px-3 rounded-lg"
            >
              Pricing
            </a>
            <a
              href="#mobile"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 py-2 px-3 rounded-lg"
            >
              Mobile
            </a>
            <a
              href="#faq"
              onClick={handleLinkClick}
              className="text-sm font-medium text-zinc-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 py-2 px-3 rounded-lg"
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
                className="flex-1 bg-white hover:bg-white/90 text-zinc-950 text-sm font-bold px-4 py-3 rounded-full text-center transition-all duration-300 hover:scale-105"
              >
                Sign Up
              </a>
              <a
                href="/app/auth"
                onClick={() => {
                  handleLinkClick()
                  handleLoginClick()
                }}
                className="flex-1 bg-transparent border border-zinc-700 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-600 text-white text-sm font-bold px-4 py-3 rounded-full text-center transition-all duration-300"
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
