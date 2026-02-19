import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { useAdminAccess } from "../../../auth/useAdminAccess";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { KpiCard } from "../../../components/KpiCard";
import { PageHeader } from "../../../components/PageHeader";
import { SlaBadge } from "../../../components/SlaBadge";
import { assignTicket, listTickets, transitionTicket } from "../api";
import { AssigneeOption, AssigneeSelect } from "../components/AssigneeSelect";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

const statusOptions = ["Open", "Paid", "InProgress", "Completed"];
const priorityOptions = ["Normal", "Fast", "VIP"];
const slaOptions = ["pending", "on_track", "breached", "met"];

export const TicketsListPage: React.FC = () => {
  const { tokens } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const { data: access } = useAdminAccess(tokens?.accessToken || null);
  const canEdit = Boolean(access?.is_superuser || access?.permissions?.includes("ticket.update"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [queue, setQueue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slaState, setSlaState] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeSelection, setAssigneeSelection] = useState<AssigneeOption | null>(null);
  const [nextStatus, setNextStatus] = useState("InProgress");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      priority: priority || undefined,
      assignee: assignee || undefined,
      queue: queue || undefined,
      start: startDate || undefined,
      end: endDate || undefined,
      sla_state: slaState || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, status, priority, assignee, queue, startDate, endDate, slaState]
  );

  useEffect(() => {
    setSelectedIds([]);
  }, [queryParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tickets", queryParams, tokens?.accessToken],
    queryFn: () => listTickets(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  useEffect(() => {
    if (data) {
      setLastUpdated(new Date().toLocaleString());
    }
  }, [data]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      const token = tokens?.accessToken || "";
      await Promise.all(
        selectedIds.map((id) =>
          assignTicket(token, String(id), {
            assignee_id: assigneeSelection?.id || "",
            assignee_label: assigneeSelection?.label,
          })
        )
      );
    },
    onSuccess: () => {
      pushToast({ message: t("tickets.assign.success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setAssignOpen(false);
      setSelectedIds([]);
      setAssigneeSelection(null);
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async () => {
      const token = tokens?.accessToken || "";
      await Promise.all(
        selectedIds.map((id) => transitionTicket(token, String(id), { status: nextStatus }))
      );
    },
    onSuccess: () => {
      pushToast({ message: t("tickets.status.success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setStatusOpen(false);
      setSelectedIds([]);
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const rows = (data?.results || []).map((ticket) => ({
    id: ticket.id,
    exportData: {
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      assignee: ticket.assignee_label || ticket.assignee_id || "",
      queue: ticket.queue || "",
      created_at: ticket.created_at,
      sla: ticket.sla?.state || ticket.sla_state || "",
    },
    title: (
      <Stack>
        <Typography variant="body2" fontWeight={600}>
          {ticket.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {ticket.id}
        </Typography>
      </Stack>
    ),
    status: <Chip size="small" label={ticket.status} />,
    priority: <Chip size="small" label={ticket.priority} />,
    assignee: ticket.assignee_label || ticket.assignee_id || "-",
    queue: ticket.queue || "-",
    created_at: new Date(ticket.created_at).toLocaleString(),
    sla: <SlaBadge sla={ticket.sla} state={ticket.sla_state} status={ticket.status} />,
  }));

  const columns = [
    { key: "title", label: t("tickets.column.title") },
    { key: "status", label: t("tickets.column.status") },
    { key: "priority", label: t("tickets.column.priority") },
    { key: "assignee", label: t("tickets.column.assignee") },
    { key: "queue", label: t("tickets.column.queue") },
    { key: "created_at", label: t("tickets.column.created_at") },
    { key: "sla", label: t("tickets.column.sla") },
  ];

  const tickets = data?.results || [];
  const openCount = tickets.filter((t) => t.status === "Open").length;
  const vipCount = tickets.filter((t) => t.priority === "VIP").length;
  const breachedCount = tickets.filter((t) => t.sla_state === "breached" || t.sla?.state === "breached").length;

  return (
    <PermissionGate permissions={["ticket.view"]}>
      <Stack spacing={4}>
        <PageHeader
          title={t("tickets.title")}
          subtitle={t("tickets.subtitle")}
          sx={{ mb: 1 }}
          actions={
            <Stack spacing={1} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  disabled={!canEdit || selectedIds.length === 0}
                  onClick={() => setAssignOpen(true)}
                >
                  {t("tickets.assign")}
                </Button>
                <Button
                  variant="outlined"
                  disabled={!canEdit || selectedIds.length === 0}
                  onClick={() => setStatusOpen(true)}
                >
                  {t("tickets.change_status")}
                </Button>
              </Stack>
            </Stack>
          }
        />

        <Grid container spacing={3}>
          {/* Intelligence Tray (4 Columns) */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              <Paper
                sx={(theme) => ({
                  p: 3,
                  borderRadius: radiusTokens.large,
                  background: "var(--app-surface)",
                  backdropFilter: "blur(var(--app-blur))",
                  border: "1px solid var(--app-card-border)",
                  boxShadow: elevationTokens.level3,
                })}
              >
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
                      {t("tickets.support_intelligence", { defaultValue: "Support Intelligence" })}
                    </Typography>
                    <Typography variant="h3">{t("tickets.queue_snapshot", { defaultValue: "Queue Snapshot" })}</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <KpiCard
                        label={t("tickets.snapshot.open", { defaultValue: "Active Tickets" })}
                        value={openCount}
                        loading={isLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("tickets.snapshot.vip", { defaultValue: "VIP Priority" })}
                        value={vipCount}
                        loading={isLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("tickets.snapshot.breached", { defaultValue: "SLA Breached" })}
                        value={breachedCount}
                        loading={isLoading}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ opacity: 0.1 }} />

                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      {t("table.last_updated")} · {lastUpdated || t("state.loading")}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setPriority("VIP")}
                        fullWidth
                      >
                        {t("tickets.filter.vip", { defaultValue: "VIP Only" })}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSlaState("breached")}
                        fullWidth
                      >
                        {t("tickets.filter.breached", { defaultValue: "Critical SLA" })}
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: radiusTokens.large,
                  background: "rgba(14,124,120,0.02)",
                  border: "1px dashed rgba(14,124,120,0.2)",
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {t("tickets.sla_reminder", { defaultValue: "Response Protocol" })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("tickets.sla_hint", { defaultValue: "Priority tickets require a response within 15 minutes to maintain SLA silver tier status." })}
                </Typography>
              </Paper>
            </Stack>
          </Grid>

          {/* Primary Data Tray (8 Columns) */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              <FilterBar
                savedViews={{
                  storageKey: "tickets.list",
                  getState: () => ({
                    status,
                    priority,
                    assignee,
                    queue,
                    startDate,
                    endDate,
                    slaState,
                  }),
                  applyState: (state) => {
                    setStatus(String(state.status || ""));
                    setPriority(String(state.priority || ""));
                    setAssignee(String(state.assignee || ""));
                    setQueue(String(state.queue || ""));
                    setStartDate(String(state.startDate || ""));
                    setEndDate(String(state.endDate || ""));
                    setSlaState(String(state.slaState || ""));
                    setPage(0);
                  },
                  defaultState: {
                    status: "",
                    priority: "",
                    assignee: "",
                    queue: "",
                    startDate: "",
                    endDate: "",
                    slaState: "",
                  },
                }}
                advanced={{
                  title: t("filter.advanced"),
                  content: (
                    <Stack spacing={2} mt={1}>
                      <TextField
                        label={t("tickets.assignee")}
                        value={assignee}
                        onChange={(event) => setAssignee(event.target.value)}
                        helperText={t("tickets.assignee.helper")}
                      />
                      <TextField
                        label={t("tickets.date_start")}
                        type="date"
                        size="small"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label={t("tickets.date_end")}
                        type="date"
                        size="small"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        select
                        label={t("tickets.sla_state")}
                        value={slaState}
                        onChange={(event) => setSlaState(event.target.value)}
                        size="small"
                      >
                        <MenuItem value="">{t("label.all")}</MenuItem>
                        {slaOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {t(`sla.state.${option}`)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  ),
                  onApply: () => setPage(0),
                  onReset: () => {
                    setAssignee("");
                    setStartDate("");
                    setEndDate("");
                    setSlaState("");
                  },
                }}
              >
                <TextField
                  select
                  label={t("label.status")}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t("tickets.priority")}
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  {priorityOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={t("tickets.queue")}
                  value={queue}
                  onChange={(event) => setQueue(event.target.value)}
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
                exportFilename="tickets.csv"
                onPageChange={setPage}
                onRowsPerPageChange={(size: number) => {
                  setRowsPerPage(size);
                  setPage(0);
                }}
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                density={density}
                onDensityChange={setDensity}
                onRowClick={(row: any) => navigate(`/tickets/${row.id}`)}
              />
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("tickets.assign")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <AssigneeSelect value={assigneeSelection} onChange={setAssigneeSelection} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            disabled={!assigneeSelection?.id || assignMutation.isLoading}
            onClick={() => assignMutation.mutate()}
          >
            {t("tickets.assign")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={statusOpen} onClose={() => setStatusOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("tickets.change_status")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            disabled={statusMutation.isLoading}
            onClick={() => statusMutation.mutate()}
          >
            {t("tickets.change_status")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
