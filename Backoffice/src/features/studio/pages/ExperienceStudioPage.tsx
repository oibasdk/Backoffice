import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { useAdminAccess } from "../../../auth/useAdminAccess";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { KpiCard } from "../../../components/KpiCard";
import { PageHeader } from "../../../components/PageHeader";
import {
  createAppSetting,
  listAppSettings,
  updateAppSetting,
  type AppSetting,
} from "../../configuration/api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

type StudioField = {
  key: string;
  group: string;
  labelKey: string;
  helperKey?: string;
  placeholderKey?: string;
  valueType: AppSetting["value_type"];
  defaultValue: string | number | boolean;
  description: string;
  inputType?: "text" | "number" | "boolean" | "color" | "email" | "url";
  multiline?: boolean;
  minRows?: number;
  unit?: string;
  grid?: { xs?: number; sm?: number; md?: number; lg?: number };
  inputProps?: { min?: number; max?: number; step?: number };
};

type StudioSection = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  fields: StudioField[];
};

const STUDIO_SECTIONS: StudioSection[] = [
  {
    id: "brand",
    titleKey: "studio.section.brand.title",
    subtitleKey: "studio.section.brand.subtitle",
    fields: [
      {
        key: "ui.brand.name",
        group: "ui.brand",
        labelKey: "studio.field.brand_name",
        helperKey: "studio.help.brand_name",
        placeholderKey: "studio.placeholder.brand_name",
        valueType: "string",
        defaultValue: "",
        description: "Primary brand name",
        inputType: "text",
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.brand.logo",
        group: "ui.brand",
        labelKey: "studio.field.brand_logo",
        helperKey: "studio.help.brand_logo",
        placeholderKey: "studio.placeholder.brand_logo",
        valueType: "string",
        defaultValue: "",
        description: "Public logo URL",
        inputType: "url",
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.brand.support_email",
        group: "ui.brand",
        labelKey: "studio.field.support_email",
        helperKey: "studio.help.support_email",
        placeholderKey: "studio.placeholder.support_email",
        valueType: "string",
        defaultValue: "",
        description: "Support contact email",
        inputType: "email",
        grid: { xs: 12, md: 4 },
      },
    ],
  },
  {
    id: "theme",
    titleKey: "studio.section.theme.title",
    subtitleKey: "studio.section.theme.subtitle",
    fields: [
      {
        key: "ui.theme.primary",
        group: "ui.theme",
        labelKey: "studio.field.theme_primary",
        helperKey: "studio.help.theme_color",
        placeholderKey: "studio.placeholder.theme_color",
        valueType: "string",
        defaultValue: "",
        description: "Primary theme color",
        inputType: "color",
        grid: { xs: 12, sm: 6, md: 4 },
      },
      {
        key: "ui.theme.accent",
        group: "ui.theme",
        labelKey: "studio.field.theme_accent",
        helperKey: "studio.help.theme_color",
        placeholderKey: "studio.placeholder.theme_color",
        valueType: "string",
        defaultValue: "",
        description: "Accent theme color",
        inputType: "color",
        grid: { xs: 12, sm: 6, md: 4 },
      },
      {
        key: "ui.theme.background",
        group: "ui.theme",
        labelKey: "studio.field.theme_background",
        helperKey: "studio.help.theme_color",
        placeholderKey: "studio.placeholder.theme_color",
        valueType: "string",
        defaultValue: "",
        description: "Background color",
        inputType: "color",
        grid: { xs: 12, sm: 6, md: 4 },
      },
      {
        key: "ui.theme.surface",
        group: "ui.theme",
        labelKey: "studio.field.theme_surface",
        helperKey: "studio.help.theme_color",
        placeholderKey: "studio.placeholder.theme_color",
        valueType: "string",
        defaultValue: "",
        description: "Surface color",
        inputType: "color",
        grid: { xs: 12, sm: 6, md: 4 },
      },
      {
        key: "ui.theme.card",
        group: "ui.theme",
        labelKey: "studio.field.theme_card",
        helperKey: "studio.help.theme_color",
        placeholderKey: "studio.placeholder.theme_color",
        valueType: "string",
        defaultValue: "",
        description: "Card surface color",
        inputType: "color",
        grid: { xs: 12, sm: 6, md: 4 },
      },
      {
        key: "ui.theme.text",
        group: "ui.theme",
        labelKey: "studio.field.theme_text",
        helperKey: "studio.help.theme_color",
        placeholderKey: "studio.placeholder.theme_color",
        valueType: "string",
        defaultValue: "",
        description: "Primary text color",
        inputType: "color",
        grid: { xs: 12, sm: 6, md: 4 },
      },
      {
        key: "ui.theme.font_family",
        group: "ui.theme",
        labelKey: "studio.field.theme_font",
        helperKey: "studio.help.theme_font",
        placeholderKey: "studio.placeholder.theme_font",
        valueType: "string",
        defaultValue: "Cairo",
        description: "Font family (must exist in app assets)",
        inputType: "text",
        grid: { xs: 12, md: 6 },
      },
      {
        key: "ui.typography.scale",
        group: "ui.typography",
        labelKey: "studio.field.typography_scale",
        helperKey: "studio.help.typography_scale",
        valueType: "number",
        defaultValue: 1,
        description: "Typography scale multiplier",
        inputType: "number",
        unit: "x",
        inputProps: { min: 0.5, step: 0.05 },
        grid: { xs: 12, md: 6 },
      },
    ],
  },
  {
    id: "rules",
    titleKey: "studio.section.rules.title",
    subtitleKey: "studio.section.rules.subtitle",
    fields: [
      {
        key: "ui.auth.guest_enabled",
        group: "ui.auth",
        labelKey: "studio.field.guest_enabled",
        helperKey: "studio.help.guest_enabled",
        valueType: "boolean",
        defaultValue: true,
        description: "Allow guest access",
        inputType: "boolean",
        grid: { xs: 12, md: 6 },
      },
      {
        key: "ui.auth.require_signup_on_checkout",
        group: "ui.auth",
        labelKey: "studio.field.require_signup",
        helperKey: "studio.help.require_signup",
        valueType: "boolean",
        defaultValue: true,
        description: "Require signup before checkout",
        inputType: "boolean",
        grid: { xs: 12, md: 6 },
      },
      {
        key: "ui.auth.pin_length",
        group: "ui.auth",
        labelKey: "studio.field.pin_length",
        helperKey: "studio.help.pin_length",
        valueType: "number",
        defaultValue: 6,
        description: "PIN length for login",
        inputType: "number",
        inputProps: { min: 1, step: 1 },
        grid: { xs: 12, md: 6 },
      },
      {
        key: "ui.security.require_2fa",
        group: "ui.security",
        labelKey: "studio.field.require_2fa",
        helperKey: "studio.help.require_2fa",
        valueType: "boolean",
        defaultValue: true,
        description: "Require 2FA for admin access",
        inputType: "boolean",
        grid: { xs: 12, md: 6 },
      },
    ],
  },
  {
    id: "locale",
    titleKey: "studio.section.locale.title",
    subtitleKey: "studio.section.locale.subtitle",
    fields: [
      {
        key: "ui.locale.default",
        group: "ui.locale",
        labelKey: "studio.field.default_locale",
        helperKey: "studio.help.default_locale",
        placeholderKey: "studio.placeholder.default_locale",
        valueType: "string",
        defaultValue: "en-US",
        description: "Default locale",
        inputType: "text",
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.currency.default",
        group: "ui.currency",
        labelKey: "studio.field.default_currency",
        helperKey: "studio.help.default_currency",
        placeholderKey: "studio.placeholder.default_currency",
        valueType: "string",
        defaultValue: "USD",
        description: "Default currency",
        inputType: "text",
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.currency.symbol",
        group: "ui.currency",
        labelKey: "studio.field.currency_symbol",
        helperKey: "studio.help.currency_symbol",
        placeholderKey: "studio.placeholder.currency_symbol",
        valueType: "string",
        defaultValue: "$",
        description: "Currency symbol",
        inputType: "text",
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.format.date",
        group: "ui.format",
        labelKey: "studio.field.date_format",
        helperKey: "studio.help.date_format",
        placeholderKey: "studio.placeholder.date_format",
        valueType: "string",
        defaultValue: "YYYY-MM-DD",
        description: "Date format string",
        inputType: "text",
        grid: { xs: 12, md: 6 },
      },
      {
        key: "ui.format.time",
        group: "ui.format",
        labelKey: "studio.field.time_format",
        helperKey: "studio.help.time_format",
        placeholderKey: "studio.placeholder.time_format",
        valueType: "string",
        defaultValue: "HH:mm",
        description: "Time format string",
        inputType: "text",
        grid: { xs: 12, md: 6 },
      },
    ],
  },
  {
    id: "layout",
    titleKey: "studio.section.layout.title",
    subtitleKey: "studio.section.layout.subtitle",
    fields: [
      {
        key: "ui.layout.card_radius",
        group: "ui.layout",
        labelKey: "studio.field.card_radius",
        helperKey: "studio.help.card_radius",
        valueType: "number",
        defaultValue: 12,
        description: "Card corner radius",
        inputType: "number",
        unit: "px",
        inputProps: { min: 0, step: 1 },
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.layout.control_radius",
        group: "ui.layout",
        labelKey: "studio.field.control_radius",
        helperKey: "studio.help.control_radius",
        valueType: "number",
        defaultValue: 10,
        description: "Input/button corner radius",
        inputType: "number",
        unit: "px",
        inputProps: { min: 0, step: 1 },
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.layout.section_spacing",
        group: "ui.layout",
        labelKey: "studio.field.section_spacing",
        helperKey: "studio.help.section_spacing",
        valueType: "number",
        defaultValue: 16,
        description: "Vertical spacing between sections",
        inputType: "number",
        unit: "px",
        inputProps: { min: 0, step: 1 },
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.layout.content_padding",
        group: "ui.layout",
        labelKey: "studio.field.content_padding",
        helperKey: "studio.help.content_padding",
        valueType: "number",
        defaultValue: 16,
        description: "Default content padding",
        inputType: "number",
        unit: "px",
        inputProps: { min: 0, step: 1 },
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.layout.card_elevation",
        group: "ui.layout",
        labelKey: "studio.field.card_elevation",
        helperKey: "studio.help.card_elevation",
        valueType: "number",
        defaultValue: 0,
        description: "Card elevation",
        inputType: "number",
        inputProps: { min: 0, step: 1 },
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.layout.shadow_opacity",
        group: "ui.layout",
        labelKey: "studio.field.shadow_opacity",
        helperKey: "studio.help.shadow_opacity",
        valueType: "number",
        defaultValue: 0.12,
        description: "Shadow opacity (0-1)",
        inputType: "number",
        inputProps: { min: 0, max: 1, step: 0.01 },
        grid: { xs: 12, md: 4 },
      },
    ],
  },
  {
    id: "announcements",
    titleKey: "studio.section.announcements.title",
    subtitleKey: "studio.section.announcements.subtitle",
    fields: [
      {
        key: "ui.maintenance.enabled",
        group: "ui.maintenance",
        labelKey: "studio.field.maintenance_enabled",
        helperKey: "studio.help.maintenance_enabled",
        valueType: "boolean",
        defaultValue: false,
        description: "Global maintenance mode",
        inputType: "boolean",
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.maintenance.message",
        group: "ui.maintenance",
        labelKey: "studio.field.maintenance_message",
        helperKey: "studio.help.maintenance_message",
        placeholderKey: "studio.placeholder.maintenance_message",
        valueType: "string",
        defaultValue: "",
        description: "Maintenance message",
        inputType: "text",
        multiline: true,
        minRows: 3,
        grid: { xs: 12, md: 8 },
      },
      {
        key: "ui.announcement.title",
        group: "ui.announcement",
        labelKey: "studio.field.announcement_title",
        helperKey: "studio.help.announcement_title",
        placeholderKey: "studio.placeholder.announcement_title",
        valueType: "string",
        defaultValue: "",
        description: "Announcement title",
        inputType: "text",
        grid: { xs: 12, md: 4 },
      },
      {
        key: "ui.announcement.message",
        group: "ui.announcement",
        labelKey: "studio.field.announcement_message",
        helperKey: "studio.help.announcement_message",
        placeholderKey: "studio.placeholder.announcement_message",
        valueType: "string",
        defaultValue: "",
        description: "Announcement message",
        inputType: "text",
        multiline: true,
        minRows: 3,
        grid: { xs: 12, md: 8 },
      },
    ],
  },
];

