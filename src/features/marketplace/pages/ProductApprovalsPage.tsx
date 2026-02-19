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
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { approveProduct, listProducts, rejectProduct } from "../api";

const statusOptions = ["pending", "approved", "rejected"];
const typeOptions = ["physical", "digital_key", "service"];

export const ProductApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("pending");
  const [productType, setProductType] = useState("");
  const [search, setSearch] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      approval_status: status || undefined,
      product_type: productType || undefined,
      search: search || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, status, productType, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-approvals", queryParams, tokens?.accessToken],
    queryFn: () => listProducts(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const approveMutation = useMutation({
    mutationFn: (productId: string) => approveProduct(tokens?.accessToken || "", productId),
    onSuccess: () => {
      pushToast({ message: t("product.approvals.approved"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["product-approvals"] });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { productId: string; reason?: string }) =>
      rejectProduct(tokens?.accessToken || "", payload.productId, payload.reason),
    onSuccess: () => {
      pushToast({ message: t("product.approvals.rejected"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["product-approvals"] });
      setRejectOpen(false);
      setRejectReason("");
      setSelectedProductId(null);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (data?.results || []).map((product) => ({
    id: product.id,
    exportData: {
      product: product.name,
      type: product.product_type,
      status: product.approval_status,
      price: `${product.price_cents} ${product.currency}`,
      created: product.created_at,
    },
    product: (
      <Stack>
        <Typography variant="body2" fontWeight={600}>
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {product.id}
        </Typography>
      </Stack>
    ),
    type: <Chip size="small" label={product.product_type} />,
    status: <Chip size="small" label={product.approval_status} />,
    price: `${product.price_cents} ${product.currency}`,
    created: new Date(product.created_at).toLocaleString(),
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["product_approval.update"]}>
          <Button size="small" variant="outlined" onClick={() => approveMutation.mutate(product.id)}>
            {t("action.approve")}
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => {
              setSelectedProductId(product.id);
              setRejectOpen(true);
            }}
          >
            {t("action.reject")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "product", label: t("product.approvals.product") },
    { key: "type", label: t("product.approvals.type") },
    { key: "status", label: t("label.status") },
    { key: "price", label: t("product.approvals.price") },
    { key: "created", label: t("table.column.created") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["product_approval.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("product.approvals.title")} subtitle={t("product.approvals.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "marketplace.products",
            getState: () => ({ status, productType, search }),
            applyState: (state) => {
              setStatus(String(state.status || "pending"));
              setProductType(String(state.productType || ""));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { status: "pending", productType: "", search: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("label.search")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setSearch(""),
          }}
        >
          <TextField
            select
            label={t("label.status")}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            size="small"
          >
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("product.approvals.type")}
            value={productType}
            onChange={(event) => setProductType(event.target.value)}
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
          totalCount={data?.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="product_approvals.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("product.approvals.reject_title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              {t("product.approvals.reject_hint")}
            </Typography>
            <TextField
              label={t("product.approvals.reject_reason")}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() =>
              selectedProductId &&
              rejectMutation.mutate({ productId: selectedProductId, reason: rejectReason || undefined })
            }
          >
            {t("action.reject")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
