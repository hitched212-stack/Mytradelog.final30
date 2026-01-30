import { Navbar } from "./components/navbar"
import { HeroSection } from "./components/hero-section"
import { FeaturesSection } from "./components/features-section"
import { HighlightsSection } from "./components/highlights-section"
import { MobileSection } from "./components/mobile-section"
import { AddToHomeScreen } from "./components/add-to-homescreen"
import { PricingSection } from "./components/pricing-section"
import { ExcusesSection } from "./components/excuses-section"
import { CTASection } from "./components/cta-section"
import { Footer } from "./components/footer"

export default function HomePage() {
  return (
    <main
      data-theme="landing"
      className="bg-black text-zinc-300 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 min-h-screen"
    >
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HighlightsSection />
      <PricingSection />
      <MobileSection />
      <AddToHomeScreen />
      <ExcusesSection />
      <CTASection />
      <Footer />
    </main>
  )
}
