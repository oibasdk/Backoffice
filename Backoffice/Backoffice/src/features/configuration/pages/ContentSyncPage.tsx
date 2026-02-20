import React, { useState } from "react";
import { Button, Paper, Stack, TextField, Typography, MenuItem } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { PageHeader } from "../../../components/PageHeader";
import { runContentTemplateSync } from "../api";

export const ContentSyncPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const [configVersionId, setConfigVersionId] = useState("");
  const [screens, setScreens] = useState("");
  const [mode, setMode] = useState("replace");
  const [limit, setLimit] = useState(6);
  const [output, setOutput] = useState("{}");

  const syncMutation = useMutation({
    mutationFn: () =>
      runContentTemplateSync(tokens?.accessToken || "", {
        config_version_id: configVersionId ? Number(configVersionId) : undefined,
        screens: screens ? screens.split(",").map((value) => value.trim()).filter(Boolean) : undefined,
        mode,
        limit,
      }),
    onSuccess: (data) => {
      setOutput(JSON.stringify(data, null, 2));
      pushToast({ message: t("content_sync.completed"), severity: "success" });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  return (
    <PermissionGate permissions={["content_template.update"]}>
      <Stack spacing={3}>
        <PageHeader title={t("content_sync.title")} subtitle={t("content_sync.subtitle")} />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Paper sx={{ p: 3, flex: 1 }}>
            <Stack spacing={2}>
              <TextField
                label={t("content_sync.config_version")}
                value={configVersionId}
                onChange={(event) => setConfigVersionId(event.target.value)}
              />
              <TextField
                label={t("content_sync.screens")}
                value={screens}
                onChange={(event) => setScreens(event.target.value)}
              />
              <TextField
                select
                label={t("content_sync.mode")}
                value={mode}
                onChange={(event) => setMode(event.target.value)}
              >
                <MenuItem value="replace">replace</MenuItem>
                <MenuItem value="merge">merge</MenuItem>
              </TextField>
              <TextField
                label={t("content_sync.limit")}
                type="number"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
              />
              <Button variant="contained" onClick={() => syncMutation.mutate()}>
                {t("content_sync.run")}
              </Button>
            </Stack>
          </Paper>
          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h3" gutterBottom>
              {t("content_sync.output")}
            </Typography>
            <Typography
              component="pre"
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.8rem", margin: 0 }}
            >
              {syncMutation.isLoading ? t("state.loading") : output}
            </Typography>
          </Paper>
        </Stack>
      </Stack>
    </PermissionGate>
  );
};
