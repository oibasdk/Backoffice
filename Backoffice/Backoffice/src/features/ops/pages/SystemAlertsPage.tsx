import React, { useMemo, useState } from "react";
import { Button, Chip, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { KpiCard } from "../../../components/KpiCard";
import { PageHeader } from "../../../components/PageHeader";
import { listSystemAlerts, resolveSystemAlert, retrySystemAlert, type SystemAlert } from "../api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const resolveResults = <T,>(payload: PaginatedLike<T> | T[] | null | undefined) => {
  if (Array.isArray(payload)) {
    return { count: payload.length, results: payload };
  }
  if (payload && Array.isArray(payload.results)) {
    return { count: payload.count ?? payload.results.length, results: payload.results };
  }
  return { count: 0, results: [] as T[] };
};

const severityOptions = ["", "low", "medium", "high", "critical"];

export const SystemAlertsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [isActive, setIsActive] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      severity: severity || undefined,
      service_name: serviceName || undefined,
      is_active: isActive || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, search, severity, serviceName, isActive]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["system-alerts", queryParams, tokens?.accessToken],
    queryFn: () => listSystemAlerts(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<SystemAlert>(data);
  const alerts = resolved.results || [];
  const activeCount = alerts.filter((alert) => alert.is_active).length;
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const lastUpdated = alerts[0]?.created_at ? new Date(alerts[0].created_at).toLocaleString() : "-";

  const resolveMutation = useMutation({
    mutationFn: (alertId: number) => resolveSystemAlert(tokens?.accessToken || "", alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-alerts"] });
      pushToast({ message: t("alerts.resolved"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const retryMutation = useMutation({
    mutationFn: (alertId: number) => retrySystemAlert(tokens?.accessToken || "", alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-alerts"] });
      pushToast({ message: t("alerts.retried"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolved.results.map((alert) => ({
    id: alert.id,
    exportData: {
      service: alert.service_name,
      type: alert.alert_type,
      severity: alert.severity,
      status: alert.is_active ? "active" : "resolved",
      created: alert.created_at,
    },
    service: alert.service_name,
    type: alert.alert_type,
    severity: <Chip size="small" label={alert.severity} />,
    status: (
      <Chip
        size="small"
        label={alert.is_active ? t("alerts.active") : t("alerts.resolved_state")}
        color={alert.is_active ? "warning" : "default"}
      />
    ),
    message: alert.message,
    created: alert.created_at ? new Date(alert.created_at).toLocaleString() : "-",
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["system_alert.update"]}>
          <Button
            size="small"
            variant="outlined"
            disabled={!alert.is_active}
            onClick={() => resolveMutation.mutate(alert.id)}
          >
            {t("alerts.resolve")}
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => retryMutation.mutate(alert.id)}
          >
            {t("alerts.retry")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "service", label: t("alerts.column.service") },
    { key: "type", label: t("alerts.column.type") },
    { key: "severity", label: t("alerts.column.severity") },
    { key: "status", label: t("label.status") },
    { key: "message", label: t("alerts.column.message") },
    { key: "created", label: t("table.column.created") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["system_alert.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("alerts.title")} subtitle={t("alerts.subtitle")} />
        <Paper
          sx={(theme) => ({
            p: { xs: 2.5, md: 3.5 },
            borderRadius: radiusTokens.large,
            backgroundImage:
              theme.palette.mode === "light"
                ? "linear-gradient(135deg, rgba(14,124,120,0.18) 0%, rgba(33,64,153,0.12) 45%, rgba(255,255,255,0.8) 100%)"
                : "linear-gradient(135deg, rgba(14,124,120,0.28) 0%, rgba(33,64,153,0.2) 45%, rgba(15,18,15,0.8) 100%)",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: elevationTokens.level3,
          })}
        >
          <Stack spacing={2}>
            <Typography variant="overline" color="text.secondary">
              {t("alerts.context", { defaultValue: "System Alerting" })}
            </Typography>
            <Typography variant="h1">{t("alerts.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("alerts.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("alerts.active")}: ${activeCount}`} color="warning" />
              <Chip size="small" label={`${t("alerts.severity.critical", { defaultValue: "Critical" })}: ${criticalCount}`} />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("alerts.snapshot.total", { defaultValue: "Total Alerts" })} value={resolved.count} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("alerts.snapshot.active", { defaultValue: "Active Alerts" })} value={activeCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("alerts.snapshot.critical", { defaultValue: "Critical Alerts" })} value={criticalCount} loading={isLoading} />
          </Grid>
        </Grid>
        <FilterBar
          savedViews={{
            storageKey: "ops.system_alerts",
            getState: () => ({ search, severity, serviceName, isActive }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setSeverity(String(state.severity || ""));
              setServiceName(String(state.serviceName || ""));
              setIsActive(String(state.isActive || ""));
              setPage(0);
            },
            defaultState: { search: "", severity: "", serviceName: "", isActive: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("alerts.filter.severity")}
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value)}
                  size="small"
                >
                  {severityOptions.map((option) => (
                    <MenuItem key={option || "all"} value={option}>
                      {option || t("label.all")}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={t("alerts.filter.service")}
                  value={serviceName}
                  onChange={(event) => setServiceName(event.target.value)}
                  size="small"
                />
                <TextField
                  select
                  label={t("alerts.filter.active")}
                  value={isActive}
                  onChange={(event) => setIsActive(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="true">{t("alerts.active")}</MenuItem>
                  <MenuItem value="false">{t("alerts.resolved_state")}</MenuItem>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setSeverity("");
              setServiceName("");
              setIsActive("");
            },
          }}
        >
          <TextField
            label={t("label.search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
          />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={isError}
          totalCount={resolved.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="system_alerts.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>
    </PermissionGate>
  );
};
