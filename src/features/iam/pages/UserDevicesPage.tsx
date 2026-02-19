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
import { listUserDevices, updateUserDevice, type UserDevice } from "../api";

const deviceTypes = ["", "ios", "android", "web", "desktop", "unknown"];

export const UserDevicesPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [search, setSearch] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [trusted, setTrusted] = useState("");
  const [metadataTarget, setMetadataTarget] = useState<UserDevice | null>(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      search: search || undefined,
      device_type: deviceType || undefined,
      is_trusted: trusted || undefined,
      ordering: "-last_seen_at",
    }),
    [page, rowsPerPage, search, deviceType, trusted]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-devices", queryParams, tokens?.accessToken],
    queryFn: () => listUserDevices(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const toggleMutation = useMutation({
    mutationFn: (payload: { deviceId: number; is_trusted: boolean }) =>
      updateUserDevice(tokens?.accessToken || "", payload.deviceId, { is_trusted: payload.is_trusted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-devices"] });
      pushToast({ message: t("iam.devices.updated"), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = (data?.results || []).map((device) => ({
    id: device.id,
    exportData: {
      user: device.user_email || device.user || "",
      device: device.device_id,
      type: device.device_type,
      os: device.os_name || "",
      last_seen: device.last_seen_at || "",
      trusted: device.is_trusted ? "true" : "false",
    },
    user: device.user_email || device.user || "-",
    device: device.device_name || device.device_id,
    type: <Chip size="small" label={device.device_type} />,
    os: device.os_name || "-",
    last_seen: device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "-",
    trusted: (
      <PermissionGate permissions={["user_device.update"]}>
        <Button
          size="small"
          variant="outlined"
          onClick={(event) => {
            event.stopPropagation();
            toggleMutation.mutate({ deviceId: device.id, is_trusted: !device.is_trusted });
          }}
        >
          {device.is_trusted ? t("iam.devices.trusted") : t("iam.devices.untrusted")}
        </Button>
      </PermissionGate>
    ),
    actions: (
      <Button
        size="small"
        variant="text"
        onClick={(event) => {
          event.stopPropagation();
          setMetadataTarget(device);
        }}
      >
        {t("iam.devices.view_metadata")}
      </Button>
    ),
  }));

  const columns = [
    { key: "user", label: t("label.user") },
    { key: "device", label: t("iam.devices.column.device") },
    { key: "type", label: t("iam.devices.column.type") },
    { key: "os", label: t("iam.devices.column.os") },
    { key: "last_seen", label: t("iam.devices.column.last_seen") },
    { key: "trusted", label: t("iam.devices.column.trusted") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["user_device.view"]}>
      <Stack spacing={3}>
        <PageHeader title={t("iam.devices.title")} subtitle={t("iam.devices.subtitle")} />
        <FilterBar
          savedViews={{
            storageKey: "iam.user_devices",
            getState: () => ({ search, deviceType, trusted }),
            applyState: (state) => {
              setSearch(String(state.search || ""));
              setDeviceType(String(state.deviceType || ""));
              setTrusted(String(state.trusted || ""));
              setPage(0);
            },
            defaultState: { search: "", deviceType: "", trusted: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("iam.devices.filter.type")}
                  value={deviceType}
                  onChange={(event) => setDeviceType(event.target.value)}
                  size="small"
                >
                  {deviceTypes.map((option) => (
                    <MenuItem key={option || "all"} value={option}>
                      {option || t("label.all")}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t("iam.devices.filter.trusted")}
                  value={trusted}
                  onChange={(event) => setTrusted(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  <MenuItem value="true">{t("iam.devices.trusted")}</MenuItem>
                  <MenuItem value="false">{t("iam.devices.untrusted")}</MenuItem>
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => {
              setDeviceType("");
              setTrusted("");
            },
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
          totalCount={data?.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="user_devices.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={Boolean(metadataTarget)} onClose={() => setMetadataTarget(null)} fullWidth maxWidth="md">
        <DialogTitle>{t("iam.devices.metadata_title")}</DialogTitle>
        <DialogContent>
          <Typography
            component="pre"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.8rem", margin: 0 }}
          >
            {metadataTarget ? JSON.stringify(metadataTarget.metadata || {}, null, 2) : ""}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataTarget(null)}>{t("action.dismiss")}</Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
