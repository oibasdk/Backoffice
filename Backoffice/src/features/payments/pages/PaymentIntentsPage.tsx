import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { KpiCard } from "../../../components/KpiCard";
import { PageHeader } from "../../../components/PageHeader";
import {
  cancelPaymentIntent,
  completePaymentIntent,
  listPaymentIntents,
  type PaymentIntent,
} from "../api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

const statusOptions = ["pending", "verified", "completed", "expired", "cancelled"];

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

type IntentAction = "complete" | "cancel";

export const PaymentIntentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [actionDialog, setActionDialog] = useState<{
    intentId: string;
    reference: string;
    action: IntentAction;
  } | null>(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      reference: reference || undefined,
      customer_id: customerId || undefined,
      order: orderId || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, status, reference, customerId, orderId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-intents", queryParams, tokens?.accessToken],
    queryFn: () => listPaymentIntents(tokens?.accessToken || "", queryParams),
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

  const resolvedData = resolveResults<PaymentIntent>(data);
  const intents = resolvedData.results || [];
  const pendingCount = intents.filter((intent) => intent.status === "pending").length;
  const verifiedCount = intents.filter((intent) => intent.status === "verified").length;
  const completedCount = intents.filter((intent) => intent.status === "completed").length;
  const lastUpdated = intents[0]?.created_at ? new Date(intents[0].created_at).toLocaleString() : "-";

  const intentMutation = useMutation({
    mutationFn: async (payload: { intentId: string; action: IntentAction }) => {
      if (payload.action === "complete") {
        return completePaymentIntent(tokens?.accessToken || "", payload.intentId);
      }
      return cancelPaymentIntent(tokens?.accessToken || "", payload.intentId);
    },
    onSuccess: () => {
      pushToast({ message: t("payments.intents.action.success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["payment-intents"] });
      setActionDialog(null);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolvedData.results.map((intent) => {
    const methodLabel =
      intent.method_detail?.name_en ||
      intent.method_detail?.name_ar ||
      intent.method_detail?.code ||
      intent.method;
    const amount = `${(intent.amount_cents / 100).toLocaleString()} ${intent.currency}`;
    const canComplete = ["pending", "verified"].includes(intent.status);
    const canCancel = ["pending", "verified"].includes(intent.status);
    return {
      id: intent.id,
      reference: (
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600}>
            {intent.reference}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {intent.id}
          </Typography>
        </Stack>
      ),
      customer: intent.customer_id,
      order: intent.order || "-",
      method: methodLabel,
      amount,
      status: <Chip size="small" label={intent.status} />,
      expires: intent.expires_at ? new Date(intent.expires_at).toLocaleString() : "-",
      created: new Date(intent.created_at).toLocaleString(),
      actions: (
        <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
          <PermissionGate permissions={["payment_intent.update"]}>
            <Button
              size="small"
              variant="outlined"
              disabled={!canComplete}
              onClick={() =>
                setActionDialog({ intentId: intent.id, reference: intent.reference, action: "complete" })
              }
            >
              {t("payments.intents.action.complete")}
            </Button>
            <Button
              size="small"
              variant="text"
              color="error"
              disabled={!canCancel}
              onClick={() =>
                setActionDialog({ intentId: intent.id, reference: intent.reference, action: "cancel" })
              }
            >
              {t("payments.intents.action.cancel")}
            </Button>
          </PermissionGate>
        </Stack>
      ),
    };
  });

  const columns = [
    { key: "reference", label: t("payments.intents.column.reference") },
    { key: "customer", label: t("payments.intents.column.customer") },
    { key: "order", label: t("payments.intents.column.order") },
    { key: "method", label: t("payments.intents.column.method") },
    { key: "amount", label: t("payments.intents.column.amount") },
    { key: "status", label: t("label.status") },
    { key: "expires", label: t("payments.intents.column.expires") },
    { key: "created", label: t("table.column.created") },
    { key: "actions", label: t("label.action") },
  ];

  const actionLabel =
    actionDialog?.action === "cancel"
      ? t("payments.intents.action.cancel")
      : t("payments.intents.action.complete");

  return (
    <PermissionGate permissions={["payment_intent.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("payments.intents.title")} subtitle={t("payments.intents.subtitle")} />
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
              {t("payments.intents.context", { defaultValue: "Payment Intent Control" })}
            </Typography>
            <Typography variant="h1">{t("payments.intents.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("payments.intents.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("payments.intents.status.pending", { defaultValue: "Pending" })}: ${pendingCount}`} />
              <Chip size="small" label={`${t("payments.intents.status.verified", { defaultValue: "Verified" })}: ${verifiedCount}`} />
              <Chip size="small" label={`${t("payments.intents.status.completed", { defaultValue: "Completed" })}: ${completedCount}`} color="success" />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("payments.intents.snapshot.total", { defaultValue: "Total Intents" })} value={resolvedData.count} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("payments.intents.snapshot.pending", { defaultValue: "Pending" })} value={pendingCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("payments.intents.snapshot.completed", { defaultValue: "Completed" })} value={completedCount} loading={isLoading} />
          </Grid>
        </Grid>
        <FilterBar
          savedViews={{
            storageKey: "payments.intents",
            getState: () => ({ status, reference, customerId, orderId }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setReference(String(state.reference || ""));
              setCustomerId(String(state.customerId || ""));
              setOrderId(String(state.orderId || ""));
              setPage(0);
            },
            defaultState: { status: "", reference: "", customerId: "", orderId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("label.reference")}
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  size="small"
                />
                <TextField
                  label={t("label.customer_id")}
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  size="small"
                />
                <TextField
                  label={t("label.order_id")}
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setReference("");
              setCustomerId("");
              setOrderId("");
            },
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
          exportFilename="payment-intents.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={Boolean(actionDialog)} onClose={() => setActionDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t("payments.intents.confirm.title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              {t("payments.intents.confirm.subtitle", {
                reference: actionDialog?.reference,
                action: actionLabel,
              })}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            color={actionDialog?.action === "cancel" ? "error" : "primary"}
            onClick={() =>
              actionDialog &&
              intentMutation.mutate({ intentId: actionDialog.intentId, action: actionDialog.action })
            }
          >
            {actionDialog?.action === "cancel"
              ? t("payments.intents.action.cancel")
              : t("payments.intents.action.complete")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
