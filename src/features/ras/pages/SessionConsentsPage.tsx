import React, { useMemo, useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listSessionConsents, SessionConsent } from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const statusOptions = ["pending", "approved", "rejected", "expired", "cancelled"];

export const SessionConsentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      search: search || undefined,
      ordering: "-requested_at",
    }),
    [page, rowsPerPage, status, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ras-session-consents", queryParams, tokens?.accessToken],
    queryFn: () => listSessionConsents(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolveResults = (payload: PaginatedLike<SessionConsent> | SessionConsent[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as SessionConsent[] };
  };

  const resolvedData = resolveResults(data);

  const rows = (resolvedData.results || []).map((consent) => ({
    id: consent.id,
    exportData: {
      session: consent.session,
      status: consent.status,
      responder_label: consent.responder_label ?? "",
      requested_at: consent.requested_at ?? "",
      responded_at: consent.responded_at ?? "",
    },
    session: consent.session,
    status: consent.status,
    responder: consent.responder_label ?? "-",
    requested: consent.requested_at ? new Date(consent.requested_at).toLocaleString() : "-",
    responded: consent.responded_at ? new Date(consent.responded_at).toLocaleString() : "-",
  }));

  const columns = [
    { key: "session", label: t("ras_consents.column.session") },
    { key: "status", label: t("ras_consents.column.status") },
    { key: "responder", label: t("ras_consents.column.responder") },
    { key: "requested", label: t("ras_consents.column.requested_at") },
    { key: "responded", label: t("ras_consents.column.responded_at") },
  ];

  return (
    <PermissionGate permissions={["session_consent.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("ras_consents.title")} subtitle={t("ras_consents.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "ras.session_consents",
            getState: () => ({ status, search }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { status: "", search: "" },
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
            label={t("ras_consents.column.status")}
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
          exportFilename="ras_session_consents.csv"
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
