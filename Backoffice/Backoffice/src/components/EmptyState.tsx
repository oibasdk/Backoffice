import React from "react";
import { Paper, Stack, Typography } from "@mui/material";

export const EmptyState: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <Paper
    sx={{
      p: 3,
      backgroundColor: "var(--app-surface)",
      border: "1px solid",
      borderColor: "var(--app-card-border)",
    }}
  >
    <Stack spacing={2}>
      <Typography variant="h3">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {action}
    </Stack>
  </Paper>
);
