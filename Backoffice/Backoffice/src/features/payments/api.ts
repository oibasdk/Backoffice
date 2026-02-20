import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type Order = {
  id: string;
  customer_id: string;
  total_cents: number;
  currency: string;
  order_type: string;
  status: string;
  created_at: string;
};

export type PaymentMethod = {
  id: string;
  code: string;
  name_ar?: string;
  name_en?: string;
  method_type?: string;
  is_active?: boolean;
  deep_link?: string;
  logo_url?: string;
  instructions?: string;
  fee_percent?: number;
  fee_cents?: number;
  supports_qr?: boolean;
  sort_order?: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export type PaymentIntent = {
  id: string;
  reference: string;
  customer_id: string;
  order?: string | null;
  method: string;
  method_detail?: PaymentMethod;
  amount_cents: number;
  currency: string;
  status: string;
  expires_at?: string | null;
  created_at: string;
};

export type PaymentProof = {
  id: string;
  intent: string;
  submitted_by?: string;
  reference?: string;
  receipt_url?: string;
  status: string;
  status_reason?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
};

export type Escrow = {
  id: string;
  order: string;
  amount_cents: number;
  currency: string;
  status: string;
  hold_reason?: string | null;
  released_at?: string | null;
  refunded_at?: string | null;
  created_at: string;
};

export type EscrowTransaction = {
  id: string;
  order: string;
  amount_cents: number;
  currency: string;
  status: string;
  hold_reason?: string | null;
  released_at?: string | null;
  refunded_at?: string | null;
};

export type Payout = {
  id: string;
  target_type: string;
  target_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  sent_at?: string | null;
};

export type Bank = {
  id: string;
  name_ar: string;
  name_en: string;
  deep_link: string;
};

export type PaymentAuditLog = {
  id: string;
  actor_id?: string | null;
  resource_type: string;
  resource_id: string;
  action: string;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance_cents: number;
  currency: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type WalletTransaction = {
  id: string;
  wallet: string;
  tx_type: string;
  amount_cents: number;
  currency: string;
  reason?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  status: string;
  created_at: string;
};

export type ReferralCode = {
  id: string;
  user_id: string;
  code: string;
  is_active: boolean;
  created_at: string;
};

export type ReferralEvent = {
  id: string;
  code?: string | null;
  referrer_user_id: string;
  referred_user_id: string;
  event_type: string;
  status: string;
  reason?: string | null;
  created_at: string;
  completed_at?: string | null;
};

export type RewardRule = {
  id: string;
  name: string;
  event_type: string;
  reward_type: string;
  amount_cents: number;
  percent: number;
  currency: string;
  max_per_user: number;
  cooldown_days: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type RewardTransaction = {
  id: string;
  user_id: string;
  rule?: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  wallet_transaction?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  created_at: string;
};

export const listOrders = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<Order>>(
    `/bff/admin/service/payment/orders/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const refundOrder = (token: string, orderId: string, reason?: string) =>
  request<Order>(
    `/bff/admin/service/payment/orders/${orderId}/refund/`,
    { method: "POST", body: JSON.stringify({ reason }) },
    token
  );

export const listPaymentIntents = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<PaymentIntent> | PaymentIntent[]>(
    `/bff/admin/service/payment/payment-intents/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const completePaymentIntent = (token: string, intentId: string) =>
  request<PaymentIntent>(
    `/bff/admin/service/payment/payment-intents/${intentId}/complete/`,
    { method: "POST" },
    token
  );

export const cancelPaymentIntent = (token: string, intentId: string) =>
  request<PaymentIntent>(
    `/bff/admin/service/payment/payment-intents/${intentId}/cancel/`,
    { method: "POST" },
    token
  );

export const listPaymentProofs = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<PaymentProof> | PaymentProof[]>(
    `/bff/admin/service/payment/payment-proofs/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const approvePaymentProof = (token: string, proofId: string, reason?: string) =>
  request<PaymentProof>(
    `/bff/admin/service/payment/payment-proofs/${proofId}/approve/`,
    { method: "POST", body: JSON.stringify({ reason }) },
    token
  );

export const rejectPaymentProof = (token: string, proofId: string, reason?: string) =>
  request<PaymentProof>(
    `/bff/admin/service/payment/payment-proofs/${proofId}/reject/`,
    { method: "POST", body: JSON.stringify({ reason }) },
    token
  );

export const listEscrows = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<Escrow> | Escrow[]>(
    `/bff/admin/service/payment/escrows/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listEscrowTransactions = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<EscrowTransaction> | EscrowTransaction[]>(
    `/bff/admin/service/payment/escrow-transactions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listPayouts = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<Payout> | Payout[]>(
    `/bff/admin/service/payment/payouts/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listBanks = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<Bank> | Bank[]>(
    `/bff/admin/service/payment/banks/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listPaymentMethods = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<PaymentMethod> | PaymentMethod[]>(
    `/bff/admin/service/payment/payment-methods/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listPaymentAuditLogs = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<PaymentAuditLog> | PaymentAuditLog[]>(
    `/bff/admin/service/payment/payment-audit-logs/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listWallets = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<Wallet> | Wallet[]>(
    `/bff/admin/service/payment/wallets/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const updateWallet = (token: string, id: string, payload: Partial<Wallet>) =>
  request<Wallet>(
    `/bff/admin/service/payment/wallets/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const freezeWallet = (token: string, id: string) =>
  request<Wallet>(
    `/bff/admin/service/payment/wallets/${id}/freeze/`,
    { method: "POST" },
    token
  );

export const unfreezeWallet = (token: string, id: string) =>
  request<Wallet>(
    `/bff/admin/service/payment/wallets/${id}/unfreeze/`,
    { method: "POST" },
    token
  );

export const adjustWallet = (
  token: string,
  id: string,
  payload: { amount_cents: number; reason?: string }
) =>
  request<{ wallet: Wallet; transaction: WalletTransaction }>(
    `/bff/admin/service/payment/wallets/${id}/adjust/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const listWalletTransactions = (
  token: string,
  params: Record<string, string | number | undefined>
) =>
  request<PaginatedResponse<WalletTransaction> | WalletTransaction[]>(
    `/bff/admin/service/payment/wallet-transactions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listReferralCodes = (
  token: string,
  params: Record<string, string | number | undefined>
) =>
  request<PaginatedResponse<ReferralCode> | ReferralCode[]>(
    `/bff/admin/service/payment/referral-codes/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createReferralCode = (token: string, payload: Partial<ReferralCode>) =>
  request<ReferralCode>(
    `/bff/admin/service/payment/referral-codes/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateReferralCode = (token: string, id: string, payload: Partial<ReferralCode>) =>
  request<ReferralCode>(
    `/bff/admin/service/payment/referral-codes/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const listReferralEvents = (
  token: string,
  params: Record<string, string | number | undefined>
) =>
  request<PaginatedResponse<ReferralEvent> | ReferralEvent[]>(
    `/bff/admin/service/payment/referral-events/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const listRewardRules = (
  token: string,
  params: Record<string, string | number | undefined>
) =>
  request<PaginatedResponse<RewardRule> | RewardRule[]>(
    `/bff/admin/service/payment/reward-rules/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createRewardRule = (token: string, payload: Partial<RewardRule>) =>
  request<RewardRule>(
    `/bff/admin/service/payment/reward-rules/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateRewardRule = (token: string, id: string, payload: Partial<RewardRule>) =>
  request<RewardRule>(
    `/bff/admin/service/payment/reward-rules/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteRewardRule = (token: string, id: string) =>
  request<void>(
    `/bff/admin/service/payment/reward-rules/${id}/`,
    { method: "DELETE" },
    token
  );

export const listRewardTransactions = (
  token: string,
  params: Record<string, string | number | undefined>
) =>
  request<PaginatedResponse<RewardTransaction> | RewardTransaction[]>(
    `/bff/admin/service/payment/reward-transactions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );
