import React, { useMemo, useState, useEffect } from "react";
import { Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { listAuditLogs } from "../api";
import { useAuth } from "../../../app/providers/AuthProvider";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { PermissionGate } from "../../../auth/PermissionGate";

export const AuditLogsPage: React.FC = () => {
  const { tokens } = useAuth();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [success, setSuccess] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      action: action || undefined,
      resource: resource || undefined,
      success: success || undefined,
      ordering: "-timestamp",
    }),
    [page, rowsPerPage, search, action, resource, success]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit", queryParams, tokens?.accessToken],
    queryFn: () => listAuditLogs(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  useEffect(() => {
    if (data) {
      setLastUpdated(new Date().toLocaleString());
    }
  }, [data]);

  const rows = (data?.results || []).map((entry) => ({
    id: entry.id,
    exportData: {
      timestamp: entry.timestamp,
      user: entry.user_email || (entry.user ? String(entry.user) : "-"),
      action: entry.action,
      resource: entry.resource,
      ip_address: entry.ip_address || "-",
      success: entry.success ? "true" : "false",
      error_message: entry.error_message || "",
    },
    timestamp: new Date(entry.timestamp).toLocaleString(),
    user: entry.user_email || (entry.user ? String(entry.user) : "-"),
    action: entry.action,
    resource: entry.resource,
    ip: entry.ip_address || "-",
    error: entry.error_message || "-",
    success: (
      <Chip
        size="small"
        color={entry.success ? "success" : "error"}
        label={entry.success ? t("label.success") : t("label.failed")}
      />
    ),
  }));

  const columns = [
    { key: "timestamp", label: t("label.timestamp") },
    { key: "user", label: t("label.user") },
    { key: "action", label: t("label.action") },
    { key: "resource", label: t("label.resource") },
    { key: "ip", label: t("label.ip") },
    { key: "success", label: t("label.status") },
    { key: "error", label: t("label.error") },
  ];

  return (
    <PermissionGate permissions={["audit_log.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("audit.title")}
          subtitle={t("audit.subtitle")}
          actions={
            <Typography variant="caption" color="text.secondary">
              {t("table.last_updated")} · {lastUpdated || t("state.loading")}
            </Typography>
          }
        />
        <FilterBar
          savedViews={{
            storageKey: "audit.logs",
            getState: () => ({ search, action, resource, success }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setAction(String(state.action || ""));
              setResource(String(state.resource || ""));
              setSuccess(String(state.success || ""));
              setPage(0);
            },
            defaultState: { search: "", action: "", resource: "", success: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("label.resource")}
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  {[
                    "user",
                    "user_session",
                    "user_device",
                    "permission",
                    "role_template",
                    "permission_template",
                    "audit_log",
                    "system_alert",
                    "notification",
                    "analytics",
                    "security",
                    "feature_flag",
                    "app_setting",
                    "app_config_version",
                    "content_section",
                    "content_block",
                    "content_template",
                  ].map(
                    (option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    )
                  )}
                </TextField>
                <TextField
                  select
                  label={t("label.status")}
                  value={success}
                  onChange={(e) => setSuccess(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="true">{t("label.success")}</MenuItem>
                  <MenuItem value="false">{t("label.failed")}</MenuItem>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setResource("");
              setSuccess("");
            },
          }}
        >
          <TextField
            label={t("label.search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
          />
          <TextField
            select
            label={t("label.action")}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {[
              "login",
              "logout",
              "create",
              "update",
              "delete",
              "view",
              "export",
              "bulk_action",
              "permission_grant",
              "permission_revoke",
              "password_change",
              "account_status_change",
            ].map((option) => (
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
          totalCount={data?.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="audit_logs.csv"
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
