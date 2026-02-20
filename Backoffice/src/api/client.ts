import { BFF_BASE_URL } from "../app/config";

export type ApiErrorPayload = {
  code: number;
  message: string;
  details?: unknown;
  request_id?: string;
};

export class ApiError extends Error {
  code: number;
  details?: unknown;
  requestId?: string;

  constructor(code: number, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

const normalizePath = (path: string) => {
  if (path.startsWith("http")) {
    return path;
  }
  const base = BFF_BASE_URL || "";
  if (!base) {
    return path;
  }
  return `${base}${path}`;
};

export const request = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(normalizePath(path), {
    ...options,
    headers,
  });

  const requestId = response.headers.get("X-Request-ID") || undefined;
  const contentType = response.headers.get("content-type") || "";

  let payload: any = null;
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const message = payload?.message || payload?.detail || response.statusText;
    const error = new ApiError(response.status, message, payload?.details || payload, requestId);
    console.info("api_error", { path, status: response.status, request_id: requestId });
    throw error;
  }

  return payload as T;
};
