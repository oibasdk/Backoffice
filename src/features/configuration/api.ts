import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type FeatureFlag = {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_roles: string[];
  created_at: string;
  updated_at: string;
};

export type AppSetting = {
  id: number;
  key: string;
  description?: string | null;
  value: unknown;
  value_type: "string" | "number" | "boolean" | "json";
  group?: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type AppConfigVersion = {
  id: number;
  version: number;
  name: string;
  description?: string | null;
  status: "draft" | "active" | "archived";
  created_at: string;
  activated_at?: string | null;
};

export type ContentSection = {
  id: number;
  config_version: number;
  screen?: string | null;
  key: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  section_type: string;
  payload?: unknown;
  sort_order: number;
  is_visible: boolean;
  variant_key?: string | null;
  rollout_percentage?: number | null;
  target_roles?: string[];
  target_locales?: string[];
  target_countries?: string[];
  target_segments?: string[];
  target_tags?: string[];
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentBlock = {
  id: number;
  section: number;
  key: string;
  block_type: string;
  payload?: unknown;
  sort_order: number;
  is_visible: boolean;
  variant_key?: string | null;
  rollout_percentage?: number | null;
  target_roles?: string[];
  target_locales?: string[];
  target_countries?: string[];
  target_segments?: string[];
  target_tags?: string[];
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentTemplate = {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  section_type: string;
  default_screen?: string | null;
  is_active: boolean;
  updated_at: string;
};

export type ContentTemplateBlock = {
  id: number;
  template: number;
  key: string;
  block_type: string;
  payload?: unknown;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at: string;
};

export const listFeatureFlags = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<FeatureFlag>>(
    `/bff/admin/feature-flags/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createFeatureFlag = (token: string, payload: Partial<FeatureFlag>) =>
  request<FeatureFlag>(
    `/bff/admin/feature-flags/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateFeatureFlag = (token: string, id: number, payload: Partial<FeatureFlag>) =>
  request<FeatureFlag>(
    `/bff/admin/feature-flags/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const listAppSettings = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<AppSetting>>(
    `/bff/admin/app-settings/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createAppSetting = (token: string, payload: Partial<AppSetting>) =>
  request<AppSetting>(
    `/bff/admin/app-settings/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateAppSetting = (token: string, id: number, payload: Partial<AppSetting>) =>
  request<AppSetting>(
    `/bff/admin/app-settings/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteAppSetting = (token: string, id: number) =>
  request<void>(`/bff/admin/app-settings/${id}/`, { method: "DELETE" }, token);

export const listConfigVersions = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<AppConfigVersion>>(
    `/bff/admin/app-config-versions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createConfigVersion = (token: string, payload: Partial<AppConfigVersion>) =>
  request<AppConfigVersion>(
    `/bff/admin/app-config-versions/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const activateConfigVersion = (token: string, id: number) =>
  request<{ status: string; version: number }>(
    `/bff/admin/app-config-versions/${id}/activate/`,
    { method: "POST" },
    token
  );

export const listContentSections = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<ContentSection>>(
    `/bff/admin/content-sections/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createContentSection = (token: string, payload: Partial<ContentSection>) =>
  request<ContentSection>(
    `/bff/admin/content-sections/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateContentSection = (token: string, id: number, payload: Partial<ContentSection>) =>
  request<ContentSection>(
    `/bff/admin/content-sections/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteContentSection = (token: string, id: number) =>
  request<void>(`/bff/admin/content-sections/${id}/`, { method: "DELETE" }, token);

export const listContentBlocks = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<ContentBlock>>(
    `/bff/admin/content-blocks/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createContentBlock = (token: string, payload: Partial<ContentBlock>) =>
  request<ContentBlock>(
    `/bff/admin/content-blocks/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateContentBlock = (token: string, id: number, payload: Partial<ContentBlock>) =>
  request<ContentBlock>(
    `/bff/admin/content-blocks/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteContentBlock = (token: string, id: number) =>
  request<void>(`/bff/admin/content-blocks/${id}/`, { method: "DELETE" }, token);

export const listContentTemplates = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<ContentTemplate>>(
    `/bff/admin/content-templates/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listContentTemplateBlocks = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<PaginatedResponse<ContentTemplateBlock>>(
    `/bff/admin/content-template-blocks/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createContentTemplateBlock = (token: string, payload: Partial<ContentTemplateBlock>) =>
  request<ContentTemplateBlock>(
    `/bff/admin/content-template-blocks/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateContentTemplateBlock = (
  token: string,
  id: number,
  payload: Partial<ContentTemplateBlock>
) =>
  request<ContentTemplateBlock>(
    `/bff/admin/content-template-blocks/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteContentTemplateBlock = (token: string, id: number) =>
  request<void>(`/bff/admin/content-template-blocks/${id}/`, { method: "DELETE" }, token);

export const applyContentTemplate = (
  token: string,
  templateId: number,
  payload: { screen?: string; config_version_id?: number; key_prefix?: string }
) =>
  request<Record<string, any>>(
    `/bff/admin/content-templates/${templateId}/apply/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const runContentTemplateSync = (
  token: string,
  payload: {
    config_version_id?: number;
    screens?: string[];
    mode?: string;
    limit?: number;
  }
) =>
  request<Record<string, any>>(
    `/bff/admin/content-templates/sync/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const previewFrontendConfig = (params: Record<string, string | number | undefined>) =>
  request<Record<string, any>>(
    `/bff/public/auth/config/${buildQuery(params)}`,
    { method: "GET" }
  );
