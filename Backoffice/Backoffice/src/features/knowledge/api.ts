import { request } from "../../api/client";
import type { PaginatedResponse } from "../../api/types";

export type KnowledgeCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type KnowledgeTag = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type KnowledgeLink = {
  id: number;
  article: number;
  link_type: string;
  external_id?: string;
  label: string;
  url?: string;
  sort_order: number;
  is_active: boolean;
};

export type KnowledgeDriverAsset = {
  id: number;
  article: number;
  vendor: string;
  model: string;
  os: string;
  version?: string;
  download_url: string;
  checksum?: string;
  size_bytes?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type KnowledgeArticle = {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  article_type: string;
  status: string;
  language: string;
  cover_image_url?: string;
  author?: number | null;
  category?: number | null;
  tags: KnowledgeTag[];
  metadata?: Record<string, any>;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  drivers: KnowledgeDriverAsset[];
  links: KnowledgeLink[];
};

type KnowledgeArticleQuery = {
  q?: string;
  category?: string | number;
  tag?: string;
  language?: string;
  status?: string;
  article_type?: string;
  ordering?: string;
  author?: string | number;
  slug?: string;
  updated_after?: string;
  updated_before?: string;
  page?: number;
  page_size?: number;
};

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const listKnowledgeArticles = (
  token: string,
  params: KnowledgeArticleQuery = {}
) => {
  const query = buildQuery(params);
  return request<PaginatedResponse<KnowledgeArticle>>(
    `/bff/admin/service/auth/knowledge/articles/${query}`,
    { method: "GET" },
    token
  );
};

export const listKnowledgeCategories = (token: string, pageSize = 200) => {
  const query = buildQuery({ page_size: pageSize });
  return request<PaginatedResponse<KnowledgeCategory>>(
    `/bff/admin/service/auth/knowledge/categories/${query}`,
    { method: "GET" },
    token
  );
};

export const listKnowledgeTags = (token: string, pageSize = 200) => {
  const query = buildQuery({ page_size: pageSize });
  return request<PaginatedResponse<KnowledgeTag>>(
    `/bff/admin/service/auth/knowledge/tags/${query}`,
    { method: "GET" },
    token
  );
};
