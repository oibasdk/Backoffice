import React from "react";
import { Paper, Stack, Typography } from "@mui/material";

export const RightPanel: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <Paper
    sx={{
      p: 3,
      backgroundColor: "var(--app-surface)",
      border: "1px solid",
      borderColor: "var(--app-card-border)",
      boxShadow: "var(--app-glow)",
    }}
  >
    <Stack spacing={2}>
      <Typography variant="h3">{title}</Typography>
      {children}
    </Stack>
  </Paper>
);
