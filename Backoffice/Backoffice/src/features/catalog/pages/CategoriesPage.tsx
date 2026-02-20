import React, { useMemo, useState } from "react";
import {
  Button,
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
import { createCategory, deleteCategory, listCategories, updateCategory, type Category } from "../api";

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

export const CategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      ordering: "name",
      search: search || undefined,
    }),
    [page, rowsPerPage, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog-categories", queryParams, tokens?.accessToken],
    queryFn: () => listCategories(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<Category>(data);
  const categoryOptions = resolved.results.filter((option) => option.id !== editing?.id);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        parent: parentId === "" ? null : parentId,
      };
      if (editing) {
        return updateCategory(tokens?.accessToken || "", editing.id, payload);
      }
      return createCategory(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-categories"] });
      pushToast({ message: t(editing ? "catalog.categories.updated" : "catalog.categories.created"), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setName("");
      setParentId("");
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: number) => deleteCategory(tokens?.accessToken || "", categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-categories"] });
      pushToast({ message: t("catalog.categories.deleted"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolved.results.map((category) => ({
    id: category.id,
    exportData: {
      name: category.name,
      parent: category.parent || "",
    },
    name: category.name,
    parent: category.parent || "-",
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["catalog_category.update"]}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setEditing(category);
              setName(category.name);
              setParentId(category.parent ?? "");
              setDialogOpen(true);
            }}
          >
            {t("action.edit")}
          </Button>
        </PermissionGate>
        <PermissionGate permissions={["catalog_category.delete"]}>
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => deleteMutation.mutate(category.id)}
          >
            {t("action.delete")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "name", label: t("catalog.categories.column.name") },
    { key: "parent", label: t("catalog.categories.column.parent") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["catalog_category.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("catalog.categories.title")}
          subtitle={t("catalog.categories.subtitle")}
          actions={
            <PermissionGate permissions={["catalog_category.create"]}>
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setName("");
                  setParentId("");
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
            storageKey: "catalog.categories",
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
          exportFilename="catalog_categories.csv"
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
          {editing ? t("catalog.categories.edit") : t("catalog.categories.new")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("catalog.categories.column.name")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <TextField
              select
              label={t("catalog.categories.column.parent")}
              value={parentId}
              onChange={(event) => setParentId(event.target.value as number | "")}
            >
              <MenuItem value="">{t("label.none")}</MenuItem>
              {categoryOptions.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!name}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
