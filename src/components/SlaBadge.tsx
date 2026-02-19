import React, { useMemo } from "react";
import { Chip, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

export type SlaInfo = {
  state?: string | null;
  policy_version_id?: string | null;
  first_response_due_at?: string | null;
  resolution_due_at?: string | null;
  priority_key?: string | null;
};

const formatDuration = (valueMs: number, t: (key: string, params?: Record<string, any>) => string) => {
  const totalMinutes = Math.max(0, Math.floor(Math.abs(valueMs) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return t("sla.duration.days", { count: days });
  }
  if (hours > 0) {
    return t("sla.duration.hours", { count: hours, minutes });
  }
  return t("sla.duration.minutes", { count: minutes });
};

const resolveDisplayState = (
  state: string | null | undefined,
  fallbackState: string | null | undefined,
  status?: string | null,
) => {
  const normalized = state || fallbackState;
  if (normalized === "breached") {
    return "breached";
  }
  if (status === "Completed") {
    return "met";
  }
  if (normalized) {
    return normalized;
  }
  return "pending";
};

const resolveChipColor = (state: string) => {
  switch (state) {
    case "breached":
      return "error";
    case "on_track":
      return "success";
    case "met":
      return "info";
    case "pending":
    default:
      return "warning";
  }
};

export const SlaBadge: React.FC<{
  sla?: SlaInfo | null;
  state?: string | null;
  status?: string | null;
  showCountdown?: boolean;
}> = ({ sla, state, status, showCountdown }) => {
  const { t } = useTranslation();
  const displayState = resolveDisplayState(sla?.state, state, status);
  const color = resolveChipColor(displayState);
  const dueAt = sla?.resolution_due_at || sla?.first_response_due_at;

  const countdownLabel = useMemo(() => {
    if (!dueAt) {
      return "";
    }
    const dueTime = new Date(dueAt).getTime();
    const delta = dueTime - Date.now();
    const duration = formatDuration(delta, t);
    if (delta < 0) {
      return t("sla.overdue_by", { time: duration });
    }
    return t("sla.due_in", { time: duration });
  }, [dueAt, t]);

  const label = showCountdown && countdownLabel
    ? `${t(`sla.state.${displayState}`)} • ${countdownLabel}`
    : t(`sla.state.${displayState}`);

  const tooltip = dueAt
    ? `${t("sla.due_at")}: ${new Date(dueAt).toLocaleString()}`
    : t("sla.no_policy");

  return (
    <Tooltip title={tooltip} arrow>
      <Chip size="small" color={color} label={label} />
    </Tooltip>
  );
};
