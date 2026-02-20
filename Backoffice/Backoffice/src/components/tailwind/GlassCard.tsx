import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  title?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', delay = 0, title }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={`
        relative overflow-hidden rounded-lg border
        bg-white/70 dark:bg-neutral-900/60
        border-white/20 dark:border-white/10
        backdrop-blur-md shadow-lg
        hover:shadow-xl transition-shadow duration-300
        before:absolute before:inset-0
        before:bg-gradient-to-br before:from-white/10 before:to-transparent
        before:pointer-events-none
        ${className}
      `}
      role="article"
    >
      {title && (
        <div className="px-6 py-4 border-b border-white/10 dark:border-white/5 bg-gradient-to-r from-primary-500/10 to-transparent">
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm uppercase tracking-wide">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  );
};

export default GlassCard;
