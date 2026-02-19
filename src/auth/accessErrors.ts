import type { TFunction } from "i18next";

import { ApiError } from "../api/client";

const isNetworkError = (error: unknown) =>
  error instanceof Error && error.message.toLowerCase().includes("failed to fetch");

export const getAccessErrorMessage = (error: unknown, t: TFunction) => {
  if (error instanceof ApiError) {
    if (error.code === 401) {
      return t("auth.error.session_expired");
    }
    if (error.code === 403) {
      return t("auth.error.access_denied");
    }
    if (error.code >= 500) {
      return t("auth.error.unavailable");
    }
    return error.message || t("state.error");
  }
  if (isNetworkError(error)) {
    return t("auth.error.network");
  }
  return t("state.error");
};

export const isUnauthorizedError = (error: unknown) =>
  error instanceof ApiError && error.code === 401;
