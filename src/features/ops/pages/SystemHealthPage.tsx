import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { KpiCard } from "../../../components/KpiCard";
import { Sparkline } from "../../../components/Sparkline";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listSystemHealth, type SystemHealth } from "../api";
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

const statusOptions = ["", "healthy", "warning", "error", "critical"];

export const SystemHealthPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [status, setStatus] = useState("");
  const [detailTarget, setDetailTarget] = useState<SystemHealth | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      service_name: serviceName || undefined,
      status: status || undefined,
      ordering: "-timestamp",
    }),
    [page, rowsPerPage, search, serviceName, status]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["system-health", queryParams, tokens?.accessToken],
    queryFn: () => listSystemHealth(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const resolved = resolveResults<SystemHealth>(data);

  const trendSummary = useMemo(() => {
    const grouped = new Map<
      string,
      {
        count: number;
        response: number;
        cpu: number;
        memory: number;
        disk: number;
        errors: number;
        series: Array<{ ts: number; response: number }>;
      }
    >();
    resolved.results.forEach((entry) => {
      const key = entry.service_name || "unknown";
      const current =
        grouped.get(key) || { count: 0, response: 0, cpu: 0, memory: 0, disk: 0, errors: 0, series: [] };
      const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now();
      grouped.set(key, {
        count: current.count + 1,
        response: current.response + (entry.response_time || 0),
        cpu: current.cpu + (entry.cpu_usage || 0),
        memory: current.memory + (entry.memory_usage || 0),
        disk: current.disk + (entry.disk_usage || 0),
        errors: current.errors + (entry.error_count || 0),
        series: [...current.series, { ts, response: entry.response_time || 0 }],
      });
    });
    const aggregates = Array.from(grouped.entries()).map(([service, values]) => ({
      service,
      response: values.count ? values.response / values.count : 0,
      cpu: values.count ? values.cpu / values.count : 0,
      memory: values.count ? values.memory / values.count : 0,
      disk: values.count ? values.disk / values.count : 0,
      errors: values.errors,
      series: values.series.sort((a, b) => a.ts - b.ts).slice(-12).map((item) => item.response),
    }));
    const topLatency = [...aggregates].sort((a, b) => b.response - a.response).slice(0, 5);
    const avgResponse = aggregates.length
      ? aggregates.reduce((sum, item) => sum + item.response, 0) / aggregates.length
      : 0;
    const avgCpu = aggregates.length
      ? aggregates.reduce((sum, item) => sum + item.cpu, 0) / aggregates.length
      : 0;
    const avgMemory = aggregates.length
      ? aggregates.reduce((sum, item) => sum + item.memory, 0) / aggregates.length
      : 0;
    const avgDisk = aggregates.length
      ? aggregates.reduce((sum, item) => sum + item.disk, 0) / aggregates.length
      : 0;
    return { aggregates, topLatency, avgResponse, avgCpu, avgMemory, avgDisk };
  }, [resolved.results]);

  const trendSeries = useMemo(() => {
    const points = [...resolved.results]
      .filter((entry) => entry.timestamp)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-24);
    return {
      response: points.map((entry) => entry.response_time || 0),
      cpu: points.map((entry) => entry.cpu_usage || 0),
      memory: points.map((entry) => entry.memory_usage || 0),
      disk: points.map((entry) => entry.disk_usage || 0),
      errors: points.map((entry) => entry.error_count || 0),
    };
  }, [resolved.results]);

  const rows = resolved.results.map((entry) => ({
    id: entry.id,
    exportData: {
      service: entry.service_name,
      status: entry.status,
      response_time: entry.response_time ?? "",
      timestamp: entry.timestamp,
    },
    service: entry.service_name,
    status: <Chip size="small" label={entry.status} />,
    response: typeof entry.response_time === "number" ? `${entry.response_time} ms` : "-",
    cpu: typeof entry.cpu_usage === "number" ? `${entry.cpu_usage.toFixed(1)}%` : "-",
    memory: typeof entry.memory_usage === "number" ? `${entry.memory_usage.toFixed(1)} MB` : "-",
    disk: typeof entry.disk_usage === "number" ? `${entry.disk_usage.toFixed(1)}%` : "-",
    timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "-",
    actions: (
      <Button
        size="small"
        variant="text"
        onClick={(event) => {
          event.stopPropagation();
          setDetailTarget(entry);
        }}
      >
        {t("action.view")}
      </Button>
    ),
  }));

  const columns = [
    { key: "service", label: t("monitoring.column.service") },
    { key: "status", label: t("label.status") },
    { key: "response", label: t("monitoring.column.response") },
    { key: "cpu", label: t("monitoring.column.cpu") },
    { key: "memory", label: t("monitoring.column.memory") },
    { key: "disk", label: t("monitoring.column.disk") },
    { key: "timestamp", label: t("label.timestamp") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["system_health.view"]}>
      <Stack spacing={4}>
        <PageHeader title={t("monitoring.title")} subtitle={t("monitoring.subtitle")} sx={{ mb: 1 }} />

        <Grid container spacing={3}>
          {/* Intelligence Tray (4 Columns) */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              <Paper
                sx={(theme) => ({
                  p: 3,
                  borderRadius: radiusTokens.large,
                  background: "var(--app-surface)",
                  backdropFilter: "blur(var(--app-blur))",
                  border: "1px solid var(--app-card-border)",
                  boxShadow: elevationTokens.level3,
                })}
              >
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
                      {t("monitoring.ops_intelligence", { defaultValue: "Operations Intelligence" })}
                    </Typography>
                    <Typography variant="h3">{t("monitoring.health_summary", { defaultValue: "Health Summary" })}</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("monitoring.trends.avg_response")}
                        value={trendSummary.avgResponse ? `${trendSummary.avgResponse.toFixed(0)}ms` : "-"}
                        loading={isLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("monitoring.trends.avg_cpu")}
                        value={trendSummary.avgCpu ? `${trendSummary.avgCpu.toFixed(0)}%` : "-"}
                        loading={isLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("monitoring.trends.avg_memory")}
                        value={trendSummary.avgMemory ? `${trendSummary.avgMemory.toFixed(0)}MB` : "-"}
                        loading={isLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("monitoring.trends.avg_disk")}
                        value={trendSummary.avgDisk ? `${trendSummary.avgDisk.toFixed(0)}%` : "-"}
                        loading={isLoading}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ opacity: 0.1 }} />

                  <Stack spacing={2}>
                    <Typography variant="overline" color="text.secondary">
                      {t("monitoring.trends.series")}
                    </Typography>
                    <Stack spacing={1}>
                      {trendSummary.aggregates.map((item) => (
                        <Box
                          key={item.service}
                          sx={{
                            p: 1.5,
                            borderRadius: radiusTokens.medium,
                            background: "rgba(33,64,153,0.03)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.service}
                          </Typography>
                          <Box sx={{ width: 80, height: 24 }}>
                            <Sparkline values={item.series} />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      color={autoRefresh ? "primary" : "inherit"}
                    >
                      {autoRefresh ? t("monitoring.stop_refresh", { defaultValue: "Stop Monitoring" }) : t("monitoring.start_refresh", { defaultValue: "Live Telemetry" })}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: radiusTokens.large,
                  background: "rgba(217,131,31,0.02)",
                  border: "1px dashed rgba(217,131,31,0.2)",
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {t("monitoring.ops_tip", { defaultValue: "Ops Insight" })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("monitoring.latency_hint", { defaultValue: "Spikes in response time often correlate with high CPU usage across shared worker nodes." })}
                </Typography>
              </Paper>
            </Stack>
          </Grid>

          {/* Primary Data Tray (8 Columns) */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              <FilterBar
                savedViews={{
                  storageKey: "ops.system_health",
                  getState: () => ({ search, serviceName, status }),
                  applyState: (state) => {
                    setSearch(String(state.search || ""));
                    setServiceName(String(state.serviceName || ""));
                    setStatus(String(state.status || ""));
                    setPage(0);
                  },
                  defaultState: { search: "", serviceName: "", status: "" },
                }}
                advanced={{
                  title: t("filter.advanced"),
                  content: (
                    <Stack spacing={2} mt={1}>
                      <TextField
                        label={t("monitoring.filter.service")}
                        value={serviceName}
                        onChange={(event) => setServiceName(event.target.value)}
                        size="small"
                      />
                      <TextField
                        select
                        label={t("monitoring.filter.status")}
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        size="small"
                      >
                        {statusOptions.map((option) => (
                          <MenuItem key={option || "all"} value={option}>
                            {option || t("label.all")}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  ),
                  onApply: () => setPage(0),
                  onReset: () => {
                    setServiceName("");
                    setStatus("");
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
                exportFilename="system_health.csv"
                onPageChange={setPage}
                onRowsPerPageChange={(size: number) => {
                  setRowsPerPage(size);
                  setPage(0);
                }}
                density={density}
                onDensityChange={setDensity}
              />
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={Boolean(detailTarget)} onClose={() => setDetailTarget(null)} fullWidth maxWidth="md">
        <DialogTitle>{t("monitoring.details")}</DialogTitle>
        <DialogContent>
          <Typography
            component="pre"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.8rem", margin: 0 }}
          >
            {detailTarget ? JSON.stringify(detailTarget.details || {}, null, 2) : ""}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailTarget(null)}>{t("action.dismiss")}</Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
