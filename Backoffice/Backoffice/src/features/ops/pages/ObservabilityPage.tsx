import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { PageHeader } from "../../../components/PageHeader";
import { getObservabilityServices, getObservabilityTraces } from "../api";

type TraceSpan = {
  id: string;
  parentId?: string | null;
  service: string;
  operation: string;
  durationMs?: number;
  status?: string;
  startTime?: number;
  tags?: Record<string, any>;
};

type TraceSummary = {
  id: string;
  rootService: string;
  rootOperation: string;
  durationMs?: number;
  spanCount: number;
  status: string;
  spans: TraceSpan[];
};

const extractArray = (payload: any): any[] => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  if (Array.isArray(payload.traces)) {
    return payload.traces;
  }
  if (Array.isArray(payload.data?.traces)) {
    return payload.data.traces;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
};

const toMs = (value?: number | string | null) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) {
    return undefined;
  }
  if (num > 1e12) {
    return num / 1e6;
  }
  if (num > 1e9) {
    return num / 1e6;
  }
  if (num > 1e6) {
    return num / 1000;
  }
  return num;
};

const normalizeSpan = (span: any): TraceSpan => {
  const tagsArray = Array.isArray(span.tags) ? span.tags : [];
  const tags = tagsArray.reduce<Record<string, any>>((acc, tag) => {
    if (tag?.key) {
      acc[tag.key] = tag.value;
    }
    return acc;
  }, {});
  const status = tags["error"] ? "error" : tags["http.status_code"] ? "warning" : "ok";
  return {
    id: span.spanID || span.span_id || span.id || span.spanId || "-",
    parentId: span.parentSpanID || span.parent_span_id || span.parentId || null,
    service: span.process?.serviceName || span.service || span.service_name || "-",
    operation: span.operationName || span.name || span.operation || "-",
    durationMs: toMs(span.duration),
    status,
    startTime: toMs(span.startTime) || toMs(span.start_time) || toMs(span.startTimeUnixNano),
    tags,
  };
};

const normalizeTrace = (trace: any): TraceSummary | null => {
  const spans = Array.isArray(trace.spans) ? trace.spans.map(normalizeSpan) : [];
  if (spans.length === 0) {
    return null;
  }
  const rootSpan =
    spans.find((span) => !span.parentId || span.parentId === "0") || spans[0];
  const durations = spans.map((span) => span.durationMs).filter((value) => typeof value === "number") as number[];
  const durationMs = durations.length ? Math.max(...durations) : undefined;
  const status = spans.some((span) => span.status === "error")
    ? "error"
    : spans.some((span) => span.status === "warning")
      ? "warning"
      : "ok";
  return {
    id: trace.traceID || trace.trace_id || trace.id || rootSpan.id,
    rootService: rootSpan.service,
    rootOperation: rootSpan.operation,
    durationMs,
    spanCount: spans.length,
    status,
    spans: spans.sort((a, b) => (a.startTime || 0) - (b.startTime || 0)),
  };
};

