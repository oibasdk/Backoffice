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
  approvePaymentProof,
  listPaymentProofs,
  rejectPaymentProof,
  type PaymentProof,
} from "../api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

const statusOptions = ["pending", "approved", "rejected"];

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

type ReviewAction = "approve" | "reject";

export const PaymentProofsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [intentId, setIntentId] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewDialog, setReviewDialog] = useState<{
    proofId: string;
    reference?: string;
    action: ReviewAction;
  } | null>(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      intent: intentId || undefined,
      submitted_by: submittedBy || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, status, intentId, submittedBy]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-proofs", queryParams, tokens?.accessToken],
    queryFn: () => listPaymentProofs(tokens?.accessToken || "", queryParams),
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

  const resolvedData = resolveResults<PaymentProof>(data);
  const proofs = resolvedData.results || [];
  const pendingCount = proofs.filter((proof) => proof.status === "pending").length;
  const approvedCount = proofs.filter((proof) => proof.status === "approved").length;
  const rejectedCount = proofs.filter((proof) => proof.status === "rejected").length;
  const lastUpdated = proofs[0]?.created_at ? new Date(proofs[0].created_at).toLocaleString() : "-";

  const reviewMutation = useMutation({
    mutationFn: async (payload: { proofId: string; action: ReviewAction; reason?: string }) => {
      if (payload.action === "approve") {
        return approvePaymentProof(tokens?.accessToken || "", payload.proofId, payload.reason);
      }
      return rejectPaymentProof(tokens?.accessToken || "", payload.proofId, payload.reason);
    },
    onSuccess: () => {
      pushToast({ message: t("payments.proofs.review.success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["payment-proofs"] });
      setReviewDialog(null);
      setReviewReason("");
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolvedData.results.map((proof) => ({
    id: proof.id,
    intent: proof.intent,
    reference: proof.reference || "-",
    submitted: proof.submitted_by || "-",
    status: <Chip size="small" label={proof.status} />,
    created: new Date(proof.created_at).toLocaleString(),
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["payment_proof.update"]}>
          <Button
            size="small"
            variant="outlined"
            disabled={proof.status !== "pending"}
            onClick={() =>
              setReviewDialog({ proofId: proof.id, reference: proof.reference, action: "approve" })
            }
          >
            {t("payments.proofs.action.approve")}
          </Button>
          <Button
            size="small"
            variant="text"
            color="error"
            disabled={proof.status !== "pending"}
            onClick={() =>
              setReviewDialog({ proofId: proof.id, reference: proof.reference, action: "reject" })
            }
          >
            {t("payments.proofs.action.reject")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "intent", label: t("payments.proofs.column.intent") },
    { key: "reference", label: t("payments.proofs.column.reference") },
    { key: "submitted", label: t("payments.proofs.column.submitted_by") },
    { key: "status", label: t("label.status") },
    { key: "created", label: t("table.column.created") },
    { key: "actions", label: t("label.action") },
  ];

  const reviewActionLabel =
    reviewDialog?.action === "reject"
      ? t("payments.proofs.action.reject")
      : t("payments.proofs.action.approve");

  return (
    <PermissionGate permissions={["payment_proof.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("payments.proofs.title")} subtitle={t("payments.proofs.subtitle")} />
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
              {t("payments.proofs.context", { defaultValue: "Proof Review" })}
            </Typography>
            <Typography variant="h1">{t("payments.proofs.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("payments.proofs.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("payments.proofs.status.pending", { defaultValue: "Pending" })}: ${pendingCount}`} />
              <Chip size="small" label={`${t("payments.proofs.status.approved", { defaultValue: "Approved" })}: ${approvedCount}`} color="success" />
              <Chip size="small" label={`${t("payments.proofs.status.rejected", { defaultValue: "Rejected" })}: ${rejectedCount}`} />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("payments.proofs.snapshot.total", { defaultValue: "Total Proofs" })} value={resolvedData.count} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("payments.proofs.snapshot.pending", { defaultValue: "Pending" })} value={pendingCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("payments.proofs.snapshot.approved", { defaultValue: "Approved" })} value={approvedCount} loading={isLoading} />
          </Grid>
        </Grid>
        <FilterBar
          savedViews={{
            storageKey: "payments.proofs",
            getState: () => ({ status, intentId, submittedBy }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setIntentId(String(state.intentId || ""));
              setSubmittedBy(String(state.submittedBy || ""));
              setPage(0);
            },
            defaultState: { status: "", intentId: "", submittedBy: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("label.intent_id")}
                  value={intentId}
                  onChange={(event) => setIntentId(event.target.value)}
                  size="small"
                />
                <TextField
                  label={t("label.submitted_by")}
                  value={submittedBy}
                  onChange={(event) => setSubmittedBy(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setIntentId("");
              setSubmittedBy("");
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
          exportFilename="payment-proofs.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={Boolean(reviewDialog)} onClose={() => setReviewDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t("payments.proofs.review.title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              {t("payments.proofs.review.subtitle", {
                reference: reviewDialog?.reference || reviewDialog?.proofId,
                action: reviewActionLabel,
              })}
            </Typography>
            <TextField
              label={t("payments.proofs.review.reason")}
              value={reviewReason}
              onChange={(event) => setReviewReason(event.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(null)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            color={reviewDialog?.action === "reject" ? "error" : "primary"}
            onClick={() =>
              reviewDialog &&
              reviewMutation.mutate({
                proofId: reviewDialog.proofId,
                action: reviewDialog.action,
                reason: reviewReason || undefined,
              })
            }
          >
            {reviewDialog?.action === "reject"
              ? t("payments.proofs.action.reject")
              : t("payments.proofs.action.approve")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
