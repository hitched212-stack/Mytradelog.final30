export function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-6 sm:py-8 bg-black overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-zinc-500">© 2026 MyTradeLog. Stop losing money.</div>
        <div className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm text-zinc-500">
          <a href="/terms" className="hover:text-white transition-colors">
            Terms and Services
          </a>
        </div>
      </div>
    </footer>
  )
}
