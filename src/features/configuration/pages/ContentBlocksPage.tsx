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
  createContentBlock,
  deleteContentBlock,
  listContentBlocks,
  listContentSections,
  updateContentBlock,
  type ContentBlock,
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

const buildVisibilityLabel = (block: ContentBlock) => {
  const rollout = typeof block.rollout_percentage === "number" ? `${block.rollout_percentage}%` : "-";
  const variant = block.variant_key ? block.variant_key : "-";
  return `${rollout} · ${variant}`;
};

const buildTargetingSummary = (block: ContentBlock, t: (key: string) => string) => {
  const items = [
    block.target_roles?.length ? `roles:${block.target_roles.length}` : null,
    block.target_locales?.length ? `locales:${block.target_locales.length}` : null,
    block.target_countries?.length ? `countries:${block.target_countries.length}` : null,
    block.target_segments?.length ? `segments:${block.target_segments.length}` : null,
    block.target_tags?.length ? `tags:${block.target_tags.length}` : null,
  ].filter(Boolean) as string[];
  const schedule =
    block.starts_at || block.ends_at
      ? `${block.starts_at ? new Date(block.starts_at).toLocaleDateString() : "-"} → ${
          block.ends_at ? new Date(block.ends_at).toLocaleDateString() : "-"
        }`
      : t("content_visibility.schedule_always");
  return {
    targets: items.length ? items.join(" · ") : t("content_visibility.targets_all"),
    schedule,
  };
};

