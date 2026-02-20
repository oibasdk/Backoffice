import { request } from "../../api/client";
import { buildQuery } from "../../api/query";
import { PaginatedResponse } from "../../api/types";

export type Category = {
  id: number;
  name: string;
  parent?: number | null;
};

export type Profession = {
  id: number;
  name_en: string;
  name_ar: string;
  note_en?: string | null;
  note_ar?: string | null;
};

export type Product = {
  id: string;
  vendor_id?: string | null;
  name: string;
  description?: string | null;
  price_cents: number;
  currency: string;
  product_type: string;
  version?: string | null;
  size_mb?: number | null;
  supported_os?: string[] | null;
  metadata?: Record<string, any> | null;
  approval_status: string;
  reviewed_by_label?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  stock: number;
  category?: number | null;
  profession?: number | null;
  created_at: string;
};

export type ProductKey = {
  id: string;
  product: string;
  status: string;
  reserved_until?: string | null;
};

export type Bundle = {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  currency: string;
  items?: Array<{ id: number; product: string }>;
};

export type CatalogListResponse<T> = PaginatedResponse<T> | T[];

export const listCategories = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<CatalogListResponse<Category>>(
    `/bff/admin/service/catalog/categories/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createCategory = (token: string, payload: Partial<Category>) =>
  request<Category>(
    `/bff/admin/service/catalog/categories/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateCategory = (token: string, id: number, payload: Partial<Category>) =>
  request<Category>(
    `/bff/admin/service/catalog/categories/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteCategory = (token: string, id: number) =>
  request<void>(`/bff/admin/service/catalog/categories/${id}/`, { method: "DELETE" }, token);

export const listProfessions = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<CatalogListResponse<Profession>>(
    `/bff/admin/service/catalog/professions/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createProfession = (token: string, payload: Partial<Profession>) =>
  request<Profession>(
    `/bff/admin/service/catalog/professions/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateProfession = (token: string, id: number, payload: Partial<Profession>) =>
  request<Profession>(
    `/bff/admin/service/catalog/professions/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteProfession = (token: string, id: number) =>
  request<void>(`/bff/admin/service/catalog/professions/${id}/`, { method: "DELETE" }, token);

export const listProducts = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<CatalogListResponse<Product>>(
    `/bff/admin/service/catalog/products/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createProduct = (token: string, payload: Partial<Product>) =>
  request<Product>(
    `/bff/admin/service/catalog/products/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateProduct = (token: string, id: string, payload: Partial<Product>) =>
  request<Product>(
    `/bff/admin/service/catalog/products/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteProduct = (token: string, id: string) =>
  request<void>(`/bff/admin/service/catalog/products/${id}/`, { method: "DELETE" }, token);

export const listProductKeys = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<CatalogListResponse<ProductKey>>(
    `/bff/admin/service/catalog/product-keys/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createProductKey = (token: string, payload: Partial<ProductKey> & { key_value?: string }) =>
  request<ProductKey>(
    `/bff/admin/service/catalog/product-keys/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateProductKey = (token: string, id: string, payload: Partial<ProductKey> & { key_value?: string }) =>
  request<ProductKey>(
    `/bff/admin/service/catalog/product-keys/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteProductKey = (token: string, id: string) =>
  request<void>(`/bff/admin/service/catalog/product-keys/${id}/`, { method: "DELETE" }, token);

export const listBundles = (
  token: string,
  params: Record<string, string | number | undefined> = {}
) =>
  request<CatalogListResponse<Bundle>>(
    `/bff/admin/service/catalog/bundles/${buildQuery(params)}`,
    { method: "GET" },
    token
  );

export const createBundle = (token: string, payload: Partial<Bundle>) =>
  request<Bundle>(
    `/bff/admin/service/catalog/bundles/`,
    { method: "POST", body: JSON.stringify(payload) },
    token
  );

export const updateBundle = (token: string, id: string, payload: Partial<Bundle>) =>
  request<Bundle>(
    `/bff/admin/service/catalog/bundles/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );

export const deleteBundle = (token: string, id: string) =>
  request<void>(`/bff/admin/service/catalog/bundles/${id}/`, { method: "DELETE" }, token);
