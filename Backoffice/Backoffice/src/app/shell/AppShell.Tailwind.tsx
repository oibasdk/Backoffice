import React, { useMemo, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { buildNavSections } from '../moduleRegistry';
import { useAdminAccess } from '../../auth/useAdminAccess';
import { useFeatureFlags } from '../../auth/useFeatureFlags';
import { useAuth } from '../providers/AuthProvider';
import SidebarAdapter from './SidebarAdapter';
import AIInsightsTray from '../../components/tailwind/AIInsightsTray';

export const AppShellTailwind: React.FC = () => {
  const [showInsights, setShowInsights] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { tokens } = useAuth();
  const { data } = useAdminAccess(tokens?.accessToken || null);
  const { flags } = useFeatureFlags();

  const navSections = useMemo(() => buildNavSections(data, flags), [data, flags]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
      {/* Glassmorphic background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-64 hidden xl:block sticky top-0 h-screen"
        >
          <div className="relative h-full backdrop-blur-xl bg-white/40 dark:bg-neutral-900/40 border-r border-white/20 dark:border-white/10 overflow-y-auto">
            {/* Glassmorphic overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5 pointer-events-none" />
            
            {/* Logo area */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="px-6 py-6 border-b border-white/10 relative z-10"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="font-bold text-white">S</span>
                </div>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">Sharoobi</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Command Center</p>
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 relative z-10"
            >
              <SidebarAdapter sections={navSections} />
            </motion.nav>
          </div>
        </motion.aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header - Glassmorphic */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="sticky top-0 z-40 backdrop-blur-xl bg-white/40 dark:bg-neutral-900/40 border-b border-white/20 dark:border-white/10"
          >
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Left section */}
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <Icon icon="tabler:menu-2" width={20} />
                  </motion.button>
                  <Link to="/" className="text-lg font-bold text-neutral-900 dark:text-white">
                    Dashboard
                  </Link>
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center gap-3">
                  <motion.input
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    transition={{ delay: 0.2 }}
                    type="text"
                    placeholder="Search..."
                    className="px-4 py-2 rounded-lg bg-white/50 dark:bg-neutral-800/50 border border-white/20 dark:border-white/10 placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowInsights((s) => !s)}
                    className="relative px-4 py-2 rounded-lg backdrop-blur-md bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Icon icon="mdi:lightbulb-outline" className="inline mr-2" />
                    AI Insights
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Main content area */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grow container mx-auto px-6 py-8"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>

      {/* AI Insights Tray */}
      <AIInsightsTray open={showInsights} onClose={() => setShowInsights(false)} />
    </div>
  );
};

export default AppShellTailwind;
