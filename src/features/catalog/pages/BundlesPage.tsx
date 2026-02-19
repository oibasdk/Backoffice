import React, { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { createBundle, deleteBundle, listBundles, updateBundle, type Bundle } from "../api";

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

export const BundlesPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_cents: 0,
    currency: "USD",
  });

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      ordering: "name",
    }),
    [page, rowsPerPage, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog-bundles", queryParams, tokens?.accessToken],
    queryFn: () => listBundles(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<Bundle>(data);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price_cents: Number(form.price_cents),
        currency: form.currency,
      };
      if (editing) {
        return updateBundle(tokens?.accessToken || "", editing.id, payload);
      }
      return createBundle(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-bundles"] });
      pushToast({ message: t(editing ? "catalog.bundles.updated" : "catalog.bundles.created"), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setForm({ name: "", description: "", price_cents: 0, currency: "USD" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (bundleId: string) => deleteBundle(tokens?.accessToken || "", bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-bundles"] });
      pushToast({ message: t("catalog.bundles.deleted"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolved.results.map((bundle) => ({
    id: bundle.id,
    exportData: {
      name: bundle.name,
      price_cents: bundle.price_cents,
      currency: bundle.currency,
      items: bundle.items?.length || 0,
    },
    name: bundle.name,
    price: `${(bundle.price_cents / 100).toLocaleString()} ${bundle.currency}`,
    items: bundle.items?.length || 0,
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["catalog_bundle.update"]}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setEditing(bundle);
              setForm({
                name: bundle.name,
                description: bundle.description || "",
                price_cents: bundle.price_cents,
                currency: bundle.currency,
              });
              setDialogOpen(true);
            }}
          >
            {t("action.edit")}
          </Button>
        </PermissionGate>
        <PermissionGate permissions={["catalog_bundle.delete"]}>
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => deleteMutation.mutate(bundle.id)}
          >
            {t("action.delete")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "name", label: t("catalog.bundles.column.name") },
    { key: "price", label: t("catalog.bundles.column.price") },
    { key: "items", label: t("catalog.bundles.column.items") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["catalog_bundle.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("catalog.bundles.title")}
          subtitle={t("catalog.bundles.subtitle")}
          actions={
            <PermissionGate permissions={["catalog_bundle.create"]}>
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setForm({ name: "", description: "", price_cents: 0, currency: "USD" });
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
            storageKey: "catalog.bundles",
            getState: () => ({ search }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { search: "" },
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
          exportFilename="catalog_bundles.csv"
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
          {editing ? t("catalog.bundles.edit") : t("catalog.bundles.new")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("catalog.bundles.column.name")}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <TextField
              label={t("catalog.bundles.column.description")}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              multiline
              minRows={3}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("catalog.bundles.column.price_cents")}
                type="number"
                value={form.price_cents}
                onChange={(event) => setForm({ ...form, price_cents: Number(event.target.value) })}
              />
              <TextField
                label={t("catalog.bundles.column.currency")}
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
              />
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
