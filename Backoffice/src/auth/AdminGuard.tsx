import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../app/providers/AuthProvider";
import { useAdminAccess } from "./useAdminAccess";
import { FullPageError, FullPageLoader } from "../components/StateViews";
import { getAccessErrorMessage, isUnauthorizedError } from "./accessErrors";

export const AdminGuard: React.FC = () => {
  const bypassEnabled = import.meta.env.VITE_BACKOFFICE_TEST_BYPASS === "true";
  const bypass =
    import.meta.env.MODE !== "production" &&
    bypassEnabled &&
    window.__BACKOFFICE_TEST_BYPASS__ === true;
  const { tokens, clearAuth } = useAuth();
  const { t } = useTranslation();
  const token = tokens?.accessToken || null;
  const { data, isLoading, isError, error, refetch } = useAdminAccess(token);

  if (bypass) {
    return <Outlet />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError || !data) {
    if (isUnauthorizedError(error)) {
      clearAuth();
      return <Navigate to="/login" replace />;
    }
    return <FullPageError message={getAccessErrorMessage(error, t)} onRetry={() => refetch()} />;
  }

  return <Outlet />;
};
