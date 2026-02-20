import React, { useMemo, useState } from "react";
import { Chip, MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listWalletTransactions, type WalletTransaction } from "../api";

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

const txTypes = ["", "credit", "debit"];

export const WalletTransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [txType, setTxType] = useState("");
  const [userId, setUserId] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      tx_type: txType || undefined,
      wallet__user_id: userId || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, txType, userId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wallet-transactions", queryParams, tokens?.accessToken],
    queryFn: () => listWalletTransactions(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<WalletTransaction>(data);
  const rows = resolved.results.map((tx) => ({
    id: tx.id,
    exportData: {
      wallet: tx.wallet,
      tx_type: tx.tx_type,
      amount_cents: tx.amount_cents,
      currency: tx.currency,
      status: tx.status,
      created_at: tx.created_at,
    },
    wallet: tx.wallet,
    type: <Chip size="small" label={tx.tx_type} />,
    amount: `${(tx.amount_cents / 100).toLocaleString()} ${tx.currency}`,
    status: tx.status,
    created: new Date(tx.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "wallet", label: t("wallet_transactions.column.wallet", { defaultValue: "Wallet" }) },
    { key: "type", label: t("wallet_transactions.column.type", { defaultValue: "Type" }) },
    { key: "amount", label: t("wallet_transactions.column.amount", { defaultValue: "Amount" }) },
    { key: "status", label: t("wallet_transactions.column.status", { defaultValue: "Status" }) },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["wallet_transaction.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("wallet_transactions.title", { defaultValue: "Wallet transactions" })}
          subtitle={t("wallet_transactions.subtitle", { defaultValue: "Ledger of wallet credits and debits." })}
        />
        <FilterBar
          savedViews={{
            storageKey: "payments.wallet_transactions",
            getState: () => ({ txType, userId }),
            applyState: (state) => {
              setTxType(String(state.txType || ""));
              setUserId(String(state.userId || ""));
              setPage(0);
            },
            defaultState: { txType: "", userId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("wallet_transactions.column.type", { defaultValue: "Type" })}
                  value={txType}
                  onChange={(event) => setTxType(event.target.value)}
                  size="small"
                >
                  {txTypes.map((option) => (
                    <MenuItem key={option || "all"} value={option}>
                      {option || t("label.all")}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setTxType(""),
          }}
        >
          <TextField
            label={t("wallet_transactions.column.user", { defaultValue: "User" })}
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
          exportFilename="wallet_transactions.csv"
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
