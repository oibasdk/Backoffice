import React, { useMemo, useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listChatModerationLogs, ChatModerationLog } from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const actionOptions = ["flag", "block", "approve", "escalate", "mute"];

export const ChatModerationLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      action: action || undefined,
      search: search || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, action, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ras-chat-moderation-logs", queryParams, tokens?.accessToken],
    queryFn: () => listChatModerationLogs(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolveResults = (payload: PaginatedLike<ChatModerationLog> | ChatModerationLog[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as ChatModerationLog[] };
  };

  const resolvedData = resolveResults(data);

  const rows = (resolvedData.results || []).map((log) => ({
    id: log.id,
    exportData: {
      message: log.message,
      action: log.action,
      actor_label: log.actor_label ?? "",
      reason: log.reason ?? "",
      created_at: log.created_at,
    },
    message: log.message,
    action: log.action,
    actor: log.actor_label ?? "-",
    reason: log.reason ?? "-",
    created: new Date(log.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "message", label: t("ras_moderation.column.message") },
    { key: "action", label: t("ras_moderation.column.action") },
    { key: "actor", label: t("ras_moderation.column.actor") },
    { key: "reason", label: t("ras_moderation.column.reason") },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["chat_moderation_log.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("ras_moderation.title")} subtitle={t("ras_moderation.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "ras.chat_moderation",
            getState: () => ({ action, search }),
            applyState: (state) => {
              setAction(String(state.action || ""));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { action: "", search: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: null,
            onApply: () => setPage(0),
            onReset: () => setSearch(""),
          }}
        >
          <TextField
            select
            label={t("ras_moderation.column.action")}
            value={action}
            onChange={(event) => setAction(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {actionOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
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
          totalCount={resolvedData.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="ras_chat_moderation_logs.csv"
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