export const ObservabilityPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const [service, setService] = useState("");
  const [lookback, setLookback] = useState("1h");
  const [limit, setLimit] = useState(20);
  const [minDuration, setMinDuration] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [tags, setTags] = useState("");
  const [traceData, setTraceData] = useState<any>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const { data: servicesData } = useQuery({
    queryKey: ["observability-services", tokens?.accessToken],
    queryFn: () => getObservabilityServices(tokens?.accessToken || ""),
    enabled: Boolean(tokens?.accessToken),
  });

  const services = servicesData?.data || servicesData?.services || servicesData?.data?.services || [];

  const tracesMutation = useMutation({
    mutationFn: () =>
      getObservabilityTraces(tokens?.accessToken || "", {
        service,
        lookback,
        limit,
        min_duration: minDuration || undefined,
        max_duration: maxDuration || undefined,
        tags: tags || undefined,
      }),
    onSuccess: (data) => {
      setTraceData(data);
      setSelectedTraceId(null);
      pushToast({ message: t("observability.traces.loaded"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const traces = useMemo(() => {
    const rawTraces = extractArray(traceData);
    return rawTraces
      .map((trace) => normalizeTrace(trace))
      .filter((trace): trace is TraceSummary => Boolean(trace));
  }, [traceData]);

  const selectedTrace = traces.find((trace) => trace.id === selectedTraceId) || traces[0] || null;

  const traceRows = traces.map((trace) => ({
    id: trace.id,
    service: trace.rootService,
    operation: trace.rootOperation,
    duration: trace.durationMs ? `${trace.durationMs.toFixed(1)} ms` : "-",
    spans: trace.spanCount,
    status: (
      <Chip
        size="small"
        label={trace.status}
        color={trace.status === "error" ? "error" : trace.status === "warning" ? "warning" : "success"}
      />
    ),
  }));

  return (
    <PermissionGate permissions={["system_health.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("observability.title")} subtitle={t("observability.subtitle")} />
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                label={t("observability.service")}
                value={service}
                onChange={(event) => setService(event.target.value)}
                fullWidth
              >
                <MenuItem value="">{t("label.select")}</MenuItem>
                {Array.isArray(services) &&
                  services.map((item: any) => {
                    const value = typeof item === "string" ? item : item.name || "";
                    return (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    );
                  })}
              </TextField>
              <TextField
                label={t("observability.lookback")}
                value={lookback}
                onChange={(event) => setLookback(event.target.value)}
                fullWidth
              />
              <TextField
                label={t("observability.limit")}
                type="number"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label={t("observability.min_duration")}
                value={minDuration}
                onChange={(event) => setMinDuration(event.target.value)}
                fullWidth
              />
              <TextField
                label={t("observability.max_duration")}
                value={maxDuration}
                onChange={(event) => setMaxDuration(event.target.value)}
                fullWidth
              />
              <TextField
                label={t("observability.tags")}
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                fullWidth
              />
            </Stack>
            <Button
              variant="contained"
              disabled={!service}
              onClick={() => tracesMutation.mutate()}
            >
              {t("observability.load_traces")}
            </Button>
          </Stack>
        </Paper>

        {traceData && (
          <Grid container spacing={2}>
            <Grid item xs={12} lg={5}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h3">{t("observability.traces")}</Typography>
                  <DataTable
                    columns={[
                      { key: "service", label: t("observability.trace.service") },
                      { key: "operation", label: t("observability.trace.operation") },
                      { key: "duration", label: t("observability.trace.duration") },
                      { key: "spans", label: t("observability.trace.spans") },
                      { key: "status", label: t("label.status") },
                    ]}
                    rows={traceRows}
                    loading={tracesMutation.isPending}
                    totalCount={traceRows.length}
                    rowsPerPage={6}
                    showToolbar={false}
                    onRowClick={(row) => setSelectedTraceId(String(row.id))}
                  />
                  {traceRows.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {t("observability.trace.empty")}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={7}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h3">{t("observability.trace.details")}</Typography>
                  {selectedTrace ? (
                    <>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={selectedTrace.rootService} />
                        <Chip label={selectedTrace.rootOperation} />
                        <Chip
                          label={selectedTrace.status}
                          color={selectedTrace.status === "error" ? "error" : selectedTrace.status === "warning" ? "warning" : "success"}
                        />
                        <Chip
                          label={
                            selectedTrace.durationMs ? `${selectedTrace.durationMs.toFixed(1)} ms` : t("label.none")
                          }
                        />
                      </Stack>
                      <Divider />
                      <Stack spacing={1}>
                        {selectedTrace.spans.map((span) => (
                          <Paper key={span.id} variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={0.5}>
                              <Typography variant="overline" color="text.secondary">
                                {span.service} · {span.operation}
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip
                                  size="small"
                                  label={span.status || "ok"}
                                  color={span.status === "error" ? "error" : span.status === "warning" ? "warning" : "success"}
                                />
                                <Chip size="small" label={span.durationMs ? `${span.durationMs.toFixed(1)} ms` : "-"} />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {t("observability.trace.span_id")}: {span.id}
                              </Typography>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t("observability.trace.select_hint")}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Stack>
    </PermissionGate>
  );
};
