import React, { useMemo, useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listSessionEvents, SessionEvent } from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const eventOptions = [
  "session_started",
  "session_ended",
  "consent_requested",
  "consent_accepted",
  "consent_declined",
  "remote_connected",
  "remote_disconnected",
  "note",
];

export const SessionEventsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [eventType, setEventType] = useState("");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      event_type: eventType || undefined,
      search: search || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, eventType, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ras-session-events", queryParams, tokens?.accessToken],
    queryFn: () => listSessionEvents(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolveResults = (payload: PaginatedLike<SessionEvent> | SessionEvent[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as SessionEvent[] };
  };

  const resolvedData = resolveResults(data);

  const rows = (resolvedData.results || []).map((event) => ({
    id: event.id,
    exportData: {
      session: event.session,
      event_type: event.event_type,
      actor_label: event.actor_label ?? "",
      message: event.message ?? "",
      created_at: event.created_at,
    },
    session: event.session,
    event_type: event.event_type,
    actor: event.actor_label ?? "-",
    message: event.message ?? "-",
    created: new Date(event.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "session", label: t("ras_events.column.session") },
    { key: "event_type", label: t("ras_events.column.event_type") },
    { key: "actor", label: t("ras_events.column.actor") },
    { key: "message", label: t("ras_events.column.message") },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["session_event.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("ras_events.title")} subtitle={t("ras_events.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "ras.session_events",
            getState: () => ({ eventType, search }),
            applyState: (state) => {
              setEventType(String(state.eventType || ""));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { eventType: "", search: "" },
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
            label={t("ras_events.column.event_type")}
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {eventOptions.map((option) => (
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
          exportFilename="ras_session_events.csv"
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
