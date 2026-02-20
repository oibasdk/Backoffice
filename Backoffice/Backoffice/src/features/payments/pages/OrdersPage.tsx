import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import { listOrders, refundOrder } from "../api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const statusOptions = ["pending", "paid", "failed", "refunded"];
const typeOptions = ["product", "service", "task"];

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [orderType, setOrderType] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      order_type: orderType || undefined,
      start: start || undefined,
      end: end || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, status, orderType, start, end]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", queryParams, tokens?.accessToken],
    queryFn: () => listOrders(tokens?.accessToken || "", queryParams),
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

  const resolvedData = resolveResults(data);
  const orders = resolvedData.results || [];
  const paidCount = orders.filter((order) => order.status === "paid").length;
  const pendingCount = orders.filter((order) => order.status === "pending").length;
  const refundedCount = orders.filter((order) => order.status === "refunded").length;
  const lastUpdated = orders[0]?.created_at ? new Date(orders[0].created_at).toLocaleString() : "-";

  const refundMutation = useMutation({
    mutationFn: (payload: { orderId: string; reason?: string }) =>
      refundOrder(tokens?.accessToken || "", payload.orderId, payload.reason),
    onSuccess: () => {
      pushToast({ message: t("orders.refund.success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setRefundOpen(false);
      setRefundReason("");
      setSelectedOrderId(null);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (resolvedData.results || []).map((order) => ({
    id: order.id,
    exportData: {
      order: order.id,
      type: order.order_type,
      status: order.status,
      total: `${order.total_cents} ${order.currency}`,
      created: order.created_at,
    },
    order: (
      <Stack>
        <Typography variant="body2" fontWeight={600}>
          {order.id}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {order.customer_id}
        </Typography>
      </Stack>
    ),
    type: <Chip size="small" label={order.order_type} />,
    status: <Chip size="small" label={order.status} />,
    total: `${order.total_cents} ${order.currency}`,
    created: new Date(order.created_at).toLocaleString(),
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["order_refund.create"]}>
          <Button
            size="small"
            variant="outlined"
            disabled={order.status !== "paid"}
            onClick={() => {
              setSelectedOrderId(order.id);
              setRefundOpen(true);
            }}
          >
            {t("action.refund")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "order", label: t("orders.column.order") },
    { key: "type", label: t("orders.column.type") },
    { key: "status", label: t("orders.column.status") },
    { key: "total", label: t("orders.column.total") },
    { key: "created", label: t("table.column.created") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["order.view"]}>
      <Stack spacing={4}>
        <PageHeader title={t("orders.title")} subtitle={t("orders.subtitle")} sx={{ mb: 1 }} />

        <Grid container spacing={3}>
          {/* Intelligence Tray (4 Columns) */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              <Paper
                sx={(theme) => ({
                  p: 3,
                  borderRadius: radiusTokens.large,
                  background: "var(--app-surface)",
                  backdropFilter: "blur(var(--app-blur))",
                  border: "1px solid var(--app-card-border)",
                  boxShadow: elevationTokens.level3,
                })}
              >
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
                      {t("orders.financial_intelligence", { defaultValue: "Financial Intelligence" })}
                    </Typography>
                    <Typography variant="h3">{t("orders.ledger_summary", { defaultValue: "Ledger Summary" })}</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <KpiCard
                        label={t("orders.snapshot.total", { defaultValue: "Total Lifetime" })}
                        value={resolvedData.count}
                        loading={isLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("orders.snapshot.paid", { defaultValue: "Paid" })}
                        value={paidCount}
                        loading={isLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("orders.snapshot.refunded", { defaultValue: "Refunded" })}
                        value={refundedCount}
                        loading={isLoading}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ opacity: 0.1 }} />

                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      {t("orders.last_activity", { defaultValue: "Last transaction recorded on" })} {lastUpdated}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setStatus("paid")}
                        fullWidth
                      >
                        {t("orders.filter.paid", { defaultValue: "Paid Ledger" })}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setStatus("pending")}
                        fullWidth
                      >
                        {t("orders.filter.pending", { defaultValue: "Pending" })}
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: radiusTokens.large,
                  background: "rgba(33,64,153,0.02)",
                  border: "1px dashed rgba(33,64,153,0.2)",
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {t("orders.compliance_note", { defaultValue: "Compliance Reminder" })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("orders.compliance_hint", { defaultValue: "All refunds are audited system-wide. Ensure proper documentation is attached to high-value reversals." })}
                </Typography>
              </Paper>
            </Stack>
          </Grid>

          {/* Primary Data Tray (8 Columns) */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              <FilterBar
                savedViews={{
                  storageKey: "payments.orders",
                  getState: () => ({ status, orderType, start, end }),
                  applyState: (state) => {
                    setStatus(String(state.status || ""));
                    setOrderType(String(state.orderType || ""));
                    setStart(String(state.start || ""));
                    setEnd(String(state.end || ""));
                    setPage(0);
                  },
                  defaultState: { status: "", orderType: "", start: "", end: "" },
                }}
                advanced={{
                  title: t("filter.advanced"),
                  content: (
                    <Stack spacing={2} mt={1}>
                      <TextField
                        label={t("orders.date_start")}
                        type="date"
                        value={start}
                        onChange={(event) => setStart(event.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label={t("orders.date_end")}
                        type="date"
                        value={end}
                        onChange={(event) => setEnd(event.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  ),
                  onApply: () => setPage(0),
                  onReset: () => {
                    setStart("");
                    setEnd("");
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
                <TextField
                  select
                  label={t("orders.column.type")}
                  value={orderType}
                  onChange={(event) => setOrderType(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  {typeOptions.map((option) => (
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
                exportFilename="orders.csv"
                onPageChange={setPage}
                onRowsPerPageChange={(size: number) => {
                  setRowsPerPage(size);
                  setPage(0);
                }}
                density={density}
                onDensityChange={setDensity}
              />
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={refundOpen} onClose={() => setRefundOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("orders.refund.title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              {t("orders.refund.subtitle")}
            </Typography>
            <TextField
              label={t("orders.refund.reason")}
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() =>
              selectedOrderId &&
              refundMutation.mutate({ orderId: selectedOrderId, reason: refundReason || undefined })
            }
          >
            {t("action.refund")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
