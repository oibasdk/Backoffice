import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type AdminUser = {
  id: number;
  public_id?: string;
  user_code?: string | null;
  email: string;
  role: string;
  account_status: string;
  last_activity: string | null;
  created_at: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  failed_login_attempts?: number | null;
  locked_until?: string | null;
  email_verified?: boolean;
  session_timeout?: number | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  notes?: string | null;
  two_fa_enabled?: boolean;
  provider_type?: string | null;
  business_name?: string | null;
  business_category?: string | null;
  business_license_id?: string | null;
};

export type Permission = {
  id: number;
  name: string;
  codename: string;
  description?: string | null;
  resource: string;
  action: string;
};

export type UserPermission = {
  id: number;
  user: number;
  permission: number;
  permission_details?: Permission;
  granted_at?: string;
  expires_at?: string | null;
};

export type UserSession = {
  id: number;
  session_id: string;
  user: number | null;
  user_email?: string | null;
  device_id?: string | null;
  is_guest: boolean;
  consent_granted?: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  locale?: string | null;
  timezone?: string | null;
  started_at: string;
  last_seen_at?: string | null;
  ended_at?: string | null;
  risk_score?: number | null;
  is_active?: boolean;
};

export type RoleTemplate = {
  id: number;
  role: string;
  name: string;
  description?: string;
  is_active: boolean;
  permissions_detail?: Array<{ id: number; name: string; resource: string; action: string }>;
  templates_detail?: Array<{ id: number; name: string }>;
  effective_permissions?: Array<{ id: number; name: string; resource: string; action: string }>;
  created_at?: string;
  updated_at?: string;
};

export type PermissionTemplate = {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  permissions_detail?: Array<{ id: number; name: string; resource: string; action: string }>;
};

export type UserDevice = {
  id: number;
  user?: number | null;
  user_email?: string | null;
  device_id: string;
  device_type: string;
  device_name?: string | null;
  os_name?: string | null;
  os_version?: string | null;
  app_version?: string | null;
  app_build?: string | null;
  locale?: string | null;
  timezone?: string | null;
  last_ip?: string | null;
  last_seen_at?: string | null;
  is_trusted: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export type AdminUserCreatePayload = {
  email: string;
  password: string;
  role: string;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  account_status?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  notes?: string | null;
  provider_type?: string | null;
  business_name?: string | null;
  business_category?: string | null;
  business_license_id?: string | null;
};

export const listUsers = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<AdminUser>>(
    `/bff/admin/users/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createUser = (token: string, payload: AdminUserCreatePayload) =>
  request<AdminUser>(
    `/bff/admin/users/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateUser = (token: string, userId: string | number, payload: Partial<AdminUser>) =>
  request<AdminUser>(
    `/bff/admin/users/${userId}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const getUser = (token: string, userId: string) =>
  request<AdminUser>(`/bff/admin/users/${userId}/`, { method: "GET" }, token);

export const setUserPin = (token: string, userId: string, payload: { pin: string }) =>
  request<{ status: string }>(
    `/bff/admin/users/${userId}/set_pin/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const resetUserTwoFa = (token: string, userId: string) =>
  request<{ status: string }>(`/bff/admin/users/${userId}/reset_2fa/`, { method: "POST" }, token);

export const verifyUserEmail = (token: string, userId: string) =>
  request<{ status: string }>(`/bff/admin/users/${userId}/verify_email/`, { method: "POST" }, token);

export const setUserSessionTimeout = (token: string, userId: string, session_timeout: number) =>
  request<{ status: string; session_timeout: number }>(
    `/bff/admin/users/${userId}/set_session_timeout/`,
    { method: "POST", body: JSON.stringify({ session_timeout }) },
    token
  );

export const lockUser = (
  token: string,
  userId: string,
  payload: { duration_minutes: number; reason?: string }
) =>
  request<{ status: string; locked_until?: string }>(
    `/bff/admin/users/${userId}/lock/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const unlockUser = (token: string, userId: string, payload?: { reason?: string }) =>
  request<{ status: string }>(
    `/bff/admin/users/${userId}/unlock/`,
    { method: "POST", body: JSON.stringify(payload || {}) },
    token
  );

export const suspendUser = (token: string, userId: string, payload?: { reason?: string }) =>
  request<{ status: string }>(
    `/bff/admin/users/${userId}/suspend/`,
    { method: "POST", body: JSON.stringify(payload || {}) },
    token
  );

export const activateUser = (token: string, userId: string, payload?: { reason?: string }) =>
  request<{ status: string }>(
    `/bff/admin/users/${userId}/activate/`,
    { method: "POST", body: JSON.stringify(payload || {}) },
    token
  );

export const listPermissions = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<Permission>>(
    `/bff/admin/permissions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listUserPermissions = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<PaginatedResponse<UserPermission>>(
    `/bff/admin/user-permissions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const grantUserPermission = (
  token: string,
  payload: { user: number; permission: number; expires_at?: string | null }
) =>
  request<UserPermission>(
    `/bff/admin/user-permissions/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const revokeUserPermission = (token: string, id: number) =>
  request<void>(`/bff/admin/user-permissions/${id}/`, { method: "DELETE" }, token);

export const listUserSessions = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<UserSession>>(
    `/bff/admin/user-sessions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listUserDevices = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<UserDevice>>(
    `/bff/admin/user-devices/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const updateUserDevice = (token: string, deviceId: number, payload: Partial<UserDevice>) =>
  request<UserDevice>(
    `/bff/admin/user-devices/${deviceId}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const terminateUserSession = (token: string, sessionId: number) =>
  request<{ status: string }>(
    `/bff/admin/user-sessions/${sessionId}/terminate/`,
    { method: "POST" },
    token
  );

export const listRoleTemplates = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<RoleTemplate>>(
    `/bff/admin/role-templates/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const updateRoleTemplate = (token: string, id: number, payload: Partial<RoleTemplate>) =>
  request<RoleTemplate>(
    `/bff/admin/role-templates/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const applyRoleTemplate = (token: string, id: number) =>
  request<{ status: string }>(`/bff/admin/role-templates/${id}/apply_to_users/`, { method: "POST" }, token);

export const listPermissionTemplates = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<PermissionTemplate>>(
    `/bff/admin/permission-templates/${buildQuery(params)}`,
    { method: "GET" },
    token
  );