export const ContentBlocksPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [blockType, setBlockType] = useState("");
  const [isVisible, setIsVisible] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentBlock | null>(null);
  const [form, setForm] = useState({
    section: "",
    key: "",
    block_type: "text",
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
      block_type: blockType || undefined,
      is_visible: isVisible || undefined,
      section: sectionId || undefined,
      ordering: "sort_order",
    }),
    [page, rowsPerPage, search, blockType, isVisible, sectionId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-blocks", queryParams, tokens?.accessToken],
    queryFn: () => listContentBlocks(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });
  const blocks = data?.results || [];
  const visibleCount = blocks.filter((block) => block.is_visible).length;
  const hiddenCount = blocks.length - visibleCount;
  const sectionsCount = new Set(blocks.map((block) => block.section)).size;
  const lastUpdated = blocks[0]?.updated_at ? new Date(blocks[0].updated_at).toLocaleString() : "-";

  const { data: sections } = useQuery({
    queryKey: ["content-sections", tokens?.accessToken],
    queryFn: () => listContentSections(tokens?.accessToken || "", { page_size: 200 }),
    enabled: Boolean(tokens?.accessToken),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        section: Number(form.section),
        key: form.key,
        block_type: form.block_type,
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
        return updateContentBlock(tokens?.accessToken || "", editing.id, payload);
      }
      return createContentBlock(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-blocks"] });
      pushToast({ message: t(editing ? "content_blocks.updated" : "content_blocks.created"), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setForm({
        section: "",
        key: "",
        block_type: "text",
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
    onError: () => pushToast({ message: t("content_blocks.invalid_payload"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (blockId: number) => deleteContentBlock(tokens?.accessToken || "", blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-blocks"] });
      pushToast({ message: t("content_blocks.deleted"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const sectionMap = useMemo(() => {
    const map = new Map<number, ContentSection>();
    (sections?.results || []).forEach((section) => map.set(section.id, section));
    return map;
  }, [sections?.results]);

  const rows = (data?.results || []).map((block) => {
    const visibility = buildVisibilityLabel(block);
    const targeting = buildTargetingSummary(block, t);
    return {
      id: block.id,
      exportData: {
        key: block.key,
        type: block.block_type,
        section: block.section,
        order: block.sort_order,
        visible: block.is_visible ? "true" : "false",
      },
      key: block.key,
      type: block.block_type,
      section: sectionMap.get(block.section)?.key || block.section,
      order: block.sort_order,
      status: (
        <Chip
          size="small"
          label={block.is_visible ? t("label.active") : t("label.inactive")}
          color={block.is_visible ? "success" : "default"}
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
      updated: block.updated_at ? new Date(block.updated_at).toLocaleString() : "-",
      actions: (
        <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
          <PermissionGate permissions={["content_block.update"]}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setEditing(block);
                setForm({
                  section: String(block.section),
                  key: block.key,
                  block_type: block.block_type,
                  payload: JSON.stringify(block.payload || {}, null, 2),
                  sort_order: block.sort_order,
                  is_visible: block.is_visible,
                  variant_key: block.variant_key || "",
                  rollout_percentage: block.rollout_percentage ?? 100,
                  target_roles: (block.target_roles || []).join(", "),
                  target_locales: (block.target_locales || []).join(", "),
                  target_countries: (block.target_countries || []).join(", "),
                  target_segments: (block.target_segments || []).join(", "),
                  target_tags: (block.target_tags || []).join(", "),
                  starts_at: toDateTimeLocal(block.starts_at),
                  ends_at: toDateTimeLocal(block.ends_at),
                });
                setDialogOpen(true);
              }}
            >
              {t("action.edit")}
            </Button>
          </PermissionGate>
          <PermissionGate permissions={["content_block.delete"]}>
            <Button
              size="small"
              color="error"
              variant="text"
              onClick={() => deleteMutation.mutate(block.id)}
            >
              {t("action.delete")}
            </Button>
          </PermissionGate>
        </Stack>
      ),
    };
  });

  const columns = [
    { key: "key", label: t("content_blocks.column.key") },
    { key: "type", label: t("content_blocks.column.type") },
    { key: "section", label: t("content_blocks.column.section") },
    { key: "order", label: t("content_blocks.column.order") },
    { key: "status", label: t("label.status") },
    { key: "visibility", label: t("content_visibility.column") },
    { key: "updated", label: t("table.column.updated") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["content_block.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("content_blocks.title")}
          subtitle={t("content_blocks.subtitle")}
          actions={
            <PermissionGate permissions={["content_block.create"]}>
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    section: "",
                    key: "",
                    block_type: "text",
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
              {t("content_blocks.context", { defaultValue: "Block Library" })}
            </Typography>
            <Typography variant="h1">{t("content_blocks.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("content_blocks.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("label.active")}: ${visibleCount}`} color="success" />
              <Chip size="small" label={`${t("label.inactive")}: ${hiddenCount}`} />
              <Chip size="small" label={`${t("content_blocks.column.section")}: ${sectionsCount}`} />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("content_blocks.snapshot.total", { defaultValue: "Total Blocks" })} value={data?.count ?? "-"} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("content_blocks.snapshot.visible", { defaultValue: "Visible Blocks" })} value={visibleCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("content_blocks.snapshot.sections", { defaultValue: "Sections" })} value={sectionsCount || "-"} loading={isLoading} />
          </Grid>
        </Grid>
        <FilterBar
          savedViews={{
            storageKey: "configuration.content_blocks",
            getState: () => ({ search, blockType, isVisible, sectionId }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setBlockType(String(state.blockType || ""));
              setIsVisible(String(state.isVisible || ""));
              setSectionId(String(state.sectionId || ""));
              setPage(0);
            },
            defaultState: { search: "", blockType: "", isVisible: "", sectionId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("content_blocks.filter.type")}
                  value={blockType}
                  onChange={(event) => setBlockType(event.target.value)}
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
                <TextField
                  label={t("content_blocks.filter.section")}
                  value={sectionId}
                  onChange={(event) => setSectionId(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setBlockType("");
              setIsVisible("");
              setSectionId("");
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
          exportFilename="content_blocks.csv"
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
        <DialogTitle>{editing ? t("content_blocks.edit") : t("content_blocks.new")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label={t("content_blocks.column.section")}
              value={form.section}
              onChange={(event) => setForm({ ...form, section: event.target.value })}
            >
              {(sections?.results || []).map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.key}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("content_blocks.column.key")}
              value={form.key}
              onChange={(event) => setForm({ ...form, key: event.target.value })}
            />
            <TextField
              label={t("content_blocks.column.type")}
              value={form.block_type}
              onChange={(event) => setForm({ ...form, block_type: event.target.value })}
            />
            <TextField
              label={t("content_blocks.column.payload")}
              value={form.payload}
              onChange={(event) => setForm({ ...form, payload: event.target.value })}
              multiline
              minRows={6}
            />
            <Divider />
            <Typography variant="subtitle2">{t("content_visibility.title")}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("content_blocks.column.order")}
                type="number"
                value={form.sort_order}
                onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })}
              />
              <TextField
                label={t("content_blocks.column.rollout")}
                type="number"
                value={form.rollout_percentage}
                onChange={(event) => setForm({ ...form, rollout_percentage: Number(event.target.value) })}
              />
              <TextField
                label={t("content_blocks.column.variant")}
                value={form.variant_key}
                onChange={(event) => setForm({ ...form, variant_key: event.target.value })}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("content_blocks.column.starts_at")}
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={form.starts_at}
                onChange={(event) => setForm({ ...form, starts_at: event.target.value })}
              />
              <TextField
                label={t("content_blocks.column.ends_at")}
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={form.ends_at}
                onChange={(event) => setForm({ ...form, ends_at: event.target.value })}
              />
            </Stack>
            <TextField
              label={t("content_blocks.column.target_roles")}
              value={form.target_roles}
              onChange={(event) => setForm({ ...form, target_roles: event.target.value })}
            />
            <TextField
              label={t("content_blocks.column.target_locales")}
              value={form.target_locales}
              onChange={(event) => setForm({ ...form, target_locales: event.target.value })}
            />
            <TextField
              label={t("content_blocks.column.target_countries")}
              value={form.target_countries}
              onChange={(event) => setForm({ ...form, target_countries: event.target.value })}
            />
            <TextField
              label={t("content_blocks.column.target_segments")}
              value={form.target_segments}
              onChange={(event) => setForm({ ...form, target_segments: event.target.value })}
            />
            <TextField
              label={t("content_blocks.column.target_tags")}
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
              label={t("content_blocks.column.visible")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!form.key || !form.section}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
