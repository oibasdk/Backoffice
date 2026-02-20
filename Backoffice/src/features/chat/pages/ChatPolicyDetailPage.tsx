import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { PageHeader } from "../../../components/PageHeader";
import { RightPanel } from "../../../components/RightPanel";
import {
  createChatPolicyVersion,
  getChatPolicy,
  listChatPolicyVersions,
  publishChatPolicyVersion,
  simulateChatPolicyVersion,
  updateChatPolicy,
  updateChatPolicyVersion,
} from "../api";

const buildEmptyConfig = () => ({
  retention_days: "",
  max_message_length: "",
  max_attachments: "",
  max_attachment_size_mb: "",
  allowed_attachment_types: [] as string[],
  allowed_sender_roles: [] as string[],
  allow_edit: false,
  allow_delete: false,
  slow_mode_seconds: "",
  moderation: {
    roles: [] as string[],
    actions: [] as string[],
    flag_keywords: [] as string[],
  },
});

export const ChatPolicyDetailPage: React.FC = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [draftConfig, setDraftConfig] = useState<any>(buildEmptyConfig());

  const roleOptions = [
    { value: "customer", label: t("role.customer") },
    { value: "vendor", label: t("role.vendor") },
    { value: "provider", label: t("role.provider") },
    { value: "support_agent", label: t("role.support_agent") },
    { value: "technician", label: t("role.technician") },
    { value: "admin", label: t("role.admin") },
    { value: "ops", label: t("role.ops") },
    { value: "superadmin", label: t("role.superadmin") },
  ];

  const moderationActions = [
    { value: "flagged", label: t("chat.moderation.flag") },
    { value: "hidden", label: t("chat.moderation.hide") },
    { value: "visible", label: t("chat.moderation.restore") },
  ];

  const { data: policy } = useQuery({
    queryKey: ["chat-policy", id, tokens?.accessToken],
    queryFn: () => getChatPolicy(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const { data: versions } = useQuery({
    queryKey: ["chat-policy-versions", id, tokens?.accessToken],
    queryFn: () =>
      listChatPolicyVersions(tokens?.accessToken || "", {
        template: id,
        ordering: "-created_at",
      }),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const selectedVersion = useMemo(
    () => versions?.results.find((version) => version.id === selectedVersionId) || null,
    [versions?.results, selectedVersionId]
  );

  useEffect(() => {
    if (!selectedVersionId && versions?.results?.length) {
      const latest = versions.results[0];
      setSelectedVersionId(latest.id);
      setDraftConfig(latest.config || buildEmptyConfig());
    }
  }, [selectedVersionId, versions]);

  const normalizeConfig = () => {
    const retentionDays = Number(draftConfig.retention_days);
    const maxMessageLength = Number(draftConfig.max_message_length);
    const maxAttachments = Number(draftConfig.max_attachments);
    const maxAttachmentSize = Number(draftConfig.max_attachment_size_mb);
    const slowMode = Number(draftConfig.slow_mode_seconds);

    const allowedAttachmentTypes = draftConfig.allowed_attachment_types || [];
    const allowedSenderRoles = draftConfig.allowed_sender_roles || [];
    const moderation = draftConfig.moderation || {};
    const moderationRoles = moderation.roles || [];
    const moderationActionsSelected = moderation.actions || [];
    const flagKeywords = moderation.flag_keywords || [];

    const errors: string[] = [];
    if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
      errors.push("retention_days");
    }
    if (!Number.isFinite(maxMessageLength) || maxMessageLength <= 0) {
      errors.push("max_message_length");
    }
    if (!Number.isFinite(maxAttachments) || maxAttachments < 0) {
      errors.push("max_attachments");
    }
    if (!Number.isFinite(maxAttachmentSize) || maxAttachmentSize <= 0) {
      errors.push("max_attachment_size_mb");
    }
    if (!Array.isArray(allowedAttachmentTypes)) {
      errors.push("allowed_attachment_types");
    }
    if (!Array.isArray(allowedSenderRoles) || allowedSenderRoles.length === 0) {
      errors.push("allowed_sender_roles");
    }
    if (!Number.isFinite(slowMode) || slowMode < 0) {
      errors.push("slow_mode_seconds");
    }
    if (!Array.isArray(moderationRoles) || moderationRoles.length === 0) {
      errors.push("moderation_roles");
    }
    if (!Array.isArray(moderationActionsSelected) || moderationActionsSelected.length === 0) {
      errors.push("moderation_actions");
    }

    if (errors.length) {
      pushToast({ message: t("chat.validation.invalid"), severity: "error" });
      return null;
    }

    return {
      retention_days: retentionDays,
      max_message_length: maxMessageLength,
      max_attachments: maxAttachments,
      max_attachment_size_mb: maxAttachmentSize,
      allowed_attachment_types: allowedAttachmentTypes,
      allowed_sender_roles: allowedSenderRoles,
      allow_edit: Boolean(draftConfig.allow_edit),
      allow_delete: Boolean(draftConfig.allow_delete),
      slow_mode_seconds: slowMode,
      moderation: {
        roles: moderationRoles,
        actions: moderationActionsSelected,
        flag_keywords: flagKeywords,
      },
    };
  };

  const updateTemplate = useMutation({
    mutationFn: (payload: { is_active: boolean }) =>
      updateChatPolicy(tokens?.accessToken || "", id || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-policy", id] });
      pushToast({ message: t("chat.policy.updated"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const createVersion = useMutation({
    mutationFn: (config: any) =>
      createChatPolicyVersion(tokens?.accessToken || "", {
        template: id,
        config,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-policy-versions", id] });
      setSelectedVersionId(data.id);
      pushToast({ message: t("chat.version.created"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const saveDraft = useMutation({
    mutationFn: (config: any) =>
      updateChatPolicyVersion(tokens?.accessToken || "", selectedVersionId || "", {
        config,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-policy-versions", id] });
      pushToast({ message: t("chat.version.saved"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const publishVersion = useMutation({
    mutationFn: (versionId: string) => publishChatPolicyVersion(tokens?.accessToken || "", versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-policy-versions", id] });
      pushToast({ message: t("chat.version.published"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const simulateVersion = useMutation({
    mutationFn: (versionId: string) => simulateChatPolicyVersion(tokens?.accessToken || "", versionId),
    onSuccess: () => pushToast({ message: t("chat.version.simulated"), severity: "success" }),
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const versionRows = (versions?.results || []).map((version) => ({
    id: version.id,
    version: `v${version.version}`,
    status: (
      <Chip
        size="small"
        label={version.status}
        color={version.status === "published" ? "success" : "default"}
      />
    ),
    created: new Date(version.created_at).toLocaleString(),
  }));

  const versionColumns = [
    { key: "version", label: t("chat.version.label") },
    { key: "status", label: t("label.status") },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["chat_policy.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={policy?.name || t("chat.policy.detail.title")}
          subtitle={t("chat.policy.detail.subtitle")}
        />
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Box flex={1}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h3">{t("chat.policy.detail.versions")}</Typography>
                <DataTable
                  columns={versionColumns}
                  rows={versionRows}
                  loading={!versions}
                  totalCount={versions?.count}
                  showToolbar={false}
                  onRowClick={(row) => {
                    const version = versions?.results.find((item) => item.id === row.id);
                    if (version) {
                      setSelectedVersionId(version.id);
                      setDraftConfig(version.config || buildEmptyConfig());
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    const config = normalizeConfig();
                    if (config) {
                      createVersion.mutate(config);
                    }
                  }}
                >
                  {t("chat.version.new")}
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, mt: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h3">{t("chat.version.editor")}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => selectedVersion && simulateVersion.mutate(selectedVersion.id)}
                      disabled={!selectedVersion}
                    >
                      {t("chat.version.simulate")}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => selectedVersion && publishVersion.mutate(selectedVersion.id)}
                      disabled={!selectedVersion}
                    >
                      {t("chat.version.publish")}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        const config = normalizeConfig();
                        if (config && selectedVersionId) {
                          saveDraft.mutate(config);
                        } else if (config && !selectedVersionId) {
                          createVersion.mutate(config);
                        }
                      }}
                    >
                      {selectedVersionId ? t("action.save") : t("chat.version.new")}
                    </Button>
                  </Stack>
                </Stack>
                <Divider />
                <Typography variant="body2" fontWeight={600}>
                  {t("chat.policy.settings")}
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("chat.policy.retention_days")}
                      type="number"
                      value={draftConfig.retention_days}
                      onChange={(event) => setDraftConfig({ ...draftConfig, retention_days: event.target.value })}
                    />
                    <TextField
                      label={t("chat.policy.max_message_length")}
                      type="number"
                      value={draftConfig.max_message_length}
                      onChange={(event) =>
                        setDraftConfig({ ...draftConfig, max_message_length: event.target.value })
                      }
                    />
                    <TextField
                      label={t("chat.policy.slow_mode_seconds")}
                      type="number"
                      value={draftConfig.slow_mode_seconds}
                      onChange={(event) =>
                        setDraftConfig({ ...draftConfig, slow_mode_seconds: event.target.value })
                      }
                    />
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("chat.policy.max_attachments")}
                      type="number"
                      value={draftConfig.max_attachments}
                      onChange={(event) => setDraftConfig({ ...draftConfig, max_attachments: event.target.value })}
                    />
                    <TextField
                      label={t("chat.policy.max_attachment_size")}
                      type="number"
                      value={draftConfig.max_attachment_size_mb}
                      onChange={(event) =>
                        setDraftConfig({ ...draftConfig, max_attachment_size_mb: event.target.value })
                      }
                    />
                  </Stack>
                  <TextField
                    label={t("chat.policy.allowed_attachment_types")}
                    value={(draftConfig.allowed_attachment_types || []).join(", ")}
                    onChange={(event) =>
                      setDraftConfig({
                        ...draftConfig,
                        allowed_attachment_types: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <TextField
                    select
                    label={t("chat.policy.allowed_sender_roles")}
                    SelectProps={{ multiple: true }}
                    value={draftConfig.allowed_sender_roles || []}
                    onChange={(event) =>
                      setDraftConfig({ ...draftConfig, allowed_sender_roles: event.target.value })
                    }
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Stack direction="row" spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(draftConfig.allow_edit)}
                          onChange={(event) =>
                            setDraftConfig({ ...draftConfig, allow_edit: event.target.checked })
                          }
                        />
                      }
                      label={t("chat.policy.allow_edit")}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(draftConfig.allow_delete)}
                          onChange={(event) =>
                            setDraftConfig({ ...draftConfig, allow_delete: event.target.checked })
                          }
                        />
                      }
                      label={t("chat.policy.allow_delete")}
                    />
                  </Stack>
                </Stack>
                <Divider />
                <Typography variant="body2" fontWeight={600}>
                  {t("chat.policy.moderation")}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    select
                    label={t("chat.policy.moderation_roles")}
                    SelectProps={{ multiple: true }}
                    value={draftConfig.moderation?.roles || []}
                    onChange={(event) =>
                      setDraftConfig({
                        ...draftConfig,
                        moderation: { ...draftConfig.moderation, roles: event.target.value },
                      })
                    }
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={t("chat.policy.moderation_actions")}
                    SelectProps={{ multiple: true }}
                    value={draftConfig.moderation?.actions || []}
                    onChange={(event) =>
                      setDraftConfig({
                        ...draftConfig,
                        moderation: { ...draftConfig.moderation, actions: event.target.value },
                      })
                    }
                  >
                    {moderationActions.map((action) => (
                      <MenuItem key={action.value} value={action.value}>
                        {action.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label={t("chat.policy.flag_keywords")}
                    value={(draftConfig.moderation?.flag_keywords || []).join(", ")}
                    onChange={(event) =>
                      setDraftConfig({
                        ...draftConfig,
                        moderation: {
                          ...draftConfig.moderation,
                          flag_keywords: event.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </Stack>
              </Stack>
            </Paper>
          </Box>

          <Box width={{ xs: "100%", lg: 320 }}>
            <RightPanel title={t("chat.policy.detail.summary")}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  {t("chat.policy.scope")}:{" "}
                  {policy ? `${policy.scope_type}${policy.scope_value ? `: ${policy.scope_value}` : ""}` : "-"}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy?.is_active ?? false}
                      onChange={(event) => updateTemplate.mutate({ is_active: event.target.checked })}
                    />
                  }
                  label={t("chat.policy.active")}
                />
              </Stack>
            </RightPanel>
          </Box>
        </Stack>
      </Stack>
    </PermissionGate>
  );
};
