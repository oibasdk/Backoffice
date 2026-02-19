import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
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
  createAppSetting,
  deleteAppSetting,
  listAppSettings,
  updateAppSetting,
  type AppSetting,
} from "../api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

const valueTypes = ["string", "number", "boolean", "json"] as const;

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

const parseValue = (raw: string, type: AppSetting["value_type"]) => {
  if (type === "number") {
    return Number(raw);
  }
  if (type === "boolean") {
    return raw === "true";
  }
  if (type === "json") {
    if (!raw.trim()) {
      return {};
    }
    return JSON.parse(raw);
  }
  return raw;
};

export const AppSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [isPublic, setIsPublic] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppSetting | null>(null);
  const [navDialogOpen, setNavDialogOpen] = useState(false);
  const [form, setForm] = useState({
    key: "",
    description: "",
    value: "",
    value_type: "string" as AppSetting["value_type"],
    group: "",
    is_public: false,
  });
  const [navForm, setNavForm] = useState({
    order: "",
    hidden: "",
    labels: "{}",
    icons: "{}",
    items: "[]",
  });

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      group: group || undefined,
      is_public: isPublic || undefined,
      ordering: "key",
    }),
    [page, rowsPerPage, search, group, isPublic]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["app-settings", queryParams, tokens?.accessToken],
    queryFn: () => listAppSettings(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });
  const totalCount = data?.count ?? 0;
  const publicCount = (data?.results || []).filter((setting) => setting.is_public).length;
  const groupsCount = new Set((data?.results || []).map((setting) => setting.group).filter(Boolean)).size;
  const lastUpdated = data?.results?.[0]?.updated_at
    ? new Date(data.results[0].updated_at).toLocaleString()
    : "-";

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        key: form.key,
        description: form.description || undefined,
        value: parseValue(form.value, form.value_type),
        value_type: form.value_type,
        group: form.group || undefined,
        is_public: form.is_public,
      };
      if (editing) {
        return updateAppSetting(tokens?.accessToken || "", editing.id, payload);
      }
      return createAppSetting(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      pushToast({ message: t(editing ? "app_settings.updated" : "app_settings.created"), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setForm({
        key: "",
        description: "",
        value: "",
        value_type: "string",
        group: "",
        is_public: false,
      });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (settingId: number) => deleteAppSetting(tokens?.accessToken || "", settingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      pushToast({ message: t("app_settings.deleted"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const navKeys = ["ui.nav.order", "ui.nav.hidden", "ui.nav.labels", "ui.nav.icons", "ui.nav.items"];
  const navSettingsMap = useMemo(() => {
    const map = new Map<string, AppSetting>();
    (data?.results || []).forEach((setting) => {
      if (navKeys.includes(setting.key)) {
        map.set(setting.key, setting);
      }
    });
    return map;
  }, [data?.results]);

  const openNavDialog = () => {
    const orderSetting = navSettingsMap.get("ui.nav.order");
    const hiddenSetting = navSettingsMap.get("ui.nav.hidden");
    const labelsSetting = navSettingsMap.get("ui.nav.labels");
    const iconsSetting = navSettingsMap.get("ui.nav.icons");
    const itemsSetting = navSettingsMap.get("ui.nav.items");
    setNavForm({
      order: stringifyValue(orderSetting?.value || []),
      hidden: stringifyValue(hiddenSetting?.value || []),
      labels: stringifyValue(labelsSetting?.value || {}),
      icons: stringifyValue(iconsSetting?.value || {}),
      items: stringifyValue(itemsSetting?.value || []),
    });
    setNavDialogOpen(true);
  };

  const saveNavSettings = async () => {
    try {
      const payloads = [
        { key: "ui.nav.order", value: JSON.parse(navForm.order || "[]") },
        { key: "ui.nav.hidden", value: JSON.parse(navForm.hidden || "[]") },
        { key: "ui.nav.labels", value: JSON.parse(navForm.labels || "{}") },
        { key: "ui.nav.icons", value: JSON.parse(navForm.icons || "{}") },
        { key: "ui.nav.items", value: JSON.parse(navForm.items || "[]") },
      ];
      await Promise.all(
        payloads.map((entry) => {
          const existing = navSettingsMap.get(entry.key);
          if (existing) {
            return updateAppSetting(tokens?.accessToken || "", existing.id, {
              value: entry.value,
              value_type: "json",
              key: existing.key,
              is_public: existing.is_public,
              group: existing.group,
            });
          }
          return createAppSetting(tokens?.accessToken || "", {
            key: entry.key,
            value: entry.value,
            value_type: "json",
            is_public: true,
            group: "navigation",
          });
        })
      );
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      pushToast({ message: t("app_settings.nav_saved"), severity: "success" });
      setNavDialogOpen(false);
    } catch {
      pushToast({ message: t("app_settings.invalid_json"), severity: "error" });
    }
  };

  const rows = (data?.results || []).map((setting) => ({
    id: setting.id,
    exportData: {
      key: setting.key,
      group: setting.group || "",
      type: setting.value_type,
      public: setting.is_public ? "true" : "false",
      updated: setting.updated_at,
    },
    key: setting.key,
    group: setting.group || "-",
    type: setting.value_type,
    public: (
      <Chip
        size="small"
        label={setting.is_public ? t("label.public") : t("label.private")}
        color={setting.is_public ? "success" : "default"}
      />
    ),
    updated: setting.updated_at ? new Date(setting.updated_at).toLocaleString() : "-",
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["app_setting.update"]}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setEditing(setting);
              setForm({
                key: setting.key,
                description: setting.description || "",
                value: stringifyValue(setting.value),
                value_type: setting.value_type,
                group: setting.group || "",
                is_public: setting.is_public,
              });
              setDialogOpen(true);
            }}
          >
            {t("action.edit")}
          </Button>
        </PermissionGate>
        <PermissionGate permissions={["app_setting.delete"]}>
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => deleteMutation.mutate(setting.id)}
          >
            {t("action.delete")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "key", label: t("app_settings.column.key") },
    { key: "group", label: t("app_settings.column.group") },
    { key: "type", label: t("app_settings.column.type") },
    { key: "public", label: t("app_settings.column.public") },
    { key: "updated", label: t("table.column.updated") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["app_setting.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("app_settings.title")}
          subtitle={t("app_settings.subtitle")}
          actions={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <PermissionGate permissions={["app_setting.update"]}>
                <Button variant="outlined" onClick={openNavDialog}>
                  {t("app_settings.nav_control")}
                </Button>
              </PermissionGate>
              <PermissionGate permissions={["app_setting.create"]}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setEditing(null);
                    setForm({
                      key: "",
                      description: "",
                      value: "",
                      value_type: "string",
                      group: "",
                      is_public: false,
                    });
                    setDialogOpen(true);
                  }}
                >
                  {t("action.create")}
                </Button>
              </PermissionGate>
            </Stack>
          }
        />
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
              {t("app_settings.context", { defaultValue: "Configuration Hub" })}
            </Typography>
            <Typography variant="h1">{t("app_settings.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("app_settings.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("app_settings.snapshot.total", { defaultValue: "Total" })}: ${totalCount}`} />
              <Chip size="small" label={`${t("app_settings.snapshot.public", { defaultValue: "Public" })}: ${publicCount}`} />
              <Chip size="small" label={`${t("app_settings.snapshot.groups", { defaultValue: "Groups" })}: ${groupsCount}`} />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("app_settings.snapshot.total", { defaultValue: "Total Settings" })} value={totalCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("app_settings.snapshot.public", { defaultValue: "Public Settings" })} value={publicCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("app_settings.snapshot.groups", { defaultValue: "Groups" })} value={groupsCount || "-"} loading={isLoading} />
          </Grid>
        </Grid>
        <FilterBar
          savedViews={{
            storageKey: "configuration.app_settings",
            getState: () => ({ search, group, isPublic }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setGroup(String(state.group || ""));
              setIsPublic(String(state.isPublic || ""));
              setPage(0);
            },
            defaultState: { search: "", group: "", isPublic: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("app_settings.column.group")}
                  value={group}
                  onChange={(event) => setGroup(event.target.value)}
                  size="small"
                />
                <TextField
                  select
                  label={t("app_settings.column.public")}
                  value={isPublic}
                  onChange={(event) => setIsPublic(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="true">{t("label.public")}</MenuItem>
                  <MenuItem value="false">{t("label.private")}</MenuItem>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setGroup("");
              setIsPublic("");
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
          totalCount={data?.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="app_settings.csv"
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
        <DialogTitle>{editing ? t("app_settings.edit") : t("app_settings.new")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("app_settings.column.key")}
              value={form.key}
              onChange={(event) => setForm({ ...form, key: event.target.value })}
              disabled={Boolean(editing)}
            />
            <TextField
              label={t("app_settings.description")}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              multiline
              minRows={2}
            />
            <TextField
              select
              label={t("app_settings.column.type")}
              value={form.value_type}
              onChange={(event) =>
                setForm({ ...form, value_type: event.target.value as AppSetting["value_type"] })
              }
            >
              {valueTypes.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("app_settings.column.value")}
              value={form.value}
              onChange={(event) => setForm({ ...form, value: event.target.value })}
              multiline={form.value_type === "json"}
              minRows={form.value_type === "json" ? 6 : 1}
            />
            <TextField
              label={t("app_settings.column.group")}
              value={form.group}
              onChange={(event) => setForm({ ...form, group: event.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_public}
                  onChange={(event) => setForm({ ...form, is_public: event.target.checked })}
                />
              }
              label={t("app_settings.column.public")}
            />
            <Typography variant="caption" color="text.secondary">
              {t("app_settings.value_hint")}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!form.key || !form.value_type}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={navDialogOpen} onClose={() => setNavDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{t("app_settings.nav_control")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("app_settings.nav.order")}
              value={navForm.order}
              onChange={(event) => setNavForm({ ...navForm, order: event.target.value })}
            />
            <TextField
              label={t("app_settings.nav.hidden")}
              value={navForm.hidden}
              onChange={(event) => setNavForm({ ...navForm, hidden: event.target.value })}
            />
            <TextField
              label={t("app_settings.nav.labels")}
              value={navForm.labels}
              onChange={(event) => setNavForm({ ...navForm, labels: event.target.value })}
              multiline
              minRows={4}
            />
            <TextField
              label={t("app_settings.nav.icons")}
              value={navForm.icons}
              onChange={(event) => setNavForm({ ...navForm, icons: event.target.value })}
              multiline
              minRows={4}
            />
            <TextField
              label={t("app_settings.nav.items")}
              value={navForm.items}
              onChange={(event) => setNavForm({ ...navForm, items: event.target.value })}
              multiline
              minRows={4}
            />
            <Typography variant="caption" color="text.secondary">
              {t("app_settings.nav_hint")}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNavDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button variant="contained" onClick={saveNavSettings}>
            {t("action.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
