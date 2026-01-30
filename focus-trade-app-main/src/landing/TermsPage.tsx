import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Menu, X } from "lucide-react"

export default function TermsPage() {
  const sectionsRef = useRef<HTMLDivElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLoginClick = () => {
    window.location.assign("/app/auth")
  }

  const handleSignUpClick = () => {
    window.location.assign("/app/auth?tab=signup")
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = sectionsRef.current?.querySelectorAll(".reveal-on-scroll")
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sectionsRef} data-theme="landing" className="bg-black min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 5.5L8 18.5" stroke="black" strokeWidth="2.25" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white tracking-tight">MyTradeLog</span>
          </a>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="/#features" className="hover:text-white transition-colors">
              The Truth
            </a>
            <a href="/#highlights" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="/#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="/#mobile" className="hover:text-white transition-colors">
              Mobile
            </a>
            <a href="/#faq" className="hover:text-white transition-colors">
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
              className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-zinc-950/80 backdrop-blur-md">
            <div className="px-4 py-4 flex flex-col gap-4">
              <a
                href="/#features"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                The Truth
              </a>
              <a
                href="/#highlights"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="/#pricing"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="/#mobile"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mobile
              </a>
              <a
                href="/#faq"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Excuses
              </a>
              <div className="pt-4 border-t border-white/10 flex gap-3">
                <a
                  href="/app/auth?tab=signup"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignUpClick()
                  }}
                  className="flex-1 bg-white hover:bg-zinc-100 text-zinc-950 text-sm font-medium px-4 py-3 rounded-xl text-center transition-all"
                >
                  Sign Up
                </a>
                <a
                  href="/app/auth"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLoginClick()
                  }}
                  className="flex-1 bg-transparent border border-zinc-700 hover:border-zinc-500 text-white text-sm font-medium px-4 py-3 rounded-xl text-center transition-all"
                >
                  Log in
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Header Section */}
      <header className="pt-32 sm:pt-40 pb-12 sm:pb-16 text-center border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight mb-6 reveal-on-scroll">
            Terms and Services
          </h1>
          <p className="text-zinc-400 reveal-on-scroll">
            Effective Date: <span className="text-zinc-300">January 16, 2026</span>
          </p>
        </div>
      </header>

      {/* Content Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 relative">
        <div className="space-y-12 sm:space-y-16">
          {/* Section 1 */}
          <section className="reveal-on-scroll">
            <h2 className="text-lg sm:text-xl font-medium text-white mb-4 sm:mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-900 border border-white/10 text-xs text-zinc-500 font-mono tabular-nums">
                01
              </span>
              Acceptance of Terms
            </h2>
            <div className="text-zinc-400 text-sm leading-7 space-y-4">
              <p>
                By accessing or using MyTradeLog (&quot;the Service&quot;), you agree to be bound by these Terms of
                Service. If you disagree with any part of the terms, you may not access the Service. We reserve the
                right to modify these terms at any time. Your continued use of the Service following any changes
                constitutes your acceptance of the new Terms.
              </p>
              <p>
                Basically: Use the tool to improve your trading, don&apos;t try to hack us, and don&apos;t blame us if
                the market goes against you.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="reveal-on-scroll">
            <h2 className="text-lg sm:text-xl font-medium text-white mb-4 sm:mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-900 border border-white/10 text-xs text-zinc-500 font-mono tabular-nums">
                02
              </span>
              Use of Service &amp; Account Security
            </h2>
            <div className="text-zinc-400 text-sm leading-7 space-y-4">
              <p>
                You are responsible for safeguarding the password that you use to access the Service and for any
                activities or actions under your password. We encourage you to use &quot;strong&quot; passwords
                (passwords that use a combination of upper and lower case letters, numbers, and symbols) with your
                account.
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-indigo-500">
                <li>You must provide accurate and complete registration information.</li>
                <li>You may not use the Service for any illegal or unauthorized purpose.</li>
                <li>You must not transmit any worms or viruses or any code of a destructive nature.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="reveal-on-scroll">
            <h2 className="text-lg sm:text-xl font-medium text-white mb-4 sm:mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-900 border border-white/10 text-xs text-zinc-500 font-mono tabular-nums">
                03
              </span>
              Subscriptions &amp; Billing
            </h2>
            <div className="text-zinc-400 text-sm leading-7 space-y-4">
              <p>
                MyTradeLog offers both monthly and annual subscription plans. The Service is billed in advance on a
                recurring and periodic basis (&quot;Billing Cycle&quot;).
              </p>
              <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-4 sm:p-5 mt-4">
                <h3 className="text-white font-medium text-sm mb-2">Refund Policy</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  We stand by our product and the value it provides. All sales are final, and we operate under a strict no-refund policy. Once a purchase is completed, no refunds will be issued under any circumstances, including partial use, dissatisfaction, or failure to cancel. You may cancel your subscription at any time to prevent future billing, but cancellation does not entitle you to a refund for any past or current billing period.
                </p>
              </div>
            </div>
          </section>

          {/* Important Disclaimer Section */}
          <section className="reveal-on-scroll">
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5 sm:p-8">
              <h2 className="text-base sm:text-lg font-medium text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" strokeWidth={1} />
                Trading Risk Disclaimer
              </h2>
              <div className="text-red-200/70 text-sm leading-7 space-y-4">
                <p>
                  Trading involves substantial risk of loss and may not be suitable for all investors. You could lose
                  some or all of your initial investment. The data and analytics provided by MyTradeLog are for
                  informational and educational purposes only.
                </p>
                <p>
                  MyTradeLog is a journaling tool, not a financial advisor. We do not provide investment advice, nor do
                  we recommend the purchase or sale of any specific asset. Your trading results are your own
                  responsibility. Past performance, even when accurately tracked, is not indicative of future results.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="reveal-on-scroll">
            <h2 className="text-lg sm:text-xl font-medium text-white mb-4 sm:mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-900 border border-white/10 text-xs text-zinc-500 font-mono tabular-nums">
                05
              </span>
              Intellectual Property
            </h2>
            <div className="text-zinc-400 text-sm leading-7 space-y-4">
              <p>
                The Service and its original content (excluding Content provided by users), features, and functionality
                are and will remain the exclusive property of MyTradeLog and its licensors. The Service is protected by
                copyright, trademark, and other laws of both the United States and foreign countries.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="reveal-on-scroll">
            <h2 className="text-lg sm:text-xl font-medium text-white mb-4 sm:mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-900 border border-white/10 text-xs text-zinc-500 font-mono tabular-nums">
                06
              </span>
              Limitation of Liability
            </h2>
            <div className="text-zinc-400 text-sm leading-7 space-y-4">
              <p>
                In no event shall MyTradeLog, nor its directors, employees, partners, agents, suppliers, or affiliates,
                be liable for any indirect, incidental, special, consequential or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access
                to or use of or inability to access or use the Service.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Contact CTA */}
      <section className="py-16 sm:py-20 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Still have questions?</h3>
          <p className="text-zinc-500 text-sm mb-6">We&apos;re here to help clarify any part of these terms.</p>
          <a
            href="mailto:legal@mytradelog.net"
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Contact us
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 sm:py-8 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-zinc-500">© 2026 MyTradeLog. Stop losing money.</div>
          <div className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm text-zinc-500">
            <span className="text-zinc-500">Terms and Services</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
