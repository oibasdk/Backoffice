import React from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../app/providers/AuthProvider";
import { useAdminAccess } from "./useAdminAccess";
import { FullPageError, FullPageLoader } from "../components/StateViews";
import { getAccessErrorMessage } from "./accessErrors";

export const PermissionGate: React.FC<{ permissions?: string[]; children: React.ReactNode }> = ({
  permissions,
  children,
}) => {
  const bypassEnabled = import.meta.env.VITE_BACKOFFICE_TEST_BYPASS === "true";
  const bypass =
    import.meta.env.MODE !== "production" &&
    bypassEnabled &&
    window.__BACKOFFICE_TEST_BYPASS__ === true;
  const { tokens } = useAuth();
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useAdminAccess(tokens?.accessToken || null);

  if (bypass) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError || !data) {
    return <FullPageError message={getAccessErrorMessage(error, t)} onRetry={() => refetch()} />;
  }

  if (
    permissions &&
    permissions.length > 0 &&
    !data.is_superuser &&
    !permissions.some((permission) => data.permissions.includes(permission))
  ) {
    return <FullPageError message={t("route.forbidden.subtitle")} />;
  }

  return <>{children}</>;
};
