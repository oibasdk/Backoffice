import { request } from "../../api/client";
import { buildQuery } from "../../api/query";

export type OpsStatus = {
  enabled: boolean;
};

export type OpsRunResult = {
  tasks: Array<{
    task: string;
    duration_ms: number;
    result: Record<string, any>;
  }>;
};

export const getOpsStatus = (token: string) =>
  request<OpsStatus>(`/bff/admin/ops/status`, { method: "GET" }, token);

export const runOpsTasks = (token: string, tasks: string[]) =>
  request<OpsRunResult>(
    `/bff/admin/ops/run`,
    { method: "POST", body: JSON.stringify({ tasks }) },
    token
  );

export const getObservabilityServices = (token: string) =>
  request<Record<string, any>>(`/bff/admin/observability/services`, { method: "GET" }, token);

export const getObservabilityTraces = (
  token: string,
  params: {
    service: string;
    lookback?: string;
    limit?: number;
    min_duration?: string;
    max_duration?: string;
    tags?: string;
  }
) =>
  request<Record<string, any>>(
    `/bff/admin/observability/traces${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export type SystemHealth = {
  id: number;
  timestamp: string;
  service_name: string;
  status: string;
  response_time?: number | null;
  memory_usage?: number | null;
  cpu_usage?: number | null;
  disk_usage?: number | null;
  active_connections?: number | null;
  error_count?: number | null;
  details?: Record<string, any>;
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  user?: number;
  user_email?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  action_url?: string | null;
  expires_at?: string | null;
};

export type SystemAlert = {
  id: number;
  alert_type: string;
  service_name: string;
  severity: string;
  message: string;
  threshold_value: number;
  current_value: number;
  is_active: boolean;
  resolved_at?: string | null;
  created_at: string;
  last_triggered?: string | null;
};

export const listSystemHealth = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<{ count?: number; results?: SystemHealth[] }>(
    `/bff/admin/monitoring/health/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listNotifications = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<{ count?: number; results?: NotificationItem[] }>(
    `/bff/admin/notifications/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const markNotificationRead = (token: string, notificationId: number) =>
  request<{ status: string }>(
    `/bff/admin/notifications/${notificationId}/mark_read/`,
    { method: "POST" },
    token
  );

export const markAllNotificationsRead = (token: string) =>
  request<{ status: string }>(
    `/bff/admin/notifications/mark_all_read/`,
    { method: "POST" },
    token
  );

export const listSystemAlerts = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<{ count?: number; results?: SystemAlert[] }>(
    `/bff/admin/alerts/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const resolveSystemAlert = (token: string, alertId: number) =>
  request<{ status: string }>(
    `/bff/admin/alerts/${alertId}/resolve/`,
    { method: "POST" },
    token
  );

export const retrySystemAlert = (token: string, alertId: number) =>
  request<{ status: string; healthy?: boolean }>(
    `/bff/admin/alerts/${alertId}/retry/`,
    { method: "POST" },
    token
  );
