import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type RemoteSession = {
  id: string;
  ticket: string;
  status: string;
  remote_tool: string;
  remote_code?: string | null;
  consent_status: string;
  policy_version_id?: string | null;
  requested_by_id?: string | null;
  requested_by_label?: string | null;
  requested_by_role?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  recording_url?: string | null;
};

export type SessionConsent = {
  id: string;
  session: string;
  status: string;
  consent_text?: string | null;
  requested_at: string;
  expires_at?: string | null;
  responded_at?: string | null;
  responder_label?: string | null;
  responder_role?: string | null;
};

export type SessionEvent = {
  id: string;
  session: string;
  event_type: string;
  message?: string | null;
  actor_label?: string | null;
  created_at: string;
};

export type SessionArtifact = {
  id: string;
  session: string;
  artifact_type: string;
  label?: string | null;
  url?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  created_by_label?: string | null;
  expires_at?: string | null;
  created_at: string;
};

export type RemoteSessionPolicyTemplate = {
  id: string;
  name: string;
  description?: string;
  scope_type: string;
  scope_value?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RemoteSessionPolicyVersion = {
  id: string;
  template: string;
  version: number;
  status: "draft" | "published" | "archived";
  config: Record<string, any>;
  created_by_id?: string | null;
  created_by_label?: string | null;
  published_at?: string | null;
  published_by_id?: string | null;
  published_by_label?: string | null;
  created_at: string;
};

export const listRemoteSessions = (
  token: string,
  params: Record<string, string | number | undefined>
) =>
  request<PaginatedResponse<RemoteSession> | RemoteSession[]>(
    `/bff/admin/service/ras/sessions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const getRemoteSession = (token: string, id: string) =>
  request<RemoteSession>(`/bff/admin/service/ras/sessions/${id}/`, { method: "GET" }, token);

export const activateRemoteSession = (token: string, id: string) =>
  request<RemoteSession>(`/bff/admin/service/ras/sessions/${id}/activate/`, { method: "POST" }, token);

export const stopRemoteSession = (token: string, id: string) =>
  request<RemoteSession>(`/bff/admin/service/ras/sessions/${id}/stop/`, { method: "POST" }, token);

export const listSessionConsents = (token: string, sessionId: string) =>
  request<PaginatedResponse<SessionConsent> | SessionConsent[]>(
    `/bff/admin/service/ras/session-consents/${buildQuery({ session: sessionId })}`,
    { method: "GET" },
    token
  );

export const listSessionEvents = (token: string, sessionId: string) =>
  request<PaginatedResponse<SessionEvent> | SessionEvent[]>(
    `/bff/admin/service/ras/session-events/${buildQuery({ session: sessionId })}`,
    { method: "GET" },
    token
  );

export const listSessionArtifacts = (token: string, sessionId: string) =>
  request<PaginatedResponse<SessionArtifact> | SessionArtifact[]>(
    `/bff/admin/service/ras/session-artifacts/${buildQuery({ session: sessionId })}`,
    { method: "GET" },
    token
  );

export const listRemoteSessionPolicies = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<PaginatedResponse<RemoteSessionPolicyTemplate>>(
    `/bff/admin/service/ras/remote-session-policies/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createRemoteSessionPolicy = (
  token: string,
  payload: Partial<RemoteSessionPolicyTemplate>
) =>
  request<RemoteSessionPolicyTemplate>(
    `/bff/admin/service/ras/remote-session-policies/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateRemoteSessionPolicy = (
  token: string,
  id: string,
  payload: Partial<RemoteSessionPolicyTemplate>
) =>
  request<RemoteSessionPolicyTemplate>(
    `/bff/admin/service/ras/remote-session-policies/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const getRemoteSessionPolicy = (token: string, id: string) =>
  request<RemoteSessionPolicyTemplate>(
    `/bff/admin/service/ras/remote-session-policies/${id}/`,
    { method: "GET" },
    token
  );

export const listRemoteSessionPolicyVersions = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<PaginatedResponse<RemoteSessionPolicyVersion>>(
    `/bff/admin/service/ras/remote-session-policy-versions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createRemoteSessionPolicyVersion = (
  token: string,
  payload: Partial<RemoteSessionPolicyVersion>
) =>
  request<RemoteSessionPolicyVersion>(
    `/bff/admin/service/ras/remote-session-policy-versions/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateRemoteSessionPolicyVersion = (
  token: string,
  id: string,
  payload: Partial<RemoteSessionPolicyVersion>
) =>
  request<RemoteSessionPolicyVersion>(
    `/bff/admin/service/ras/remote-session-policy-versions/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const publishRemoteSessionPolicyVersion = (token: string, id: string) =>
  request<RemoteSessionPolicyVersion>(
    `/bff/admin/service/ras/remote-session-policy-versions/${id}/publish/`,
    { method: "POST" },
    token
  );

export const simulateRemoteSessionPolicyVersion = (token: string, id: string) =>
  request<{ count: number; results: Array<Record<string, any>> }>(
    `/bff/admin/service/ras/remote-session-policy-versions/${id}/simulate/`,
    { method: "GET" },
    token
  );
