import React, { useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import {
  createReferralCode,
  listReferralCodes,
  updateReferralCode,
  type ReferralCode,
} from "../api";

type PaginatedLike<T> = {
  count?: number;
  results?: T[];
};

const resolveResults = <T,>(payload: PaginatedLike<T> | T[] | null | undefined) => {
  if (Array.isArray(payload)) {
    return { count: payload.length, results: payload };
  }
  if (payload && Array.isArray(payload.results)) {
    return { count: payload.count ?? payload.results.length, results: payload.results };
  }
  return { count: 0, results: [] as T[] };
};

export const ReferralCodesPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [userId, setUserId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReferralCode | null>(null);
  const [form, setForm] = useState({ user_id: "", code: "", is_active: true });

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      user_id: userId || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, userId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["referral-codes", queryParams, tokens?.accessToken],
    queryFn: () => listReferralCodes(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<ReferralCode>(data);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        user_id: form.user_id,
        code: form.code,
        is_active: form.is_active,
      };
      if (editing) {
        return updateReferralCode(tokens?.accessToken || "", editing.id, payload);
      }
      return createReferralCode(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-codes"] });
      pushToast({ message: t("referrals.codes.saved", { defaultValue: "Referral code saved." }), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
      setForm({ user_id: "", code: "", is_active: true });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolved.results.map((code) => ({
    id: code.id,
    exportData: {
      user_id: code.user_id,
      code: code.code,
      is_active: code.is_active ? "active" : "inactive",
      created_at: code.created_at,
    },
    user: code.user_id,
    code: code.code,
    status: (
      <Chip
        size="small"
        label={code.is_active ? t("label.active") : t("label.inactive")}
        color={code.is_active ? "success" : "default"}
      />
    ),
    created: new Date(code.created_at).toLocaleString(),
    actions: (
      <Button
        size="small"
        variant="outlined"
        onClick={() => {
          setEditing(code);
          setForm({ user_id: code.user_id, code: code.code, is_active: code.is_active });
          setDialogOpen(true);
        }}
      >
        {t("action.edit")}
      </Button>
    ),
  }));

  const columns = [
    { key: "user", label: t("referrals.codes.column.user", { defaultValue: "User" }) },
    { key: "code", label: t("referrals.codes.column.code", { defaultValue: "Code" }) },
    { key: "status", label: t("referrals.codes.column.status", { defaultValue: "Status" }) },
    { key: "created", label: t("table.column.created") },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["referral_code.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("referrals.codes.title", { defaultValue: "Referral codes" })}
          subtitle={t("referrals.codes.subtitle", { defaultValue: "Manage referral codes." })}
          actions={
            <Button
              variant="contained"
              onClick={() => {
                setEditing(null);
                setForm({ user_id: "", code: "", is_active: true });
                setDialogOpen(true);
              }}
            >
              {t("action.create")}
            </Button>
          }
        />
        <FilterBar
          savedViews={{
            storageKey: "payments.referral_codes",
            getState: () => ({ userId }),
            applyState: (state) => {
              setUserId(String(state.userId || ""));
              setPage(0);
            },
            defaultState: { userId: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: null,
            onApply: () => setPage(0),
            onReset: () => setUserId(""),
          }}
        >
          <TextField
            label={t("referrals.codes.column.user", { defaultValue: "User" })}
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            size="small"
          />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={isError}
          totalCount={resolved.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="referral_codes.csv"
          onPageChange={setPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
          density={density}
          onDensityChange={setDensity}
        />
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? t("action.edit") : t("action.create")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label={t("referrals.codes.column.user", { defaultValue: "User" })}
              value={form.user_id}
              onChange={(event) => setForm({ ...form, user_id: event.target.value })}
            />
            <TextField
              label={t("referrals.codes.column.code", { defaultValue: "Code" })}
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={!form.user_id || !form.code}
          >
            {t("action.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
