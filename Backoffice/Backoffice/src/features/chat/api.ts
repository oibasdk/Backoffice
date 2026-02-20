import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type ChatThread = {
  id: string;
  ticket: string;
  ticket_title?: string | null;
  status: string;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  thread: string;
  sender_id: string;
  sender_role: string;
  sender_type: string;
  content: string;
  attachments: Array<Record<string, any>>;
  moderation_state: string;
  moderation_reason?: string | null;
  moderated_by_id?: string | null;
  moderated_by_label?: string | null;
  moderated_at?: string | null;
  policy_version_id?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  expires_at?: string | null;
  created_at: string;
};

export type ChatPolicyTemplate = {
  id: string;
  name: string;
  description?: string;
  scope_type: string;
  scope_value?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatPolicyVersion = {
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

export const listChatThreads = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<ChatThread>>(
    `/bff/admin/service/ras/chat-threads/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const getChatThread = (token: string, id: string) =>
  request<ChatThread>(`/bff/admin/service/ras/chat-threads/${id}/`, { method: "GET" }, token);

export const listChatMessages = (token: string, threadId: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<ChatMessage>>(
    `/bff/admin/service/ras/chat-messages/${buildQuery({ thread: threadId, ...params })}`,
    { method: "GET" },
    token
  );

export const createChatMessage = (token: string, payload: { thread: string; content: string; attachments?: Array<Record<string, any>> }) =>
  request<ChatMessage>(
    `/bff/admin/service/ras/chat-messages/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const moderateChatMessage = (
  token: string,
  messageId: string,
  payload: { action: string; reason?: string }
) =>
  request<ChatMessage>(
    `/bff/admin/service/ras/chat-messages/${messageId}/moderate/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const listChatPolicies = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<ChatPolicyTemplate>>(
    `/bff/admin/service/ras/chat-policies/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createChatPolicy = (token: string, payload: Partial<ChatPolicyTemplate>) =>
  request<ChatPolicyTemplate>(
    `/bff/admin/service/ras/chat-policies/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateChatPolicy = (token: string, id: string, payload: Partial<ChatPolicyTemplate>) =>
  request<ChatPolicyTemplate>(
    `/bff/admin/service/ras/chat-policies/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const getChatPolicy = (token: string, id: string) =>
  request<ChatPolicyTemplate>(`/bff/admin/service/ras/chat-policies/${id}/`, { method: "GET" }, token);

export const listChatPolicyVersions = (token: string, params: Record<string, string | number | undefined> = {}) =>
  request<PaginatedResponse<ChatPolicyVersion>>(
    `/bff/admin/service/ras/chat-policy-versions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createChatPolicyVersion = (token: string, payload: Partial<ChatPolicyVersion>) =>
  request<ChatPolicyVersion>(
    `/bff/admin/service/ras/chat-policy-versions/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateChatPolicyVersion = (token: string, id: string, payload: Partial<ChatPolicyVersion>) =>
  request<ChatPolicyVersion>(
    `/bff/admin/service/ras/chat-policy-versions/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const publishChatPolicyVersion = (token: string, id: string) =>
  request<ChatPolicyVersion>(
    `/bff/admin/service/ras/chat-policy-versions/${id}/publish/`,
    { method: "POST" },
    token
  );

export const simulateChatPolicyVersion = (token: string, id: string) =>
  request<{ count: number; results: Array<Record<string, any>> }>(
    `/bff/admin/service/ras/chat-policy-versions/${id}/simulate/`,
    { method: "GET" },
    token
  );
