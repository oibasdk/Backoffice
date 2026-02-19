import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type AuditLogEntry = {
  id: number;
  action: string;
  resource: string;
  resource_id?: string | null;
  timestamp: string;
  success: boolean;
  error_message?: string | null;
  user?: number | null;
  user_email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown>;
};

export const listAuditLogs = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<AuditLogEntry>>(
    `/bff/admin/audit-logs/${buildQuery(params)}`,
    { method: "GET" },
    token
  );
