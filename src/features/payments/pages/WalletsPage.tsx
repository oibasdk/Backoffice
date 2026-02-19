import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import {
  adjustWallet,
  freezeWallet,
  listWallets,
  unfreezeWallet,
  type Wallet,
} from "../api";

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

const statusOptions = ["", "active", "frozen"];

export const WalletsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");
  const [userId, setUserId] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("0");
  const [adjustReason, setAdjustReason] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      currency: currency || undefined,
      user_id: userId || undefined,
      ordering: "-updated_at",
    }),
    [page, rowsPerPage, status, currency, userId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wallets", queryParams, tokens?.accessToken],
    queryFn: () => listWallets(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<Wallet>(data);

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjustWallet(tokens?.accessToken || "", selectedWallet?.id || "", {
        amount_cents: Number(adjustAmount),
        reason: adjustReason || undefined,
      }),
    onSuccess: () => {
      pushToast({ message: t("wallets.adjusted", { defaultValue: "Wallet adjusted." }), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setAdjustOpen(false);
      setAdjustAmount("0");
      setAdjustReason("");
      setSelectedWallet(null);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const freezeMutation = useMutation({
    mutationFn: (walletId: string) => freezeWallet(tokens?.accessToken || "", walletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });

  const unfreezeMutation = useMutation({
    mutationFn: (walletId: string) => unfreezeWallet(tokens?.accessToken || "", walletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });

  const rows = resolved.results.map((wallet) => ({
    id: wallet.id,
    exportData: {
      user_id: wallet.user_id,
      balance_cents: wallet.balance_cents,
      currency: wallet.currency,
      status: wallet.status,
      updated_at: wallet.updated_at,
    },
    user: wallet.user_id,
    balance: `${(wallet.balance_cents / 100).toLocaleString()} ${wallet.currency}`,
    status: <Chip size="small" label={wallet.status} color={wallet.status === "active" ? "success" : "warning"} />,
    updated: wallet.updated_at ? new Date(wallet.updated_at).toLocaleString() : "-",
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setSelectedWallet(wallet);
            setAdjustOpen(true);
          }}
        >
          {t("wallets.adjust", { defaultValue: "Adjust" })}
        </Button>
        {wallet.status === "active" ? (
          <Button size="small" color="warning" onClick={() => freezeMutation.mutate(wallet.id)}>
            {t("wallets.freeze", { defaultValue: "Freeze" })}
          </Button>
        ) : (
          <Button size="small" color="success" onClick={() => unfreezeMutation.mutate(wallet.id)}>
            {t("wallets.unfreeze", { defaultValue: "Unfreeze" })}
          </Button>
        )}
      </Stack>
    ),
  }));

  const columns = [
    { key: "user", label: t("wallets.column.user", { defaultValue: "User" }) },
    { key: "balance", label: t("wallets.column.balance", { defaultValue: "Balance" }) },
    { key: "status", label: t("wallets.column.status", { defaultValue: "Status" }) },
    { key: "updated", label: t("table.column.updated") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["wallet.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("wallets.title", { defaultValue: "Wallets" })}
          subtitle={t("wallets.subtitle", { defaultValue: "Manage customer wallet balances." })}
        />
        <FilterBar
          savedViews={{
            storageKey: "payments.wallets",
            getState: () => ({ status, currency, userId }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setCurrency(String(state.currency || ""));
              setUserId(String(state.userId || ""));
              setPage(0);
            },
            defaultState: { status: "", currency: "", userId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("wallets.column.status", { defaultValue: "Status" })}
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
                <TextField
                  label={t("wallets.column.currency", { defaultValue: "Currency" })}
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setStatus("");
              setCurrency("");
            },
          }}
        >
          <TextField
            label={t("wallets.column.user", { defaultValue: "User" })}
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
          exportFilename="wallets.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("wallets.adjust", { defaultValue: "Adjust wallet" })}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("wallets.adjust_amount", { defaultValue: "Amount (cents)" })}
              type="number"
              value={adjustAmount}
              onChange={(event) => setAdjustAmount(event.target.value)}
            />
            <TextField
              label={t("wallets.adjust_reason", { defaultValue: "Reason" })}
              value={adjustReason}
              onChange={(event) => setAdjustReason(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => adjustMutation.mutate()}
            disabled={Number(adjustAmount) === 0 || !selectedWallet}
          >
            {t("action.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
