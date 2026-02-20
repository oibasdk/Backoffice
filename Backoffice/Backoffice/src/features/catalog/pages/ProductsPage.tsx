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
  createProduct,
  deleteProduct,
  listCategories,
  listProducts,
  listProfessions,
  updateProduct,
  type Category,
  type Profession,
  type Product,
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

const approvalOptions = ["", "pending", "approved", "rejected"];
const productTypes = ["physical", "digital_key", "service", "software"];

export const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [productType, setProductType] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_cents: 0,
    currency: "USD",
    product_type: "digital_key",
    stock: 0,
    category: "" as number | "",
    profession: "" as number | "",
    version: "",
    size_mb: "",
    supported_os: "",
  });

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      approval_status: approvalStatus || undefined,
      product_type: productType || undefined,
      vendor_id: vendorId || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, search, approvalStatus, productType, vendorId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog-products", queryParams, tokens?.accessToken],
    queryFn: () => listProducts(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: categories } = useQuery({
    queryKey: ["catalog-categories", tokens?.accessToken],
    queryFn: () => listCategories(tokens?.accessToken || "", { page_size: 200 }),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: professions } = useQuery({
    queryKey: ["catalog-professions", tokens?.accessToken],
    queryFn: () => listProfessions(tokens?.accessToken || "", { page_size: 200 }),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<Product>(data);
  const categoryResults = resolveResults<Category>(categories);
  const professionResults = resolveResults<Profession>(professions);

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categoryResults.results.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categoryResults.results]);

  const professionMap = useMemo(() => {
    const map = new Map<number, string>();
    professionResults.results.forEach((profession) =>
      map.set(profession.id, profession.name_en || profession.name_ar)
    );
    return map;
  }, [professionResults.results]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price_cents: Number(form.price_cents),
        currency: form.currency,
        product_type: form.product_type,
        stock: Number(form.stock),
        category: form.category === "" ? null : form.category,
        profession: form.profession === "" ? null : form.profession,
        version: form.version || undefined,
        size_mb: form.size_mb ? Number(form.size_mb) : undefined,
        supported_os: form.supported_os
          ? form.supported_os.split(",").map((item) => item.trim()).filter(Boolean)
          : undefined,
      };
      if (editing) {
        return updateProduct(tokens?.accessToken || "", editing.id, payload);
      }
      return createProduct(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      pushToast({ message: t(editing ? "catalog.products.updated" : "catalog.products.created"), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setForm({
        name: "",
        description: "",
        price_cents: 0,
        currency: "USD",
        product_type: "digital_key",
        stock: 0,
        category: "",
        profession: "",
        version: "",
        size_mb: "",
        supported_os: "",
      });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(tokens?.accessToken || "", productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      pushToast({ message: t("catalog.products.deleted"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolved.results.map((product) => ({
    id: product.id,
    exportData: {
      name: product.name,
      type: product.product_type,
      approval: product.approval_status,
      price_cents: product.price_cents,
      currency: product.currency,
      stock: product.stock,
      created: product.created_at,
    },
    name: product.name,
    type: <Chip size="small" label={product.product_type} />,
    approval: <Chip size="small" label={product.approval_status} />,
    price: `${(product.price_cents / 100).toLocaleString()} ${product.currency}`,
    stock: product.stock,
    category: product.category ? categoryMap.get(product.category) || product.category : "-",
    profession: product.profession ? professionMap.get(product.profession) || product.profession : "-",
    created: product.created_at ? new Date(product.created_at).toLocaleString() : "-",
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["catalog_product.update"]}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setEditing(product);
              setForm({
                name: product.name,
                description: product.description || "",
                price_cents: product.price_cents,
                currency: product.currency,
                product_type: product.product_type,
                stock: product.stock,
                category: product.category ?? "",
                profession: product.profession ?? "",
                version: product.version || "",
                size_mb: product.size_mb?.toString() || "",
                supported_os: Array.isArray(product.supported_os)
                  ? product.supported_os.join(", ")
                  : "",
              });
              setDialogOpen(true);
            }}
          >
            {t("action.edit")}
          </Button>
        </PermissionGate>
        <PermissionGate permissions={["catalog_product.delete"]}>
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => deleteMutation.mutate(product.id)}
          >
            {t("action.delete")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "name", label: t("catalog.products.column.name") },
    { key: "type", label: t("catalog.products.column.type") },
    { key: "approval", label: t("catalog.products.column.approval") },
    { key: "price", label: t("catalog.products.column.price") },
    { key: "stock", label: t("catalog.products.column.stock") },
    { key: "category", label: t("catalog.products.column.category") },
    { key: "profession", label: t("catalog.products.column.profession") },
    { key: "created", label: t("table.column.created") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["catalog_product.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("catalog.products.title")}
          subtitle={t("catalog.products.subtitle")}
          actions={
            <PermissionGate permissions={["catalog_product.create"]}>
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    name: "",
                    description: "",
                    price_cents: 0,
                    currency: "USD",
                    product_type: "digital_key",
                    stock: 0,
                    category: "",
                    profession: "",
                    version: "",
                    size_mb: "",
                    supported_os: "",
                  });
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
            storageKey: "catalog.products",
            getState: () => ({ search, approvalStatus, productType, vendorId }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setApprovalStatus(String(state.approvalStatus || ""));
              setProductType(String(state.productType || ""));
              setVendorId(String(state.vendorId || ""));
              setPage(0);
            },
            defaultState: { search: "", approvalStatus: "", productType: "", vendorId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("catalog.products.filter.approval")}
                  value={approvalStatus}
                  onChange={(event) => setApprovalStatus(event.target.value)}
                  size="small"
                >
                  {approvalOptions.map((option) => (
                    <MenuItem key={option || "all"} value={option}>
                      {option || t("label.all")}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t("catalog.products.filter.type")}
                  value={productType}
                  onChange={(event) => setProductType(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  {productTypes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={t("catalog.products.filter.vendor")}
                  value={vendorId}
                  onChange={(event) => setVendorId(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setApprovalStatus("");
              setProductType("");
              setVendorId("");
            },
          }}
        >
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
          totalCount={resolved.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="catalog_products.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          {editing ? t("catalog.products.edit") : t("catalog.products.new")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("catalog.products.column.name")}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <TextField
              label={t("catalog.products.column.description")}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              multiline
              minRows={3}
            />
            {form.product_type === "software" && (
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label={t("catalog.products.column.version", { defaultValue: "Version" })}
                    value={form.version}
                    onChange={(event) => setForm({ ...form, version: event.target.value })}
                  />
                  <TextField
                    label={t("catalog.products.column.size_mb", { defaultValue: "Size (MB)" })}
                    type="number"
                    value={form.size_mb}
                    onChange={(event) => setForm({ ...form, size_mb: event.target.value })}
                  />
                </Stack>
                <TextField
                  label={t("catalog.products.column.supported_os", { defaultValue: "Supported OS (comma separated)" })}
                  value={form.supported_os}
                  onChange={(event) => setForm({ ...form, supported_os: event.target.value })}
                />
              </Stack>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("catalog.products.column.price_cents")}
                type="number"
                value={form.price_cents}
                onChange={(event) => setForm({ ...form, price_cents: Number(event.target.value) })}
              />
              <TextField
                label={t("catalog.products.column.stock")}
                type="number"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })}
              />
              <TextField
                label={t("catalog.products.column.currency")}
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label={t("catalog.products.column.type")}
                value={form.product_type}
                onChange={(event) => setForm({ ...form, product_type: event.target.value })}
              >
                {productTypes.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t("catalog.products.column.category")}
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value as number | "" })
                }
              >
                <MenuItem value="">{t("label.none")}</MenuItem>
                {categoryResults.results.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t("catalog.products.column.profession")}
                value={form.profession}
                onChange={(event) =>
                  setForm({ ...form, profession: event.target.value as number | "" })
                }
              >
                <MenuItem value="">{t("label.none")}</MenuItem>
                {professionResults.results.map((profession) => (
                  <MenuItem key={profession.id} value={profession.id}>
                    {profession.name_en || profession.name_ar}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!form.name || !form.price_cents || !form.currency}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
