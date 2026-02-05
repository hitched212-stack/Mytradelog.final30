import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper for page content to provide smooth fade-in transitions.
 * Prevents flash when navigating between pages.
 * Uses AnimatePresence for proper exit animations.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="page-transition"
        className={`h-full w-full ${className || ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}