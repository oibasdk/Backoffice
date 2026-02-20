import React, { useMemo, useState } from "react";
import { Chip, MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listSessionLogs, type SessionLog } from "../api";

const logTypeOptions = ["action", "security", "file_transfer"];

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

export const SessionLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [sessionId, setSessionId] = useState("");
  const [logType, setLogType] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      session: sessionId || undefined,
      log_type: logType || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, sessionId, logType]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ras-session-logs", queryParams, tokens?.accessToken],
    queryFn: () => listSessionLogs(tokens?.accessToken || "", queryParams),
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

  const resolvedData = resolveResults<SessionLog>(data);

  const rows = resolvedData.results.map((log) => ({
    id: log.id,
    session: log.ras_session,
    type: <Chip size="small" label={log.log_type} />,
    message: log.message,
    created: new Date(log.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "session", label: t("ras.logs.column.session") },
    { key: "type", label: t("ras.logs.column.type") },
    { key: "message", label: t("ras.logs.column.message") },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["session_log.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("ras.logs.title")} subtitle={t("ras.logs.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "ras.session_logs",
            getState: () => ({ sessionId, logType }),
            applyState: (state) => {
              setSessionId(String(state.sessionId || ""));
              setLogType(String(state.logType || ""));
              setPage(0);
            },
            defaultState: { sessionId: "", logType: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("label.session_id")}
                  value={sessionId}
                  onChange={(event) => setSessionId(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setSessionId(""),
          }}
        >
          <TextField
            select
            label={t("ras.logs.filter.type")}
            value={logType}
            onChange={(event) => setLogType(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {logTypeOptions.map((option) => (
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
          exportFilename="ras-session-logs.csv"
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
