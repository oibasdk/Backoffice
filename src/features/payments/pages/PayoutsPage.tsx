import React, { useMemo, useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listPayouts, Payout } from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const statusOptions = ["pending", "sent", "failed"];
const targetOptions = ["vendor", "provider"];

export const PayoutsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [targetType, setTargetType] = useState("");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      target_type: targetType || undefined,
      search: search || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, status, targetType, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-payouts", queryParams, tokens?.accessToken],
    queryFn: () => listPayouts(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolveResults = (payload: PaginatedLike<Payout> | Payout[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as Payout[] };
  };

  const resolvedData = resolveResults(data);

  const rows = (resolvedData.results || []).map((payout) => ({
    id: payout.id,
    exportData: {
      target_type: payout.target_type,
      target_id: payout.target_id,
      amount: `${payout.amount_cents} ${payout.currency}`,
      status: payout.status,
      created_at: payout.created_at,
      sent_at: payout.sent_at ?? "",
    },
    target: `${payout.target_type} • ${payout.target_id}`,
    amount: `${payout.amount_cents} ${payout.currency}`,
    status: payout.status,
    created: new Date(payout.created_at).toLocaleString(),
    sent: payout.sent_at ? new Date(payout.sent_at).toLocaleString() : "-",
  }));

  const columns = [
    { key: "target", label: t("payouts.column.target") },
    { key: "amount", label: t("payouts.column.amount") },
    { key: "status", label: t("payouts.column.status") },
    { key: "created", label: t("table.column.created") },
    { key: "sent", label: t("payouts.column.sent_at") },
  ];

  return (
    <PermissionGate permissions={["payout.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("payouts.title")} subtitle={t("payouts.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "payments.payouts",
            getState: () => ({ status, targetType, search }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setTargetType(String(state.targetType || ""));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { status: "", targetType: "", search: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: null,
            onApply: () => setPage(0),
            onReset: () => setSearch(""),
          }}
        >
          <TextField
            select
            label={t("payouts.column.status")}
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
          <TextField
            select
            label={t("payouts.column.target_type")}
            value={targetType}
            onChange={(event) => setTargetType(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {targetOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
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
          totalCount={resolvedData.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="payouts.csv"
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
