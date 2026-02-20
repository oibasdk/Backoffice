import React, { useMemo, useState, useEffect } from "react";
import { Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listRemoteSessions } from "../api";

const statusOptions = ["pending", "active", "closed"];
const consentOptions = ["pending", "accepted", "declined", "expired", "not_required"];
const toolOptions = ["manual", "anydesk", "teamviewer"];

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

export const RemoteSessionsListPage: React.FC = () => {
  const { tokens } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  const [status, setStatus] = useState("");
  const [consent, setConsent] = useState("");
  const [tool, setTool] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      consent_status: consent || undefined,
      remote_tool: tool || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, status, consent, tool]
  );

  useEffect(() => {
    setPage(0);
  }, [status, consent, tool]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["remote-sessions", queryParams, tokens?.accessToken],
    queryFn: () => listRemoteSessions(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
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

  const resolvedData = resolveResults(data);

  const rows = resolvedData.results.map((session) => ({
    id: session.id,
    exportData: {
      ticket: session.ticket,
      status: session.status,
      consent: session.consent_status,
      tool: session.remote_tool,
      started_at: session.started_at || "",
      created_at: session.created_at || "",
    },
    ticket: (
      <Stack>
        <Typography variant="body2" fontWeight={600}>
          {session.ticket}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {session.id}
        </Typography>
      </Stack>
    ),
    status: <Chip size="small" label={session.status} />,
    consent: <Chip size="small" label={session.consent_status} />,
    tool: <Chip size="small" label={session.remote_tool} />,
    started_at: session.started_at ? new Date(session.started_at).toLocaleString() : "-",
    created_at: session.created_at ? new Date(session.created_at).toLocaleString() : "-",
  }));

  const columns = [
    { key: "ticket", label: t("remote_sessions.column.ticket") },
    { key: "status", label: t("remote_sessions.column.status") },
    { key: "consent", label: t("remote_sessions.column.consent") },
    { key: "tool", label: t("remote_sessions.column.tool") },
    { key: "started_at", label: t("remote_sessions.column.started") },
    { key: "created_at", label: t("remote_sessions.column.created") },
  ];

  return (
    <PermissionGate permissions={["remote_session.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("remote_sessions.title")} subtitle={t("remote_sessions.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "remote.sessions",
            getState: () => ({ status, consent, tool }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setConsent(String(state.consent || ""));
              setTool(String(state.tool || ""));
              setPage(0);
            },
            defaultState: { status: "", consent: "", tool: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("remote_sessions.tool")}
                  value={tool}
                  onChange={(event) => setTool(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  {toolOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setTool(""),
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
            label={t("remote_sessions.consent")}
            value={consent}
            onChange={(event) => setConsent(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {consentOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={isError}
          totalCount={resolvedData.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="remote_sessions.csv"
          density={density}
          onDensityChange={setDensity}
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          onRowClick={(row) => navigate(`/remote-sessions/${row.id}`)}
        />
      </Stack>
    </PermissionGate>
  );
};
