import React, { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { useAdminAccess } from "../../../auth/useAdminAccess";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { EmptyState } from "../../../components/EmptyState";
import { EntityHeader } from "../../../components/EntityHeader";
import { RightPanel } from "../../../components/RightPanel";
import { Timeline } from "../../../components/Timeline";
import { FullPageError, FullPageLoader } from "../../../components/StateViews";
import {
  activateRemoteSession,
  getRemoteSession,
  listSessionArtifacts,
  listSessionConsents,
  listSessionEvents,
  stopRemoteSession,
} from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

export const RemoteSessionDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: access } = useAdminAccess(tokens?.accessToken || null);
  const canEdit = Boolean(access?.is_superuser || access?.permissions?.includes("remote_session.update"));

  const { data: session, isLoading, isError } = useQuery({
    queryKey: ["remote-session", id, tokens?.accessToken],
    queryFn: () => getRemoteSession(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const { data: consents } = useQuery({
    queryKey: ["remote-session-consents", id, tokens?.accessToken],
    queryFn: () => listSessionConsents(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const { data: events } = useQuery({
    queryKey: ["remote-session-events", id, tokens?.accessToken],
    queryFn: () => listSessionEvents(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const { data: artifacts } = useQuery({
    queryKey: ["remote-session-artifacts", id, tokens?.accessToken],
    queryFn: () => listSessionArtifacts(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const activateMutation = useMutation({
    mutationFn: () => activateRemoteSession(tokens?.accessToken || "", id || ""),
    onSuccess: () => {
      pushToast({ message: t("remote_sessions.activate.success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["remote-session", id] });
      queryClient.invalidateQueries({ queryKey: ["remote-session-events", id] });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => stopRemoteSession(tokens?.accessToken || "", id || ""),
    onSuccess: () => {
      pushToast({ message: t("remote_sessions.stop.success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["remote-session", id] });
      queryClient.invalidateQueries({ queryKey: ["remote-session-events", id] });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const resolveResults = <T,>(payload: PaginatedLike<T> | T[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as T[] };
  };

  const resolvedConsents = resolveResults(consents);
  const resolvedEvents = resolveResults(events);
  const resolvedArtifacts = resolveResults(artifacts);

  const consent = resolvedConsents.results[0];

  const timelineItems = useMemo(
    () =>
      resolvedEvents.results.map((event) => ({
        id: event.id,
        title: event.event_type,
        timestamp: new Date(event.created_at).toLocaleString(),
        description: event.message || "",
        badge: event.actor_label ? <Chip size="small" label={event.actor_label} /> : undefined,
      })),
    [resolvedEvents.results]
  );

  const artifactRows = resolvedArtifacts.results.map((artifact) => ({
    id: artifact.id,
    type: <Chip size="small" label={artifact.artifact_type} />,
    label: artifact.label || "-",
    url: artifact.url || "-",
    created_at: new Date(artifact.created_at).toLocaleString(),
  }));

  const artifactColumns = [
    { key: "type", label: t("remote_sessions.artifact.type") },
    { key: "label", label: t("remote_sessions.artifact.label") },
    { key: "url", label: t("remote_sessions.artifact.url") },
    { key: "created_at", label: t("remote_sessions.artifact.created") },
  ];

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError || !session) {
    return <FullPageError onRetry={() => navigate("/remote-sessions")} />;
  }

  return (
    <PermissionGate permissions={["remote_session.view"]}>
      <Stack spacing={3}>
        <EntityHeader
          title={`${t("remote_sessions.detail.title")} #${session.id}`}
          subtitle={`${t("remote_sessions.detail.ticket")}: ${session.ticket}`}
          meta={
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("remote_sessions.status")}: ${session.status}`} />
              <Chip size="small" label={`${t("remote_sessions.consent")}: ${session.consent_status}`} />
              <Chip size="small" label={`${t("remote_sessions.tool")}: ${session.remote_tool}`} />
            </Stack>
          }
          actions={
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disabled={!canEdit || activateMutation.isPending}
                onClick={() => activateMutation.mutate()}
              >
                {t("remote_sessions.activate")}
              </Button>
              <Button
                variant="outlined"
                disabled={!canEdit || stopMutation.isPending}
                onClick={() => stopMutation.mutate()}
              >
                {t("remote_sessions.stop")}
              </Button>
            </Stack>
          }
        />

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Stack spacing={2}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h3" gutterBottom>
                  {t("remote_sessions.detail.summary")}
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    {t("remote_sessions.detail.started")}:{" "}
                    {session.started_at ? new Date(session.started_at).toLocaleString() : "-"}
                  </Typography>
                  <Typography variant="body2">
                    {t("remote_sessions.detail.ended")}:{" "}
                    {session.ended_at ? new Date(session.ended_at).toLocaleString() : "-"}
                  </Typography>
                  <Typography variant="body2">
                    {t("remote_sessions.detail.requested_by")}:{" "}
                    {session.requested_by_label || session.requested_by_id || "-"}
                  </Typography>
                  <Typography variant="body2">
                    {t("remote_sessions.detail.recording")}: {session.recording_url || "-"}
                  </Typography>
                </Stack>
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h3" gutterBottom>
                  {t("remote_sessions.detail.timeline")}
                </Typography>
                {timelineItems.length > 0 ? (
                  <Timeline items={timelineItems} />
                ) : (
                  <EmptyState title={t("remote_sessions.timeline.empty")} />
                )}
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h3" gutterBottom>
                  {t("remote_sessions.detail.artifacts")}
                </Typography>
                <DataTable
                  columns={artifactColumns}
                  rows={artifactRows}
                  loading={!artifacts && !isError}
                  showToolbar={false}
                />
              </Paper>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Stack spacing={2}>
              <RightPanel title={t("remote_sessions.detail.consent")}>
                {consent ? (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      {t("remote_sessions.consent_status")}: {consent.status}
                    </Typography>
                    <Typography variant="body2">
                      {t("remote_sessions.consent_requested")}:{" "}
                      {new Date(consent.requested_at).toLocaleString()}
                    </Typography>
                    {consent.responded_at && (
                      <Typography variant="body2">
                        {t("remote_sessions.consent_responded")}:{" "}
                        {new Date(consent.responded_at).toLocaleString()}
                      </Typography>
                    )}
                    {consent.responder_label && (
                      <Typography variant="body2">
                        {t("remote_sessions.consent_responder")}: {consent.responder_label}
                      </Typography>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("remote_sessions.consent_missing")}
                  </Typography>
                )}
              </RightPanel>
              <RightPanel title={t("remote_sessions.detail.metadata")}>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    {t("remote_sessions.detail.tool")}: {session.remote_tool}
                  </Typography>
                  <Typography variant="body2">
                    {t("remote_sessions.detail.code")}: {session.remote_code || "-"}
                  </Typography>
                  <Typography variant="body2">
                    {t("remote_sessions.detail.policy")}: {session.policy_version_id || "-"}
                  </Typography>
                </Stack>
              </RightPanel>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </PermissionGate>
  );
};
