import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/icons/IconifyShim';
import useWebSocket, { AIInsightMessage } from '../../hooks/useWebSocket';
import { useAIAnomalies } from '../../api/ai';
import { useNavigate } from 'react-router-dom';

interface InsightCardProps {
  title: string;
  summary: string;
  severity?: 'critical' | 'warning' | 'info';
  icon?: string;
}

const severityColor: Record<string, string> = {
  critical: 'border-red-500/50 bg-red-500/10',
  warning: 'border-yellow-500/50 bg-yellow-500/10',
  info: 'border-blue-500/50 bg-blue-500/10',
};

const severityBadge: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-700 dark:text-red-300',
  warning: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  info: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
};

const InsightCard: React.FC<InsightCardProps & { delay?: number }> = ({
  title,
  summary,
  severity = 'info',
  icon = 'mdi:lightbulb-outline',
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.28, delay }}
      className={`
        bg-white/70 dark:bg-neutral-800/70 border rounded-lg p-4 shadow-lg
        backdrop-blur-md mb-3 overflow-hidden
        hover:shadow-xl hover:border-primary-500/50 transition-all duration-300
        ${severityColor[severity]}
      `}
    >
      <div className="flex gap-3">
        <div className="text-2xl flex-shrink-0">
          <Icon icon={icon} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h5 className="font-semibold text-neutral-900 dark:text-white text-sm">{title}</h5>
            <span className={`text-xs font-medium px-2 py-1 rounded ${severityBadge[severity]}`}>
              {severity.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{summary}</p>
        </div>
      </div>
    </motion.div>
  );
};

interface AIInsightsTrayProps {
  open: boolean;
  onClose: () => void;
}

const severityRank = (s: string) => (s === 'critical' ? 3 : s === 'warning' ? 2 : 1);

const AIInsightsTray: React.FC<AIInsightsTrayProps> = ({ open, onClose }) => {
  const ws = useWebSocket({ url: (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws/ai-insights', maxHistory: 300 });
  const { data: anomalies, isLoading: anomaliesLoading } = useAIAnomalies();
  const navigate = useNavigate();

  const combined: AIInsightMessage[] = useMemo(() => {
    if (ws.history && ws.history.length > 0) return ws.history;
    if (anomalies && anomalies.length > 0) {
      return anomalies.map((a) => ({
        id: a.id,
        severity: a.severity,
        title: a.title,
        summary: a.summary,
        timestamp: a.timestamp,
      }));
    }
    return [];
  }, [ws.history, anomalies]);

  const sorted = useMemo(() => {
    return [...combined].sort((a, b) => {
      const s = severityRank(b.severity) - severityRank(a.severity);
      if (s !== 0) return s;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [combined]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40" />

          <motion.aside
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-4 top-24 w-96 z-50 max-h-[70vh] overflow-y-auto"
          >
            <div
              className={`
                relative backdrop-blur-xl
                bg-gradient-to-br from-white/60 to-white/40
                dark:from-neutral-900/80 dark:to-neutral-800/60
                border border-white/30 dark:border-white/10
                rounded-xl shadow-2xl p-6
                before:absolute before:inset-0 before:bg-gradient-to-tr
                before:from-primary-500/5 before:to-transparent before:rounded-xl before:pointer-events-none
              `}
            >
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white">AI Insights</h3>
                  <p className="text-xs text-neutral-500">Real-time intelligence {ws.connected ? ' · Live' : ' · Snapshot'}</p>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50">
                  <Icon icon="mdi:close" width={20} />
                </motion.button>
              </motion.div>

              <div className="space-y-0 relative z-10">
                {ws.lastError && (
                  <div className="text-xs text-red-600 dark:text-red-300 mb-3">Live feed error: {ws.lastError}</div>
                )}

                {sorted.length === 0 && anomaliesLoading && <div className="text-sm text-neutral-500">Loading insights…</div>}

                {sorted.length === 0 && !anomaliesLoading && <div className="text-sm text-neutral-500">No insights at the moment.</div>}

                {sorted.map((insight, idx) => (
                  <InsightCard key={insight.id} title={insight.title} summary={insight.summary} severity={insight.severity} icon={insight.meta && (insight.meta.icon as string)} delay={0.04 * (idx + 1)} />
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="relative z-10">
                <button
                  onClick={() => navigate('/analytics')}
                  className="w-full mt-6 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  View Full Analytics
                </button>
              </motion.div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIInsightsTray;
