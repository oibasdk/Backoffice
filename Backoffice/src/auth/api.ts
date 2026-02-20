import { request } from "../api/client";
import { BFF_BASE_URL } from "../app/config";

export type LoginResponse = {
  access?: string;
  refresh?: string;
  user?: {
    email: string;
    role: string;
  };
  message?: string;
  error?: string;
  requires_2fa?: boolean;
  requires_email_verification?: boolean;
};

export type AdminAccess = {
  user: {
    id: number | string;
    email: string;
    role: string;
    first_name?: string;
    last_name?: string;
  };
  role: string;
  is_staff: boolean;
  is_superuser: boolean;
  permissions: string[];
  permission_map: Record<string, string[]>;
  feature_flags?: string[];
};

export const login = (identifier: string, password: string) =>
  request<LoginResponse>("/bff/public/auth/token/", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });

export type RefreshTokenResponse = {
  access: string;
  refresh?: string;
};

export const refreshAccessToken = (refresh: string) =>
  request<RefreshTokenResponse>("/bff/public/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });

export const getAdminAccess = (token: string) =>
  request<AdminAccess>("/bff/admin/access", { method: "GET" }, token);

export const verifyAccessToken = (token: string) =>
  request<{ detail?: string }>(
    "/bff/public/auth/token/verify/",
    { method: "POST", body: JSON.stringify({ token }) },
    token
  );

export type PublicReadyResponse = {
  status?: "ok" | "degraded" | "unavailable";
  redis?: boolean;
};

export const getPublicReady = async (): Promise<PublicReadyResponse> => {
  const url = BFF_BASE_URL ? `${BFF_BASE_URL}/bff/ready` : "/bff/ready";
  const response = await fetch(url, { method: "GET" });
  const contentType = response.headers.get("content-type") || "";
  let payload: any = null;
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }
  if (!response.ok) {
    if (payload && typeof payload === "object") {
      return payload as PublicReadyResponse;
    }
    return { status: "unavailable" };
  }
  return payload as PublicReadyResponse;
};
