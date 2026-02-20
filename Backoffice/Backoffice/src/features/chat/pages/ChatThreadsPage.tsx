import React, { useMemo, useState } from "react";
import { Chip, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listChatThreads } from "../api";

export const ChatThreadsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      ordering: "-updated_at",
      status: status || undefined,
    }),
    [page, rowsPerPage, status]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["chat-threads", queryParams, tokens?.accessToken],
    queryFn: () => listChatThreads(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const columns = [
    { key: "ticket", label: t("chat.thread.ticket") },
    { key: "status", label: t("label.status") },
    { key: "updated", label: t("table.column.updated") },
  ];

  const rows = (data?.results || []).map((thread) => ({
    id: thread.id,
    exportData: {
      ticket: thread.ticket_title || thread.ticket || "",
      status: thread.status,
      updated: thread.updated_at || "",
    },
    ticket: thread.ticket_title || thread.ticket,
    status: <Chip size="small" label={t(`chat.thread.status.${thread.status}`)} />,
    updated: thread.updated_at ? new Date(thread.updated_at).toLocaleString() : "-",
  }));

  return (
    <PermissionGate permissions={["chat_thread.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("chat.threads.title")} subtitle={t("chat.threads.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "chat.threads",
            getState: () => ({ status }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setPage(0);
            },
            defaultState: { status: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  size="small"
                  label={t("label.status")}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  SelectProps={{ native: true }}
                >
                  <option value="">{t("label.all")}</option>
                  <option value="open">{t("chat.thread.status.open")}</option>
                  <option value="closed">{t("chat.thread.status.closed")}</option>
                  <option value="archived">{t("chat.thread.status.archived")}</option>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setStatus(""),
          }}
        >
          <TextField
            select
            size="small"
            label={t("label.status")}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="">{t("label.all")}</option>
            <option value="open">{t("chat.thread.status.open")}</option>
            <option value="closed">{t("chat.thread.status.closed")}</option>
            <option value="archived">{t("chat.thread.status.archived")}</option>
          </TextField>
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={isError}
          totalCount={data?.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="chat_threads.csv"
          density={density}
          onDensityChange={setDensity}
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          onRowClick={(row) => navigate(`/chat/threads/${row.id}`)}
        />
      </Stack>
    </PermissionGate>
  );
};
