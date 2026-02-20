import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type SlaPolicyTemplate = {
  id: string;
  name: string;
  description?: string;
  scope_type: string;
  scope_value?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SlaPolicyVersion = {
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

export const listSlaPolicies = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<SlaPolicyTemplate>>(
    `/bff/admin/service/ras/sla-policies/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createSlaPolicy = (token: string, payload: Partial<SlaPolicyTemplate>) =>
  request<SlaPolicyTemplate>(
    "/bff/admin/service/ras/sla-policies/",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateSlaPolicy = (token: string, id: string, payload: Partial<SlaPolicyTemplate>) =>
  request<SlaPolicyTemplate>(
    `/bff/admin/service/ras/sla-policies/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const getSlaPolicy = (token: string, id: string) =>
  request<SlaPolicyTemplate>(`/bff/admin/service/ras/sla-policies/${id}/`, { method: "GET" }, token);

export const listSlaPolicyVersions = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<SlaPolicyVersion>>(
    `/bff/admin/service/ras/sla-policy-versions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createSlaPolicyVersion = (token: string, payload: Partial<SlaPolicyVersion>) =>
  request<SlaPolicyVersion>(
    "/bff/admin/service/ras/sla-policy-versions/",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateSlaPolicyVersion = (token: string, id: string, payload: Partial<SlaPolicyVersion>) =>
  request<SlaPolicyVersion>(
    `/bff/admin/service/ras/sla-policy-versions/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const getSlaPolicyVersion = (token: string, id: string) =>
  request<SlaPolicyVersion>(`/bff/admin/service/ras/sla-policy-versions/${id}/`, { method: "GET" }, token);

export const publishSlaPolicyVersion = (token: string, id: string) =>
  request<SlaPolicyVersion>(
    `/bff/admin/service/ras/sla-policy-versions/${id}/publish/`,
    { method: "POST" },
    token
  );

export const simulateSlaPolicyVersion = (token: string, id: string) =>
  request<{ count: number; results: Array<Record<string, any>> }>(
    `/bff/admin/service/ras/sla-policy-versions/${id}/simulate/`,
    { method: "GET" },
    token
  );
