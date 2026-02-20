import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
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
import { createFeatureFlag, listFeatureFlags, updateFeatureFlag } from "../api";

const roleOptions = ["customer", "vendor", "provider", "admin", "superadmin", "support_agent", "technician", "ops"];

export const FeatureFlagsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [enabled, setEnabled] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rollout, setRollout] = useState(100);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      is_enabled: enabled || undefined,
      ordering: "key",
    }),
    [page, rowsPerPage, search, enabled]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["feature-flags", queryParams, tokens?.accessToken],
    queryFn: () => listFeatureFlags(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createFeatureFlag(tokens?.accessToken || "", {
        key: keyValue,
        name,
        description: description || undefined,
        is_enabled: false,
        rollout_percentage: rollout,
        target_roles: targetRoles,
      }),
    onSuccess: () => {
      pushToast({ message: t("feature_flags.created"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      setDialogOpen(false);
      setKeyValue("");
      setName("");
      setDescription("");
      setRollout(100);
      setTargetRoles([]);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const toggleMutation = useMutation({
    mutationFn: (payload: { id: number; is_enabled: boolean }) =>
      updateFeatureFlag(tokens?.accessToken || "", payload.id, { is_enabled: payload.is_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      pushToast({ message: t("feature_flags.updated"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (data?.results || []).map((flag) => ({
    id: flag.id,
    exportData: {
      key: flag.key,
      name: flag.name,
      rollout: flag.rollout_percentage,
      roles: (flag.target_roles || []).join(", "),
      enabled: flag.is_enabled ? "true" : "false",
    },
    key: flag.key,
    name: flag.name,
    rollout: `${flag.rollout_percentage}%`,
    roles: (flag.target_roles || []).length ? (
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {flag.target_roles.map((role) => (
          <Chip key={role} size="small" label={role} />
        ))}
      </Stack>
    ) : (
      "-"
    ),
    enabled: (
      <PermissionGate permissions={["feature_flag.update"]}>
        <FormControlLabel
          control={
            <Switch
              checked={flag.is_enabled}
              onChange={(event) => toggleMutation.mutate({ id: flag.id, is_enabled: event.target.checked })}
            />
          }
          label={flag.is_enabled ? t("label.active") : t("label.inactive")}
        />
      </PermissionGate>
    ),
  }));

  const columns = [
    { key: "key", label: t("feature_flags.column.key") },
    { key: "name", label: t("feature_flags.column.name") },
    { key: "rollout", label: t("feature_flags.column.rollout") },
    { key: "roles", label: t("feature_flags.column.roles") },
    { key: "enabled", label: t("feature_flags.column.enabled") },
  ];

  return (
    <PermissionGate permissions={["feature_flag.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("feature_flags.title")}
          subtitle={t("feature_flags.subtitle")}
          actions={
            <PermissionGate permissions={["feature_flag.create"]}>
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                {t("action.create")}
              </Button>
            </PermissionGate>
          }
        />
        <FilterBar
          savedViews={{
            storageKey: "configuration.feature_flags",
            getState: () => ({ search, enabled }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setEnabled(String(state.enabled || ""));
              setPage(0);
            },
            defaultState: { search: "", enabled: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("label.status")}
                  value={enabled}
                  onChange={(event) => setEnabled(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="true">{t("label.active")}</MenuItem>
                  <MenuItem value="false">{t("label.inactive")}</MenuItem>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setEnabled(""),
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
          exportFilename="feature_flags.csv"
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
        <DialogTitle>{t("feature_flags.new")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("feature_flags.column.key")}
              value={keyValue}
              onChange={(event) => setKeyValue(event.target.value)}
            />
            <TextField
              label={t("feature_flags.column.name")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <TextField
              label={t("feature_flags.description")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
            />
            <TextField
              label={t("feature_flags.column.rollout")}
              type="number"
              value={rollout}
              onChange={(event) => setRollout(Number(event.target.value))}
            />
            <TextField
              select
              label={t("feature_flags.column.roles")}
              SelectProps={{ multiple: true }}
              value={targetRoles}
              onChange={(event) => setTargetRoles(event.target.value as string[])}
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {t(`role.${role}`) || role}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={!keyValue || !name}
          >
            {t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
