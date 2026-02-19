import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
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
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../api";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const resolveResults = <T,>(payload: PaginatedLike<T> | T[] | null | undefined) => {
  if (Array.isArray(payload)) {
    return { count: payload.length, results: payload };
  }
  if (payload && Array.isArray(payload.results)) {
    return { count: payload.count ?? payload.results.length, results: payload.results };
  }
  return { count: 0, results: [] as T[] };
};

const typeOptions = ["", "info", "warning", "error", "success", "critical"];

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [isRead, setIsRead] = useState("");
  const [userId, setUserId] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      notification_type: type || undefined,
      is_read: isRead || undefined,
      user: userId || undefined,
      scope: "all",
      ordering: "-created_at",
    }),
    [page, rowsPerPage, search, type, isRead, userId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", queryParams, tokens?.accessToken],
    queryFn: () => listNotifications(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const resolved = resolveResults<NotificationItem>(data);
  const notifications = resolved.results || [];
  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const criticalCount = notifications.filter((item) => item.notification_type === "critical").length;
  const lastUpdated = notifications[0]?.created_at ? new Date(notifications[0].created_at).toLocaleString() : "-";

  const markMutation = useMutation({
    mutationFn: (notificationId: number) => markNotificationRead(tokens?.accessToken || "", notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      pushToast({ message: t("notifications.marked"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(tokens?.accessToken || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      pushToast({ message: t("notifications.marked_all"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolved.results.map((notification) => ({
    id: notification.id,
    exportData: {
      title: notification.title,
      type: notification.notification_type,
      user: notification.user_email || notification.user,
      status: notification.is_read ? "read" : "unread",
      created: notification.created_at,
    },
    title: notification.title,
    type: <Chip size="small" label={notification.notification_type} />,
    user: notification.user_email || notification.user || "-",
    status: (
      <Chip
        size="small"
        label={notification.is_read ? t("notifications.read") : t("notifications.unread")}
        color={notification.is_read ? "default" : "info"}
      />
    ),
    created: notification.created_at ? new Date(notification.created_at).toLocaleString() : "-",
    actions: (
      <PermissionGate permissions={["notification.update"]}>
        <Button
          size="small"
          variant="outlined"
          disabled={notification.is_read}
          onClick={(event) => {
            event.stopPropagation();
            markMutation.mutate(notification.id);
          }}
        >
          {t("notifications.mark_read")}
        </Button>
      </PermissionGate>
    ),
  }));

  const columns = [
    { key: "title", label: t("notifications.column.title") },
    { key: "type", label: t("notifications.column.type") },
    { key: "user", label: t("label.user") },
    { key: "status", label: t("label.status") },
    { key: "created", label: t("table.column.created") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["notification.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("notifications.title")}
          subtitle={t("notifications.subtitle")}
          actions={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(event) => setAutoRefresh(event.target.checked)}
                  />
                }
                label={t("notifications.auto_refresh")}
              />
              <PermissionGate permissions={["notification.update"]}>
                <Button variant="outlined" onClick={() => markAllMutation.mutate()}>
                  {t("notifications.mark_all")}
                </Button>
              </PermissionGate>
            </Stack>
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
              {t("notifications.context", { defaultValue: "Ops Communication" })}
            </Typography>
            <Typography variant="h1">{t("notifications.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("notifications.subtitle")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${t("notifications.unread")}: ${unreadCount}`} color="info" />
              <Chip size="small" label={`${t("notifications.critical", { defaultValue: "Critical" })}: ${criticalCount}`} />
              <Chip size="small" label={`${t("table.last_updated")} · ${lastUpdated}`} />
            </Stack>
          </Stack>
        </Paper>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("notifications.snapshot.total", { defaultValue: "Total Notifications" })} value={resolved.count} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("notifications.snapshot.unread", { defaultValue: "Unread" })} value={unreadCount} loading={isLoading} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KpiCard label={t("notifications.snapshot.critical", { defaultValue: "Critical" })} value={criticalCount} loading={isLoading} />
          </Grid>
        </Grid>
        <FilterBar
          savedViews={{
            storageKey: "ops.notifications",
            getState: () => ({ search, type, isRead, userId }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setType(String(state.type || ""));
              setIsRead(String(state.isRead || ""));
              setUserId(String(state.userId || ""));
              setPage(0);
            },
            defaultState: { search: "", type: "", isRead: "", userId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("notifications.filter.type")}
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  size="small"
                >
                  {typeOptions.map((option) => (
                    <MenuItem key={option || "all"} value={option}>
                      {option || t("label.all")}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t("notifications.filter.read")}
                  value={isRead}
                  onChange={(event) => setIsRead(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="true">{t("notifications.read")}</MenuItem>
                  <MenuItem value="false">{t("notifications.unread")}</MenuItem>
                </TextField>
                <TextField
                  label={t("notifications.filter.user")}
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setType("");
              setIsRead("");
              setUserId("");
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
          totalCount={resolved.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="notifications.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>
    </PermissionGate>
  );
};
