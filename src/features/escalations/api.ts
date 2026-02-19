import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type EscalationPolicyTemplate = {
  id: string;
  name: string;
  description?: string;
  scope_type: string;
  scope_value?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EscalationPolicyVersion = {
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

export const listEscalationPolicies = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<PaginatedResponse<EscalationPolicyTemplate>>(
    `/bff/admin/service/ras/escalation-policies/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createEscalationPolicy = (token: string, payload: Partial<EscalationPolicyTemplate>) =>
  request<EscalationPolicyTemplate>(
    "/bff/admin/service/ras/escalation-policies/",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateEscalationPolicy = (token: string, id: string, payload: Partial<EscalationPolicyTemplate>) =>
  request<EscalationPolicyTemplate>(
    `/bff/admin/service/ras/escalation-policies/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const getEscalationPolicy = (token: string, id: string) =>
  request<EscalationPolicyTemplate>(
    `/bff/admin/service/ras/escalation-policies/${id}/`,
    { method: "GET" },
    token
  );

export const listEscalationPolicyVersions = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<PaginatedResponse<EscalationPolicyVersion>>(
    `/bff/admin/service/ras/escalation-policy-versions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createEscalationPolicyVersion = (token: string, payload: Partial<EscalationPolicyVersion>) =>
  request<EscalationPolicyVersion>(
    "/bff/admin/service/ras/escalation-policy-versions/",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateEscalationPolicyVersion = (
  token: string,
  id: string,
  payload: Partial<EscalationPolicyVersion>
) =>
  request<EscalationPolicyVersion>(
    `/bff/admin/service/ras/escalation-policy-versions/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const getEscalationPolicyVersion = (token: string, id: string) =>
  request<EscalationPolicyVersion>(
    `/bff/admin/service/ras/escalation-policy-versions/${id}/`,
    { method: "GET" },
    token
  );

export const publishEscalationPolicyVersion = (token: string, id: string) =>
  request<EscalationPolicyVersion>(
    `/bff/admin/service/ras/escalation-policy-versions/${id}/publish/`,
    { method: "POST" },
    token
  );

export const simulateEscalationPolicyVersion = (token: string, id: string) =>
  request<{ count: number; results: Array<Record<string, any>> }>(
    `/bff/admin/service/ras/escalation-policy-versions/${id}/simulate/`,
    { method: "GET" },
    token
  );
