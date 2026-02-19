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
import { activateConfigVersion, createConfigVersion, listConfigVersions } from "../api";

export const ConfigVersionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      status: status || undefined,
      ordering: "-version",
    }),
    [page, rowsPerPage, search, status]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["config-versions", queryParams, tokens?.accessToken],
    queryFn: () => listConfigVersions(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createConfigVersion(tokens?.accessToken || "", {
        name,
        description: description || undefined,
        status: "draft",
      }),
    onSuccess: () => {
      pushToast({ message: t("config_versions.created"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["config-versions"] });
      setDialogOpen(false);
      setName("");
      setDescription("");
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => activateConfigVersion(tokens?.accessToken || "", id),
    onSuccess: () => {
      pushToast({ message: t("config_versions.activated"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["config-versions"] });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (data?.results || []).map((version) => ({
    id: version.id,
    exportData: {
      version: version.version,
      name: version.name,
      status: version.status,
      created: version.created_at,
      activated: version.activated_at || "",
    },
    version: `v${version.version}`,
    name: version.name,
    status: (
      <Chip
        size="small"
        label={version.status}
        color={version.status === "active" ? "success" : "default"}
      />
    ),
    created: new Date(version.created_at).toLocaleString(),
    activated: version.activated_at ? new Date(version.activated_at).toLocaleString() : "-",
    actions: (
      <PermissionGate permissions={["app_config_version.update"]}>
        <Button
          size="small"
          variant="outlined"
          disabled={version.status === "active"}
          onClick={() => activateMutation.mutate(version.id)}
        >
          {t("action.activate")}
        </Button>
      </PermissionGate>
    ),
  }));

  const columns = [
    { key: "version", label: t("config_versions.column.version") },
    { key: "name", label: t("config_versions.column.name") },
    { key: "status", label: t("label.status") },
    { key: "created", label: t("table.column.created") },
    { key: "activated", label: t("config_versions.column.activated") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["app_config_version.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("config_versions.title")}
          subtitle={t("config_versions.subtitle")}
          actions={
            <PermissionGate permissions={["app_config_version.create"]}>
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                {t("action.create")}
              </Button>
            </PermissionGate>
          }
        />
        <FilterBar
          savedViews={{
            storageKey: "configuration.versions",
            getState: () => ({ search, status }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setStatus(String(state.status || ""));
              setPage(0);
            },
            defaultState: { search: "", status: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("label.status")}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="draft">draft</MenuItem>
                  <MenuItem value="active">active</MenuItem>
                  <MenuItem value="archived">archived</MenuItem>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setStatus(""),
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
          totalCount={data?.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="config_versions.csv"
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
        <DialogTitle>{t("config_versions.new")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("config_versions.column.name")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <TextField
              label={t("config_versions.description")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={!name}>
            {t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
