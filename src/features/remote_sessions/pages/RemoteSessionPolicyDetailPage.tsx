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
  createRemoteSessionPolicyVersion,
  getRemoteSessionPolicy,
  listRemoteSessionPolicyVersions,
  publishRemoteSessionPolicyVersion,
  simulateRemoteSessionPolicyVersion,
  updateRemoteSessionPolicy,
  updateRemoteSessionPolicyVersion,
} from "../api";

const buildEmptyConfig = () => ({
  consent_required: true,
  consent_timeout_minutes: "",
  allowed_tools: [] as string[],
  default_tool: "",
  retention_days: "",
  max_artifacts: "",
  max_artifact_size_mb: "",
  allowed_attachment_types: [] as string[],
  allowed_initiator_roles: [] as string[],
  consent_text: "",
});

const toolOptions = ["manual", "anydesk", "teamviewer"];

export const RemoteSessionPolicyDetailPage: React.FC = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [draftConfig, setDraftConfig] = useState<any>(buildEmptyConfig());

  const roleOptions = [
    { value: "support_agent", label: t("role.support_agent") },
    { value: "technician", label: t("role.technician") },
    { value: "admin", label: t("role.admin") },
    { value: "ops", label: t("role.ops") },
    { value: "superadmin", label: t("role.superadmin") },
  ];

  const { data: policy } = useQuery({
    queryKey: ["remote-session-policy", id, tokens?.accessToken],
    queryFn: () => getRemoteSessionPolicy(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const { data: versions } = useQuery({
    queryKey: ["remote-session-policy-versions", id, tokens?.accessToken],
    queryFn: () =>
      listRemoteSessionPolicyVersions(tokens?.accessToken || "", {
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
    const consentRequired = Boolean(draftConfig.consent_required);
    const consentTimeout = Number(draftConfig.consent_timeout_minutes);
    const retentionDays = Number(draftConfig.retention_days);
    const maxArtifacts = Number(draftConfig.max_artifacts);
    const maxArtifactSize = Number(draftConfig.max_artifact_size_mb);
    const allowedTools = draftConfig.allowed_tools || [];
    const allowedAttachmentTypes = draftConfig.allowed_attachment_types || [];
    const allowedInitiatorRoles = draftConfig.allowed_initiator_roles || [];
    const defaultTool = String(draftConfig.default_tool || "").trim();

    const errors: string[] = [];
    if (consentRequired && (!Number.isFinite(consentTimeout) || consentTimeout <= 0)) {
      errors.push("consent_timeout_minutes");
    }
    if (!Array.isArray(allowedTools) || allowedTools.length === 0) {
      errors.push("allowed_tools");
    }
    if (!defaultTool) {
      errors.push("default_tool");
    }
    if (defaultTool && Array.isArray(allowedTools) && !allowedTools.includes(defaultTool)) {
      errors.push("default_tool");
    }
    if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
      errors.push("retention_days");
    }
    if (!Number.isFinite(maxArtifacts) || maxArtifacts < 0) {
      errors.push("max_artifacts");
    }
    if (!Number.isFinite(maxArtifactSize) || maxArtifactSize <= 0) {
      errors.push("max_artifact_size_mb");
    }
    if (!Array.isArray(allowedAttachmentTypes)) {
      errors.push("allowed_attachment_types");
    }
    if (!Array.isArray(allowedInitiatorRoles) || allowedInitiatorRoles.length === 0) {
      errors.push("allowed_initiator_roles");
    }

    if (errors.length) {
      pushToast({ message: t("remote_sessions.policy.validation.invalid"), severity: "error" });
      return null;
    }

    return {
      consent_required: consentRequired,
      consent_timeout_minutes: consentRequired ? consentTimeout : 0,
      allowed_tools: allowedTools,
      default_tool: defaultTool,
      retention_days: retentionDays,
      max_artifacts: maxArtifacts,
      max_artifact_size_mb: maxArtifactSize,
      allowed_attachment_types: allowedAttachmentTypes,
      allowed_initiator_roles: allowedInitiatorRoles,
      consent_text: String(draftConfig.consent_text || ""),
    };
  };

  const updateTemplate = useMutation({
    mutationFn: (payload: { is_active: boolean }) =>
      updateRemoteSessionPolicy(tokens?.accessToken || "", id || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remote-session-policy", id] });
      pushToast({ message: t("remote_sessions.policy.updated"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const createVersion = useMutation({
    mutationFn: (config: any) =>
      createRemoteSessionPolicyVersion(tokens?.accessToken || "", {
        template: id,
        config,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["remote-session-policy-versions", id] });
      setSelectedVersionId(data.id);
      pushToast({ message: t("remote_sessions.policy.version.created"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const saveDraft = useMutation({
    mutationFn: (config: any) =>
      updateRemoteSessionPolicyVersion(tokens?.accessToken || "", selectedVersionId || "", {
        config,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remote-session-policy-versions", id] });
      pushToast({ message: t("remote_sessions.policy.version.saved"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const publishVersion = useMutation({
    mutationFn: (versionId: string) =>
      publishRemoteSessionPolicyVersion(tokens?.accessToken || "", versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remote-session-policy-versions", id] });
      pushToast({ message: t("remote_sessions.policy.version.published"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const simulateVersion = useMutation({
    mutationFn: (versionId: string) =>
      simulateRemoteSessionPolicyVersion(tokens?.accessToken || "", versionId),
    onSuccess: () => pushToast({ message: t("remote_sessions.policy.version.simulated"), severity: "success" }),
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
    { key: "version", label: t("remote_sessions.policy.version.label") },
    { key: "status", label: t("label.status") },
    { key: "created", label: t("table.column.created") },
  ];

  const handleAllowedToolsChange = (value: string[]) => {
    const nextDefault = value.includes(draftConfig.default_tool) ? draftConfig.default_tool : "";
    setDraftConfig({ ...draftConfig, allowed_tools: value, default_tool: nextDefault });
  };

  return (
    <PermissionGate permissions={["remote_session_policy.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={policy?.name || t("remote_sessions.policy.detail.title")}
          subtitle={t("remote_sessions.policy.detail.subtitle")}
        />
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Box flex={1}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h3">{t("remote_sessions.policy.detail.versions")}</Typography>
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
                  {t("remote_sessions.policy.version.new")}
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, mt: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h3">{t("remote_sessions.policy.version.editor")}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => selectedVersion && simulateVersion.mutate(selectedVersion.id)}
                      disabled={!selectedVersion}
                    >
                      {t("remote_sessions.policy.version.simulate")}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => selectedVersion && publishVersion.mutate(selectedVersion.id)}
                      disabled={!selectedVersion}
                    >
                      {t("remote_sessions.policy.version.publish")}
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
                      {selectedVersionId ? t("action.save") : t("remote_sessions.policy.version.new")}
                    </Button>
                  </Stack>
                </Stack>
                <Divider />
                <Typography variant="body2" fontWeight={600}>
                  {t("remote_sessions.policy.detail.settings")}
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(draftConfig.consent_required)}
                        onChange={(event) =>
                          setDraftConfig({ ...draftConfig, consent_required: event.target.checked })
                        }
                      />
                    }
                    label={t("remote_sessions.policy.consent_required")}
                  />
                  <TextField
                    label={t("remote_sessions.policy.consent_timeout_minutes")}
                    type="number"
                    value={draftConfig.consent_timeout_minutes}
                    onChange={(event) =>
                      setDraftConfig({ ...draftConfig, consent_timeout_minutes: event.target.value })
                    }
                    disabled={!draftConfig.consent_required}
                  />
                  <TextField
                    select
                    label={t("remote_sessions.policy.allowed_tools")}
                    SelectProps={{ multiple: true }}
                    value={draftConfig.allowed_tools || []}
                    onChange={(event) => handleAllowedToolsChange(event.target.value as string[])}
                  >
                    {toolOptions.map((tool) => (
                      <MenuItem key={tool} value={tool}>
                        {tool}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={t("remote_sessions.policy.default_tool")}
                    value={draftConfig.default_tool || ""}
                    onChange={(event) =>
                      setDraftConfig({ ...draftConfig, default_tool: event.target.value })
                    }
                  >
                    {toolOptions.map((tool) => (
                      <MenuItem key={tool} value={tool}>
                        {tool}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label={t("remote_sessions.policy.retention_days")}
                      type="number"
                      value={draftConfig.retention_days}
                      onChange={(event) =>
                        setDraftConfig({ ...draftConfig, retention_days: event.target.value })
                      }
                    />
                    <TextField
                      label={t("remote_sessions.policy.max_artifacts")}
                      type="number"
                      value={draftConfig.max_artifacts}
                      onChange={(event) =>
                        setDraftConfig({ ...draftConfig, max_artifacts: event.target.value })
                      }
                    />
                    <TextField
                      label={t("remote_sessions.policy.max_artifact_size")}
                      type="number"
                      value={draftConfig.max_artifact_size_mb}
                      onChange={(event) =>
                        setDraftConfig({ ...draftConfig, max_artifact_size_mb: event.target.value })
                      }
                    />
                  </Stack>
                  <TextField
                    label={t("remote_sessions.policy.allowed_attachment_types")}
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
                    label={t("remote_sessions.policy.allowed_initiator_roles")}
                    SelectProps={{ multiple: true }}
                    value={draftConfig.allowed_initiator_roles || []}
                    onChange={(event) =>
                      setDraftConfig({ ...draftConfig, allowed_initiator_roles: event.target.value })
                    }
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label={t("remote_sessions.policy.consent_text")}
                    value={draftConfig.consent_text}
                    onChange={(event) =>
                      setDraftConfig({ ...draftConfig, consent_text: event.target.value })
                    }
                    multiline
                    minRows={3}
                  />
                </Stack>
              </Stack>
            </Paper>
          </Box>

          <Box width={{ xs: "100%", lg: 320 }}>
            <RightPanel title={t("remote_sessions.policy.detail.summary")}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  {t("remote_sessions.policy.scope")}:{" "}
                  {policy ? `${policy.scope_type}${policy.scope_value ? `: ${policy.scope_value}` : ""}` : "-"}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy?.is_active ?? false}
                      onChange={(event) => updateTemplate.mutate({ is_active: event.target.checked })}
                    />
                  }
                  label={t("remote_sessions.policy.active")}
                />
              </Stack>
            </RightPanel>
          </Box>
        </Stack>
      </Stack>
    </PermissionGate>
  );
};
