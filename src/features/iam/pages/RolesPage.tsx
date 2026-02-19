import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  listRoleTemplates,
  listPermissionTemplates,
  RoleTemplate,
  updateRoleTemplate,
  applyRoleTemplate,
} from "../api";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useAdminAccess } from "../../../auth/useAdminAccess";
import { DataTable } from "../../../components/DataTable";
import { PageHeader } from "../../../components/PageHeader";
import { PermissionGate } from "../../../auth/PermissionGate";
import { useToast } from "../../../app/providers/ToastProvider";
import { FilterBar } from "../../../components/FilterBar";
import { KpiCard } from "../../../components/KpiCard";
import { elevationTokens, radiusTokens } from "../../../design-system/tokens";

export const RolesPage: React.FC = () => {
  const { tokens } = useAuth();
  const { t, i18n } = useTranslation();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [rolePage, setRolePage] = useState(0);
  const [roleRowsPerPage, setRoleRowsPerPage] = useState(10);
  const [permPage, setPermPage] = useState(0);
  const [permRowsPerPage, setPermRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [roleSearch, setRoleSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleStatus, setRoleStatus] = useState("");
  const [permSearch, setPermSearch] = useState("");
  const [permStatus, setPermStatus] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleTemplate | null>(null);
  const isRtl = i18n.language.startsWith("ar");
  const { data: access } = useAdminAccess(tokens?.accessToken || null);
  const canEdit = Boolean(access?.is_superuser || access?.permissions?.includes("role_template.update"));

  const roleQueryParams = useMemo(
    () => ({
      page: rolePage + 1,
      page_size: roleRowsPerPage,
      search: roleSearch || undefined,
      role: roleFilter || undefined,
      is_active: roleStatus || undefined,
      ordering: "role",
    }),
    [rolePage, roleRowsPerPage, roleSearch, roleFilter, roleStatus]
  );

  const permissionQueryParams = useMemo(
    () => ({
      page: permPage + 1,
      page_size: permRowsPerPage,
      search: permSearch || undefined,
      is_active: permStatus || undefined,
      ordering: "name",
    }),
    [permPage, permRowsPerPage, permSearch, permStatus]
  );

  const { data: roleTemplates, isLoading: roleLoading, isError: roleError } = useQuery({
    queryKey: ["role-templates", roleQueryParams, tokens?.accessToken],
    queryFn: () => listRoleTemplates(tokens?.accessToken || "", roleQueryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const { data: permissionTemplates, isLoading: permLoading, isError: permError } = useQuery({
    queryKey: ["permission-templates", permissionQueryParams, tokens?.accessToken],
    queryFn: () => listPermissionTemplates(tokens?.accessToken || "", permissionQueryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RoleTemplate> }) =>
      updateRoleTemplate(tokens?.accessToken || "", id, payload),
    onSuccess: () => {
      pushToast({ message: t("iam.roles.saved"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["role-templates"] });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (roleId: number) => applyRoleTemplate(tokens?.accessToken || "", roleId),
    onSuccess: () => {
      pushToast({ message: t("iam.roles.applied"), severity: "success" });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const roleColumns = [
    { key: "name", label: t("table.column.name") },
    { key: "role", label: t("label.role") },
    { key: "status", label: t("label.status") },
  ];

  const roleRows = (roleTemplates?.results || []).map((role) => ({
    id: role.id,
    exportData: {
      name: role.name,
      role: role.role,
      status: role.is_active ? "active" : "inactive",
    },
    name: role.name,
    role: <Chip size="small" label={role.role} />,
    status: <Chip size="small" label={role.is_active ? t("label.active") : t("label.inactive")} />,
  }));

  const permissionColumns = [
    { key: "name", label: t("table.column.name") },
    { key: "status", label: t("label.status") },
  ];

  const permissionRows = (permissionTemplates?.results || []).map((template) => ({
    id: template.id,
    exportData: {
      name: template.name,
      status: template.is_active ? "active" : "inactive",
    },
    name: template.name,
    status: <Chip size="small" label={template.is_active ? t("label.active") : t("label.inactive")} />,
  }));

  const drawerContent = useMemo(() => {
    if (!selectedRole) {
      return null;
    }
    return (
      <Stack spacing={2}>
        <Typography variant="h6">{t("iam.roles.edit")}</Typography>
        <TextField
          label={t("table.column.name")}
          value={selectedRole.name}
          onChange={(event) =>
            setSelectedRole({
              ...selectedRole,
              name: event.target.value,
            })
          }
        />
        <TextField
          label={t("iam.roles.description")}
          value={selectedRole.description || ""}
          onChange={(event) =>
            setSelectedRole({
              ...selectedRole,
              description: event.target.value,
            })
          }
          multiline
          minRows={3}
        />
        <FormControlLabel
          control={
            <Switch
              checked={selectedRole.is_active}
              onChange={(event) =>
                setSelectedRole({
                  ...selectedRole,
                  is_active: event.target.checked,
                })
              }
            />
          }
          label={t("iam.roles.active")}
        />
        <Button
          variant="contained"
          disabled={!canEdit}
          onClick={() =>
            mutation.mutate({
              id: selectedRole.id,
              payload: {
                name: selectedRole.name,
                description: selectedRole.description,
                is_active: selectedRole.is_active,
              },
            })
          }
        >
          {t("iam.roles.save")}
        </Button>
        <Button
          variant="outlined"
          disabled={!canEdit || applyMutation.isLoading}
          onClick={() => applyMutation.mutate(selectedRole.id)}
        >
          {t("iam.roles.apply")}
        </Button>
      </Stack>
    );
  }, [selectedRole, mutation, applyMutation, canEdit, t]);

  return (
    <PermissionGate permissions={["role_template.view", "permission_template.view"]}>
      <Stack spacing={4}>
        <PageHeader title={t("iam.roles.title")} subtitle={t("iam.roles.subtitle")} sx={{ mb: 1 }} />

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
                      {t("iam.roles.auth_intelligence", { defaultValue: "Auth Intelligence" })}
                    </Typography>
                    <Typography variant="h3">{t("iam.roles.auth_summary")}</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("iam.roles.total_roles", { defaultValue: "Roles" })}
                        value={roleTemplates?.count ?? "-"}
                        loading={roleLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <KpiCard
                        label={t("iam.roles.total_perms", { defaultValue: "Permissions" })}
                        value={permissionTemplates?.count ?? "-"}
                        loading={permLoading}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ opacity: 0.1 }} />

                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      {t("iam.roles.auth_insight", { defaultValue: "Manage standardized roles and fine-grained permissions for the entire ecosystem." })}
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["role-templates"] });
                        queryClient.invalidateQueries({ queryKey: ["permission-templates"] });
                      }}
                    >
                      {t("button.sync_access", { defaultValue: "Sync Access Models" })}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: radiusTokens.large,
                  background: "rgba(33,64,153,0.02)",
                  border: "1px dashed rgba(33,64,153,0.2)",
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {t("iam.roles.security_note", { defaultValue: "Security Tip" })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("iam.roles.security_hint", { defaultValue: "Prefer using Role Templates instead of direct user permissions for better audit trails." })}
                </Typography>
              </Paper>
            </Stack>
          </Grid>

          {/* Primary Data Tray (8 Columns) */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              <Paper
                sx={{
                  background: "transparent",
                  borderBottom: 1,
                  borderColor: "divider",
                  mb: -1,
                }}
              >
                <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 1 }}>
                  <Tab label={t("iam.roles.tab.roles")} sx={{ fontWeight: 600 }} />
                  <Tab label={t("iam.roles.tab.permissions")} sx={{ fontWeight: 600 }} />
                </Tabs>
              </Paper>

              {tab === 0 && (
                <Stack spacing={3}>
                  <FilterBar
                    savedViews={{
                      storageKey: "iam.role_templates",
                      getState: () => ({ roleSearch, roleFilter, roleStatus }),
                      applyState: (state) => {
                        setRoleSearch(String(state.roleSearch || ""));
                        setRoleFilter(String(state.roleFilter || ""));
                        setRoleStatus(String(state.roleStatus || ""));
                        setRolePage(0);
                      },
                      defaultState: { roleSearch: "", roleFilter: "", roleStatus: "" },
                    }}
                    advanced={{
                      title: t("filter.advanced"),
                      content: (
                        <Stack spacing={2} mt={1}>
                          <TextField
                            select
                            label={t("label.status")}
                            value={roleStatus}
                            onChange={(event) => setRoleStatus(event.target.value)}
                            size="small"
                          >
                            <MenuItem value="">{t("label.all")}</MenuItem>
                            <MenuItem value="true">{t("label.active")}</MenuItem>
                            <MenuItem value="false">{t("label.inactive")}</MenuItem>
                          </TextField>
                        </Stack>
                      ),
                      onApply: () => setRolePage(0),
                      onReset: () => setRoleStatus(""),
                    }}
                  >
                    <TextField
                      label={t("label.search")}
                      value={roleSearch}
                      onChange={(event) => setRoleSearch(event.target.value)}
                      size="small"
                    />
                    <TextField
                      label={t("label.role")}
                      value={roleFilter}
                      onChange={(event) => setRoleFilter(event.target.value)}
                      size="small"
                    />
                  </FilterBar>

                  <DataTable
                    columns={roleColumns}
                    rows={roleRows}
                    loading={roleLoading}
                    error={roleError}
                    totalCount={roleTemplates?.count}
                    page={rolePage}
                    rowsPerPage={roleRowsPerPage}
                    exportFilename="role_templates.csv"
                    density={density}
                    onDensityChange={setDensity}
                    onPageChange={setRolePage}
                    onRowsPerPageChange={(size) => {
                      setRoleRowsPerPage(size);
                      setRolePage(0);
                    }}
                    onRowClick={(row: any) => {
                      const role = roleTemplates?.results.find((item) => item.id === row.id);
                      if (role) {
                        setSelectedRole(role);
                      }
                    }}
                  />
                </Stack>
              )}

              {tab === 1 && (
                <Stack spacing={3}>
                  <FilterBar
                    savedViews={{
                      storageKey: "iam.permission_templates",
                      getState: () => ({ permSearch, permStatus }),
                      applyState: (state) => {
                        setPermSearch(String(state.permSearch || ""));
                        setPermStatus(String(state.permStatus || ""));
                        setPermPage(0);
                      },
                      defaultState: { permSearch: "", permStatus: "" },
                    }}
                    advanced={{
                      title: t("filter.advanced"),
                      content: (
                        <Stack spacing={2} mt={1}>
                          <TextField
                            select
                            label={t("label.status")}
                            value={permStatus}
                            onChange={(event) => setPermStatus(event.target.value)}
                            size="small"
                          >
                            <MenuItem value="">{t("label.all")}</MenuItem>
                            <MenuItem value="true">{t("label.active")}</MenuItem>
                            <MenuItem value="false">{t("label.inactive")}</MenuItem>
                          </TextField>
                        </Stack>
                      ),
                      onApply: () => setPermPage(0),
                      onReset: () => setPermStatus(""),
                    }}
                  >
                    <TextField
                      label={t("label.search")}
                      value={permSearch}
                      onChange={(event) => setPermSearch(event.target.value)}
                      size="small"
                    />
                  </FilterBar>

                  <DataTable
                    columns={permissionColumns}
                    rows={permissionRows}
                    loading={permLoading}
                    error={permError}
                    totalCount={permissionTemplates?.count}
                    page={permPage}
                    rowsPerPage={permRowsPerPage}
                    exportFilename="permission_templates.csv"
                    density={density}
                    onDensityChange={setDensity}
                    onPageChange={setPermPage}
                    onRowsPerPageChange={(size) => {
                      setPermRowsPerPage(size);
                      setPermPage(0);
                    }}
                  />
                </Stack>
              )}
            </Stack>
          </Grid>
        </Grid>
        <Drawer
          anchor={isRtl ? "left" : "right"}
          open={Boolean(selectedRole)}
          onClose={() => setSelectedRole(null)}
          PaperProps={{ sx: { p: 3, width: 360 } }}
        >
          {drawerContent}
        </Drawer>
      </Stack>
    </PermissionGate>
  );
};
