import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper for page content to provide smooth fade-in transitions.
 * Prevents flash when navigating between pages.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={`h-full w-full ${className || ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}