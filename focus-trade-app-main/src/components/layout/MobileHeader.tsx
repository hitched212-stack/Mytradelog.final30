import { useEffect, useState } from 'react';

export function MobileHeader() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA/standalone mode (added to home screen)
    const checkStandalone = () => {
      const isInStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isInStandaloneMode);
    };

    checkStandalone();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);
    
    return () => mediaQuery.removeEventListener('change', checkStandalone);
  }, []);

  // Only show spacer when running as PWA (added to home screen)
  if (!isStandalone) {
    return null;
  }

  return (
    <div className="md:hidden">
      {/* Header spacer for PWA mode - accounts for status bar */}
      <header className="h-14" />
    </div>
  );
}