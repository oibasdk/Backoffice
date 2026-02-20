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
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { approveVendor, listVendors, rejectVendor } from "../api";

const roleOptions = ["vendor", "provider"];
const statusOptions = ["pending", "active", "rejected", "suspended", "inactive"];

export const VendorApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [role, setRole] = useState("vendor");
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      role: role || undefined,
      account_status: status || undefined,
      search: search || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, role, status, search]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor-approvals", queryParams, tokens?.accessToken],
    queryFn: () => listVendors(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => approveVendor(tokens?.accessToken || "", userId),
    onSuccess: () => {
      pushToast({ message: t("vendor.approvals.approved"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["vendor-approvals"] });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { userId: string; reason?: string }) =>
      rejectVendor(tokens?.accessToken || "", payload.userId, payload.reason),
    onSuccess: () => {
      pushToast({ message: t("vendor.approvals.rejected"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["vendor-approvals"] });
      setRejectOpen(false);
      setRejectReason("");
      setSelectedUserId(null);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (data?.results || []).map((user) => ({
    id: user.id,
    exportData: {
      user: user.email,
      role: user.role,
      status: user.account_status,
      created: user.created_at,
    },
    user: (
      <Stack>
        <Typography variant="body2" fontWeight={600}>
          {user.email}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user.phone || "-"}
        </Typography>
      </Stack>
    ),
    role: <Chip size="small" label={t(`role.${user.role}`)} />,
    status: <Chip size="small" label={user.account_status} />,
    created: new Date(user.created_at).toLocaleString(),
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <PermissionGate permissions={["vendor_approval.update"]}>
          <Button size="small" variant="outlined" onClick={() => approveMutation.mutate(String(user.id))}>
            {t("action.approve")}
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => {
              setSelectedUserId(String(user.id));
              setRejectOpen(true);
            }}
          >
            {t("action.reject")}
          </Button>
        </PermissionGate>
      </Stack>
    ),
  }));

  const columns = [
    { key: "user", label: t("vendor.approvals.user") },
    { key: "role", label: t("label.role") },
    { key: "status", label: t("label.status") },
    { key: "created", label: t("table.column.created") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["vendor_approval.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("vendor.approvals.title")} subtitle={t("vendor.approvals.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "marketplace.vendors",
            getState: () => ({ role, status, search }),
            applyState: (state) => {
              setRole(String(state.role || "vendor"));
              setStatus(String(state.status || "pending"));
              setSearch(String(state.search || ""));
              setPage(0);
            },
            defaultState: { role: "vendor", status: "pending", search: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  label={t("label.search")}
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
            label={t("label.role")}
            value={role}
            onChange={(event) => setRole(event.target.value)}
            size="small"
          >
            {roleOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {t(`role.${option}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("label.status")}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            size="small"
          >
            {statusOptions.map((option) => (
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
          exportFilename="vendor_approvals.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("vendor.approvals.reject_title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              {t("vendor.approvals.reject_hint")}
            </Typography>
            <TextField
              label={t("vendor.approvals.reject_reason")}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() =>
              selectedUserId &&
              rejectMutation.mutate({ userId: selectedUserId, reason: rejectReason || undefined })
            }
          >
            {t("action.reject")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
