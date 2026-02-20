import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type VendorAccount = {
  id: number;
  email: string;
  role: string;
  account_status: string;
  created_at: string;
  is_active: boolean;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type CatalogProduct = {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  currency: string;
  product_type: string;
  approval_status: string;
  vendor_id?: string | null;
  created_at: string;
  reviewed_by_label?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
};

export const listVendors = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<VendorAccount>>(
    `/bff/admin/users/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const approveVendor = (token: string, userId: string) =>
  request<VendorAccount>(`/bff/admin/users/${userId}/approve/`, { method: "POST" }, token);

export const rejectVendor = (token: string, userId: string, reason?: string) =>
  request<VendorAccount>(
    `/bff/admin/users/${userId}/reject/`,
    { method: "POST", body: JSON.stringify({ reason }) },
    token
  );

export const listProducts = (token: string, params: Record<string, string | number | undefined>) =>
  request<PaginatedResponse<CatalogProduct>>(
    `/bff/admin/service/catalog/products/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const approveProduct = (token: string, productId: string) =>
  request<CatalogProduct>(
    `/bff/admin/service/catalog/products/${productId}/approve/`,
    { method: "POST" },
    token
  );

export const rejectProduct = (token: string, productId: string, reason?: string) =>
  request<CatalogProduct>(
    `/bff/admin/service/catalog/products/${productId}/reject/`,
    { method: "POST", body: JSON.stringify({ reason }) },
    token
  );