const ALL_FIELDS = STUDIO_SECTIONS.flatMap((section) => section.fields);

const buildDefaults = () => {
  const defaults: Record<string, string | boolean> = {};
  ALL_FIELDS.forEach((field) => {
    if (field.valueType === "boolean") {
      defaults[field.key] = Boolean(field.defaultValue);
    } else {
      defaults[field.key] = String(field.defaultValue ?? "");
    }
  });
  return defaults;
};

const parseNumberValue = (raw: string | boolean | undefined, fallback: number) => {
  if (raw === "" || raw === null || raw === undefined) {
    return fallback;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
};

const resolveFieldValue = (field: StudioField, raw: string | boolean | undefined) => {
  if (field.valueType === "number") {
    return parseNumberValue(raw, Number(field.defaultValue));
  }
  if (field.valueType === "boolean") {
    return Boolean(raw);
  }
  return String(raw ?? "").trim();
};

const buildFormState = (settingsMap: Map<string, AppSetting>) => {
  const next = buildDefaults();
  ALL_FIELDS.forEach((field) => {
    const setting = settingsMap.get(field.key);
    if (!setting) {
      return;
    }
    if (field.valueType === "boolean") {
      next[field.key] = Boolean(setting.value);
      return;
    }
    next[field.key] =
      setting.value === null || setting.value === undefined ? "" : String(setting.value);
  });
  return next;
};

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

export const ExperienceStudioPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const { data: access } = useAdminAccess(tokens?.accessToken || null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppSetting | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [form, setForm] = useState({
    key: "",
    description: "",
    value: "",
    value_type: "string",
    is_public: false,
  });
  const [studioForm, setStudioForm] = useState<Record<string, string | boolean>>(() =>
    buildDefaults()
  );
  const [dirtyKeys, setDirtyKeys] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  const canEdit =
    Boolean(access?.is_superuser) ||
    Boolean(access?.permissions?.includes("app_setting.update")) ||
    Boolean(access?.permissions?.includes("app_setting.create"));

  const queryParams = useMemo(
    () => ({
      page_size: 200,
      ordering: "key",
      search: "ui.",
    }),
    []
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["experience-studio", queryParams, tokens?.accessToken],
    queryFn: () => listAppSettings(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
    refetchOnWindowFocus: false,
  });

  const settingsMap = useMemo(() => {
    const map = new Map<string, AppSetting>();
    (data?.results || []).forEach((setting) => {
      map.set(setting.key, setting);
    });
    return map;
  }, [data?.results]);

  useEffect(() => {
    if (!data || hydrated) {
      return;
    }
    setStudioForm(buildFormState(settingsMap));
    setDirtyKeys({});
    setHydrated(true);
  }, [data, hydrated, settingsMap]);

  const handleReload = useCallback(async () => {
    try {
      const result = await refetch();
      if (result.data?.results) {
        const map = new Map<string, AppSetting>();
        result.data.results.forEach((setting) => map.set(setting.key, setting));
        setStudioForm(buildFormState(map));
        setDirtyKeys({});
      }
    } catch {
      pushToast({ message: t("state.error"), severity: "error" });
    }
  }, [pushToast, refetch, t]);

  const handleFieldChange = useCallback((field: StudioField, value: string | boolean) => {
    setStudioForm((prev) => ({ ...prev, [field.key]: value }));
    setDirtyKeys((prev) => ({ ...prev, [field.key]: true }));
  }, []);

  const handleResetSection = useCallback(
    (section: StudioSection) => {
      setStudioForm((prev) => {
        const next = { ...prev };
        section.fields.forEach((field) => {
          const setting = settingsMap.get(field.key);
          if (setting) {
            if (field.valueType === "boolean") {
              next[field.key] = Boolean(setting.value);
            } else {
              next[field.key] =
                setting.value === null || setting.value === undefined
                  ? ""
                  : String(setting.value);
            }
          } else if (field.valueType === "boolean") {
            next[field.key] = Boolean(field.defaultValue);
          } else {
            next[field.key] = String(field.defaultValue ?? "");
          }
        });
        return next;
      });
      setDirtyKeys((prev) => {
        const next = { ...prev };
        section.fields.forEach((field) => {
          delete next[field.key];
        });
        return next;
      });
    },
    [settingsMap]
  );

  const handleSaveSection = useCallback(
    async (section: StudioSection) => {
      if (!tokens?.accessToken) {
        pushToast({ message: t("state.error"), severity: "error" });
        return;
      }
      setSavingSection(section.id);
      try {
        await Promise.all(
          section.fields.map((field) => {
            const payload = {
              key: field.key,
              description: field.description,
              value: resolveFieldValue(field, studioForm[field.key]),
              value_type: field.valueType,
              group: field.group,
              is_public: true,
            };
            const existing = settingsMap.get(field.key);
            if (existing) {
              return updateAppSetting(tokens.accessToken, existing.id, payload);
            }
            return createAppSetting(tokens.accessToken, payload);
          })
        );
        queryClient.invalidateQueries({ queryKey: ["experience-studio"] });
        setDirtyKeys((prev) => {
          const next = { ...prev };
          section.fields.forEach((field) => {
            delete next[field.key];
          });
          return next;
        });
        pushToast({ message: t("studio.updated"), severity: "success" });
      } catch {
        pushToast({ message: t("state.error"), severity: "error" });
      } finally {
        setSavingSection(null);
      }
    },
    [pushToast, queryClient, settingsMap, studioForm, t, tokens]
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        key: form.key,
        description: form.description || undefined,
        value: parseValue(form.value, form.value_type as AppSetting["value_type"]),
        value_type: form.value_type as AppSetting["value_type"],
        is_public: form.is_public,
        group: editing?.group || undefined,
      };
      if (editing) {
        return updateAppSetting(tokens?.accessToken || "", editing.id, payload);
      }
      return createAppSetting(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience-studio"] });
      pushToast({ message: t(editing ? "studio.updated" : "studio.created"), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setForm({ key: "", description: "", value: "", value_type: "string", is_public: false });
    },
    onError: () => pushToast({ message: t("studio.invalid_payload"), severity: "error" }),
  });

  const settingsList = data?.results || [];
  const totalCount = settingsList.length;
  const publicCount = settingsList.filter((setting) => setting.is_public).length;
  const lastUpdated = settingsList[0]?.updated_at
    ? new Date(settingsList[0].updated_at).toLocaleString()
    : "-";

  const filteredSettings = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return settingsList;
    }
    return settingsList.filter((setting) => {
      const valueText =
        setting.value === null || setting.value === undefined ? "" : String(setting.value);
      return (
        setting.key.toLowerCase().includes(term) ||
        (setting.group || "").toLowerCase().includes(term) ||
        valueText.toLowerCase().includes(term)
      );
    });
  }, [search, settingsList]);

  const paginatedSettings = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredSettings.slice(start, start + rowsPerPage);
  }, [filteredSettings, page, rowsPerPage]);

  const rows = paginatedSettings.map((setting) => ({
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
    value: JSON.stringify(setting.value ?? ""),
    public: (
      <Chip
        size="small"
        label={setting.is_public ? t("label.public") : t("label.private")}
        color={setting.is_public ? "success" : "default"}
      />
    ),
    updated: setting.updated_at ? new Date(setting.updated_at).toLocaleString() : "-",
    actions: (
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
            is_public: setting.is_public,
          });
          setDialogOpen(true);
        }}
        disabled={!canEdit}
      >
        {t("action.edit")}
      </Button>
    ),
  }));

  const columns = [
    { key: "key", label: t("studio.column.key") },
    { key: "group", label: t("app_settings.column.group") },
    { key: "type", label: t("studio.column.type") },
    { key: "value", label: t("studio.column.value") },
    { key: "public", label: t("studio.column.public") },
    { key: "updated", label: t("table.column.updated") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["app_setting.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("studio.title")}
          subtitle={t("studio.subtitle")}
          actions={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/configuration/app-settings"
              >
                {t("studio.action.open_app_settings")}
              </Button>
              <Button variant="outlined" onClick={handleReload} disabled={isFetching}>
                {t("studio.action.refresh")}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setForm({ key: "", description: "", value: "", value_type: "string", is_public: false });
                  setDialogOpen(true);
                }}
                disabled={!canEdit}
              >
                {t("studio.new_setting")}
              </Button>
            </Stack>
          }
        />
        <Paper
          sx={(theme) => ({
            p: { xs: 2.5, md: 3.5 },
            borderRadius: radiusTokens.large,
            backgroundImage:
              theme.palette.mode === "light"
                ? "linear-gradient(135deg, rgba(14,124,120,0.18) 0%, rgba(33,64,153,0.12) 45%, rgba(255,255,255,0.75) 100%)"
                : "linear-gradient(135deg, rgba(14,124,120,0.28) 0%, rgba(33,64,153,0.18) 45%, rgba(15,18,15,0.7) 100%)",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: elevationTokens.level3,
          })}
        >
          <Stack spacing={2}>
            <Typography variant="overline" color="text.secondary">
              {t("studio.context", { defaultValue: "Studio Context" })}
            </Typography>
            <Typography variant="h1">{t("studio.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("studio.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("studio.snapshot.total")}: ${totalCount}`} />
              <Chip size="small" label={`${t("studio.snapshot.public")}: ${publicCount}`} />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("studio.snapshot.total")} value={totalCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("studio.snapshot.public")} value={publicCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard
              label={t("studio.snapshot.group")}
              value={t("studio.section.brand.title")}
              loading={isLoading}
            />
          </Grid>
        </Grid>

        {STUDIO_SECTIONS.map((section) => {
          const sectionDirty = section.fields.some((field) => dirtyKeys[field.key]);
          return (
            <Paper
              key={section.id}
              sx={(theme) => ({
                p: 3,
                borderRadius: radiusTokens.large,
                backgroundImage:
                  theme.palette.mode === "light"
                    ? "linear-gradient(180deg, rgba(33,64,153,0.05) 0%, rgba(255,255,255,0.95) 100%)"
                    : "linear-gradient(180deg, rgba(33,64,153,0.18) 0%, rgba(15,18,15,0.95) 100%)",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: elevationTokens.level2,
              })}
            >
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                  <Box flex={1}>
                    <Typography variant="h3">{t(section.titleKey)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(section.subtitleKey)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {sectionDirty && (
                      <Chip size="small" color="warning" label={t("studio.badge.unsaved")} />
                    )}
                    <Button
                      variant="text"
                      onClick={() => handleResetSection(section)}
                      disabled={!sectionDirty}
                    >
                      {t("action.reset")}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleSaveSection(section)}
                      disabled={!sectionDirty || !canEdit || savingSection === section.id}
                    >
                      {savingSection === section.id ? t("action.saving") : t("action.save")}
                    </Button>
                  </Stack>
                </Stack>
                <Divider />
                <Grid container spacing={2}>
                  {section.fields.map((field) => {
                    const value = studioForm[field.key];
                    const gridProps = field.grid ?? { xs: 12, md: 6 };
                    if (field.valueType === "boolean") {
                      return (
                        <Grid item key={field.key} {...gridProps}>
                          <Stack spacing={0.5}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={Boolean(value)}
                                  onChange={(event) => handleFieldChange(field, event.target.checked)}
                                />
                              }
                              label={t(field.labelKey)}
                            />
                            {field.helperKey && (
                              <Typography variant="caption" color="text.secondary">
                                {t(field.helperKey)}
                              </Typography>
                            )}
                          </Stack>
                        </Grid>
                      );
                    }
                    const inputValue = typeof value === "boolean" ? "" : String(value ?? "");
                    const startAdornment =
                      field.inputType === "color" ? (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              border: "1px solid rgba(0,0,0,0.2)",
                              backgroundColor: inputValue || "#ffffff",
                            }}
                          />
                        </InputAdornment>
                      ) : undefined;

                    return (
                      <Grid item key={field.key} {...gridProps}>
                        <TextField
                          fullWidth
                          label={t(field.labelKey)}
                          value={inputValue}
                          onChange={(event) => handleFieldChange(field, event.target.value)}
                          type={field.valueType === "number" ? "number" : field.inputType || "text"}
                          placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                          helperText={field.helperKey ? t(field.helperKey) : undefined}
                          multiline={field.multiline}
                          minRows={field.minRows}
                          InputProps={{
                            startAdornment,
                            endAdornment: field.unit ? (
                              <InputAdornment position="end">{field.unit}</InputAdornment>
                            ) : undefined,
                          }}
                          inputProps={field.inputProps}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            </Paper>
          );
        })}

        <Accordion expanded={advancedOpen} onChange={(_, expanded) => setAdvancedOpen(expanded)}>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Stack spacing={0.5}>
              <Typography variant="h4">{t("studio.section.advanced.title")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("studio.section.advanced.subtitle")}
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <FilterBar
                savedViews={{
                  storageKey: "studio.experience",
                  getState: () => ({ search }),
                  applyState: (state) => {
                    setSearch(String(state.search || ""));
                    setPage(0);
                  },
                  defaultState: { search: "" },
                }}
                advanced={{
                  title: t("filter.advanced"),
                  content: null,
                  onApply: () => setPage(0),
                  onReset: () => setSearch(""),
                }}
              >
                <TextField
                  label={t("label.search")}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                  size="small"
                />
              </FilterBar>
              <DataTable
                columns={columns}
                rows={rows}
                loading={isLoading}
                error={isError}
                totalCount={filteredSettings.length}
                page={page}
                rowsPerPage={rowsPerPage}
                exportFilename="experience_studio.csv"
                onPageChange={setPage}
                onRowsPerPageChange={(size) => {
                  setRowsPerPage(size);
                  setPage(0);
                }}
                density={density}
                onDensityChange={setDensity}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? t("studio.edit_setting") : t("studio.new_setting")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("studio.form.key")}
              value={form.key}
              onChange={(event) => setForm({ ...form, key: event.target.value })}
              disabled={Boolean(editing)}
            />
            <TextField
              label={t("studio.form.description")}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <TextField
              select
              label={t("studio.form.type")}
              value={form.value_type}
              onChange={(event) => setForm({ ...form, value_type: event.target.value })}
            >
              <MenuItem value="string">string</MenuItem>
              <MenuItem value="number">number</MenuItem>
              <MenuItem value="boolean">boolean</MenuItem>
              <MenuItem value="json">json</MenuItem>
            </TextField>
            <TextField
              label={t("studio.form.value")}
              value={form.value}
              onChange={(event) => setForm({ ...form, value: event.target.value })}
              multiline
              minRows={4}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_public}
                  onChange={(event) => setForm({ ...form, is_public: event.target.checked })}
                />
              }
              label={t("studio.form.public")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!form.key || !canEdit}
          >
            {editing ? t("action.save") : t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
