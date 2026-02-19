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
import {
  grantUserPermission,
  listPermissions,
  listUserPermissions,
  revokeUserPermission,
} from "../api";

export const UserPermissionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [permissionId, setPermissionId] = useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      ordering: "-granted_at",
    }),
    [page, rowsPerPage, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-permissions", queryParams, tokens?.accessToken],
    queryFn: () => listUserPermissions(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: permissions } = useQuery({
    queryKey: ["permissions", tokens?.accessToken],
    queryFn: () => listPermissions(tokens?.accessToken || "", { page_size: 200 }),
    enabled: Boolean(tokens?.accessToken),
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      grantUserPermission(tokens?.accessToken || "", {
        user: Number(userId),
        permission: Number(permissionId),
        expires_at: expiresAt || undefined,
      }),
    onSuccess: () => {
      pushToast({ message: t("iam.permissions.granted"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
      setDialogOpen(false);
      setUserId("");
      setPermissionId("");
      setExpiresAt("");
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const revokeMutation = useMutation({
    mutationFn: (permissionId: number) => revokeUserPermission(tokens?.accessToken || "", permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
      pushToast({ message: t("iam.permissions.revoked"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (data?.results || []).map((permission) => ({
    id: permission.id,
    exportData: {
      user: permission.user_email || permission.user,
      permission: permission.permission_details?.name || permission.permission,
      granted_at: permission.granted_at || "",
      expires_at: permission.expires_at || "",
    },
    user: permission.user_email || permission.user,
    permission: permission.permission_details?.name || permission.permission,
    granted_at: permission.granted_at ? new Date(permission.granted_at).toLocaleString() : "-",
    expires_at: permission.expires_at ? new Date(permission.expires_at).toLocaleString() : "-",
    actions: (
      <PermissionGate permissions={["user_permission.delete"]}>
        <Button
          size="small"
          variant="text"
          color="error"
          onClick={(event) => {
            event.stopPropagation();
            revokeMutation.mutate(permission.id);
          }}
        >
          {t("action.remove")}
        </Button>
      </PermissionGate>
    ),
  }));

  const columns = [
    { key: "user", label: t("label.user") },
    { key: "permission", label: t("iam.permissions.permission") },
    { key: "granted_at", label: t("iam.permissions.granted_at") },
    { key: "expires_at", label: t("iam.permissions.expires_at") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["user_permission.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("iam.permissions.user_title")}
          subtitle={t("iam.permissions.user_subtitle")}
          actions={
            <PermissionGate permissions={["user_permission.create"]}>
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                {t("action.create")}
              </Button>
            </PermissionGate>
          }
        />
        <FilterBar
          savedViews={{
            storageKey: "iam.user_permissions",
            getState: () => ({ search }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { search: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Typography variant="caption" color="text.secondary">
                {t("iam.permissions.search_hint")}
              </Typography>
            ),
            onApply: () => setPage(0),
            onReset: () => {},
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
          exportFilename="user_permissions.csv"
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
        <DialogTitle>{t("iam.permissions.grant_title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("iam.permissions.user_id")}
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
            <TextField
              select
              label={t("iam.permissions.permission")}
              value={permissionId}
              onChange={(event) => setPermissionId(event.target.value as number | "")}
            >
              <MenuItem value="">{t("label.select")}</MenuItem>
              {(permissions?.results || []).map((perm) => (
                <MenuItem key={perm.id} value={perm.id}>
                  {perm.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("iam.permissions.expires_at")}
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => grantMutation.mutate()}
            disabled={!userId || !permissionId}
          >
            {t("action.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
