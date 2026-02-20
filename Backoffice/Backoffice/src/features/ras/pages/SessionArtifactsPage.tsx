import React, { useMemo, useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listSessionArtifacts, SessionArtifact } from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const artifactOptions = ["log", "snapshot", "file", "transcript", "note"];

export const SessionArtifactsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [artifactType, setArtifactType] = useState("");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      artifact_type: artifactType || undefined,
      search: search || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, artifactType, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ras-session-artifacts", queryParams, tokens?.accessToken],
    queryFn: () => listSessionArtifacts(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolveResults = (payload: PaginatedLike<SessionArtifact> | SessionArtifact[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as SessionArtifact[] };
  };

  const resolvedData = resolveResults(data);

  const rows = (resolvedData.results || []).map((artifact) => ({
    id: artifact.id,
    exportData: {
      session: artifact.session,
      artifact_type: artifact.artifact_type,
      label: artifact.label ?? "",
      url: artifact.url ?? "",
      created_at: artifact.created_at,
    },
    session: artifact.session,
    type: artifact.artifact_type,
    label: artifact.label ?? "-",
    url: artifact.url ?? "-",
    created: new Date(artifact.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "session", label: t("ras_artifacts.column.session") },
    { key: "type", label: t("ras_artifacts.column.type") },
    { key: "label", label: t("ras_artifacts.column.label") },
    { key: "url", label: t("ras_artifacts.column.url") },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["session_artifact.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("ras_artifacts.title")} subtitle={t("ras_artifacts.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "ras.session_artifacts",
            getState: () => ({ artifactType, search }),
            applyState: (state) => {
              setArtifactType(String(state.artifactType || ""));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { artifactType: "", search: "" },
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
            label={t("ras_artifacts.column.type")}
            value={artifactType}
            onChange={(event) => setArtifactType(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {artifactOptions.map((option) => (
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
          exportFilename="ras_session_artifacts.csv"
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
