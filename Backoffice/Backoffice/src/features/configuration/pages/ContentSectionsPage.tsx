import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";
import {
  createContentSection,
  deleteContentSection,
  listConfigVersions,
  listContentSections,
  updateContentSection,
  type AppConfigVersion,
  type ContentSection,
} from "../api";

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toDateTimeLocal = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const buildVisibilityLabel = (section: ContentSection) => {
  const rollout = typeof section.rollout_percentage === "number" ? `${section.rollout_percentage}%` : "-";
  const variant = section.variant_key ? section.variant_key : "-";
  return `${rollout} · ${variant}`;
};

const buildTargetingSummary = (section: ContentSection, t: (key: string) => string) => {
  const items = [
    section.target_roles?.length ? `roles:${section.target_roles.length}` : null,
    section.target_locales?.length ? `locales:${section.target_locales.length}` : null,
    section.target_countries?.length ? `countries:${section.target_countries.length}` : null,
    section.target_segments?.length ? `segments:${section.target_segments.length}` : null,
    section.target_tags?.length ? `tags:${section.target_tags.length}` : null,
  ].filter(Boolean) as string[];
  const schedule =
    section.starts_at || section.ends_at
      ? `${section.starts_at ? new Date(section.starts_at).toLocaleDateString() : "-"} → ${
          section.ends_at ? new Date(section.ends_at).toLocaleDateString() : "-"
        }`
      : t("content_visibility.schedule_always");
  return {
    targets: items.length ? items.join(" · ") : t("content_visibility.targets_all"),
    schedule,
  };
};

