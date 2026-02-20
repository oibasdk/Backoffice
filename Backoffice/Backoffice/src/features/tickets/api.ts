import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type Ticket = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  queue?: string | null;
  assignee_id?: string | null;
  assignee_label?: string | null;
  customer_id?: string | null;
  sla_state?: string | null;
  sla?: {
    state?: string | null;
    policy_version_id?: string | null;
    first_response_due_at?: string | null;
    resolution_due_at?: string | null;
    priority_key?: string | null;
  };
  chat_thread_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketEvent = {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
  actor_id?: string | null;
  actor_label?: string | null;
};

export const listTickets = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<Ticket>>(
    `/bff/admin/service/ras/tickets/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const getTicket = (token: string, id: string) =>
  request<Ticket>(`/bff/admin/service/ras/tickets/${id}/`, { method: "GET" }, token);

export const listTicketEvents = (token: string, id: string) =>
  request<PaginatedResponse<TicketEvent>>(
    `/bff/admin/service/ras/tickets/${id}/events/`,
    { method: "GET" },
    token
  );

export const assignTicket = (
  token: string,
  id: string,
  payload: { assignee_id: string; assignee_label?: string }
) =>
  request<Ticket>(
    `/bff/admin/service/ras/tickets/${id}/assign/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const transitionTicket = (token: string, id: string, payload: { status: string }) =>
  request<Ticket>(
    `/bff/admin/service/ras/tickets/${id}/transition/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const getTicketChatThread = (token: string, id: string) =>
  request<{ id: string }>(
    `/bff/admin/service/ras/tickets/${id}/chat_thread/`,
    { method: "GET" },
    token
  );
