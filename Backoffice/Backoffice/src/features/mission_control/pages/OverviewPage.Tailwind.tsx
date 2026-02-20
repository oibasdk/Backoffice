import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

import { useAuth } from '../../../app/providers/AuthProvider';
import { buildNavSections, type NavSection } from '../../../app/moduleRegistry';
import type { AdminAccess } from '../../../auth/api';
import { GlassCard } from '../../../components/tailwind/GlassCard';
import { GlassKPICard } from '../../../components/tailwind/GlassKPICard';
import { getOverview } from '../api';
import { getObservabilityServices, getOpsStatus } from '../../ops/api';

export const OverviewPageTailwind: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const queryClient = useQueryClient();
  const [range, setRange] = useState('week');

  const access = queryClient.getQueryData<AdminAccess>([
    'admin-access',
    tokens?.accessToken || null,
  ]);
  const featureFlags = useMemo(() => new Set(access?.feature_flags || []), [access?.feature_flags]);
  const navSections = useMemo(
    () =>
      buildNavSections(access, featureFlags).filter(
        (section): section is NavSection => Boolean(section) && section.id !== 'mission_control'
      ),
    [access, featureFlags]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['overview', range, tokens?.accessToken],
    queryFn: () => getOverview(tokens?.accessToken || '', range),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: opsStatus } = useQuery({
    queryKey: ['ops-status', tokens?.accessToken],
    queryFn: () => getOpsStatus(tokens?.accessToken || ''),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: observabilityData } = useQuery({
    queryKey: ['observability-services', tokens?.accessToken],
    queryFn: () => getObservabilityServices(tokens?.accessToken || ''),
    enabled: Boolean(tokens?.accessToken),
    retry: false,
  });

  const rasCounts = data?.metrics?.ras?.counts || {};
  const paymentCounts = data?.metrics?.payment || {};
  const authCounts = data?.metrics?.auth?.counts || {};
  const alerts = Array.isArray(data?.alerts) ? data?.alerts : [];

  const kpiData = [
    {
      label: 'Active Sessions',
      value: authCounts?.active_sessions || 0,
      trend: 12,
      icon: '👥'
    },
    {
      label: 'Payment Transactions',
      value: paymentCounts?.total_transactions || 0,
      trend: -5,
      icon: '💳'
    },
    {
      label: 'RAS Queue Depth',
      value: rasCounts?.queue_depth || 0,
      trend: 3,
      icon: '📊'
    },
    {
      label: 'System Health',
      value: '98.5%',
      trend: 2,
      icon: '💚'
    }
  ];

  const serviceHealth = Object.entries(data?.services || {}).map(([name, info]: any) => ({
    name,
    status: info.ok ? '✓ Healthy' : '✗ Down',
    responseTime: `${info.duration_ms}ms`,
    isHealthy: info.ok
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">Command Center</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Real-time system overview & insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/50 dark:bg-neutral-800/50 border border-white/20 dark:border-white/10 backdrop-blur-md"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {isLoading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-white/30 dark:bg-neutral-800/30 backdrop-blur-md rounded-lg animate-pulse"
                />
              ))
          : kpiData.map((kpi, idx) => (
              <GlassKPICard key={idx} {...kpi} delay={idx * 0.1} />
            ))}
      </motion.div>

      {/* Service Health & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <GlassCard title="Service Health" delay={0.2}>
            {isLoading ? (
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-8 bg-white/30 dark:bg-neutral-800/30 rounded animate-pulse" />
                  ))}
              </div>
            ) : (
              <div className="space-y-3">
                {serviceHealth.map((service, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/30 dark:bg-neutral-800/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${service.isHealthy ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                      <span className="font-medium text-neutral-900 dark:text-white">{service.name}</span>
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{service.responseTime}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <GlassCard title="Recent Alerts" delay={0.3}>
            {alerts.length === 0 ? (
              <div className="text-center py-6">
                <Icon icon="mdi:check-circle-outline" width={40} className="mx-auto text-green-500 mb-2" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">All systems nominal</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 4).map((alert, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    className="text-xs p-2 rounded bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
                  >
                    {typeof alert === 'string' ? alert : JSON.stringify(alert).slice(0, 50)}
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Detailed Metrics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
        <GlassCard title={`Detailed Metrics (${range})`} delay={0.4}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm uppercase text-neutral-600 dark:text-neutral-400 mb-4">
                Authentication & Access
              </h4>
              <div className="space-y-2">
                {Object.entries(authCounts || {})
                  .slice(0, 4)
                  .map(([key, value]: any) => (
                    <div key={key} className="flex items-center justify-between py-2 px-3 rounded bg-white/30 dark:bg-neutral-800/30">
                      <span className="text-sm capitalize text-neutral-700 dark:text-neutral-300">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">{value}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase text-neutral-600 dark:text-neutral-400 mb-4">
                Payments
              </h4>
              <div className="space-y-2">
                {Object.entries(paymentCounts || {})
                  .slice(0, 4)
                  .map(([key, value]: any) => (
                    <div key={key} className="flex items-center justify-between py-2 px-3 rounded bg-white/30 dark:bg-neutral-800/30">
                      <span className="text-sm capitalize text-neutral-700 dark:text-neutral-300">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">{value}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default OverviewPageTailwind;
