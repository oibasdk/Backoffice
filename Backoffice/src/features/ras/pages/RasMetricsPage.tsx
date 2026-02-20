import React, { useMemo, useState } from "react";
import { Button, ButtonGroup, Grid, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { DataTable } from "../../../components/DataTable";
import { KpiCard } from "../../../components/KpiCard";
import { PageHeader } from "../../../components/PageHeader";
import { getOverview } from "../../mission_control/api";

const formatNumber = (value?: number) => (typeof value === "number" ? value.toLocaleString() : "-");

export const RasMetricsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [range, setRange] = useState("week");

  const { data, isLoading } = useQuery({
    queryKey: ["overview", range, tokens?.accessToken],
    queryFn: () => getOverview(tokens?.accessToken || "", range),
    enabled: Boolean(tokens?.accessToken),
  });

  const rasMetrics = data?.metrics?.ras || {};
  const rasCounts = rasMetrics.counts || {};
  const rasSeries = rasMetrics.series || {};

  const kpis = useMemo(
    () => [
      { label: t("ras_metrics.kpi.tickets_open"), value: formatNumber(rasCounts.tickets_open) },
      { label: t("ras_metrics.kpi.sla_breaches"), value: formatNumber(rasCounts.sla_breaches) },
      { label: t("ras_metrics.kpi.sessions_active"), value: formatNumber(rasCounts.sessions_active) },
      { label: t("ras_metrics.kpi.escalations"), value: formatNumber(rasCounts.escalations_open) },
      { label: t("ras_metrics.kpi.response_time"), value: formatNumber(rasCounts.avg_response_ms) },
      { label: t("ras_metrics.kpi.csat"), value: formatNumber(rasCounts.csat_score) },
    ],
    [rasCounts, t]
  );

  const seriesRows = Object.entries(rasSeries).flatMap(([seriesKey, values]) => {
    if (Array.isArray(values)) {
      return values.map((entry: any, index: number) => ({
        id: `${seriesKey}-${entry.label || index}`,
        series: seriesKey,
        label: entry.label || "-",
        value: entry.value ?? "-",
      }));
    }
    if (values && typeof values === "object") {
      const labels = Array.isArray((values as any).labels) ? (values as any).labels : [];
      const seriesValues = Array.isArray((values as any).values) ? (values as any).values : [];
      return labels.map((label: string, index: number) => ({
        id: `${seriesKey}-${label || index}`,
        series: seriesKey,
        label: label || "-",
        value: seriesValues[index] ?? "-",
      }));
    }
    return [];
  });

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t("ras_metrics.title")}
        subtitle={t("ras_metrics.subtitle")}
        actions={
          <ButtonGroup variant="outlined" size="small">
            <Button
              onClick={() => setRange("day")}
              variant={range === "day" ? "contained" : "outlined"}
            >
              {t("overview.range.day")}
            </Button>
            <Button
              onClick={() => setRange("week")}
              variant={range === "week" ? "contained" : "outlined"}
            >
              {t("overview.range.week")}
            </Button>
            <Button
              onClick={() => setRange("month")}
              variant={range === "month" ? "contained" : "outlined"}
            >
              {t("overview.range.month")}
            </Button>
          </ButtonGroup>
        }
      />
      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={kpi.label}>
            <KpiCard label={kpi.label} value={kpi.value} loading={isLoading} />
          </Grid>
        ))}
      </Grid>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h3">{t("ras_metrics.series.title")}</Typography>
          <DataTable
            columns={[
              { key: "series", label: t("ras_metrics.series.column.series") },
              { key: "label", label: t("ras_metrics.series.column.label") },
              { key: "value", label: t("ras_metrics.series.column.value") },
            ]}
            rows={seriesRows}
            loading={isLoading}
            rowsPerPage={8}
            totalCount={seriesRows.length}
            showToolbar={false}
          />
        </Stack>
      </Paper>
    </Stack>
  );
};
