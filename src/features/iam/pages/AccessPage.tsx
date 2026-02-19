import React, { useMemo, useState } from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { useAdminAccess } from "../../../auth/useAdminAccess";
import { verifyAccessToken } from "../../../auth/api";
import { PageHeader } from "../../../components/PageHeader";

export const AccessPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens, clearAuth } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const { data: access, isLoading } = useAdminAccess(tokens?.accessToken || null);
  const [verifying, setVerifying] = useState(false);

  const formattedAccess = useMemo(() => JSON.stringify(access || {}, null, 2), [access]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-access"] });
    pushToast({ message: t("iam.access.refreshed"), severity: "success" });
  };

  const handleVerify = async () => {
    if (!tokens?.accessToken) {
      return;
    }
    setVerifying(true);
    try {
      await verifyAccessToken(tokens.accessToken);
      pushToast({ message: t("iam.access.verified"), severity: "success" });
    } catch {
      pushToast({ message: t("state.error"), severity: "error" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <PermissionGate permissions={["user.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("iam.access.title")} subtitle={t("iam.access.subtitle")} />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h3" gutterBottom>
              {t("iam.access.session_tools")}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("iam.access.session_hint")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" onClick={handleRefresh} disabled={isLoading}>
                {t("iam.access.refresh")}
              </Button>
              <Button variant="outlined" onClick={handleVerify} disabled={verifying || !tokens?.accessToken}>
                {t("iam.access.verify")}
              </Button>
              <Button variant="text" color="error" onClick={clearAuth}>
                {t("iam.access.logout")}
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" mt={2} display="block">
              {t("iam.access.session_note")}
            </Typography>
          </Paper>
          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h3" gutterBottom>
              {t("iam.access.snapshot")}
            </Typography>
            <Typography
              component="pre"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "0.8rem",
                margin: 0,
              }}
            >
              {isLoading ? t("state.loading") : formattedAccess}
            </Typography>
          </Paper>
        </Stack>
      </Stack>
    </PermissionGate>
  );
};
