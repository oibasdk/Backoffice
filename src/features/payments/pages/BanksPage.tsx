import React, { useMemo, useState } from "react";
import { Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listBanks, Bank } from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

export const BanksPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      ordering: "name_en",
    }),
    [page, rowsPerPage, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-banks", queryParams, tokens?.accessToken],
    queryFn: () => listBanks(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolveResults = (payload: PaginatedLike<Bank> | Bank[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as Bank[] };
  };

  const resolvedData = resolveResults(data);

  const rows = (resolvedData.results || []).map((bank) => ({
    id: bank.id,
    exportData: {
      name_en: bank.name_en,
      name_ar: bank.name_ar,
      deep_link: bank.deep_link,
    },
    name_en: bank.name_en,
    name_ar: bank.name_ar,
    deep_link: bank.deep_link,
  }));

  const columns = [
    { key: "name_en", label: t("banks.column.name_en") },
    { key: "name_ar", label: t("banks.column.name_ar") },
    { key: "deep_link", label: t("banks.column.deep_link") },
  ];

  return (
    <PermissionGate permissions={["bank.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("banks.title")} subtitle={t("banks.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "payments.banks",
            getState: () => ({ search }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { search: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: null,
            onApply: () => setPage(0),
            onReset: () => setSearch(""),
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
          totalCount={resolvedData.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="banks.csv"
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
