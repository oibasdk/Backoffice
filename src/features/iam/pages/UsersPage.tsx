import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { createUser, listUsers } from "../api";
import { useAuth } from "../../../app/providers/AuthProvider";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { PermissionGate } from "../../../auth/PermissionGate";
import { useToast } from "../../../app/providers/ToastProvider";
import { useAdminAccess } from "../../../auth/useAdminAccess";
import { KpiCard } from "../../../components/KpiCard";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

const roleOptions = ["", "customer", "vendor", "provider", "admin", "support_agent", "technician", "ops"];
const statusOptions = ["", "active", "inactive", "suspended", "pending"];

export const UsersPage: React.FC = () => {
  const { tokens } = useAuth();
  const { t } = useTranslation();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: access } = useAdminAccess(tokens?.accessToken || null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createPayload, setCreatePayload] = useState({
    email: "",
    password: "",
    role: "customer",
    phone: "",
    first_name: "",
    last_name: "",
    account_status: "active",
    is_active: true,
    is_staff: false,
    is_superuser: false,
    notes: "",
    provider_type: "",
    business_name: "",
    business_category: "",
    business_license_id: "",
  });
  const isProviderRole = createPayload.role === "provider";

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      role: role || undefined,
      account_status: status || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, search, role, status]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", queryParams, tokens?.accessToken],
    queryFn: () => listUsers(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createUser(tokens?.accessToken || "", {
        email: createPayload.email,
        password: createPayload.password,
        role: createPayload.role,
        phone: createPayload.phone || undefined,
        first_name: createPayload.first_name || undefined,
        last_name: createPayload.last_name || undefined,
        account_status: createPayload.account_status,
        is_active: createPayload.is_active,
        is_staff: createPayload.is_staff,
        is_superuser: createPayload.is_superuser,
        notes: createPayload.notes || undefined,
        provider_type: isProviderRole ? createPayload.provider_type || undefined : undefined,
        business_name: isProviderRole ? createPayload.business_name || undefined : undefined,
        business_category: isProviderRole ? createPayload.business_category || undefined : undefined,
        business_license_id: isProviderRole ? createPayload.business_license_id || undefined : undefined,
      }),
    onSuccess: () => {
      pushToast({ message: t("iam.users.created"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      setCreatePayload({
        email: "",
        password: "",
        role: "customer",
        phone: "",
        first_name: "",
        last_name: "",
        account_status: "active",
        is_active: true,
        is_staff: false,
        is_superuser: false,
        notes: "",
        provider_type: "",
        business_name: "",
        business_category: "",
        business_license_id: "",
      });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  useEffect(() => {
    if (data) {
      setLastUpdated(new Date().toLocaleString());
    }
  }, [data]);

  const columns = [
    { key: "email", label: t("table.column.name") },
    { key: "role", label: t("label.role") },
    { key: "status", label: t("label.status") },
    { key: "updated", label: t("table.column.updated") },
  ];

  const rows = (data?.results || []).map((user) => ({
    id: user.id,
    exportData: {
      email: user.email,
      user_code: user.user_code || "",
      role: user.role,
      status: user.account_status,
      updated: user.last_activity || "",
    },
    email: (
      <Stack>
        <Typography variant="body2" fontWeight={600}>
          {user.email}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user.first_name || ""} {user.last_name || ""}
        </Typography>
        {user.user_code && (
          <Typography variant="caption" color="text.secondary">
            {t("iam.user.user_code", { defaultValue: "User Code" })}: {user.user_code}
          </Typography>
        )}
      </Stack>
    ),
    role: <Chip size="small" label={user.role} />,
    status: <Chip size="small" color={user.is_active ? "success" : "default"} label={user.account_status} />,
    updated: user.last_activity ? new Date(user.last_activity).toLocaleString() : "-",
  }));

  return (
    <PermissionGate permissions={["user.view"]}>
      <Stack spacing={4}>
        <PageHeader
          title={t("iam.users.title")}
          subtitle={t("iam.users.subtitle")}
          sx={{ mb: 1 }}
        />

        <Grid container spacing={3}>
          {/* Intelligence Tray (4 Columns) */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              <Paper
                sx={(theme) => ({
                  p: 3,
                  borderRadius: radiusTokens.large,
                  background: "var(--app-surface)",
                  backdropFilter: "blur(var(--app-blur))",
                  border: "1px solid var(--app-card-border)",
                  boxShadow: elevationTokens.level3,
                })}
              >
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
                      {t("iam.users.intelligence", { defaultValue: "User Intelligence" })}
                    </Typography>
                    <Typography variant="h3">{t("iam.users.snapshot")}</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("iam.users.total", { defaultValue: "Total Users" })}
                        value={data?.count ?? "-"}
                        loading={isLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("iam.users.active_now", { defaultValue: "Active" })}
                        value={(data?.results || []).filter(u => u.is_active).length}
                        loading={isLoading}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ opacity: 0.1 }} />

                  <Stack spacing={2}>
                    <Typography variant="caption" color="text.secondary">
                      {t("iam.users.quick_controls", { defaultValue: "Quick Controls" })}
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                      <PermissionGate permissions={["user.create"]}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => setCreateOpen(true)}
                          sx={{ py: 1.5 }}
                        >
                          {t("action.create")}
                        </Button>
                      </PermissionGate>
                      <Button
                        variant="outlined"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
                      >
                        {t("button.refresh")}
                      </Button>
                    </Stack>
                  </Stack>

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("table.last_updated")} · {lastUpdated || t("state.loading")}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: radiusTokens.large,
                  background: "rgba(14,124,120,0.02)",
                  border: "1px dashed rgba(14,124,120,0.2)",
                }}
              >
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {t("iam.users.insight_hint", { defaultValue: "Use filters to refine the intelligence tray data." })}
                </Typography>
              </Paper>
            </Stack>
          </Grid>

          {/* Primary Data Tray (8 Columns) */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              <FilterBar
                savedViews={{
                  storageKey: "iam.users",
                  getState: () => ({ search, role, status }),
                  applyState: (state: any) => {
                    setSearch(String(state.search || ""));
                    setRole(String(state.role || ""));
                    setStatus(String(state.status || ""));
                    setPage(0);
                  },
                  defaultState: { search: "", role: "", status: "" },
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
                        {statusOptions.map((option) => (
                          <MenuItem key={option || "all"} value={option}>
                            {option || t("label.all")}
                          </MenuItem>
                        ))}
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
                  label={t("label.role")}
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  size="small"
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option || "all"} value={option}>
                      {option || t("label.all")}
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
                exportFilename="users.csv"
                onPageChange={setPage}
                onRowsPerPageChange={(size: number) => {
                  setRowsPerPage(size);
                  setPage(0);
                }}
                density={density}
                onDensityChange={setDensity}
                onRowClick={(row: any) => navigate(`/iam/users/${row.id}`)}
              />
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("iam.users.new")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("iam.user.email")}
              value={createPayload.email}
              onChange={(event) => setCreatePayload({ ...createPayload, email: event.target.value })}
            />
            <TextField
              label={t("iam.user.password")}
              type="password"
              value={createPayload.password}
              onChange={(event) => setCreatePayload({ ...createPayload, password: event.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("iam.user.first_name")}
                value={createPayload.first_name}
                onChange={(event) => setCreatePayload({ ...createPayload, first_name: event.target.value })}
              />
              <TextField
                label={t("iam.user.last_name")}
                value={createPayload.last_name}
                onChange={(event) => setCreatePayload({ ...createPayload, last_name: event.target.value })}
              />
            </Stack>
            <TextField
              label={t("iam.user.phone")}
              value={createPayload.phone}
              onChange={(event) => setCreatePayload({ ...createPayload, phone: event.target.value })}
            />
            <TextField
              select
              label={t("label.role")}
              value={createPayload.role}
              onChange={(event) => {
                const role = event.target.value;
                setCreatePayload((prev) => ({
                  ...prev,
                  role,
                  ...(role !== "provider"
                    ? {
                      provider_type: "",
                      business_name: "",
                      business_category: "",
                      business_license_id: "",
                    }
                    : {}),
                }));
              }}
            >
              {roleOptions
                .filter((option) => {
                  if (!option) {
                    return false;
                  }
                  if (!access?.is_superuser && ["admin", "superadmin", "support_agent", "technician", "ops"].includes(option)) {
                    return false;
                  }
                  return true;
                })
                .map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`role.${option}`, option)}
                  </MenuItem>
                ))}
            </TextField>
            {isProviderRole && (
              <Stack spacing={2}>
                <TextField
                  select
                  label={t("label.provider_type")}
                  value={createPayload.provider_type}
                  onChange={(event) =>
                    setCreatePayload({ ...createPayload, provider_type: event.target.value })
                  }
                >
                  <MenuItem value="">{t("label.select")}</MenuItem>
                  <MenuItem value="physical">{t("provider.physical")}</MenuItem>
                  <MenuItem value="digital">{t("provider.digital")}</MenuItem>
                </TextField>
                <TextField
                  label={t("label.business_name")}
                  value={createPayload.business_name}
                  onChange={(event) =>
                    setCreatePayload({ ...createPayload, business_name: event.target.value })
                  }
                  placeholder={t("placeholder.business_name", { defaultValue: "Sharoobi Store" })}
                />
                <TextField
                  label={t("label.business_category")}
                  value={createPayload.business_category}
                  onChange={(event) =>
                    setCreatePayload({ ...createPayload, business_category: event.target.value })
                  }
                  placeholder={t("placeholder.business_category", { defaultValue: "Electronics" })}
                />
                <TextField
                  label={t("label.business_license")}
                  value={createPayload.business_license_id}
                  onChange={(event) =>
                    setCreatePayload({ ...createPayload, business_license_id: event.target.value })
                  }
                  placeholder={t("placeholder.business_license", { defaultValue: "CR-123456" })}
                />
              </Stack>
            )}
            <TextField
              select
              label={t("iam.users.account_status")}
              value={createPayload.account_status}
              onChange={(event) => setCreatePayload({ ...createPayload, account_status: event.target.value })}
            >
              <MenuItem value="active">{t("label.active")}</MenuItem>
              <MenuItem value="inactive">{t("label.inactive")}</MenuItem>
              <MenuItem value="pending">{t("status.pending")}</MenuItem>
              <MenuItem value="suspended">{t("status.suspended")}</MenuItem>
              <MenuItem value="rejected">{t("status.rejected")}</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={createPayload.is_active}
                  onChange={(event) => setCreatePayload({ ...createPayload, is_active: event.target.checked })}
                />
              }
              label={t("iam.users.active")}
            />
            {access?.is_superuser && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={createPayload.is_staff}
                      onChange={(event) => setCreatePayload({ ...createPayload, is_staff: event.target.checked })}
                    />
                  }
                  label={t("iam.user.staff")}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={createPayload.is_superuser}
                      onChange={(event) =>
                        setCreatePayload({ ...createPayload, is_superuser: event.target.checked })
                      }
                    />
                  }
                  label={t("iam.user.superuser")}
                />
              </Stack>
            )}
            <TextField
              label={t("iam.user.notes")}
              value={createPayload.notes}
              onChange={(event) => setCreatePayload({ ...createPayload, notes: event.target.value })}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={
              !createPayload.email ||
              !createPayload.password ||
              (isProviderRole && !createPayload.provider_type)
            }
          >
            {t("action.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
