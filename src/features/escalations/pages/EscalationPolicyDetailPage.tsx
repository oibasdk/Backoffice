import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
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
  createEscalationPolicyVersion,
  getEscalationPolicy,
  listEscalationPolicyVersions,
  publishEscalationPolicyVersion,
  simulateEscalationPolicyVersion,
  updateEscalationPolicy,
  updateEscalationPolicyVersion,
} from "../api";

const buildEmptyConfig = () => ({
  rules: [],
});

export const EscalationPolicyDetailPage: React.FC = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [draftConfig, setDraftConfig] = useState<any>(buildEmptyConfig());

  const triggerOptions = [
    { value: "percentage_elapsed", label: t("escalation.trigger.percentage_elapsed") },
    { value: "breach", label: t("escalation.trigger.breach") },
    { value: "inactivity", label: t("escalation.trigger.inactivity") },
  ];

  const roleOptions = [
    { value: "admin", label: t("role.admin") },
    { value: "superadmin", label: t("role.superadmin") },
    { value: "support_agent", label: t("role.support_agent") },
    { value: "technician", label: t("role.technician") },
    { value: "ops", label: t("role.ops") },
  ];

  const channelOptions = [
    { value: "in_app", label: t("escalation.channel.in_app") },
    { value: "email", label: t("escalation.channel.email") },
  ];

  const behaviorOptions = [
    { value: "notify", label: t("escalation.behavior.notify") },
    { value: "auto", label: t("escalation.behavior.auto") },
  ];

  const severityOptions = [
    { value: "low", label: t("escalation.severity.low") },
    { value: "medium", label: t("escalation.severity.medium") },
    { value: "high", label: t("escalation.severity.high") },
    { value: "critical", label: t("escalation.severity.critical") },
  ];

  const { data: policy } = useQuery({
    queryKey: ["escalation-policy", id, tokens?.accessToken],
    queryFn: () => getEscalationPolicy(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const { data: versions } = useQuery({
    queryKey: ["escalation-policy-versions", id, tokens?.accessToken],
    queryFn: () =>
      listEscalationPolicyVersions(tokens?.accessToken || "", {
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

  const normalizeDraftConfig = () => {
    const rules = (draftConfig.rules || []).map((rule: any) => {
      const trigger = String(rule.trigger || "").trim();
      const behavior = String(rule.behavior || "").trim();
      const severity = String(rule.severity || "").trim();
      const recipients = Array.isArray(rule.recipients) ? rule.recipients : [];
      const channels = Array.isArray(rule.channels) ? rule.channels : [];
      const percentage =
        rule.percentage === "" || rule.percentage == null ? NaN : Number(rule.percentage);
      const inactivityMinutes =
        rule.inactivity_minutes === "" || rule.inactivity_minutes == null
          ? NaN
          : Number(rule.inactivity_minutes);
      const featureFlag = String(rule.feature_flag || "").trim();

      const normalizedRule: Record<string, any> = {
        trigger,
        recipients,
        channels,
        behavior,
        severity,
      };

      if (trigger === "percentage_elapsed") {
        normalizedRule.percentage = percentage;
      }
      if (trigger === "inactivity") {
        normalizedRule.inactivity_minutes = inactivityMinutes;
      }
      if (behavior === "auto") {
        normalizedRule.feature_flag = featureFlag;
      }

      return normalizedRule;
    });

    const errors: string[] = [];
    if (rules.length === 0) {
      errors.push("rules");
    }
    rules.forEach((rule) => {
      if (!rule.trigger) {
        errors.push("trigger");
      }
      if (rule.trigger === "percentage_elapsed") {
        if (!Number.isFinite(rule.percentage) || rule.percentage <= 0 || rule.percentage > 100) {
          errors.push("percentage");
        }
      }
      if (rule.trigger === "inactivity") {
        if (!Number.isFinite(rule.inactivity_minutes) || rule.inactivity_minutes <= 0) {
          errors.push("inactivity");
        }
      }
      if (!rule.recipients || rule.recipients.length === 0) {
        errors.push("recipients");
      }
      if (!rule.channels || rule.channels.length === 0) {
        errors.push("channels");
      }
      if (!rule.behavior) {
        errors.push("behavior");
      }
      if (!rule.severity) {
        errors.push("severity");
      }
      if (rule.behavior === "auto" && !rule.feature_flag) {
        errors.push("feature_flag");
      }
    });

    if (errors.length) {
      pushToast({ message: t("escalation.validation.invalid"), severity: "error" });
      return null;
    }

    return { rules };
  };

  const updateTemplate = useMutation({
    mutationFn: (payload: { is_active: boolean }) =>
      updateEscalationPolicy(tokens?.accessToken || "", id || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escalation-policy", id] });
      pushToast({ message: t("escalation.policy.updated"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const createVersion = useMutation({
    mutationFn: (config: any) =>
      createEscalationPolicyVersion(tokens?.accessToken || "", {
        template: id,
        config,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["escalation-policy-versions", id] });
      setSelectedVersionId(data.id);
      pushToast({ message: t("escalation.version.created"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const saveDraft = useMutation({
    mutationFn: (config: any) =>
      updateEscalationPolicyVersion(tokens?.accessToken || "", selectedVersionId || "", {
        config,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escalation-policy-versions", id] });
      pushToast({ message: t("escalation.version.saved"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const publishVersion = useMutation({
    mutationFn: (versionId: string) =>
      publishEscalationPolicyVersion(tokens?.accessToken || "", versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escalation-policy-versions", id] });
      pushToast({ message: t("escalation.version.published"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const simulateVersion = useMutation({
    mutationFn: (versionId: string) =>
      simulateEscalationPolicyVersion(tokens?.accessToken || "", versionId),
    onSuccess: () => pushToast({ message: t("escalation.version.simulated"), severity: "success" }),
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const handleSelectVersion = (versionId: string, config: any) => {
    setSelectedVersionId(versionId);
    setDraftConfig(config || buildEmptyConfig());
  };

  const handleRuleChange = (index: number, key: string, value: any) => {
    const rules = [...(draftConfig.rules || [])];
    rules[index] = { ...rules[index], [key]: value };
    setDraftConfig({ ...draftConfig, rules });
  };

  const handleAddRule = () => {
    const rules = [...(draftConfig.rules || [])];
    rules.push({
      trigger: "",
      recipients: [],
      channels: [],
      behavior: "",
      severity: "",
    });
    setDraftConfig({ ...draftConfig, rules });
  };

  const handleRemoveRule = (index: number) => {
    const rules = [...(draftConfig.rules || [])];
    rules.splice(index, 1);
    setDraftConfig({ ...draftConfig, rules });
  };

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
    { key: "version", label: t("escalation.version.label") },
    { key: "status", label: t("label.status") },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["escalation_policy.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={policy?.name || t("escalation.policy.detail.title")}
          subtitle={t("escalation.policy.detail.subtitle")}
        />
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Box flex={1}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h3">{t("escalation.policy.detail.versions")}</Typography>
                <DataTable
                  columns={versionColumns}
                  rows={versionRows}
                  loading={!versions}
                  totalCount={versions?.count}
                  showToolbar={false}
                  onRowClick={(row) => {
                    const version = versions?.results.find((item) => item.id === row.id);
                    if (version) {
                      handleSelectVersion(version.id, version.config);
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => {
                    const config = normalizeDraftConfig();
                    if (config) {
                      createVersion.mutate(config);
                    }
                  }}
                >
                  {t("escalation.version.new")}
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, mt: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h3">{t("escalation.version.editor")}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => selectedVersion && simulateVersion.mutate(selectedVersion.id)}
                      disabled={!selectedVersion}
                    >
                      {t("escalation.version.simulate")}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => selectedVersion && publishVersion.mutate(selectedVersion.id)}
                      disabled={!selectedVersion}
                    >
                      {t("escalation.version.publish")}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        const config = normalizeDraftConfig();
                        if (config && selectedVersionId) {
                          saveDraft.mutate(config);
                        } else if (config && !selectedVersionId) {
                          createVersion.mutate(config);
                        }
                      }}
                    >
                      {selectedVersionId ? t("action.save") : t("escalation.version.new")}
                    </Button>
                  </Stack>
                </Stack>
                <Divider />
                <Typography variant="body2" fontWeight={600}>
                  {t("escalation.rules.title")}
                </Typography>
                <Stack spacing={2}>
                  {(draftConfig.rules || []).map((rule: any, index: number) => (
                    <Paper key={`rule-${index}`} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            select
                            label={t("escalation.rules.trigger")}
                            value={rule.trigger || ""}
                            onChange={(event) => handleRuleChange(index, "trigger", event.target.value)}
                          >
                            {triggerOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          {rule.trigger === "percentage_elapsed" && (
                            <TextField
                              type="number"
                              label={t("escalation.rules.percentage")}
                              value={rule.percentage ?? ""}
                              onChange={(event) => {
                                const value = event.target.value === "" ? "" : Number(event.target.value);
                                handleRuleChange(index, "percentage", value);
                              }}
                            />
                          )}
                          {rule.trigger === "inactivity" && (
                            <TextField
                              type="number"
                              label={t("escalation.rules.inactivity_minutes")}
                              value={rule.inactivity_minutes ?? ""}
                              onChange={(event) => {
                                const value = event.target.value === "" ? "" : Number(event.target.value);
                                handleRuleChange(index, "inactivity_minutes", value);
                              }}
                            />
                          )}
                          <IconButton onClick={() => handleRemoveRule(index)}>
                            <DeleteRoundedIcon />
                          </IconButton>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            select
                            label={t("escalation.rules.recipients")}
                            SelectProps={{ multiple: true }}
                            value={rule.recipients || []}
                            onChange={(event) =>
                              handleRuleChange(index, "recipients", event.target.value)
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
                            label={t("escalation.rules.channels")}
                            SelectProps={{ multiple: true }}
                            value={rule.channels || []}
                            onChange={(event) =>
                              handleRuleChange(index, "channels", event.target.value)
                            }
                          >
                            {channelOptions.map((channel) => (
                              <MenuItem key={channel.value} value={channel.value}>
                                {channel.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            label={t("escalation.rules.behavior")}
                            value={rule.behavior || ""}
                            onChange={(event) =>
                              handleRuleChange(index, "behavior", event.target.value)
                            }
                          >
                            {behaviorOptions.map((behavior) => (
                              <MenuItem key={behavior.value} value={behavior.value}>
                                {behavior.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            label={t("escalation.rules.severity")}
                            value={rule.severity || ""}
                            onChange={(event) =>
                              handleRuleChange(index, "severity", event.target.value)
                            }
                          >
                            {severityOptions.map((severity) => (
                              <MenuItem key={severity.value} value={severity.value}>
                                {severity.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Stack>
                        {rule.behavior === "auto" && (
                          <TextField
                            label={t("escalation.rules.feature_flag")}
                            value={rule.feature_flag || ""}
                            onChange={(event) =>
                              handleRuleChange(index, "feature_flag", event.target.value)
                            }
                          />
                        )}
                      </Stack>
                    </Paper>
                  ))}
                  <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={handleAddRule}>
                    {t("escalation.rules.add")}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>

          <Box width={{ xs: "100%", lg: 320 }}>
            <RightPanel title={t("escalation.policy.detail.summary")}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  {t("escalation.policy.scope")}:{" "}
                  {policy ? `${policy.scope_type}${policy.scope_value ? `: ${policy.scope_value}` : ""}` : "-"}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy?.is_active ?? false}
                      onChange={(event) => updateTemplate.mutate({ is_active: event.target.checked })}
                    />
                  }
                  label={t("escalation.policy.active")}
                />
              </Stack>
            </RightPanel>
          </Box>
        </Stack>
      </Stack>
    </PermissionGate>
  );
};
