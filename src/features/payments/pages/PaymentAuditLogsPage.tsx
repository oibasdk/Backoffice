import React, { useMemo, useState } from "react";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listPaymentAuditLogs, type PaymentAuditLog } from "../api";

const resourceOptions = ["payment_intent", "payment_proof", "order", "escrow"];
const actionOptions = ["create", "update", "status_change", "approve", "reject", "refund"];

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

export const PaymentAuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [resourceType, setResourceType] = useState("");
  const [action, setAction] = useState("");
  const [actorId, setActorId] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      resource_type: resourceType || undefined,
      action: action || undefined,
      actor_id: actorId || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, resourceType, action, actorId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-audit-logs", queryParams, tokens?.accessToken],
    queryFn: () => listPaymentAuditLogs(tokens?.accessToken || "", queryParams),
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

  const resolvedData = resolveResults<PaymentAuditLog>(data);

  const rows = resolvedData.results.map((entry) => ({
    id: entry.id,
    resource_type: entry.resource_type,
    resource_id: entry.resource_id,
    action: entry.action,
    actor_id: entry.actor_id || "-",
    created_at: new Date(entry.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "resource_type", label: t("payments.audit.column.resource_type") },
    { key: "resource_id", label: t("payments.audit.column.resource_id") },
    { key: "action", label: t("payments.audit.column.action") },
    { key: "actor_id", label: t("payments.audit.column.actor_id") },
    { key: "created_at", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["payment_audit_log.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("payments.audit.title")} subtitle={t("payments.audit.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "payments.audit_logs",
            getState: () => ({ resourceType, action, actorId }),
            applyState: (state) => {
              setResourceType(String(state.resourceType || ""));
              setAction(String(state.action || ""));
              setActorId(String(state.actorId || ""));
              setPage(0);
            },
            defaultState: { resourceType: "", action: "", actorId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("payments.audit.filter.actor")}
                  value={actorId}
                  onChange={(event) => setActorId(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setActorId(""),
          }}
        >
          <TextField
            select
            label={t("payments.audit.filter.resource")}
            value={resourceType}
            onChange={(event) => setResourceType(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {resourceOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("payments.audit.filter.action")}
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
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={isError}
          totalCount={resolvedData.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="payment-audit-logs.csv"
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
