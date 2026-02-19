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
  createProductKey,
  deleteProductKey,
  listProductKeys,
  listProducts,
  updateProductKey,
  type Product,
  type ProductKey,
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

const statusOptions = ["", "available", "reserved", "sold"];

const normalizeDateInput = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 16);
};

export const ProductKeysPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [productId, setProductId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductKey | null>(null);
  const [form, setForm] = useState({
    product: "",
    status: "available",
    reserved_until: "",
    key_value: "",
  });

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      product: productId || undefined,
      ordering: "-reserved_until",
    }),
    [page, rowsPerPage, status, productId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog-product-keys", queryParams, tokens?.accessToken],
    queryFn: () => listProductKeys(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: products } = useQuery({
    queryKey: ["catalog-products", tokens?.accessToken],
    queryFn: () => listProducts(tokens?.accessToken || "", { page_size: 200, ordering: "name" }),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<ProductKey>(data);
  const productResults = resolveResults<Product>(products);
  const productMap = useMemo(() => {
    const map = new Map<string, string>();
    productResults.results.forEach((product) => map.set(String(product.id), product.name));
    return map;
  }, [productResults.results]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<ProductKey> & { key_value?: string } = {
        product: form.product,
        status: form.status,
        reserved_until: form.reserved_until ? new Date(form.reserved_until).toISOString() : null,
      };
      if (form.key_value) {
        payload.key_value = form.key_value;
      }
      if (editing) {
        return updateProductKey(tokens?.accessToken || "", editing.id, payload);
      }
      return createProductKey(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-product-keys"] });
      pushToast({
        message: t(editing ? "catalog.product_keys.updated" : "catalog.product_keys.created"),
        severity: "success",
      });
      setDialogOpen(false);
      setEditing(null);
      setForm({ product: "", status: "available", reserved_until: "", key_value: "" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (keyId: string) => deleteProductKey(tokens?.accessToken || "", keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-product-keys"] });
      pushToast({ message: t("catalog.product_keys.deleted"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolved.results.map((key) => ({
    id: key.id,
    exportData: {
      product: key.product,
      status: key.status,
      reserved_until: key.reserved_until || "",
    },
    product: productMap.get(String(key.product)) || key.product,
    status: <Chip size="small" label={key.status} />,
    reserved_until: key.reserved_until
      ? new Date(key.reserved_until).toLocaleString()
      : t("label.none"),
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["catalog_product_key.update"]}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setEditing(key);
              setForm({
                product: String(key.product),
                status: key.status || "available",
                reserved_until: normalizeDateInput(key.reserved_until),
                key_value: "",
              });
              setDialogOpen(true);
            }}
          >
            {t("action.edit")}
          </Button>
        </PermissionGate>
        <PermissionGate permissions={["catalog_product_key.delete"]}>
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => deleteMutation.mutate(String(key.id))}
          >
            {t("action.delete")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "product", label: t("catalog.product_keys.column.product") },
    { key: "status", label: t("catalog.product_keys.column.status") },
    { key: "reserved_until", label: t("catalog.product_keys.column.reserved_until") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["catalog_product_key.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("catalog.product_keys.title")}
          subtitle={t("catalog.product_keys.subtitle")}
          actions={
            <PermissionGate permissions={["catalog_product_key.create"]}>
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setForm({ product: "", status: "available", reserved_until: "", key_value: "" });
                  setDialogOpen(true);
                }}
              >
                {t("action.create")}
              </Button>
            </PermissionGate>
          }
        />
        <FilterBar
          savedViews={{
            storageKey: "catalog.product_keys",
            getState: () => ({ status, productId }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setProductId(String(state.productId || ""));
              setPage(0);
            },
            defaultState: { status: "", productId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("catalog.product_keys.filter.status")}
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
                  label={t("catalog.product_keys.filter.product")}
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setStatus("");
              setProductId("");
            },
          }}
        >
          <TextField
            select
            label={t("catalog.product_keys.column.product")}
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {productResults.results.map((product) => (
              <MenuItem key={product.id} value={String(product.id)}>
                {product.name}
              </MenuItem>
            ))}
          </TextField>
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={isError}
          totalCount={resolved.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="catalog_product_keys.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editing ? t("catalog.product_keys.edit") : t("catalog.product_keys.new")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label={t("catalog.product_keys.column.product")}
              value={form.product}
              onChange={(event) => setForm({ ...form, product: event.target.value })}
            >
              {productResults.results.map((product) => (
                <MenuItem key={product.id} value={String(product.id)}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("catalog.product_keys.column.status")}
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {statusOptions.filter(Boolean).map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("catalog.product_keys.column.reserved_until")}
              type="datetime-local"
              value={form.reserved_until}
              onChange={(event) => setForm({ ...form, reserved_until: event.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t("catalog.product_keys.field.key_value")}
              value={form.key_value}
              onChange={(event) => setForm({ ...form, key_value: event.target.value })}
              helperText={
                editing
                  ? t("catalog.product_keys.helper.key_value_optional")
                  : t("catalog.product_keys.helper.key_value_required")
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!form.product || (!editing && !form.key_value)}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
