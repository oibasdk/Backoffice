import React, { useMemo, useState } from "react";
import { Chip, MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { PermissionGate } from "../../../auth/PermissionGate";
import { listPermissions } from "../api";

export const PermissionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      resource: resource || undefined,
      action: action || undefined,
      ordering: "resource",
    }),
    [page, rowsPerPage, search, resource, action]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["permissions", queryParams, tokens?.accessToken],
    queryFn: () => listPermissions(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const rows = (data?.results || []).map((permission) => ({
    id: permission.id,
    exportData: {
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description || "",
    },
    name: permission.name,
    resource: <Chip size="small" label={permission.resource} />,
    action: <Chip size="small" label={permission.action} />,
    description: permission.description || "-",
  }));

  const columns = [
    { key: "name", label: t("table.column.name") },
    { key: "resource", label: t("label.resource") },
    { key: "action", label: t("label.action") },
    { key: "description", label: t("label.description") },
  ];

  return (
    <PermissionGate permissions={["permission.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("iam.permissions.title")} subtitle={t("iam.permissions.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "iam.permissions",
            getState: () => ({ search, resource, action }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setResource(String(state.resource || ""));
              setAction(String(state.action || ""));
              setPage(0);
            },
            defaultState: { search: "", resource: "", action: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("label.resource")}
                  value={resource}
                  onChange={(event) => setResource(event.target.value)}
                  size="small"
                />
                <TextField
                  label={t("label.action")}
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setResource("");
              setAction("");
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
          exportFilename="permissions.csv"
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
