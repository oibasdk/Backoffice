import React, { useMemo, useState } from "react";
import { Chip, MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listPaymentMethods, PaymentMethod } from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const typeOptions = ["bank", "wallet"];

export const PaymentMethodsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [methodType, setMethodType] = useState("");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      is_active: status || undefined,
      method_type: methodType || undefined,
      search: search || undefined,
      ordering: "sort_order",
    }),
    [page, rowsPerPage, status, methodType, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-methods", queryParams, tokens?.accessToken],
    queryFn: () => listPaymentMethods(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolveResults = (payload: PaginatedLike<PaymentMethod> | PaymentMethod[] | null | undefined) => {
    if (Array.isArray(payload)) {
      return { count: payload.length, results: payload };
    }
    if (payload && Array.isArray(payload.results)) {
      return { count: payload.count ?? payload.results.length, results: payload.results };
    }
    return { count: 0, results: [] as PaymentMethod[] };
  };

  const resolvedData = resolveResults(data);

  const rows = (resolvedData.results || []).map((method) => ({
    id: method.id,
    exportData: {
      code: method.code,
      name_en: method.name_en,
      name_ar: method.name_ar,
      type: method.method_type,
      active: method.is_active ? "active" : "inactive",
      fee_percent: method.fee_percent ?? "",
      fee_cents: method.fee_cents ?? "",
      supports_qr: method.supports_qr ? "yes" : "no",
    },
    code: method.code,
    name: method.name_en || method.name_ar || "-",
    type: <Chip size="small" label={method.method_type || "-"} />,
    status: (
      <Chip
        size="small"
        color={method.is_active ? "success" : "default"}
        label={method.is_active ? t("label.active") : t("label.inactive")}
      />
    ),
    fees: `${method.fee_percent ?? 0}% + ${method.fee_cents ?? 0}`,
    supports_qr: method.supports_qr ? t("label.yes") : t("label.no"),
  }));

  const columns = [
    { key: "code", label: t("payment_methods.column.code") },
    { key: "name", label: t("payment_methods.column.name") },
    { key: "type", label: t("payment_methods.column.type") },
    { key: "status", label: t("payment_methods.column.status") },
    { key: "fees", label: t("payment_methods.column.fees") },
    { key: "supports_qr", label: t("payment_methods.column.supports_qr") },
  ];

  return (
    <PermissionGate permissions={["payment_method.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("payment_methods.title")} subtitle={t("payment_methods.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "payments.methods",
            getState: () => ({ status, methodType, search }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setMethodType(String(state.methodType || ""));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { status: "", methodType: "", search: "" },
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
            label={t("payment_methods.column.status")}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            <MenuItem value="true">{t("label.active")}</MenuItem>
            <MenuItem value="false">{t("label.inactive")}</MenuItem>
          </TextField>
          <TextField
            select
            label={t("payment_methods.column.type")}
            value={methodType}
            onChange={(event) => setMethodType(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {typeOptions.map((option) => (
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
          exportFilename="payment_methods.csv"
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
