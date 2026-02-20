import React, { useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Chip,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { DataTable } from "../../../components/DataTable";
import { KpiCard } from "../../../components/KpiCard";
import { PageHeader } from "../../../components/PageHeader";
import { Sparkline } from "../../../components/Sparkline";
import { getOverview } from "../api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

export const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [range, setRange] = useState("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const rangeKey = range === "quarter" || range === "year" || range === "custom" ? "month" : range;

  const formatDateParam = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const rangeParams = useMemo(() => {
    if (range === "custom") {
      return {
        start: startDate || undefined,
        end: endDate || undefined,
      };
    }
    if (range === "quarter") {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 90);
      return {
        start: formatDateParam(start),
        end: formatDateParam(end),
      };
    }
    if (range === "year") {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 365);
      return {
        start: formatDateParam(start),
        end: formatDateParam(end),
      };
    }
    return {};
  }, [range, startDate, endDate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["overview", rangeKey, rangeParams.start, rangeParams.end, tokens?.accessToken],
    queryFn: () => getOverview(tokens?.accessToken || "", rangeKey, rangeParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const authCounts = data?.metrics?.auth?.counts || {};
  const paymentMetrics = data?.metrics?.payment as Record<string, any> | undefined;
  const paymentCounts = paymentMetrics?.counts || {};
  const paymentRevenue = paymentMetrics?.revenue_cents || {};
  const orderBreakdown = Array.isArray(paymentMetrics?.by_order_type)
    ? paymentMetrics?.by_order_type
    : [];
  const security = data?.security || {};
  const registrations = Array.isArray(data?.analytics?.registrations) ? data?.analytics?.registrations : [];
  const logins = Array.isArray(data?.analytics?.logins) ? data?.analytics?.logins : [];
  const latestUsers = Array.isArray(data?.latest?.users) ? data?.latest?.users : [];
  const latestProducts = Array.isArray(data?.latest?.products) ? data?.latest?.products : [];
  const lastUpdated = data?.generated_at ? new Date(data.generated_at).toLocaleString() : "-";

  const formatCurrency = (value?: number) =>
    typeof value === "number" ? (value / 100).toLocaleString() : "-";

  const kpis = useMemo(
    () => [
      { label: t("analytics.kpi.total_users"), value: authCounts.total_users ?? "-" },
      { label: t("analytics.kpi.active_users"), value: authCounts.active_last_24h ?? "-" },
      { label: t("analytics.kpi.unverified"), value: authCounts.unverified ?? "-" },
      { label: t("analytics.kpi.two_fa"), value: authCounts.two_fa_enabled ?? "-" },
      { label: t("analytics.kpi.orders"), value: paymentCounts.orders ?? "-" },
      { label: t("analytics.kpi.orders_today"), value: paymentCounts.orders_today ?? "-" },
      { label: t("analytics.kpi.revenue_total"), value: formatCurrency(paymentRevenue.total) },
      { label: t("analytics.kpi.revenue_today"), value: formatCurrency(paymentRevenue.today) },
      { label: t("analytics.kpi.pending_proofs"), value: paymentCounts.proofs_pending ?? "-" },
    ],
    [authCounts, paymentCounts, paymentRevenue, t]
  );

  const registrationRows = registrations.map((entry: any, index: number) => ({
    id: entry.id || entry.date || index,
    date: entry.date || "-",
    total: entry.total_registrations ?? "-",
    customers: entry.customer_registrations ?? "-",
    vendors: entry.vendor_registrations ?? "-",
    providers: entry.provider_registrations ?? "-",
  }));

  const loginRows = logins.map((entry: any, index: number) => ({
    id: entry.id || entry.date || index,
    date: entry.date || "-",
    total: entry.total_logins ?? "-",
    failed: entry.failed_logins ?? "-",
    unique: entry.unique_users ?? "-",
  }));

  const orderRows = orderBreakdown.map((entry: any, index: number) => ({
    id: entry.order_type || index,
    type: entry.order_type || "-",
    orders: entry.orders ?? "-",
    total: typeof entry.total_cents === "number" ? formatCurrency(entry.total_cents) : "-",
  }));

  const latestUserRows = latestUsers.map((entry: any) => ({
    id: entry.id,
    user: entry.email || "-",
    role: entry.role || "-",
    status: entry.account_status || "-",
    created: entry.created_at ? new Date(entry.created_at).toLocaleString() : "-",
  }));

  const latestProductRows = latestProducts.map((entry: any) => ({
    id: entry.id,
    product: entry.name || "-",
    status: entry.approval_status || "-",
    price: typeof entry.price_cents === "number" ? formatCurrency(entry.price_cents) : "-",
    created: entry.created_at ? new Date(entry.created_at).toLocaleString() : "-",
  }));

  const latestLoginStat = logins.length ? logins[logins.length - 1] : null;
  const riskScore = typeof security.security_score === "number" ? security.security_score : null;
  const riskLevel =
    riskScore !== null
      ? riskScore >= 80
        ? t("risk.level.high")
        : riskScore >= 50
          ? t("risk.level.medium")
        : t("risk.level.low")
      : t("risk.level.unknown");

  const handleRangeChange = (value: string) => {
    setRange(value);
    if (value !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const buildExportPayload = () => ({
    range: rangeKey,
    period: { start: rangeParams.start || null, end: rangeParams.end || null },
    kpis,
    registrations: registrationRows,
    logins: loginRows,
    orders: orderRows,
    latestUsers: latestUserRows,
    latestProducts: latestProductRows,
    riskSnapshot: {
      score: riskScore,
      level: riskLevel,
      locked: security.locked_users ?? 0,
      unverified: security.unverified_users ?? authCounts.unverified ?? 0,
      suspended: authCounts.suspended ?? 0,
      failedLogins: latestLoginStat?.failed_logins ?? 0,
    },
  });

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload = buildExportPayload();
    downloadFile("analytics_export.json", JSON.stringify(payload, null, 2), "application/json");
  };

  const handleExportCsv = () => {
    const payload = buildExportPayload();
    const flattenRows = [
      ["KPI", "Value"],
      ...payload.kpis.map((item) => [item.label, String(item.value)]),
      [],
      ["Registrations", "Date", "Total", "Customers", "Vendors", "Providers"],
      ...payload.registrations.map((row) => [
        "",
        row.date,
        row.total,
        row.customers,
        row.vendors,
        row.providers,
      ]),
      [],
      ["Logins", "Date", "Total", "Unique", "Failed"],
      ...payload.logins.map((row) => ["", row.date, row.total, row.unique, row.failed]),
      [],
      ["Orders", "Type", "Orders", "Total"],
      ...payload.orders.map((row) => ["", row.type, row.orders, row.total]),
      [],
      ["Latest Users", "User", "Role", "Status", "Created"],
      ...payload.latestUsers.map((row) => ["", row.user, row.role, row.status, row.created]),
      [],
      ["Latest Products", "Product", "Status", "Price", "Created"],
      ...payload.latestProducts.map((row) => ["", row.product, row.status, row.price, row.created]),
    ];
    const escape = (value: string | number | boolean | null | undefined) =>
      value === null || value === undefined ? "" : `"${String(value).replace(/"/g, '""')}"`;
    const csv = flattenRows.map((row) => row.map((cell) => escape(cell)).join(",")).join("\n");
    downloadFile("analytics_export.csv", `\ufeff${csv}`, "text/csv;charset=utf-8");
  };

  const handleExportExcel = () => {
    const payload = buildExportPayload();
    const rows = [
      ["KPI", "Value"],
      ...payload.kpis.map((item) => [item.label, String(item.value)]),
    ];
    const table = `<table>${rows
      .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
      .join("")}</table>`;
    downloadFile("analytics_export.xls", table, "application/vnd.ms-excel");
  };

  const handleExportPdf = () => {
    const payload = buildExportPayload();
    const win = window.open("", "_blank");
    if (!win) {
      return;
    }
    win.document.write(`<pre>${JSON.stringify(payload, null, 2)}</pre>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t("analytics.title")}
        subtitle={t("analytics.subtitle")}
        actions={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <ButtonGroup variant="outlined" size="small">
              {["day", "week", "month", "quarter", "year", "custom"].map((value) => (
                <Button
                  key={value}
                  onClick={() => handleRangeChange(value)}
                  variant={range === value ? "contained" : "outlined"}
                >
                  {t(`overview.range.${value}`, { defaultValue: value })}
                </Button>
              ))}
            </ButtonGroup>
            <Button variant="outlined" size="small" onClick={handleExportJson}>
              {t("button.export_json", { defaultValue: "Export JSON" })}
            </Button>
            <Button variant="outlined" size="small" onClick={handleExportCsv}>
              {t("button.export_csv", { defaultValue: "Export CSV" })}
            </Button>
            <Button variant="outlined" size="small" onClick={handleExportExcel}>
              {t("button.export_excel", { defaultValue: "Export Excel" })}
            </Button>
            <Button variant="outlined" size="small" onClick={handleExportPdf}>
              {t("button.export_pdf", { defaultValue: "Export PDF" })}
            </Button>
          </Stack>
        }
      />
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
            {t("analytics.context", { defaultValue: "Growth & Risk Intelligence" })}
          </Typography>
          <Typography variant="h1">{t("analytics.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("analytics.subtitle")}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={`${t("analytics.kpi.total_users")}: ${authCounts.total_users ?? "-"}`} />
            <Chip size="small" label={`${t("analytics.kpi.orders")}: ${paymentCounts.orders ?? "-"}`} />
            <Chip size="small" label={`${t("analytics.kpi.revenue_total")}: ${formatCurrency(paymentRevenue.total)}`} />
            <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
          </Stack>
        </Stack>
      </Paper>
      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <TextField
            label={t("label.start_date", { defaultValue: "Start Date" })}
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            disabled={range !== "custom"}
          />
          <TextField
            label={t("label.end_date", { defaultValue: "End Date" })}
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            disabled={range !== "custom"}
          />
          <Typography variant="caption" color="text.secondary">
            {t("analytics.range.note", {
              defaultValue: "Custom ranges apply to analytics and exports once start/end dates are set.",
            })}
          </Typography>
        </Stack>
      </Paper>
      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={kpi.label}>
            <KpiCard label={kpi.label} value={kpi.value} loading={isLoading} />
          </Grid>
        ))}
      </Grid>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h3">{t("risk.snapshot.title")}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" size="small">
              {t("risk.snapshot.level")} · {riskLevel}
            </Button>
            <Button variant="outlined" size="small">
              {riskScore !== null
                ? t("risk.snapshot.score", { score: riskScore.toFixed(0) })
                : t("risk.snapshot.score_unknown")}
            </Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard label={t("risk.snapshot.locked_label")} value={security.locked_users ?? 0} loading={isLoading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label={t("risk.snapshot.unverified_label")}
                value={security.unverified_users ?? authCounts.unverified ?? 0}
                loading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label={t("risk.snapshot.suspended_label")}
                value={authCounts.suspended ?? 0}
                loading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label={t("risk.snapshot.failed_logins_label")}
                value={latestLoginStat?.failed_logins ?? 0}
                loading={isLoading}
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h3">{t("analytics.section.registrations")}</Typography>
          <Sparkline values={registrationRows.map((row) => Number(row.total) || 0)} />
          <DataTable
            columns={[
              { key: "date", label: t("overview.column.date") },
              { key: "total", label: t("overview.column.total") },
              { key: "customers", label: t("overview.column.customers") },
              { key: "vendors", label: t("overview.column.vendors") },
              { key: "providers", label: t("analytics.column.providers") },
            ]}
            rows={registrationRows}
            loading={isLoading}
            error={isError}
            rowsPerPage={5}
            totalCount={registrationRows.length}
            showToolbar={false}
          />
        </Stack>
      </Paper>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <DataTable
            title={t("analytics.section.logins")}
            columns={[
              { key: "date", label: t("overview.column.date") },
              { key: "total", label: t("overview.column.total") },
              { key: "unique", label: t("analytics.column.unique") },
              { key: "failed", label: t("overview.column.failed") },
            ]}
            rows={loginRows}
            loading={isLoading}
            error={isError}
            rowsPerPage={5}
            totalCount={loginRows.length}
            showToolbar={false}
          />
          <Sparkline values={loginRows.map((row) => Number(row.total) || 0)} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DataTable
            title={t("analytics.section.orders")}
            columns={[
              { key: "type", label: t("overview.column.order_type") },
              { key: "orders", label: t("overview.column.orders") },
              { key: "total", label: t("overview.column.total_revenue") },
            ]}
            rows={orderRows}
            loading={isLoading}
            error={isError}
            rowsPerPage={5}
            totalCount={orderRows.length}
            showToolbar={false}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <DataTable
            title={t("analytics.section.latest_users")}
            columns={[
              { key: "user", label: t("label.user") },
              { key: "role", label: t("label.role") },
              { key: "status", label: t("label.status") },
              { key: "created", label: t("overview.column.created_at") },
            ]}
            rows={latestUserRows}
            loading={isLoading}
            error={isError}
            rowsPerPage={5}
            totalCount={latestUserRows.length}
            showToolbar={false}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <DataTable
            title={t("analytics.section.latest_products")}
            columns={[
              { key: "product", label: t("overview.column.product") },
              { key: "status", label: t("label.status") },
              { key: "price", label: t("overview.column.price") },
              { key: "created", label: t("overview.column.created_at") },
            ]}
            rows={latestProductRows}
            loading={isLoading}
            error={isError}
            rowsPerPage={5}
            totalCount={latestProductRows.length}
            showToolbar={false}
          />
        </Grid>
      </Grid>
    </Stack>
  );
};
