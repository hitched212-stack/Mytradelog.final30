export function Footer() {
  return (
    <footer className="border-t border-white/5 py-6 sm:py-8 bg-black">
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
