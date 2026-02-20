import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GlassKPICardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: number;
  delay?: number;
}

export const GlassKPICard: React.FC<GlassKPICardProps> = ({ label, value, icon, trend, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    const duration = 1000;
    const start = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(Math.floor(value * progress));
      if (progress === 1) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 100 }}
      className="
        relative overflow-hidden rounded-lg
        bg-gradient-to-br from-white/70 to-white/40
        dark:from-neutral-900/70 dark:to-neutral-800/40
        border border-white/20 dark:border-white/10
        backdrop-blur-lg shadow-lg hover:shadow-xl
        transition-all duration-300
        p-6 min-h-32
        before:absolute before:inset-0
        before:bg-gradient-to-tr before:from-primary-500/5 before:to-transparent
        before:pointer-events-none
      "
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium uppercase tracking-wider">{label}</p>
          </div>
          {icon && <div className="text-primary-500 text-2xl">{icon}</div>}
        </div>
        <div className="mt-auto">
          <motion.div className="text-3xl font-bold text-neutral-900 dark:text-white">
            {displayValue}
            {typeof value === 'string' && <span className="text-lg">{value}</span>}
          </motion.div>
          {trend !== undefined && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2 }}
              className={`text-sm mt-2 ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
            </motion.p>
          )}
        </div>
      </div>

      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 border border-transparent bg-gradient-to-r from-primary-500/20 via-transparent to-transparent rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default GlassKPICard;
