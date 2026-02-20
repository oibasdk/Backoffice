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
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/ToastProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import {
  createRewardRule,
  deleteRewardRule,
  listRewardRules,
  updateRewardRule,
  type RewardRule,
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

const eventTypes = ["signup", "first_order", "loyalty"];
const rewardTypes = ["fixed", "percent"];

export const RewardRulesPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [eventType, setEventType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RewardRule | null>(null);
  const [form, setForm] = useState({
    name: "",
    event_type: "signup",
    reward_type: "fixed",
    amount_cents: 0,
    percent: 0,
    currency: "USD",
    max_per_user: 1,
    cooldown_days: 0,
    is_active: true,
  });

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      event_type: eventType || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, eventType]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reward-rules", queryParams, tokens?.accessToken],
    queryFn: () => listRewardRules(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<RewardRule>(data);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        event_type: form.event_type,
        reward_type: form.reward_type,
        amount_cents: Number(form.amount_cents),
        percent: Number(form.percent),
        currency: form.currency,
        max_per_user: Number(form.max_per_user),
        cooldown_days: Number(form.cooldown_days),
        is_active: form.is_active,
      };
      if (editing) {
        return updateRewardRule(tokens?.accessToken || "", editing.id, payload);
      }
      return createRewardRule(tokens?.accessToken || "", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward-rules"] });
      pushToast({ message: t("rewards.saved", { defaultValue: "Reward rule saved." }), severity: "success" });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteRewardRule(tokens?.accessToken || "", ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward-rules"] });
      pushToast({ message: t("rewards.deleted", { defaultValue: "Reward rule deleted." }), severity: "success" });
    },
    onError: () => pushToast({ message: t("state.error"), severity: "error" }),
  });

  const rows = resolved.results.map((rule) => ({
    id: rule.id,
    exportData: {
      name: rule.name,
      event_type: rule.event_type,
      reward_type: rule.reward_type,
      amount_cents: rule.amount_cents,
      percent: rule.percent,
      currency: rule.currency,
      is_active: rule.is_active,
      updated_at: rule.updated_at,
    },
    name: rule.name,
    event: rule.event_type,
    type: rule.reward_type,
    value:
      rule.reward_type === "percent"
        ? `${rule.percent}%`
        : `${(rule.amount_cents / 100).toLocaleString()} ${rule.currency}`,
    status: (
      <Chip
        size="small"
        label={rule.is_active ? t("label.active") : t("label.inactive")}
        color={rule.is_active ? "success" : "default"}
      />
    ),
    actions: (
      <Stack direction="row" spacing={1} onClick={(event) => event.stopPropagation()}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setEditing(rule);
            setForm({
              name: rule.name,
              event_type: rule.event_type,
              reward_type: rule.reward_type,
              amount_cents: rule.amount_cents,
              percent: rule.percent,
              currency: rule.currency,
              max_per_user: rule.max_per_user,
              cooldown_days: rule.cooldown_days,
              is_active: rule.is_active,
            });
            setDialogOpen(true);
          }}
        >
          {t("action.edit")}
        </Button>
        <Button
          size="small"
          color="error"
          onClick={() => deleteMutation.mutate(rule.id)}
        >
          {t("action.delete")}
        </Button>
      </Stack>
    ),
  }));

  const columns = [
    { key: "name", label: t("rewards.column.name", { defaultValue: "Name" }) },
    { key: "event", label: t("rewards.column.event", { defaultValue: "Event" }) },
    { key: "type", label: t("rewards.column.type", { defaultValue: "Type" }) },
    { key: "value", label: t("rewards.column.value", { defaultValue: "Value" }) },
    { key: "status", label: t("rewards.column.status", { defaultValue: "Status" }) },
    { key: "actions", label: t("label.action") },
  ];

  return (
    <PermissionGate permissions={["reward_rule.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("rewards.title", { defaultValue: "Reward rules" })}
          subtitle={t("rewards.subtitle", { defaultValue: "Define reward policies." })}
          actions={
            <Button
              variant="contained"
              onClick={() => {
                setEditing(null);
                setForm({
                  name: "",
                  event_type: "signup",
                  reward_type: "fixed",
                  amount_cents: 0,
                  percent: 0,
                  currency: "USD",
                  max_per_user: 1,
                  cooldown_days: 0,
                  is_active: true,
                });
                setDialogOpen(true);
              }}
            >
              {t("action.create")}
            </Button>
          }
        />
        <FilterBar
          savedViews={{
            storageKey: "payments.reward_rules",
            getState: () => ({ eventType }),
            applyState: (state) => {
              setEventType(String(state.eventType || ""));
              setPage(0);
            },
            defaultState: { eventType: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("rewards.column.event", { defaultValue: "Event" })}
                  value={eventType}
                  onChange={(event) => setEventType(event.target.value)}
                  size="small"
                >
                  <MenuItem value="">{t("label.all")}</MenuItem>
                  {eventTypes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            ),
            onApply: () => setPage(0),
            onReset: () => setEventType(""),
          }}
        />
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={isError}
          totalCount={resolved.count}
          page={page}
          rowsPerPage={rowsPerPage}
          exportFilename="reward_rules.csv"
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
              label={t("rewards.column.name", { defaultValue: "Name" })}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label={t("rewards.column.event", { defaultValue: "Event" })}
                value={form.event_type}
                onChange={(event) => setForm({ ...form, event_type: event.target.value })}
              >
                {eventTypes.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t("rewards.column.type", { defaultValue: "Type" })}
                value={form.reward_type}
                onChange={(event) => setForm({ ...form, reward_type: event.target.value })}
              >
                {rewardTypes.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("rewards.column.amount", { defaultValue: "Amount (cents)" })}
                type="number"
                value={form.amount_cents}
                onChange={(event) => setForm({ ...form, amount_cents: Number(event.target.value) })}
              />
              <TextField
                label={t("rewards.column.percent", { defaultValue: "Percent" })}
                type="number"
                value={form.percent}
                onChange={(event) => setForm({ ...form, percent: Number(event.target.value) })}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("rewards.column.currency", { defaultValue: "Currency" })}
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
              />
              <TextField
                label={t("rewards.column.max_per_user", { defaultValue: "Max per user" })}
                type="number"
                value={form.max_per_user}
                onChange={(event) => setForm({ ...form, max_per_user: Number(event.target.value) })}
              />
              <TextField
                label={t("rewards.column.cooldown", { defaultValue: "Cooldown days" })}
                type="number"
                value={form.cooldown_days}
                onChange={(event) => setForm({ ...form, cooldown_days: Number(event.target.value) })}
              />
            </Stack>
            <TextField
              label={t("rewards.column.status", { defaultValue: "Active" })}
              value={form.is_active ? "true" : "false"}
              onChange={(event) => setForm({ ...form, is_active: event.target.value === "true" })}
              select
            >
              <MenuItem value="true">{t("label.active")}</MenuItem>
              <MenuItem value="false">{t("label.inactive")}</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("action.dismiss")}</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate()}>
            {t("action.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionGate>
  );
};