export const ContentSectionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [screen, setScreen] = useState("");
  const [sectionType, setSectionType] = useState("");
  const [isVisible, setIsVisible] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentSection | null>(null);
  const [form, setForm] = useState({
    config_version: "",
    key: "",
    screen: "",
    title: "",
    subtitle: "",
    description: "",
    section_type: "info",
    payload: "{}",
    sort_order: 0,
    is_visible: true,
    variant_key: "",
    rollout_percentage: 100,
    target_roles: "",
    target_locales: "",
    target_countries: "",
    target_segments: "",
    target_tags: "",
    starts_at: "",
    ends_at: "",
  });

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      screen: screen || undefined,
      section_type: sectionType || undefined,
      is_visible: isVisible || undefined,
      ordering: "sort_order",
    }),
    [page, rowsPerPage, search, screen, sectionType, isVisible]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-sections", queryParams, tokens?.accessToken],
    queryFn: () => listContentSections(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });
  const sections = data?.results || [];
  const visibleCount = sections.filter((section) => section.is_visible).length;
  const hiddenCount = sections.length - visibleCount;
  const screensCount = new Set(sections.map((section) => section.screen).filter(Boolean)).size;
  const lastUpdated = sections[0]?.updated_at ? new Date(sections[0].updated_at).toLocaleString() : "-";

  const { data: versions } = useQuery({
    queryKey: ["config-versions", tokens?.accessToken],
    queryFn: () => listConfigVersions(tokens?.accessToken || "", { page_size: 50 }),
    enabled: Boolean(tokens?.accessToken),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        config_version: Number(form.config_version),
        key: form.key,
        screen: form.screen || undefined,
        title: form.title || undefined,
        subtitle: form.subtitle || undefined,
        description: form.description || undefined,
        section_type: form.section_type,
        payload: form.payload ? JSON.parse(form.payload) : {},
        sort_order: Number(form.sort_order),
        is_visible: form.is_visible,
        variant_key: form.variant_key || undefined,
        rollout_percentage: Number(form.rollout_percentage),
        target_roles: parseList(form.target_roles),
        target_locales: parseList(form.target_locales),
        target_countries: parseList(form.target_countries),
        target_segments: parseList(form.target_segments),
        target_tags: parseList(form.target_tags),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      if (editing) {
        return updateContentSection(tokens?.accessToken || "", editing.id, payload);
      }
      return createContentSection(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
      pushToast({ message: t(editing ? "content_sections.updated" : "content_sections.created"), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setForm({
        config_version: "",
        key: "",
        screen: "",
        title: "",
        subtitle: "",
        description: "",
        section_type: "info",
        payload: "{}",
        sort_order: 0,
        is_visible: true,
        variant_key: "",
        rollout_percentage: 100,
        target_roles: "",
        target_locales: "",
        target_countries: "",
        target_segments: "",
        target_tags: "",
        starts_at: "",
        ends_at: "",
      });
    },
    onError: () => pushToast({ message: t("content_sections.invalid_payload"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (sectionId: number) => deleteContentSection(tokens?.accessToken || "", sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
      pushToast({ message: t("content_sections.deleted"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (data?.results || []).map((section) => {
    const visibility = buildVisibilityLabel(section);
    const targeting = buildTargetingSummary(section, t);
    return {
    id: section.id,
    exportData: {
      key: section.key,
      screen: section.screen || "",
      type: section.section_type,
      order: section.sort_order,
      visible: section.is_visible ? "true" : "false",
    },
    key: section.key,
    screen: section.screen || "-",
    type: section.section_type,
    order: section.sort_order,
    status: (
      <Chip
        size="small"
        label={section.is_visible ? t("label.active") : t("label.inactive")}
        color={section.is_visible ? "success" : "default"}
      />
    ),
    visibility: (
      <Stack spacing={0.5}>
        <Typography variant="caption">{visibility}</Typography>
        <Typography variant="caption" color="text.secondary">
          {targeting.targets}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {targeting.schedule}
        </Typography>
      </Stack>
    ),
    updated: section.updated_at ? new Date(section.updated_at).toLocaleString() : "-",
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["content_section.update"]}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setEditing(section);
              setForm({
                config_version: String(section.config_version),
                key: section.key,
                screen: section.screen || "",
                title: section.title || "",
                subtitle: section.subtitle || "",
                description: section.description || "",
                section_type: section.section_type,
                payload: JSON.stringify(section.payload || {}, null, 2),
                sort_order: section.sort_order,
                is_visible: section.is_visible,
                variant_key: section.variant_key || "",
                rollout_percentage: section.rollout_percentage ?? 100,
                target_roles: (section.target_roles || []).join(", "),
                target_locales: (section.target_locales || []).join(", "),
                target_countries: (section.target_countries || []).join(", "),
                target_segments: (section.target_segments || []).join(", "),
                target_tags: (section.target_tags || []).join(", "),
                starts_at: toDateTimeLocal(section.starts_at),
                ends_at: toDateTimeLocal(section.ends_at),
              });
              setDialogOpen(true);
            }}
          >
            {t("action.edit")}
          </Button>
        </PermissionGate>
        <PermissionGate permissions={["content_section.delete"]}>
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => deleteMutation.mutate(section.id)}
          >
            {t("action.delete")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  };
  });

  const columns = [
    { key: "key", label: t("content_sections.column.key") },
    { key: "screen", label: t("content_sections.column.screen") },
    { key: "type", label: t("content_sections.column.type") },
    { key: "order", label: t("content_sections.column.order") },
    { key: "status", label: t("label.status") },
    { key: "visibility", label: t("content_visibility.column") },
    { key: "updated", label: t("table.column.updated") },
    { key: "actions", label: t("label.action") },
  ];

  const versionOptions = (versions?.results || []) as AppConfigVersion[];

  return (
    <PermissionGate permissions={["content_section.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("content_sections.title")}
          subtitle={t("content_sections.subtitle")}
          actions={
            <PermissionGate permissions={["content_section.create"]}>
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    config_version: versionOptions[0] ? String(versionOptions[0].id) : "",
                    key: "",
                    screen: "",
                    title: "",
                    subtitle: "",
                    description: "",
                    section_type: "info",
                    payload: "{}",
                    sort_order: 0,
                    is_visible: true,
                    variant_key: "",
                    rollout_percentage: 100,
                    target_roles: "",
                    target_locales: "",
                    target_countries: "",
                    target_segments: "",
                    target_tags: "",
                    starts_at: "",
                    ends_at: "",
                  });
                  setDialogOpen(true);
                }}
              >
                {t("action.create")}
              </Button>
            </PermissionGate>
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
              {t("content_sections.context", { defaultValue: "Content Placement" })}
            </Typography>
            <Typography variant="h1">{t("content_sections.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("content_sections.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("label.active")}: ${visibleCount}`} color="success" />
              <Chip size="small" label={`${t("label.inactive")}: ${hiddenCount}`} />
              <Chip size="small" label={`${t("content_sections.filter.screen")}: ${screensCount}`} />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("content_sections.snapshot.total", { defaultValue: "Total Sections" })} value={data?.count ?? "-"} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("content_sections.snapshot.visible", { defaultValue: "Visible Sections" })} value={visibleCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("content_sections.snapshot.screens", { defaultValue: "Screens" })} value={screensCount || "-"} loading={isLoading} />
          </Grid>
        </Grid>
        <FilterBar
          savedViews={{
            storageKey: "configuration.content_sections",
            getState: () => ({ search, screen, sectionType, isVisible }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setScreen(String(state.screen || ""));
              setSectionType(String(state.sectionType || ""));
              setIsVisible(String(state.isVisible || ""));
              setPage(0);
            },
            defaultState: { search: "", screen: "", sectionType: "", isVisible: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("content_sections.filter.screen")}
                  value={screen}
                  onChange={(event) => setScreen(event.target.value)}
                  size="small"
                />
                <TextField
                  label={t("content_sections.filter.type")}
                  value={sectionType}
                  onChange={(event) => setSectionType(event.target.value)}
                  size="small"
                />
                <TextField
                  select
                  label={t("label.status")}
                  value={isVisible}
                  onChange={(event) => setIsVisible(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="true">{t("label.active")}</MenuItem>
                  <MenuItem value="false">{t("label.inactive")}</MenuItem>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setScreen("");
              setSectionType("");
              setIsVisible("");
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
          exportFilename="content_sections.csv"
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
          {editing ? t("content_sections.edit") : t("content_sections.new")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label={t("content_sections.column.version")}
              value={form.config_version}
              onChange={(event) => setForm({ ...form, config_version: event.target.value })}
            >
              {versionOptions.map((version) => (
                <MenuItem key={version.id} value={version.id}>
                  v{version.version} - {version.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("content_sections.column.key")}
              value={form.key}
              onChange={(event) => setForm({ ...form, key: event.target.value })}
            />
            <TextField
              label={t("content_sections.column.screen")}
              value={form.screen}
              onChange={(event) => setForm({ ...form, screen: event.target.value })}
            />
            <TextField
              label={t("content_sections.column.type")}
              value={form.section_type}
              onChange={(event) => setForm({ ...form, section_type: event.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("content_sections.column.title")}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
              <TextField
                label={t("content_sections.column.subtitle")}
                value={form.subtitle}
                onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
              />
            </Stack>
            <TextField
              label={t("content_sections.column.description")}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              multiline
              minRows={2}
            />
            <TextField
              label={t("content_sections.column.payload")}
              value={form.payload}
              onChange={(event) => setForm({ ...form, payload: event.target.value })}
              multiline
              minRows={6}
            />
            <Divider />
            <Typography variant="subtitle2">{t("content_visibility.title")}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("content_sections.column.order")}
                type="number"
                value={form.sort_order}
                onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })}
              />
              <TextField
                label={t("content_sections.column.rollout")}
                type="number"
                value={form.rollout_percentage}
                onChange={(event) => setForm({ ...form, rollout_percentage: Number(event.target.value) })}
              />
              <TextField
                label={t("content_sections.column.variant")}
                value={form.variant_key}
                onChange={(event) => setForm({ ...form, variant_key: event.target.value })}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("content_sections.column.starts_at")}
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={form.starts_at}
                onChange={(event) => setForm({ ...form, starts_at: event.target.value })}
              />
              <TextField
                label={t("content_sections.column.ends_at")}
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={form.ends_at}
                onChange={(event) => setForm({ ...form, ends_at: event.target.value })}
              />
            </Stack>
            <TextField
              label={t("content_sections.column.target_roles")}
              value={form.target_roles}
              onChange={(event) => setForm({ ...form, target_roles: event.target.value })}
            />
            <TextField
              label={t("content_sections.column.target_locales")}
              value={form.target_locales}
              onChange={(event) => setForm({ ...form, target_locales: event.target.value })}
            />
            <TextField
              label={t("content_sections.column.target_countries")}
              value={form.target_countries}
              onChange={(event) => setForm({ ...form, target_countries: event.target.value })}
            />
            <TextField
              label={t("content_sections.column.target_segments")}
              value={form.target_segments}
              onChange={(event) => setForm({ ...form, target_segments: event.target.value })}
            />
            <TextField
              label={t("content_sections.column.target_tags")}
              value={form.target_tags}
              onChange={(event) => setForm({ ...form, target_tags: event.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_visible}
                  onChange={(event) => setForm({ ...form, is_visible: event.target.checked })}
                />
              }
              label={t("content_sections.column.visible")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!form.key || !form.config_version}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
