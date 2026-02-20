import React from "react";
import { Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { DataTable } from "../components/DataTable";

export const PlaygroundPage: React.FC = () => {
  const { t } = useTranslation();

  const columns = [
    { key: "name", label: t("table.column.name") },
    { key: "status", label: t("table.column.status") },
    { key: "updated", label: t("table.column.updated") },
  ];

  const rows = [
    { id: 1, name: "Ticket #4821", status: t("status.open"), updated: "2m" },
    { id: 2, name: "Ticket #4819", status: t("status.assigned"), updated: "18m" },
    { id: 3, name: "Session RAS-211", status: t("status.active"), updated: "1h" },
  ];

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        {t("nav.playground")}
      </Typography>
      <DataTable columns={columns} rows={rows} />
      <DataTable columns={columns} rows={[]} title={t("table.state.empty")} />
      <DataTable columns={columns} rows={[]} title={t("table.state.loading")} loading />
      <DataTable columns={columns} rows={[]} title={t("table.state.error")} error />
    </Stack>
  );
};
