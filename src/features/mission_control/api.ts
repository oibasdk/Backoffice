import { request } from "../../api/client";
import { buildQuery } from "../../api/query";

export type OverviewMetrics = {
  counts?: Record<string, number>;
  series?: Record<string, Array<{ label: string; value: number }>>;
};

export type SecuritySnapshot = {
  total_users?: number;
  locked_users?: number;
  unverified_users?: number;
  two_fa_enabled_users?: number;
  security_score?: number;
};

export type NotificationItem = {
  id: number | string;
  title?: string;
  message?: string;
  notification_type?: string;
  user_email?: string;
  is_read?: boolean;
  created_at?: string;
  action_url?: string;
};

export type HealthFeedItem = {
  id: number | string;
  timestamp?: string;
  service_name?: string;
  status?: string;
  response_time?: number;
  cpu_usage?: number;
  memory_usage?: number;
};

export type PaymentAuditLogItem = {
  id: number | string;
  actor_id?: string;
  resource_type?: string;
  resource_id?: string;
  action?: string;
  created_at?: string;
};

export type RasLogItem = {
  id: number | string;
  ras_session?: string;
  log_type?: string;
  message?: string;
  created_at?: string;
};

export type ActionLogs = {
  payments?: PaymentAuditLogItem[];
  ras?: RasLogItem[];
};

export type UserSessionItem = {
  id: number | string;
  session_id?: string;
  user_email?: string;
  ip_address?: string;
  started_at?: string;
  last_seen_at?: string;
  is_active?: boolean;
};

export type UserDeviceItem = {
  id: number | string;
  device_id?: string;
  user_email?: string;
  device_type?: string;
  os_name?: string;
  app_version?: string;
  last_seen_at?: string;
  is_trusted?: boolean;
};

export type AccessSnapshot = {
  sessions?: UserSessionItem[];
  devices?: UserDeviceItem[];
};

export type RegistrationStatItem = {
  date?: string;
  total_registrations?: number;
  customer_registrations?: number;
  vendor_registrations?: number;
  provider_registrations?: number;
  admin_registrations?: number;
};

export type LoginStatItem = {
  date?: string;
  total_logins?: number;
  unique_users?: number;
  failed_logins?: number;
};

export type LatestUserItem = {
  id: number | string;
  email?: string;
  role?: string;
  account_status?: string;
  created_at?: string;
  last_activity?: string;
};

export type LatestOrderItem = {
  id: number | string;
  customer_id?: string;
  total_cents?: number;
  currency?: string;
  order_type?: string;
  status?: string;
};

export type LatestProductItem = {
  id: number | string;
  name?: string;
  price_cents?: number;
  currency?: string;
  approval_status?: string;
  created_at?: string;
};

export type OverviewResponse = {
  range: string;
  generated_at: string;
  metrics: {
    auth?: OverviewMetrics;
    catalog?: OverviewMetrics;
    payment?: OverviewMetrics;
    ras?: OverviewMetrics;
  };
  services: Record<string, { ok: boolean; duration_ms: number }>;
  security?: SecuritySnapshot;
  alerts?: Array<Record<string, unknown>>;
  notifications?: NotificationItem[];
  health_feed?: HealthFeedItem[];
  access?: AccessSnapshot;
  analytics?: {
    registrations?: RegistrationStatItem[];
    logins?: LoginStatItem[];
  };
  latest?: {
    users?: LatestUserItem[];
    orders?: LatestOrderItem[];
    products?: LatestProductItem[];
  };
  configuration?: {
    feature_flags?: number;
    app_settings?: number;
    config_versions?: number;
    content_sections?: number;
    content_blocks?: number;
    content_templates?: number;
  };
  action_logs?: ActionLogs;
  activity?: Array<Record<string, unknown>>;
};

export const getOverview = (
  token: string,
  range: string,
  params?: { start?: string; end?: string }
) =>
  request<OverviewResponse>(
    `/bff/admin/overview${buildQuery({ range, start: params?.start, end: params?.end })}`,
    { method: "GET" },
    token
  );
