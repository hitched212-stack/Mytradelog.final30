import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Slash logo icon matching dashboard/auth branding
const SlashLogoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="15" y1="5" x2="9" y2="19" />
  </svg>
);

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
  isDataReady?: boolean;
}

export function SplashScreen({ onComplete, minDisplayTime = 100, isDataReady = false }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  // Start the min display time timer immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime]);

  // Track when data is actually ready
  useEffect(() => {
    if (isDataReady) {
      // Minimal delay to show completion
      const timer = setTimeout(() => {
        setIsLoadingComplete(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDataReady]);

  // Only hide splash when both min time has elapsed AND data is ready
  useEffect(() => {
    if (minTimeElapsed && isLoadingComplete) {
      // Minimal delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [minTimeElapsed, isLoadingComplete]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-black via-black to-slate-900"
          style={{ 
            paddingTop: 'env(safe-area-inset-top)', 
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          {/* Animated background gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ 
                top: ['0%', '100%'],
                opacity: [0.3, 0.1]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute left-1/4 top-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                bottom: ['0%', '100%'],
                opacity: [0.2, 0.05]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute right-1/4 bottom-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            />
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center gap-8 z-10">
            {/* Logo Icon - matching dashboard sidebar logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white via-white/90 to-white/80 flex items-center justify-center shadow-2xl shadow-white/20"
            >
              <SlashLogoIcon className="w-8 h-8 text-black" />
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold text-white tracking-tight">MyTradeLog</h1>
              <p className="text-sm text-white/50 mt-1">Trading Journal</p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex gap-2 mt-2"
            >
              <motion.div
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-1 h-4 bg-white/40 rounded-full"
              />
              <motion.div
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                className="w-1 h-4 bg-white/40 rounded-full"
              />
              <motion.div
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                className="w-1 h-4 bg-white/40 rounded-full"
              />
            </motion.div>

            {/* Status text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoadingComplete ? 1 : 0.5 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-white/40 mt-4 text-center"
            >
              {isLoadingComplete ? 'Ready' : 'Loading your trades...'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
