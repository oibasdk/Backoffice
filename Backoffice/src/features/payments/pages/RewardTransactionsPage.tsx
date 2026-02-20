import React, { useMemo, useState } from "react";
import { Chip, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listRewardTransactions, type RewardTransaction } from "../api";

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

export const RewardTransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [userId, setUserId] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      user_id: userId || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, userId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reward-transactions", queryParams, tokens?.accessToken],
    queryFn: () => listRewardTransactions(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<RewardTransaction>(data);
  const rows = resolved.results.map((tx) => ({
    id: tx.id,
    exportData: {
      user_id: tx.user_id,
      amount_cents: tx.amount_cents,
      currency: tx.currency,
      status: tx.status,
      created_at: tx.created_at,
    },
    user: tx.user_id,
    amount: `${(tx.amount_cents / 100).toLocaleString()} ${tx.currency}`,
    status: <Chip size="small" label={tx.status} />,
    created: new Date(tx.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "user", label: t("rewards.tx.column.user", { defaultValue: "User" }) },
    { key: "amount", label: t("rewards.tx.column.amount", { defaultValue: "Amount" }) },
    { key: "status", label: t("rewards.tx.column.status", { defaultValue: "Status" }) },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["reward_transaction.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("rewards.tx.title", { defaultValue: "Reward transactions" })}
          subtitle={t("rewards.tx.subtitle", { defaultValue: "Ledger of reward credits." })}
        />
        <FilterBar
          savedViews={{
            storageKey: "payments.reward_transactions",
            getState: () => ({ userId }),
            applyState: (state) => {
              setUserId(String(state.userId || ""));
              setPage(0);
            },
            defaultState: { userId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: null,
            onApply: () => setPage(0),
            onReset: () => setUserId(""),
          }}
        >
          <TextField
            label={t("rewards.tx.column.user", { defaultValue: "User" })}
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
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
          exportFilename="reward_transactions.csv"
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
