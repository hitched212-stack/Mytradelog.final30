"use client"

import { useEffect, useRef } from "react"
import {
  BarChart2Icon,
  BarChart3,
  Bot,
  CheckCircle2,
  LineChart,
  PieChart,
  TrendingUp,
  Brain,
  MessageSquare,
  Zap,
  Shield,
  Calendar,
  History,
  Globe,
  Layers,
  BookOpen,
  ListChecks,
  Target,
  LayoutDashboard,
  Newspaper,
  Palette,
  Sun,
  Moon,
} from "lucide-react"

export function HighlightsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

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

    const elements = sectionRef.current?.querySelectorAll(".reveal-on-scroll")
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const analyticsFeatures = [
    { icon: TrendingUp, label: "Win Rate & P&L Tracking" },
    { icon: PieChart, label: "Asset Allocation Analysis" },
    { icon: LineChart, label: "Equity Curve Visualization" },
    { icon: CheckCircle2, label: "Rule Compliance Scoring" },
    { icon: BarChart3, label: "Time-of-Day Performance" },
    { icon: Shield, label: "Risk Management Metrics" },
  ]

  const aiFeatures = [
    { icon: Brain, label: "Pattern Recognition" },
    { icon: MessageSquare, label: "Trade Review Assistant" },
    { icon: Zap, label: "Real-time Insights" },
    { icon: CheckCircle2, label: "Personalized Recommendations" },
  ]

  const coreFeatures = [
    { icon: LayoutDashboard, title: "Dashboard", description: "Complete overview of your trading performance at a glance" },
    { icon: Calendar, title: "Calendar", description: "Visual calendar view of your trading activity and results" },
    { icon: History, title: "Trade History", description: "Detailed log of all your past trades with full metrics" },
    { icon: Globe, title: "Market News", description: "Stay updated with relevant market news and events" },
  ]

  const toolsFeatures = [
    { icon: Layers, title: "Backtesting", description: "Test your strategies against historical data" },
    { icon: BookOpen, title: "Playbook", description: "Document and refine your trading setups" },
    { icon: ListChecks, title: "Trading Rules", description: "Set and track your personal trading rules" },
    { icon: Target, title: "P&L Goals", description: "Set targets and track your progress" },
  ]

  return (
    <section className="bg-black pt-16 pb-16 sm:pt-24 sm:pb-24" id="highlights" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 reveal-on-scroll">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1.5 text-xs text-indigo-300 mb-4">
            <Zap className="w-3 h-3" />
            <span>Powerful Features</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-medium text-white tracking-tight mb-4">
            Everything You Need to
            <br />
            <span className="text-zinc-500">Master Your Trading</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
            From granular analytics to AI-powered insights, we give you the tools to understand every aspect of your trading performance.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Analytics Card */}
          <div className="reveal-on-scroll delay-100 group relative [perspective:1000px] h-full">
            <div className="absolute inset-0 bg-zinc-800 rounded-2xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-4deg)_translateY(8px)] group-hover:opacity-50"></div>
            <div className="relative h-full bg-zinc-900 border border-white/5 p-6 sm:p-8 rounded-2xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-4px)] group-hover:border-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/10 flex flex-col">
              {/* Card Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-500/10 flex items-center justify-center rounded-xl text-indigo-400 group-hover:bg-indigo-500/20 transition-colors shrink-0">
                  <BarChart2Icon className="w-6 h-6" strokeWidth={1} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">In-Depth Analytics</h3>
                  <p className="text-sm sm:text-base text-zinc-400">
                    Track every possible aspect of your trading, from entry timing to rule compliance. No detail goes unnoticed.
                  </p>
                </div>
              </div>

              {/* Analytics Preview */}
              <div className="bg-black/50 rounded-xl p-4 sm:p-5 mb-6 border border-white/5">
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div className="text-center p-2 sm:p-3 bg-zinc-800/50 rounded-lg">
                    <div className="text-lg sm:text-xl font-semibold text-emerald-400">67.8%</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500">Win Rate</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-zinc-800/50 rounded-lg">
                    <div className="text-lg sm:text-xl font-semibold text-indigo-400">2.4R</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500">Avg R:R</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-zinc-800/50 rounded-lg">
                    <div className="text-lg sm:text-xl font-semibold text-white">92%</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500">Compliance</div>
                  </div>
                </div>

                {/* Equity Curve Chart */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-xs text-zinc-500">Equity Curve</span>
                    <span className="text-[10px] sm:text-xs text-emerald-400">+$24,580</span>
                  </div>
                  <div className="h-24 sm:h-32 relative">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <line x1="0" y1="75" x2="300" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                      {/* Gradient fill under the curve */}
                      <defs>
                        <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Area fill */}
                      <path
                        d="M0,85 L20,80 L40,75 L60,70 L80,65 L100,68 L120,55 L140,50 L160,55 L180,45 L200,40 L220,35 L240,30 L260,25 L280,20 L300,15 L300,100 L0,100 Z"
                        fill="url(#equityGradient)"
                      />

                      {/* Line */}
                      <path
                        d="M0,85 L20,80 L40,75 L60,70 L80,65 L100,68 L120,55 L140,50 L160,55 L180,45 L200,40 L220,35 L240,30 L260,25 L280,20 L300,15"
                        fill="none"
                        stroke="rgb(52, 211, 153)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Current point indicator */}
                      <circle cx="300" cy="15" r="4" fill="rgb(52, 211, 153)" />
                      <circle cx="300" cy="15" r="6" fill="rgb(52, 211, 153)" fillOpacity="0.3" />
                    </svg>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[8px] sm:text-[10px] text-zinc-600 -ml-1">
                      <span>$50k</span>
                      <span>$25k</span>
                      <span>$0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature List */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-auto">
                {analyticsFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                    <feature.icon className="w-4 h-4 text-indigo-400 shrink-0" strokeWidth={1} />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Chatbot Card */}
          <div className="reveal-on-scroll delay-200 group relative [perspective:1000px] h-full">
            <div className="absolute inset-0 bg-zinc-800 rounded-2xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-4deg)_translateY(8px)] group-hover:opacity-50"></div>
            <div className="relative h-full bg-zinc-900 border border-white/5 p-6 sm:p-8 rounded-2xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-4px)] group-hover:border-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/10 flex flex-col">
              {/* Card Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-500/10 flex items-center justify-center rounded-xl text-indigo-400 group-hover:bg-indigo-500/20 transition-colors shrink-0">
                  <Bot className="w-6 h-6" strokeWidth={1} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">AI Trading Assistant</h3>
                  <p className="text-sm sm:text-base text-zinc-400">
                    Your personal AI coach that learns your trading style and provides tailored insights and recommendations.
                  </p>
                </div>
              </div>

              {/* Chat Preview */}
              <div className="bg-black/50 rounded-xl p-4 sm:p-5 mb-6 border border-white/5 space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-indigo-400" />
                  </div>
                  <div className="bg-zinc-800/80 rounded-lg rounded-tl-none p-3 text-xs sm:text-sm text-zinc-300 max-w-[85%]">
                    Based on your last 30 trades, you perform 23% better when trading during the London-NY overlap. Consider focusing on this session.
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-indigo-500/20 rounded-lg rounded-tr-none p-3 text-xs sm:text-sm text-zinc-300 max-w-[85%]">
                    What about my risk management?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-indigo-400" />
                  </div>
                  <div className="bg-zinc-800/80 rounded-lg rounded-tl-none p-3 text-xs sm:text-sm text-zinc-300 max-w-[85%]">
                    Your average risk per trade is 1.2%, which is solid. However, I noticed 4 trades last week exceeded your 2% max rule.
                  </div>
                </div>
              </div>

              {/* Feature List */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-auto">
                {aiFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                    <feature.icon className="w-4 h-4 text-indigo-400 shrink-0" strokeWidth={1} />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Core Features & Tools Grid */}
        <div className="mt-12 sm:mt-16">
          <h3 className="text-lg sm:text-xl font-medium text-white text-center mb-6 sm:mb-8 reveal-on-scroll">
            Complete Trading Toolkit
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {/* Core Features */}
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className={`reveal-on-scroll delay-${(index + 1) * 100} group relative [perspective:1000px]`}
              >
                <div className="absolute inset-0 bg-zinc-800 rounded-lg sm:rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-4deg)_translateY(4px)] group-hover:opacity-50"></div>
                <div className="relative bg-zinc-900 border border-white/5 p-3 sm:p-5 rounded-lg sm:rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-2px)] group-hover:border-indigo-500/30 group-hover:shadow-lg group-hover:shadow-indigo-500/10">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500/10 flex items-center justify-center rounded-md sm:rounded-lg mb-2 sm:mb-3 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-medium text-white mb-0.5 sm:mb-1">{feature.title}</h4>
                  <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mt-2 sm:mt-4 lg:mt-6">
            {/* Tools Features */}
            {toolsFeatures.map((feature, index) => (
              <div
                key={index}
                className={`reveal-on-scroll delay-${(index + 5) * 100} group relative [perspective:1000px]`}
              >
                <div className="absolute inset-0 bg-zinc-800 rounded-lg sm:rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(-4deg)_translateY(4px)] group-hover:opacity-50"></div>
                <div className="relative bg-zinc-900 border border-white/5 p-3 sm:p-5 rounded-lg sm:rounded-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(2deg)_translateY(-2px)] group-hover:border-indigo-500/30 group-hover:shadow-lg group-hover:shadow-indigo-500/10">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500/10 flex items-center justify-center rounded-md sm:rounded-lg mb-2 sm:mb-3 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-medium text-white mb-0.5 sm:mb-1">{feature.title}</h4>
                  <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customization Section */}
        <div className="mt-12 sm:mt-16">
          <div className="reveal-on-scroll bg-zinc-900/50 border border-white/5 rounded-2xl p-6 sm:p-8 lg:p-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Text Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-white/10 text-[10px] font-medium text-indigo-400 mb-4 uppercase tracking-wider">
                  <Palette className="w-3 h-3" />
                  Customization
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-medium text-white tracking-tight mb-4">
                  Make It Yours
                </h3>
                <p className="text-sm sm:text-base text-zinc-400 mb-6">
                  Personalize your P&L colors to match your style. Whether you prefer classic green and red or something completely unique, the choice is yours.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/5 text-sm text-zinc-300">
                    <Sun className="w-4 h-4 text-amber-400" />
                    Light Mode
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/5 text-sm text-zinc-300">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    Dark Mode
                  </div>
                </div>
              </div>

              {/* Custom Colors Mockup */}
              <div className="reveal-on-scroll delay-200">
                <div className="bg-zinc-950 rounded-xl p-5 sm:p-6 border border-white/5">
                  <h4 className="text-white font-medium mb-1">Custom Colors</h4>
                  <p className="text-xs text-zinc-500 mb-4">Fine-tune your interface colors</p>

                  <div className="bg-zinc-900/50 rounded-lg border border-white/10 divide-y divide-white/5">
                    {/* Profit Color */}
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium text-white">Profit Color</p>
                        <p className="text-xs text-zinc-500">Color for positive P&L values</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 font-mono">#74A7FE</span>
                        <div className="w-10 h-10 rounded-lg bg-[#74A7FE]"></div>
                      </div>
                    </div>

                    {/* Loss Color */}
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium text-white">Loss Color</p>
                        <p className="text-xs text-zinc-500">Color for negative P&L values</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 font-mono">#929292</span>
                        <div className="w-10 h-10 rounded-lg bg-[#929292]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
