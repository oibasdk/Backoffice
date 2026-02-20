import React, { useMemo, useState } from "react";
import { Chip, MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { PermissionGate } from "../../../auth/PermissionGate";
import { DataTable } from "../../../components/DataTable";
import { FilterBar } from "../../../components/FilterBar";
import { PageHeader } from "../../../components/PageHeader";
import { listReferralEvents, type ReferralEvent } from "../api";

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

const statusOptions = ["", "pending", "qualified", "rewarded", "fraud"];

export const ReferralEventsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [status, setStatus] = useState("");
  const [referrer, setReferrer] = useState("");
  const [referred, setReferred] = useState("");

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      page_size: rowsPerPage,
      status: status || undefined,
      referrer_user_id: referrer || undefined,
      referred_user_id: referred || undefined,
      ordering: "-created_at",
    }),
    [page, rowsPerPage, status, referrer, referred]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["referral-events", queryParams, tokens?.accessToken],
    queryFn: () => listReferralEvents(tokens?.accessToken || "", queryParams),
    enabled: Boolean(tokens?.accessToken),
  });

  const resolved = resolveResults<ReferralEvent>(data);
  const rows = resolved.results.map((event) => ({
    id: event.id,
    exportData: {
      referrer_user_id: event.referrer_user_id,
      referred_user_id: event.referred_user_id,
      status: event.status,
      event_type: event.event_type,
      created_at: event.created_at,
    },
    referrer: event.referrer_user_id,
    referred: event.referred_user_id,
    type: event.event_type,
    status: <Chip size="small" label={event.status} />,
    created: new Date(event.created_at).toLocaleString(),
  }));

  const columns = [
    { key: "referrer", label: t("referrals.events.column.referrer", { defaultValue: "Referrer" }) },
    { key: "referred", label: t("referrals.events.column.referred", { defaultValue: "Referred" }) },
    { key: "type", label: t("referrals.events.column.type", { defaultValue: "Type" }) },
    { key: "status", label: t("referrals.events.column.status", { defaultValue: "Status" }) },
    { key: "created", label: t("table.column.created") },
  ];

  return (
    <PermissionGate permissions={["referral_event.view"]}>
      <Stack spacing={3}>
        <PageHeader
          title={t("referrals.events.title", { defaultValue: "Referral events" })}
          subtitle={t("referrals.events.subtitle", { defaultValue: "Track referral conversions and statuses." })}
        />
        <FilterBar
          savedViews={{
            storageKey: "payments.referral_events",
            getState: () => ({ status, referrer, referred }),
            applyState: (state) => {
              setStatus(String(state.status || ""));
              setReferrer(String(state.referrer || ""));
              setReferred(String(state.referred || ""));
              setPage(0);
            },
            defaultState: { status: "", referrer: "", referred: "" },
          }}
          advanced={{
            title: t("filter.advanced"),
            content: (
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label={t("referrals.events.column.status", { defaultValue: "Status" })}
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
            label={t("referrals.events.column.referrer", { defaultValue: "Referrer" })}
            value={referrer}
            onChange={(event) => setReferrer(event.target.value)}
            size="small"
          />
          <TextField
            label={t("referrals.events.column.referred", { defaultValue: "Referred" })}
            value={referred}
            onChange={(event) => setReferred(event.target.value)}
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
          exportFilename="referral_events.csv"
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
