import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type SessionLog = {
  id: string;
  ras_session: string;
  log_type: string;
  message: string;
  created_at: string;
};

export type PolicyAuditLog = {
  id: string;
  policy_type: string;
  action: string;
  template_id: string;
  version_id?: string | null;
  actor_label?: string | null;
  created_at: string;
};

export type SessionConsent = {
  id: string;
  session: string;
  status: string;
  requested_at?: string | null;
  responded_at?: string | null;
  responder_label?: string | null;
};

export type SessionEvent = {
  id: string;
  session: string;
  event_type: string;
  actor_label?: string | null;
  message?: string | null;
  created_at: string;
};

export type SessionArtifact = {
  id: string;
  session: string;
  artifact_type: string;
  label?: string | null;
  url?: string | null;
  created_at: string;
};

export type ChatModerationLog = {
  id: string;
  message: string;
  action: string;
  actor_label?: string | null;
  reason?: string | null;
  created_at: string;
};

export const listSessionLogs = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<SessionLog> | SessionLog[]>(
    `/bff/admin/service/ras/logs/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listPolicyAuditLogs = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<PolicyAuditLog> | PolicyAuditLog[]>(
    `/bff/admin/service/ras/policy-audit-logs/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listSessionConsents = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<SessionConsent> | SessionConsent[]>(
    `/bff/admin/service/ras/session-consents/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listSessionEvents = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<SessionEvent> | SessionEvent[]>(
    `/bff/admin/service/ras/session-events/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listSessionArtifacts = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<SessionArtifact> | SessionArtifact[]>(
    `/bff/admin/service/ras/session-artifacts/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listChatModerationLogs = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<ChatModerationLog> | ChatModerationLog[]>(
    `/bff/admin/service/ras/chat-moderation-logs/${buildQuery(params)}`,
    { method: "GET" },
    token
  );
