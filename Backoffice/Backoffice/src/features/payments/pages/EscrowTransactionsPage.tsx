import React, { useMemo, useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listEscrowTransactions, EscrowTransaction } from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const statusOptions = ["held", "released", "refunded"];

export const EscrowTransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      search: search || undefined,
      ordering: "-released_at",
    }),
    [page, rowsPerPage, status, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["escrow-transactions", queryParams, tokens?.accessToken],
    queryFn: () => listEscrowTransactions(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolveResults = (payload: PaginatedLike<EscrowTransaction> | EscrowTransaction[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as EscrowTransaction[] };
  };

  const resolvedData = resolveResults(data);

  const rows = (resolvedData.results || []).map((item) => ({
    id: item.id,
    exportData: {
      order: item.order,
      amount: `${item.amount_cents} ${item.currency}`,
      status: item.status,
      hold_reason: item.hold_reason ?? "",
      released_at: item.released_at ?? "",
      refunded_at: item.refunded_at ?? "",
    },
    order: item.order,
    amount: `${item.amount_cents} ${item.currency}`,
    status: item.status,
    hold_reason: item.hold_reason ?? "-",
    released_at: item.released_at ? new Date(item.released_at).toLocaleString() : "-",
    refunded_at: item.refunded_at ? new Date(item.refunded_at).toLocaleString() : "-",
  }));

  const columns = [
    { key: "order", label: t("escrow_transactions.column.order") },
    { key: "amount", label: t("escrow_transactions.column.amount") },
    { key: "status", label: t("escrow_transactions.column.status") },
    { key: "hold_reason", label: t("escrow_transactions.column.hold_reason") },
    { key: "released_at", label: t("escrow_transactions.column.released_at") },
    { key: "refunded_at", label: t("escrow_transactions.column.refunded_at") },
  ];

  return (
    <PermissionGate permissions={["escrow_transaction.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("escrow_transactions.title")}
          subtitle={t("escrow_transactions.subtitle")}
        />
        <FilterBar
          savedViews={{
            storageKey: "payments.escrow_transactions",
            getState: () => ({ status, search }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { status: "", search: "" },
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
            label={t("escrow_transactions.column.status")}
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
          exportFilename="escrow_transactions.csv"
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
