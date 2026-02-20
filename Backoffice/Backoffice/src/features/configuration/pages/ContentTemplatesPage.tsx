import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { KpiCard } from "../../../components/KpiCard";
import { PageHeader } from "../../../components/PageHeader";
import { applyContentTemplate, listConfigVersions, listContentTemplates } from "../api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

export const ContentTemplatesPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sectionType, setSectionType] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [screen, setScreen] = useState("home");
  const [configVersionId, setConfigVersionId] = useState<number | "">("");
  const [keyPrefix, setKeyPrefix] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      is_active: status || undefined,
      section_type: sectionType || undefined,
      ordering: "name",
    }),
    [page, rowsPerPage, search, status, sectionType]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-templates", queryParams, tokens?.accessToken],
    queryFn: () => listContentTemplates(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });
  const templates = data?.results || [];
  const activeCount = templates.filter((template) => template.is_active).length;
  const inactiveCount = templates.length - activeCount;
  const typesCount = new Set(templates.map((template) => template.section_type)).size;
  const lastUpdated = templates[0]?.updated_at ? new Date(templates[0].updated_at).toLocaleString() : "-";

  const { data: versions } = useQuery({
    queryKey: ["config-versions", tokens?.accessToken],
    queryFn: () => listConfigVersions(tokens?.accessToken || "", { page_size: 50 }),
    enabled: Boolean(tokens?.accessToken),
  });

  const applyMutation = useMutation({
    mutationFn: (payload: { templateId: number; screen?: string; config_version_id?: number; key_prefix?: string }) =>
      applyContentTemplate(tokens?.accessToken || "", payload.templateId, {
        screen: payload.screen,
        config_version_id: payload.config_version_id,
        key_prefix: payload.key_prefix,
      }),
    onSuccess: () => {
      pushToast({ message: t("content_templates.applied"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["content-templates"] });
      setApplyOpen(false);
      setScreen("home");
      setConfigVersionId("");
      setKeyPrefix("");
      setSelectedTemplateId(null);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (data?.results || []).map((template) => ({
    id: template.id,
    exportData: {
      name: template.name,
      key: template.key,
      type: template.section_type,
      status: template.is_active ? "active" : "inactive",
      updated: template.updated_at,
    },
    name: template.name,
    key: template.key,
    type: <Chip size="small" label={template.section_type} />,
    status: (
      <Chip
        size="small"
        label={template.is_active ? t("label.active") : t("label.inactive")}
        color={template.is_active ? "success" : "default"}
      />
    ),
    updated: new Date(template.updated_at).toLocaleString(),
    actions: (
      <PermissionGate permissions={["content_template.update"]}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedTemplateId(template.id);
              setApplyOpen(true);
            }}
          >
            {t("action.apply")}
          </Button>
          <Button
            size="small"
            variant="text"
            component={RouterLink}
            to={`/configuration/content-templates/builder/${template.id}`}
          >
            {t("content_template_builder.title")}
          </Button>
          <Button
            size="small"
            variant="text"
            component={RouterLink}
            to={`/configuration/content-templates/output/${template.id}`}
          >
            {t("content_template_output.title")}
          </Button>
        </Stack>
      </PermissionGate>
    ),
  }));

  const columns = [
    { key: "name", label: t("content_templates.column.name") },
    { key: "key", label: t("content_templates.column.key") },
    { key: "type", label: t("content_templates.column.type") },
    { key: "status", label: t("label.status") },
    { key: "updated", label: t("table.column.updated") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["content_template.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("content_templates.title")} subtitle={t("content_templates.subtitle")} />
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
              {t("content_templates.context", { defaultValue: "Content Engine" })}
            </Typography>
            <Typography variant="h1">{t("content_templates.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("content_templates.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("label.active")}: ${activeCount}`} color="success" />
              <Chip size="small" label={`${t("label.inactive")}: ${inactiveCount}`} />
              <Chip size="small" label={`${t("content_templates.column.type")}: ${typesCount}`} />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("content_templates.snapshot.total", { defaultValue: "Total Templates" })} value={data?.count ?? "-"} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("content_templates.snapshot.active", { defaultValue: "Active Templates" })} value={activeCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("content_templates.snapshot.types", { defaultValue: "Section Types" })} value={typesCount || "-"} loading={isLoading} />
          </Grid>
        </Grid>
        <FilterBar
          savedViews={{
            storageKey: "configuration.content_templates",
            getState: () => ({ search, status, sectionType }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setStatus(String(state.status || ""));
              setSectionType(String(state.sectionType || ""));
              setPage(0);
            },
            defaultState: { search: "", status: "", sectionType: "" },
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
                  <MenuItem value="true">{t("label.active")}</MenuItem>
                  <MenuItem value="false">{t("label.inactive")}</MenuItem>
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
          <TextField
            label={t("content_templates.column.type")}
            value={sectionType}
            onChange={(event) => setSectionType(event.target.value)}
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
          exportFilename="content_templates.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("content_templates.apply_title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              {t("content_templates.apply_hint")}
            </Typography>
            <TextField
              label={t("content_templates.apply_screen")}
              value={screen}
              onChange={(event) => setScreen(event.target.value)}
            />
            <TextField
              select
              label={t("content_templates.apply_version")}
              value={configVersionId}
              onChange={(event) => setConfigVersionId(event.target.value as number | "")}
            >
              <MenuItem value="">{t("content_templates.apply_version_auto")}</MenuItem>
              {(versions?.results || []).map((version) => (
                <MenuItem key={version.id} value={version.id}>
                  v{version.version} - {version.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("content_templates.apply_key_prefix")}
              value={keyPrefix}
              onChange={(event) => setKeyPrefix(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() =>
              selectedTemplateId &&
              applyMutation.mutate({
                templateId: selectedTemplateId,
                screen: screen || undefined,
                config_version_id: configVersionId ? Number(configVersionId) : undefined,
                key_prefix: keyPrefix || undefined,
              })
            }
          >
            {t("action.apply")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
