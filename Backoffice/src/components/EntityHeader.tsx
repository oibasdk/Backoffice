import React from "react";
import { Box, Stack, Typography } from "@mui/material";

export const EntityHeader: React.FC<{
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, subtitle, meta, actions }) => (
  <Stack spacing={2}>
    <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
      <Stack spacing={1.5}>
        <Box display="inline-flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42,
              height: 6,
              borderRadius: 999,
              backgroundImage:
                "linear-gradient(90deg, rgba(14,124,120,1) 0%, rgba(217,131,31,0.9) 100%)",
              boxShadow: "var(--app-glow)",
            }}
          />
          <Typography variant="h1" component="h1">
            {title}
          </Typography>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
            {subtitle}
          </Typography>
        )}
      </Stack>
      {actions}
    </Box>
    {meta && <Box>{meta}</Box>}
  </Stack>
);
