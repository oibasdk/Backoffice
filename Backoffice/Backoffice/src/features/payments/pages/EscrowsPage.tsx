import React, { useMemo, useState } from "react";
import { Chip, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { KpiCard } from "../../../components/KpiCard";
import { PageHeader } from "../../../components/PageHeader";
import { listEscrows, type Escrow } from "../api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

const statusOptions = ["held", "released", "refunded"];

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

export const EscrowsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [orderId, setOrderId] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      order: orderId || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, status, orderId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["escrows", queryParams, tokens?.accessToken],
    queryFn: () => listEscrows(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolveResults = <T,>(payload: PaginatedLike<T> | T[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as T[] };
  };

  const resolvedData = resolveResults<Escrow>(data);
  const escrows = resolvedData.results || [];
  const heldCount = escrows.filter((escrow) => escrow.status === "held").length;
  const releasedCount = escrows.filter((escrow) => escrow.status === "released").length;
  const refundedCount = escrows.filter((escrow) => escrow.status === "refunded").length;
  const lastUpdated = escrows[0]?.created_at ? new Date(escrows[0].created_at).toLocaleString() : "-";

  const rows = resolvedData.results.map((escrow) => ({
    id: escrow.id,
    order: (
      <Stack>
        <Typography variant="body2" fontWeight={600}>
          {escrow.order}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {escrow.id}
        </Typography>
      </Stack>
    ),
    amount: `${(escrow.amount_cents / 100).toLocaleString()} ${escrow.currency}`,
    status: <Chip size="small" label={escrow.status} />,
    hold_reason: escrow.hold_reason || "-",
    released_at: escrow.released_at ? new Date(escrow.released_at).toLocaleString() : "-",
    refunded_at: escrow.refunded_at ? new Date(escrow.refunded_at).toLocaleString() : "-",
    created_at: new Date(escrow.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "order", label: t("payments.escrows.column.order") },
    { key: "amount", label: t("payments.escrows.column.amount") },
    { key: "status", label: t("label.status") },
    { key: "hold_reason", label: t("payments.escrows.column.hold_reason") },
    { key: "released_at", label: t("payments.escrows.column.released_at") },
    { key: "refunded_at", label: t("payments.escrows.column.refunded_at") },
    { key: "created_at", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["escrow.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("payments.escrows.title")} subtitle={t("payments.escrows.subtitle")} />
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
              {t("payments.escrows.context", { defaultValue: "Escrow Control" })}
            </Typography>
            <Typography variant="h1">{t("payments.escrows.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("payments.escrows.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("payments.escrows.status.held", { defaultValue: "Held" })}: ${heldCount}`} />
              <Chip size="small" label={`${t("payments.escrows.status.released", { defaultValue: "Released" })}: ${releasedCount}`} color="success" />
              <Chip size="small" label={`${t("payments.escrows.status.refunded", { defaultValue: "Refunded" })}: ${refundedCount}`} />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("payments.escrows.snapshot.total", { defaultValue: "Total Escrows" })} value={resolvedData.count} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("payments.escrows.snapshot.held", { defaultValue: "Held" })} value={heldCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("payments.escrows.snapshot.released", { defaultValue: "Released" })} value={releasedCount} loading={isLoading} />
          </Grid>
        </Grid>
        <FilterBar
          savedViews={{
            storageKey: "payments.escrows",
            getState: () => ({ status, orderId }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setOrderId(String(state.orderId || ""));
              setPage(0);
            },
            defaultState: { status: "", orderId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("label.order_id")}
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setOrderId(""),
          }}
        >
          <TextField
            select
            label={t("label.status")}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={isError}
          totalCount={resolvedData.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="escrows.csv"
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
