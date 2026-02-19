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
  createSlaPolicyVersion,
  getSlaPolicy,
  listSlaPolicyVersions,
  publishSlaPolicyVersion,
  simulateSlaPolicyVersion,
  updateSlaPolicy,
  updateSlaPolicyVersion,
} from "../api";

const buildEmptyConfig = () => ({
  working_hours: { mode: "24x7" },
  priorities: [],
});

export const SlaPolicyDetailPage: React.FC = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [draftConfig, setDraftConfig] = useState<any>(buildEmptyConfig());

  const { data: policy } = useQuery({
    queryKey: ["sla-policy", id, tokens?.accessToken],
    queryFn: () => getSlaPolicy(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const { data: versions } = useQuery({
    queryKey: ["sla-policy-versions", id, tokens?.accessToken],
    queryFn: () =>
      listSlaPolicyVersions(tokens?.accessToken || "", {
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
    const workingHours = draftConfig.working_hours || { mode: "24x7" };
    const priorities = (draftConfig.priorities || []).map((priority: any) => ({
      key: String(priority.key || "").trim(),
      first_response_minutes:
        priority.first_response_minutes === "" || priority.first_response_minutes == null
          ? NaN
          : Number(priority.first_response_minutes),
      resolution_minutes:
        priority.resolution_minutes === "" || priority.resolution_minutes == null
          ? NaN
          : Number(priority.resolution_minutes),
    }));

    const errors: string[] = [];
    if (priorities.length === 0) {
      errors.push("priorities");
    }
    priorities.forEach((priority) => {
      if (!priority.key) {
        errors.push("priority_key");
      }
      if (!Number.isFinite(priority.first_response_minutes) || priority.first_response_minutes <= 0) {
        errors.push("first_response_minutes");
      }
      if (!Number.isFinite(priority.resolution_minutes) || priority.resolution_minutes <= 0) {
        errors.push("resolution_minutes");
      }
    });

    if (workingHours.mode === "business_hours") {
      if (!workingHours.timezone || !workingHours.start || !workingHours.end) {
        errors.push("working_hours");
      }
    }

    if (errors.length) {
      pushToast({ message: t("sla.validation.invalid"), severity: "error" });
      return null;
    }

    const normalizedWorkingHours =
      workingHours.mode === "business_hours"
        ? {
            mode: "business_hours",
            timezone: workingHours.timezone,
            start: workingHours.start,
            end: workingHours.end,
            days: workingHours.days || [0, 1, 2, 3, 4, 5, 6],
          }
        : { mode: "24x7" };

    return {
      working_hours: normalizedWorkingHours,
      priorities,
    };
  };

  const updateTemplate = useMutation({
    mutationFn: (payload: { is_active: boolean }) =>
      updateSlaPolicy(tokens?.accessToken || "", id || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policy", id] });
      pushToast({ message: t("sla.policy.updated"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const createVersion = useMutation({
    mutationFn: (config: any) =>
      createSlaPolicyVersion(tokens?.accessToken || "", {
        template: id,
        config,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sla-policy-versions", id] });
      setSelectedVersionId(data.id);
      pushToast({ message: t("sla.version.created"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const saveDraft = useMutation({
    mutationFn: (config: any) =>
      updateSlaPolicyVersion(tokens?.accessToken || "", selectedVersionId || "", {
        config,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policy-versions", id] });
      pushToast({ message: t("sla.version.saved"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const publishVersion = useMutation({
    mutationFn: (versionId: string) =>
      publishSlaPolicyVersion(tokens?.accessToken || "", versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policy-versions", id] });
      pushToast({ message: t("sla.version.published"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const simulateVersion = useMutation({
    mutationFn: (versionId: string) =>
      simulateSlaPolicyVersion(tokens?.accessToken || "", versionId),
    onSuccess: () => pushToast({ message: t("sla.version.simulated"), severity: "success" }),
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const handleSelectVersion = (versionId: string, config: any) => {
    setSelectedVersionId(versionId);
    setDraftConfig(config || buildEmptyConfig());
  };

  const handlePriorityChange = (index: number, key: string, value: string | number) => {
    const priorities = [...(draftConfig.priorities || [])];
    priorities[index] = { ...priorities[index], [key]: value };
    setDraftConfig({ ...draftConfig, priorities });
  };

  const handleAddPriority = () => {
    const priorities = [...(draftConfig.priorities || [])];
    priorities.push({ key: "", first_response_minutes: "", resolution_minutes: "" });
    setDraftConfig({ ...draftConfig, priorities });
  };

  const handleRemovePriority = (index: number) => {
    const priorities = [...(draftConfig.priorities || [])];
    priorities.splice(index, 1);
    setDraftConfig({ ...draftConfig, priorities });
  };

  const workingHours = draftConfig.working_hours || { mode: "24x7" };

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
    { key: "version", label: t("sla.version.label") },
    { key: "status", label: t("label.status") },
    { key: "created", label: t("table.column.created") },
  ];

  const lastUpdatedLabel = policy?.updated_at
    ? new Date(policy.updated_at).toLocaleString()
    : null;

  return (
    <PermissionGate permissions={["sla_policy.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={policy?.name || t("sla.policy.detail.title")}
          subtitle={t("sla.policy.detail.subtitle")}
          actions={
            lastUpdatedLabel ? (
              <Typography variant="caption" color="text.secondary">
                {t("table.last_updated")} · {lastUpdatedLabel}
              </Typography>
            ) : undefined
          }
        />
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Box flex={1}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h3">{t("sla.policy.detail.versions")}</Typography>
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
                  {t("sla.version.new")}
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, mt: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h3">{t("sla.version.editor")}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => selectedVersion && simulateVersion.mutate(selectedVersion.id)}
                      disabled={!selectedVersion}
                    >
                      {t("sla.version.simulate")}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => selectedVersion && publishVersion.mutate(selectedVersion.id)}
                      disabled={!selectedVersion}
                    >
                      {t("sla.version.publish")}
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
                      {selectedVersionId ? t("action.save") : t("sla.version.new")}
                    </Button>
                  </Stack>
                </Stack>
                <Divider />
                <Typography variant="body2" fontWeight={600}>
                  {t("sla.working_hours")}
                </Typography>
                <TextField
                  select
                  label={t("sla.working_hours.mode")}
                  value={workingHours.mode || "24x7"}
                  onChange={(event) =>
                    setDraftConfig({
                      ...draftConfig,
                      working_hours: { ...workingHours, mode: event.target.value },
                    })
                  }
                >
                  <MenuItem value="24x7">{t("sla.working_hours.24x7")}</MenuItem>
                  <MenuItem value="business_hours">{t("sla.working_hours.business")}</MenuItem>
                </TextField>
                {workingHours.mode === "business_hours" && (
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("sla.working_hours.timezone")}
                      value={workingHours.timezone || ""}
                      onChange={(event) =>
                        setDraftConfig({
                          ...draftConfig,
                          working_hours: { ...workingHours, timezone: event.target.value },
                        })
                      }
                    />
                    <TextField
                      label={t("sla.working_hours.start")}
                      value={workingHours.start || ""}
                      onChange={(event) =>
                        setDraftConfig({
                          ...draftConfig,
                          working_hours: { ...workingHours, start: event.target.value },
                        })
                      }
                    />
                    <TextField
                      label={t("sla.working_hours.end")}
                      value={workingHours.end || ""}
                      onChange={(event) =>
                        setDraftConfig({
                          ...draftConfig,
                          working_hours: { ...workingHours, end: event.target.value },
                        })
                      }
                    />
                  </Stack>
                )}
                <Divider />
                <Typography variant="body2" fontWeight={600}>
                  {t("sla.priorities.title")}
                </Typography>
                <Stack spacing={2}>
                  {(draftConfig.priorities || []).map((priority: any, index: number) => (
                    <Stack key={`${priority.key}-${index}`} direction="row" spacing={1} alignItems="center">
                      <TextField
                        label={t("sla.priorities.key")}
                        value={priority.key}
                        onChange={(event) =>
                          handlePriorityChange(index, "key", event.target.value)
                        }
                      />
                      <TextField
                        type="number"
                        label={t("sla.priorities.first_response")}
                        value={priority.first_response_minutes ?? ""}
                        onChange={(event) => {
                          const value = event.target.value === "" ? "" : Number(event.target.value);
                          handlePriorityChange(index, "first_response_minutes", value);
                        }}
                      />
                      <TextField
                        type="number"
                        label={t("sla.priorities.resolution")}
                        value={priority.resolution_minutes ?? ""}
                        onChange={(event) => {
                          const value = event.target.value === "" ? "" : Number(event.target.value);
                          handlePriorityChange(index, "resolution_minutes", value);
                        }}
                      />
                      <IconButton onClick={() => handleRemovePriority(index)}>
                        <DeleteRoundedIcon />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={handleAddPriority}>
                    {t("sla.priorities.add")}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>

          <Box width={{ xs: "100%", lg: 320 }}>
            <RightPanel title={t("sla.policy.detail.summary")}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  {t("sla.policy.scope")}:{" "}
                  {policy ? `${policy.scope_type}${policy.scope_value ? `: ${policy.scope_value}` : ""}` : "-"}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy?.is_active ?? false}
                      onChange={(event) => updateTemplate.mutate({ is_active: event.target.checked })}
                    />
                  }
                  label={t("sla.policy.active")}
                />
              </Stack>
            </RightPanel>
          </Box>
        </Stack>
      </Stack>
    </PermissionGate>
  );
};
