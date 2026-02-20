import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { PageHeader } from "../../../components/PageHeader";
import { getOpsStatus, runOpsTasks } from "../api";

const TASKS = [
  { id: "migrate", labelKey: "ops.task.migrate" },
  { id: "tests", labelKey: "ops.task.tests" },
  { id: "flutter_build", labelKey: "ops.task.flutter_build" },
  { id: "flutter_test", labelKey: "ops.task.flutter_test" },
  { id: "flutter_analyze", labelKey: "ops.task.flutter_analyze" },
  { id: "smoke", labelKey: "ops.task.smoke" },
  { id: "e2e", labelKey: "ops.task.e2e" },
];

export const OpsCenterPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const [selectedTasks, setSelectedTasks] = useState<string[]>(TASKS.map((task) => task.id));
  const [results, setResults] = useState<any>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["ops-status", tokens?.accessToken],
    queryFn: () => getOpsStatus(tokens?.accessToken || ""),
    enabled: Boolean(tokens?.accessToken),
  });

  const runMutation = useMutation({
    mutationFn: () => runOpsTasks(tokens?.accessToken || "", selectedTasks),
    onSuccess: (data) => {
      setResults(data);
      pushToast({ message: t("ops.run.success"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  return (
    <PermissionGate permissions={["system_health.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("ops.title")} subtitle={t("ops.subtitle")} />
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" fontWeight={600}>
                {t("ops.status")}
              </Typography>
              {isLoading ? (
                <Chip size="small" label={t("state.loading")} />
              ) : (
                <Chip
                  size="small"
                  label={status?.enabled ? t("ops.enabled") : t("ops.disabled")}
                  color={status?.enabled ? "success" : "default"}
                />
              )}
            </Stack>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="body2" fontWeight={600}>
                {t("ops.tasks")}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {TASKS.map((task) => {
                  const active = selectedTasks.includes(task.id);
                  return (
                    <Chip
                      key={task.id}
                      label={t(task.labelKey)}
                      color={active ? "primary" : "default"}
                      variant={active ? "filled" : "outlined"}
                      onClick={() =>
                        setSelectedTasks((prev) =>
                          prev.includes(task.id)
                            ? prev.filter((item) => item !== task.id)
                            : [...prev, task.id]
                        )
                      }
                    />
                  );
                })}
              </Stack>
            </Stack>
            <PermissionGate permissions={["system_health.create"]}>
              <Button variant="contained" onClick={() => runMutation.mutate()} disabled={!status?.enabled}>
                {t("ops.run")}
              </Button>
            </PermissionGate>
          </Stack>
        </Paper>

        {results && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              {t("ops.results")}
            </Typography>
            <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 13 }}>
              {JSON.stringify(results, null, 2)}
            </Box>
          </Paper>
        )}
      </Stack>
    </PermissionGate>
  );
};
