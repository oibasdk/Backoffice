import React, { useMemo, useState } from "react";
import { Button, Chip, MenuItem, Stack, TextField } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listUserSessions, terminateUserSession } from "../api";

export const UserSessionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [isGuest, setIsGuest] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      user: userId || undefined,
      is_guest: isGuest || undefined,
      ordering: "-last_seen_at",
    }),
    [page, rowsPerPage, search, userId, isGuest]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-sessions", queryParams, tokens?.accessToken],
    queryFn: () => listUserSessions(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const terminateMutation = useMutation({
    mutationFn: (sessionId: number) => terminateUserSession(tokens?.accessToken || "", sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      pushToast({ message: t("iam.sessions.terminated"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (data?.results || []).map((session) => ({
    id: session.id,
    exportData: {
      user: session.user_email || session.user || "",
      session_id: session.session_id,
      ip: session.ip_address || "",
      status: session.is_active ? "active" : "ended",
      last_seen: session.last_seen_at || "",
    },
    user: session.user_email || session.user || "-",
    session: session.session_id,
    ip: session.ip_address || "-",
    status: (
      <Chip size="small" label={session.is_active ? t("status.active") : t("iam.sessions.ended")} />
    ),
    last_seen: session.last_seen_at ? new Date(session.last_seen_at).toLocaleString() : "-",
    actions: (
      <PermissionGate permissions={["user_session.update"]}>
        <Button
          size="small"
          variant="outlined"
          disabled={!session.is_active}
          onClick={(event) => {
            event.stopPropagation();
            terminateMutation.mutate(session.id);
          }}
        >
          {t("iam.sessions.terminate")}
        </Button>
      </PermissionGate>
    ),
  }));

  const columns = [
    { key: "user", label: t("label.user") },
    { key: "session", label: t("iam.sessions.column.session") },
    { key: "ip", label: t("iam.sessions.column.ip") },
    { key: "status", label: t("label.status") },
    { key: "last_seen", label: t("iam.sessions.column.last_seen") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["user_session.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("iam.sessions.title")} subtitle={t("iam.sessions.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "iam.user_sessions",
            getState: () => ({ search, userId, isGuest }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setUserId(String(state.userId || ""));
              setIsGuest(String(state.isGuest || ""));
              setPage(0);
            },
            defaultState: { search: "", userId: "", isGuest: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("iam.sessions.filter.user_id")}
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  size="small"
                />
                <TextField
                  select
                  label={t("iam.sessions.filter.guest")}
                  value={isGuest}
                  onChange={(event) => setIsGuest(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="true">{t("iam.sessions.guest")}</MenuItem>
                  <MenuItem value="false">{t("iam.sessions.registered")}</MenuItem>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setUserId("");
              setIsGuest("");
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
          totalCount={data?.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="user_sessions.csv"
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
