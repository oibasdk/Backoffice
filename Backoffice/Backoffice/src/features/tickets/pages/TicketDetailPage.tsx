import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { useAdminAccess } from "../../../auth/useAdminAccess";
import { PermissionGate } from "../../../auth/PermissionGate";
import { EntityHeader } from "../../../components/EntityHeader";
import { EmptyState } from "../../../components/EmptyState";
import { RightPanel } from "../../../components/RightPanel";
import { SlaBadge } from "../../../components/SlaBadge";
import { Timeline } from "../../../components/Timeline";
import { FullPageError, FullPageLoader } from "../../../components/StateViews";
import { assignTicket, getTicket, getTicketChatThread, listTicketEvents, transitionTicket } from "../api";
import { listRemoteSessions } from "../../remote_sessions/api";
import { AssigneeOption, AssigneeSelect } from "../components/AssigneeSelect";

const statusOptions = ["Open", "Paid", "InProgress", "Completed"];

export const TicketDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: access } = useAdminAccess(tokens?.accessToken || null);
  const canEdit = Boolean(access?.is_superuser || access?.permissions?.includes("ticket.update"));

  const [tab, setTab] = useState(0);
  const [assigneeSelection, setAssigneeSelection] = useState<AssigneeOption | null>(null);
  const [nextStatus, setNextStatus] = useState("InProgress");

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ["ticket", id, tokens?.accessToken],
    queryFn: () => getTicket(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  useEffect(() => {
    if (ticket && ticket.assignee_id && !assigneeSelection) {
      setAssigneeSelection({
        id: ticket.assignee_id,
        label: ticket.assignee_label || ticket.assignee_id,
      });
    }
  }, [ticket, assigneeSelection]);

  const { data: events } = useQuery({
    queryKey: ["ticket-events", id, tokens?.accessToken],
    queryFn: () => listTicketEvents(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const { data: remoteSessions } = useQuery({
    queryKey: ["ticket-remote-session", id, tokens?.accessToken],
    queryFn: () =>
      listRemoteSessions(tokens?.accessToken || "", {
        ticket_id: id,
        page: 1,
        page_size: 5,
        ordering: "-created_at",
      }),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      assignTicket(tokens?.accessToken || "", id || "", {
        assignee_id: assigneeSelection?.id || "",
        assignee_label: assigneeSelection?.label,
      }),
    onSuccess: () => {
      pushToast({ message: t("tickets.assign.success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      transitionTicket(tokens?.accessToken || "", id || "", { status: nextStatus }),
    onSuccess: () => {
      pushToast({ message: t("tickets.status.success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const openChatMutation = useMutation({
    mutationFn: () => getTicketChatThread(tokens?.accessToken || "", id || ""),
    onSuccess: (data) => {
      if (data?.id) {
        navigate(`/chat/threads/${data.id}`);
      }
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const timelineItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      timestamp: string;
      timestampValue: number;
      description?: string;
      badge?: React.ReactNode;
    }> = [];

    const pushItem = (
      id: string,
      title: string,
      timestamp: string,
      description?: string,
      badge?: React.ReactNode
    ) => {
      const timeValue = new Date(timestamp).getTime();
      if (!Number.isNaN(timeValue)) {
        items.push({
          id,
          title,
          timestamp: new Date(timestamp).toLocaleString(),
          timestampValue: timeValue,
          description,
          badge,
        });
      }
    };

    (events?.results || []).forEach((event) => {
      pushItem(
        `event-${event.id}`,
        t(`tickets.timeline.${event.event_type}`, event.event_type),
        event.created_at,
        event.message,
        event.actor_label ? <Chip size="small" label={event.actor_label} /> : undefined
      );
    });

    if (ticket?.sla?.first_response_due_at) {
      pushItem(
        "sla-first-response-due",
        t("tickets.timeline.sla_first_response_due"),
        ticket.sla.first_response_due_at,
        t("tickets.timeline.sla_due_description")
      );
    }
    if (ticket?.sla?.resolution_due_at) {
      pushItem(
        "sla-resolution-due",
        t("tickets.timeline.sla_resolution_due"),
        ticket.sla.resolution_due_at,
        t("tickets.timeline.sla_due_description")
      );
    }
    if (ticket?.first_response_at) {
      pushItem(
        "sla-first-response",
        t("tickets.timeline.first_response"),
        ticket.first_response_at
      );
    }
    if (ticket?.resolved_at) {
      pushItem(
        "sla-resolved",
        t("tickets.timeline.resolved"),
        ticket.resolved_at
      );
    }

    (remoteSessions?.results || []).forEach((session) => {
      if (session.started_at) {
        pushItem(
          `session-start-${session.id}`,
          t("tickets.timeline.remote_started"),
          session.started_at,
          session.remote_tool ? `${t("tickets.detail.remote_tool")}: ${session.remote_tool}` : undefined
        );
      }
      if (session.ended_at) {
        pushItem(
          `session-ended-${session.id}`,
          t("tickets.timeline.remote_ended"),
          session.ended_at
        );
      }
    });

    return items
      .sort((a, b) => b.timestampValue - a.timestampValue)
      .map(({ timestampValue, ...item }) => item);
  }, [events?.results, remoteSessions?.results, ticket, t]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError || !ticket) {
    return <FullPageError />;
  }

  const lastUpdatedLabel = ticket.updated_at
    ? new Date(ticket.updated_at).toLocaleString()
    : "-";

  return (
    <PermissionGate permissions={["ticket.view"]}>
      <Stack spacing={3}>
        <EntityHeader
          title={`${t("tickets.detail.title")} #${ticket.id}`}
          subtitle={ticket.title}
          meta={
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Chip size="small" label={`${t("tickets.status")}: ${ticket.status}`} />
              <Chip size="small" label={`${t("tickets.priority")}: ${ticket.priority}`} />
              <SlaBadge
                sla={ticket.sla}
                state={ticket.sla_state}
                status={ticket.status}
                showCountdown
              />
              <Typography variant="caption" color="text.secondary">
                {t("table.last_updated")} · {lastUpdatedLabel}
              </Typography>
            </Stack>
          }
          actions={
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disabled={!canEdit || !assigneeSelection?.id}
                onClick={() => assignMutation.mutate()}
              >
                {t("tickets.assign")}
              </Button>
              <Button variant="outlined" disabled={!canEdit} onClick={() => statusMutation.mutate()}>
                {t("tickets.change_status")}
              </Button>
            </Stack>
          }
        />

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                <Tab label={t("tickets.detail.overview")} />
                <Tab label={t("tickets.detail.timeline")} />
              </Tabs>
              {tab === 0 && (
                <Stack spacing={2} mt={2}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h3" gutterBottom>
                      {t("tickets.detail.issue")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ticket.description || t("state.empty")}
                    </Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h3" gutterBottom>
                      {t("tickets.detail.chat")}
                    </Typography>
                    <EmptyState
                      title={t("tickets.detail.chat_placeholder")}
                      action={
                        <Button
                          variant="contained"
                          onClick={() => {
                            if (ticket.chat_thread_id) {
                              navigate(`/chat/threads/${ticket.chat_thread_id}`);
                            } else {
                              openChatMutation.mutate();
                            }
                          }}
                          disabled={openChatMutation.isPending}
                        >
                          {t("action.open_chat")}
                        </Button>
                      }
                    />
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h3" gutterBottom>
                      {t("tickets.detail.remote")}
                    </Typography>
                    {remoteSessions?.results?.[0] ? (
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip size="small" label={remoteSessions.results[0].status} />
                          <Chip size="small" label={remoteSessions.results[0].consent_status} />
                          <Chip size="small" label={remoteSessions.results[0].remote_tool} />
                        </Stack>
                        <Button
                          variant="contained"
                          onClick={() => navigate(`/remote-sessions/${remoteSessions.results[0].id}`)}
                        >
                          {t("action.open_session")}
                        </Button>
                      </Stack>
                    ) : (
                      <EmptyState title={t("tickets.detail.remote_placeholder")} />
                    )}
                  </Paper>
                </Stack>
              )}
              {tab === 1 && (
                <Box mt={2}>
                  {timelineItems.length > 0 ? (
                    <Timeline items={timelineItems} />
                  ) : (
                    <EmptyState title={t("tickets.detail.timeline_empty")} />
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Stack spacing={2}>
              <RightPanel title={t("tickets.detail.assignment")}>
                <AssigneeSelect
                  value={assigneeSelection}
                  onChange={setAssigneeSelection}
                />
                <Button
                  variant="contained"
                  disabled={!canEdit || !assigneeSelection?.id}
                  onClick={() => assignMutation.mutate()}
                >
                  {t("tickets.assign")}
                </Button>
              </RightPanel>
              <RightPanel title={t("tickets.detail.transitions")}>
                <TextField
                  select
                  label={t("tickets.status")}
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <Button variant="outlined" disabled={!canEdit} onClick={() => statusMutation.mutate()}>
                  {t("tickets.change_status")}
                </Button>
              </RightPanel>
              <RightPanel title={t("tickets.detail.metadata")}>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    {t("tickets.detail.customer")}: {ticket.customer_id || "-"}
                  </Typography>
                  <Typography variant="body2">
                    {t("tickets.detail.created")}: {new Date(ticket.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    {t("tickets.detail.updated")}: {new Date(ticket.updated_at).toLocaleString()}
                  </Typography>
                </Stack>
              </RightPanel>
              <RightPanel title={t("tickets.detail.sla")}>
                <Stack spacing={1}>
                  <SlaBadge sla={ticket.sla} state={ticket.sla_state} status={ticket.status} showCountdown />
                  <Typography variant="body2">
                    {t("tickets.sla.first_response_due")}:{" "}
                    {ticket.sla?.first_response_due_at
                      ? new Date(ticket.sla.first_response_due_at).toLocaleString()
                      : t("state.empty")}
                  </Typography>
                  <Typography variant="body2">
                    {t("tickets.sla.resolution_due")}:{" "}
                    {ticket.sla?.resolution_due_at
                      ? new Date(ticket.sla.resolution_due_at).toLocaleString()
                      : t("state.empty")}
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
