import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { useAdminAccess } from "../../../auth/useAdminAccess";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { RightPanel } from "../../../components/RightPanel";
import { FullPageError, FullPageLoader } from "../../../components/StateViews";
import {
  Permission,
  UserPermission,
  activateUser,
  getUser,
  grantUserPermission,
  listPermissions,
  listRoleTemplates,
  listUserPermissions,
  listUserSessions,
  lockUser,
  resetUserTwoFa,
  revokeUserPermission,
  suspendUser,
  setUserSessionTimeout,
  setUserPin,
  terminateUserSession,
  unlockUser,
  updateUser,
  verifyUserEmail,
} from "../api";

const INTERNAL_ROLES = new Set(["admin", "superadmin", "support_agent", "technician", "ops"]);

export const UserDetailPage: React.FC = () => {
  const { tokens } = useAuth();
  const { id } = useParams();
  const { t } = useTranslation();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const { data: access } = useAdminAccess(tokens?.accessToken || null);

  const canUpdateUser = Boolean(access?.is_superuser || access?.permissions?.includes("user.update"));
  const canManageSessions = Boolean(
    access?.is_superuser || access?.permissions?.includes("user_session.update")
  );
  const canViewPermissions = Boolean(
    access?.is_superuser || access?.permissions?.includes("user_permission.view")
  );
  const canEditPermissions = Boolean(
    access?.is_superuser || access?.permissions?.includes("user_permission.update")
  );

  const [tab, setTab] = useState(0);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [lockMinutes, setLockMinutes] = useState(30);
  const [lockReason, setLockReason] = useState("");
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [timeoutDialogOpen, setTimeoutDialogOpen] = useState(false);
  const [timeoutValue, setTimeoutValue] = useState<number>(3600);
  const [notesValue, setNotesValue] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  const [sessionPage, setSessionPage] = useState(0);
  const [sessionRowsPerPage, setSessionRowsPerPage] = useState(10);
  const [permissionBusyId, setPermissionBusyId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", id, tokens?.accessToken],
    queryFn: () => getUser(tokens?.accessToken || "", id || ""),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const userId = data?.id ?? null;
  const isInternal = data?.role ? INTERNAL_ROLES.has(data.role) : false;

  const { data: sessions, isLoading: sessionsLoading, isError: sessionsError } = useQuery({
    queryKey: ["user-sessions", id, sessionPage, sessionRowsPerPage, tokens?.accessToken],
    queryFn: () =>
      listUserSessions(tokens?.accessToken || "", {
        user: id,
        page: sessionPage + 1,
        page_size: sessionRowsPerPage,
        ordering: "-last_seen_at",
      }),
    enabled: Boolean(tokens?.accessToken && id),
  });

  const { data: permissions } = useQuery({
    queryKey: ["permissions", tokens?.accessToken],
    queryFn: () => listPermissions(tokens?.accessToken || "", { page_size: 200 }),
    enabled: Boolean(tokens?.accessToken && tab === 2 && canViewPermissions),
  });

  const { data: userPermissions } = useQuery({
    queryKey: ["user-permissions", id, tokens?.accessToken],
    queryFn: () => listUserPermissions(tokens?.accessToken || "", { user: id, page_size: 200 }),
    enabled: Boolean(tokens?.accessToken && id && tab === 2 && canViewPermissions),
  });

  const { data: roleTemplates } = useQuery({
    queryKey: ["role-templates", data?.role, tokens?.accessToken],
    queryFn: () =>
      listRoleTemplates(tokens?.accessToken || "", {
        role: data?.role || "",
        page_size: 5,
      }),
    enabled: Boolean(tokens?.accessToken && data?.role && tab === 2 && canViewPermissions),
  });

  const pinMutation = useMutation({
    mutationFn: () => setUserPin(tokens?.accessToken || "", String(userId), { pin: pinValue }),
    onSuccess: () => {
      pushToast({ message: t("iam.user.pin_reset_success"), severity: "success" });
      setPinDialogOpen(false);
      setPinValue("");
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: () => verifyUserEmail(tokens?.accessToken || "", String(userId)),
    onSuccess: () => {
      pushToast({ message: t("iam.user.email_verified_success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const resetTwoFaMutation = useMutation({
    mutationFn: () => resetUserTwoFa(tokens?.accessToken || "", String(userId)),
    onSuccess: () => {
      pushToast({ message: t("iam.user.reset_2fa_success"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const sessionTimeoutMutation = useMutation({
    mutationFn: () =>
      setUserSessionTimeout(tokens?.accessToken || "", String(userId), timeoutValue),
    onSuccess: () => {
      pushToast({ message: t("iam.user.session_timeout_updated"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      setTimeoutDialogOpen(false);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const notesMutation = useMutation({
    mutationFn: () =>
      updateUser(tokens?.accessToken || "", String(userId), { notes: notesValue || null }),
    onSuccess: () => {
      pushToast({ message: t("iam.user.notes_saved"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      setNotesDirty(false);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const lockMutation = useMutation({
    mutationFn: () =>
      lockUser(tokens?.accessToken || "", String(userId), {
        duration_minutes: lockMinutes,
        reason: lockReason || undefined,
      }),
    onSuccess: () => {
      pushToast({ message: t("iam.user.locked"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      setLockDialogOpen(false);
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => unlockUser(tokens?.accessToken || "", String(userId), { reason: unlockReason }),
    onSuccess: () => {
      pushToast({ message: t("iam.user.unlocked"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      setUnlockDialogOpen(false);
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendUser(tokens?.accessToken || "", String(userId)),
    onSuccess: () => {
      pushToast({ message: t("iam.user.suspended"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => activateUser(tokens?.accessToken || "", String(userId)),
    onSuccess: () => {
      pushToast({ message: t("iam.user.activated"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId: number) => terminateUserSession(tokens?.accessToken || "", sessionId),
    onSuccess: () => {
      pushToast({ message: t("iam.session.terminated"), severity: "success" });
      queryClient.invalidateQueries({ queryKey: ["user-sessions", id] });
    },
    onError: () => {
      pushToast({ message: t("state.error"), severity: "error" });
    },
  });

  const grantPermissionMutation = useMutation({
    mutationFn: (permissionId: number) =>
      grantUserPermission(tokens?.accessToken || "", {
        user: Number(userId),
        permission: permissionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", id] });
    },
  });

  const revokePermissionMutation = useMutation({
    mutationFn: (userPermissionId: number) =>
      revokeUserPermission(tokens?.accessToken || "", userPermissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", id] });
    },
  });

  const permissionIndex = useMemo(() => {
    const map = new Map<string, Permission>();
    (permissions?.results || []).forEach((perm) => {
      map.set(`${perm.resource}.${perm.action}`, perm);
    });
    return map;
  }, [permissions?.results]);

  const actions = useMemo(() => {
    const set = new Set<string>();
    (permissions?.results || []).forEach((perm) => set.add(perm.action));
    return Array.from(set).sort();
  }, [permissions?.results]);

  const resources = useMemo(() => {
    const set = new Set<string>();
    (permissions?.results || []).forEach((perm) => set.add(perm.resource));
    return Array.from(set).sort();
  }, [permissions?.results]);

  const directPermissionMap = useMemo(() => {
    const map = new Map<number, UserPermission>();
    (userPermissions?.results || []).forEach((perm) => {
      map.set(perm.permission, perm);
    });
    return map;
  }, [userPermissions?.results]);

  const inheritedPermissionIds = useMemo(() => {
    const template = roleTemplates?.results?.[0];
    const ids = new Set<number>();
    (template?.effective_permissions || []).forEach((perm: Permission) => ids.add(perm.id));
    return ids;
  }, [roleTemplates?.results]);

  useEffect(() => {
    if (!data) {
      return;
    }
    setNotesValue(data.notes || "");
    setNotesDirty(false);
    if (typeof data.session_timeout === "number") {
      setTimeoutValue(data.session_timeout);
    }
  }, [data]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError || !data) {
    return <FullPageError />;
  }

  const isSuspended = data.account_status === "suspended";
  const isActive = data.account_status === "active";

  const sessionRows = (sessions?.results || []).map((session) => ({
    id: session.id,
    session_id: session.session_id,
    device: session.device_id || "-",
    status: session.ended_at ? t("iam.session.ended") : t("iam.session.active"),
    started_at: new Date(session.started_at).toLocaleString(),
    last_seen_at: session.last_seen_at ? new Date(session.last_seen_at).toLocaleString() : "-",
    actions: (
      <Button
        size="small"
        variant="outlined"
        disabled={!canManageSessions || Boolean(session.ended_at)}
        onClick={() => terminateSessionMutation.mutate(session.id)}
      >
        {t("iam.session.terminate")}
      </Button>
    ),
  }));

  const sessionColumns = [
    { key: "session_id", label: t("iam.session.id") },
    { key: "device", label: t("iam.session.device") },
    { key: "status", label: t("iam.session.status") },
    { key: "started_at", label: t("iam.session.started_at") },
    { key: "last_seen_at", label: t("iam.session.last_seen_at") },
    { key: "actions", label: t("iam.session.actions") },
  ];

  return (
    <PermissionGate permissions={["user.view"]}>
      <Stack spacing={3}>
        <PageHeader title={data.email} subtitle={t("iam.user.subtitle")} />
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label={t("iam.user.tabs.overview")} />
          <Tab label={t("iam.user.tabs.sessions")} />
          <Tab label={t("iam.user.tabs.permissions")} />
        </Tabs>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            {tab === 0 && (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Typography variant="h3">{t("iam.user.profile")}</Typography>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.role")}
                          </Typography>
                          <Typography variant="body1">
                            {t(`iam.roles.${data.role}`, data.role)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.status")}
                          </Typography>
                          <Typography variant="body1">{data.account_status}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.created")}
                          </Typography>
                          <Typography variant="body2">
                            {new Date(data.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Typography variant="h3">{t("iam.user.contact")}</Typography>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.email")}
                          </Typography>
                          <Typography variant="body2">{data.email}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.phone")}
                          </Typography>
                          <Typography variant="body2">{data.phone || "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.public_id")}
                          </Typography>
                          <Typography variant="body2">{data.public_id || "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.user_code", { defaultValue: "User Code" })}
                          </Typography>
                          <Typography variant="body2">{data.user_code || "-"}</Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Typography variant="h3">{t("iam.user.security")}</Typography>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.staff")}
                          </Typography>
                          <Typography variant="body2">
                            {data.is_staff ? t("label.yes") : t("label.no")}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.superuser")}
                          </Typography>
                          <Typography variant="body2">
                            {data.is_superuser ? t("label.yes") : t("label.no")}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.email_verified")}
                          </Typography>
                          <Typography variant="body2">
                            {data.email_verified ? t("label.yes") : t("label.no")}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t("iam.user.last_activity")}
                          </Typography>
                          <Typography variant="body2">
                            {data.last_activity ? new Date(data.last_activity).toLocaleString() : "-"}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h3" gutterBottom>
                    {t("iam.user.notes")}
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      value={notesValue}
                      onChange={(event) => {
                        setNotesValue(event.target.value);
                        setNotesDirty(true);
                      }}
                      multiline
                      minRows={3}
                    />
                    <Button
                      variant="contained"
                      disabled={!notesDirty || !canUpdateUser}
                      onClick={() => notesMutation.mutate()}
                    >
                      {t("iam.user.save_notes")}
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            )}

            {tab === 1 && (
              <DataTable
                columns={sessionColumns}
                rows={sessionRows}
                loading={sessionsLoading}
                error={sessionsError}
                totalCount={sessions?.count || 0}
                page={sessionPage}
                rowsPerPage={sessionRowsPerPage}
                onPageChange={setSessionPage}
                onRowsPerPageChange={(size) => {
                  setSessionRowsPerPage(size);
                  setSessionPage(0);
                }}
              />
            )}

            {tab === 2 && (
              <Paper sx={{ p: 3 }}>
                {!canViewPermissions && <EmptyState title={t("iam.permissions.no_access")} />}
                {canViewPermissions && (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("iam.permissions.resource")}</TableCell>
                        {actions.map((action) => (
                          <TableCell key={action}>{action}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resources.map((resource) => (
                        <TableRow key={resource}>
                          <TableCell>{resource}</TableCell>
                          {actions.map((action) => {
                            const permission = permissionIndex.get(`${resource}.${action}`);
                            if (!permission) {
                              return <TableCell key={`${resource}-${action}`}>-</TableCell>;
                            }
                            const direct = directPermissionMap.get(permission.id);
                            const inherited = inheritedPermissionIds.has(permission.id);
                            const checked = Boolean(direct || inherited);
                            const disabled = !canEditPermissions || inherited || permissionBusyId === permission.id;

                            return (
                              <TableCell key={`${resource}-${action}`}>
                                <Tooltip
                                  title={
                                    inherited
                                      ? t("iam.permissions.inherited")
                                      : t("iam.permissions.direct")
                                  }
                                >
                                  <Checkbox
                                    size="small"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={async () => {
                                      if (!userId) {
                                        return;
                                      }
                                      setPermissionBusyId(permission.id);
                                      try {
                                        if (direct) {
                                          await revokePermissionMutation.mutateAsync(direct.id);
                                        } else {
                                          await grantPermissionMutation.mutateAsync(permission.id);
                                        }
                                      } finally {
                                        setPermissionBusyId(null);
                                      }
                                    }}
                                  />
                                </Tooltip>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            )}
          </Grid>
          <Grid item xs={12} lg={4}>
            <Stack spacing={2}>
              <RightPanel title={t("iam.user.actions")}>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={!canUpdateUser || isSuspended}
                    onClick={() => suspendMutation.mutate()}
                  >
                    {t("action.suspend")}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={!canUpdateUser || isActive}
                    onClick={() => activateMutation.mutate()}
                  >
                    {t("action.activate")}
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!canUpdateUser || isInternal}
                    onClick={() => setPinDialogOpen(true)}
                  >
                    {t("iam.user.reset_pin")}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={!canUpdateUser || Boolean(data.locked_until)}
                    onClick={() => setLockDialogOpen(true)}
                  >
                    {t("iam.user.lock")}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={!canUpdateUser || !data.locked_until}
                    onClick={() => setUnlockDialogOpen(true)}
                  >
                    {t("iam.user.unlock")}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={!canUpdateUser || data.email_verified}
                    onClick={() => verifyEmailMutation.mutate()}
                  >
                    {t("iam.user.verify_email")}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={!canUpdateUser || !data.two_fa_enabled}
                    onClick={() => resetTwoFaMutation.mutate()}
                  >
                    {t("iam.user.reset_2fa")}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={!canUpdateUser}
                    onClick={() => setTimeoutDialogOpen(true)}
                  >
                    {t("iam.user.set_session_timeout")}
                  </Button>
                </Stack>
                {isInternal && (
                  <Typography variant="caption" color="text.secondary" mt={1}>
                    {t("iam.user.pin_disabled_internal")}
                  </Typography>
                )}
              </RightPanel>
              <RightPanel title={t("iam.user.security_status")}>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    {t("iam.user.locked_until")}:{" "}
                    {data.locked_until ? new Date(data.locked_until).toLocaleString() : t("label.no")}
                  </Typography>
                  <Typography variant="body2">
                    {t("iam.user.failed_attempts")}: {data.failed_login_attempts ?? 0}
                  </Typography>
                  <Typography variant="body2">
                    {t("iam.user.session_timeout")}: {data.session_timeout ?? "-"}
                  </Typography>
                </Stack>
              </RightPanel>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={pinDialogOpen} onClose={() => setPinDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("iam.user.reset_pin")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("iam.user.new_pin")}
              value={pinValue}
              onChange={(event) => setPinValue(event.target.value)}
              inputProps={{ maxLength: 6 }}
              helperText={t("iam.user.pin_helper")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPinDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            disabled={pinValue.length !== 6 || pinMutation.isLoading}
            onClick={() => pinMutation.mutate()}
          >
            {t("action.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={lockDialogOpen} onClose={() => setLockDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("iam.user.lock")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("iam.user.lock_duration")}
              type="number"
              value={lockMinutes}
              onChange={(event) => setLockMinutes(Number(event.target.value))}
              helperText={t("iam.user.lock_helper")}
            />
            <TextField
              label={t("iam.user.lock_reason")}
              value={lockReason}
              onChange={(event) => setLockReason(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLockDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            disabled={!lockMinutes || lockMutation.isLoading}
            onClick={() => lockMutation.mutate()}
          >
            {t("action.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={unlockDialogOpen} onClose={() => setUnlockDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("iam.user.unlock")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("iam.user.unlock_reason")}
              value={unlockReason}
              onChange={(event) => setUnlockReason(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlockDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            disabled={unlockMutation.isLoading}
            onClick={() => unlockMutation.mutate()}
          >
            {t("action.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={timeoutDialogOpen} onClose={() => setTimeoutDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("iam.user.set_session_timeout")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("iam.user.session_timeout")}
              type="number"
              value={timeoutValue}
              onChange={(event) => setTimeoutValue(Number(event.target.value))}
              helperText={t("iam.user.session_timeout_helper")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeoutDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            disabled={sessionTimeoutMutation.isLoading}
            onClick={() => sessionTimeoutMutation.mutate()}
          >
            {t("action.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
