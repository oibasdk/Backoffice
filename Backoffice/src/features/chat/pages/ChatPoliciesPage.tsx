import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { createChatPolicy, listChatPolicies } from "../api";

export const ChatPoliciesPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scopeType, setScopeType] = useState("global");
  const [scopeValue, setScopeValue] = useState("");

  const scopeOptions = [
    { value: "global", label: t("scope.global") },
    { value: "queue", label: t("scope.queue") },
    { value: "ticket_type", label: t("scope.ticket_type") },
  ];

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      is_active: status || undefined,
      scope_type: scopeFilter || undefined,
      ordering: "-updated_at",
    }),
    [page, rowsPerPage, search, status, scopeFilter]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["chat-policies", queryParams, tokens?.accessToken],
    queryFn: () => listChatPolicies(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createChatPolicy(tokens?.accessToken || "", {
        name,
        description: description || undefined,
        scope_type: scopeType,
        scope_value: scopeType === "global" ? null : scopeValue,
        is_active: true,
      }),
    onSuccess: () => {
      pushToast({ message: t("chat.policy.created"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["chat-policies"] });
      setDialogOpen(false);
      setName("");
      setDescription("");
      setScopeType("global");
      setScopeValue("");
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const rows = (data?.results || []).map((policy) => ({
    id: policy.id,
    exportData: {
      name: policy.name,
      scope: `${policy.scope_type}${policy.scope_value ? `: ${policy.scope_value}` : ""}`,
      status: policy.is_active ? "active" : "inactive",
      updated: policy.updated_at,
    },
    name: policy.name,
    scope: `${policy.scope_type}${policy.scope_value ? `: ${policy.scope_value}` : ""}`,
    status: (
      <Chip
        size="small"
        label={policy.is_active ? t("label.active") : t("label.inactive")}
        color={policy.is_active ? "success" : "default"}
      />
    ),
    updated: new Date(policy.updated_at).toLocaleString(),
  }));

  const columns = [
    { key: "name", label: t("chat.policy.name") },
    { key: "scope", label: t("chat.policy.scope") },
    { key: "status", label: t("label.status") },
    { key: "updated", label: t("table.column.updated") },
  ];

  return (
    <PermissionGate permissions={["chat_policy.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("chat.policy.title")}
          subtitle={t("chat.policy.subtitle")}
          actions={
            <PermissionGate permissions={["chat_policy.create"]}>
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                {t("action.create")}
              </Button>
            </PermissionGate>
          }
        />
        <FilterBar
          savedViews={{
            storageKey: "chat.policies",
            getState: () => ({ search, status, scopeFilter }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setStatus(String(state.status || ""));
              setScopeFilter(String(state.scopeFilter || ""));
              setPage(0);
            },
            defaultState: { search: "", status: "", scopeFilter: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("label.status")}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="true">{t("label.active")}</MenuItem>
                  <MenuItem value="false">{t("label.inactive")}</MenuItem>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setStatus(""),
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
            label={t("chat.policy.scope_type")}
            value={scopeFilter}
            onChange={(event) => setScopeFilter(event.target.value)}
            size="small"
          >
            <MenuItem value="">{t("label.all")}</MenuItem>
            {scopeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
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
          exportFilename="chat_policies.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
          onRowClick={(row) => navigate(`/chat/policies/${row.id}`)}
        />
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("chat.policy.new")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("chat.policy.name")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <TextField
              label={t("chat.policy.description")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
            />
            <TextField
              select
              label={t("chat.policy.scope_type")}
              value={scopeType}
              onChange={(event) => setScopeType(event.target.value)}
            >
              {scopeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            {scopeType !== "global" && (
              <TextField
                label={t("chat.policy.scope_value")}
                value={scopeValue}
                onChange={(event) => setScopeValue(event.target.value)}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={!name || (scopeType !== "global" && !scopeValue)}
          >
            {t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
