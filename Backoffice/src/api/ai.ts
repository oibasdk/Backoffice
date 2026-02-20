import { useQuery } from '@tanstack/react-query';
import { request } from '../api/client';

export type Anomaly = { id: string; severity: 'critical' | 'warning' | 'info'; title: string; summary: string; timestamp: string };
export type Prediction = { id: string; type: 'sla' | 'churn' | 'revenue'; score: number; metadata?: Record<string, unknown> };

const fetchWithRetries = async <T>(url: string, token?: string): Promise<T> => {
  const res = await request<T>({ url, method: 'GET', token });
  return res;
};

export const useAIAlerts = (token?: string) => {
  return useQuery(['ai', 'alerts'], () => fetchWithRetries<Anomaly[]>('/api/ai/alerts', token), {
    staleTime: 30_000,
    retry: 3,
    refetchInterval: 60_000,
  });
};

export const useAIAnomalies = (token?: string) => {
  return useQuery(['ai', 'anomalies'], () => fetchWithRetries<Anomaly[]>('/api/ai/anomalies', token), {
    staleTime: 30_000,
    retry: 3,
    refetchInterval: 60_000,
  });
};

export const useAIPredictions = (token?: string) => {
  return useQuery(['ai', 'predictions'], () => fetchWithRetries<Prediction[]>('/api/ai/predictions', token), {
    staleTime: 60_000,
    retry: 3,
    refetchInterval: 120_000,
  });
};

export const queryAI = async (text: string) => {
  const res = await request<{ results: Array<{ title: string; route?: string; score?: number }> }>({
    url: '/api/ai/query',
    method: 'POST',
    body: { q: text },
  });
  return res;
};

export default {};
