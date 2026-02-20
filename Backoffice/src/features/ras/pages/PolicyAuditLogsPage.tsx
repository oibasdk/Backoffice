import React, { useMemo, useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listPolicyAuditLogs, type PolicyAuditLog } from "../api";

const policyOptions = ["sla", "escalation", "chat", "remote_session"];
const actionOptions = ["created", "updated", "published", "archived", "rolled_back", "simulated"];

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

export const PolicyAuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [policyType, setPolicyType] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      policy_type: policyType || undefined,
      action: action || undefined,
      search: search || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, policyType, action, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ras-policy-audit-logs", queryParams, tokens?.accessToken],
    queryFn: () => listPolicyAuditLogs(tokens?.accessToken || "", queryParams),
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

  const resolvedData = resolveResults<PolicyAuditLog>(data);

  const rows = resolvedData.results.map((log) => ({
    id: log.id,
    policy_type: log.policy_type,
    action: log.action,
    template_id: log.template_id,
    version_id: log.version_id || "-",
    actor_label: log.actor_label || "-",
    created: new Date(log.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "policy_type", label: t("ras.policy_audit.column.policy_type") },
    { key: "action", label: t("ras.policy_audit.column.action") },
    { key: "template_id", label: t("ras.policy_audit.column.template_id") },
    { key: "version_id", label: t("ras.policy_audit.column.version_id") },
    { key: "actor_label", label: t("ras.policy_audit.column.actor") },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["policy_audit.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("ras.policy_audit.title")} subtitle={t("ras.policy_audit.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "ras.policy_audit_logs",
            getState: () => ({ policyType, action, search }),
            applyState: (state) => {
              setPolicyType(String(state.policyType || ""));
              setAction(String(state.action || ""));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { policyType: "", action: "", search: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("ras.policy_audit.filter.search")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  size="small"
                />
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setSearch(""),
          }}
        >
          <TextField
            select
            label={t("ras.policy_audit.filter.policy")}
            value={policyType}
            onChange={(event) => setPolicyType(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {policyOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("ras.policy_audit.filter.action")}
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
          exportFilename="ras-policy-audit-logs.csv"
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
