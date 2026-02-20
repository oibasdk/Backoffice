import React from "react";
import { Box, Stack, Typography } from "@mui/material";

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => {
  return (
    <Box mb={3} display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
      <Stack spacing={1.5}>
        <Box display="inline-flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 46,
              height: 6,
              borderRadius: 999,
              backgroundImage:
                "linear-gradient(90deg, rgba(14,124,120,1) 0%, rgba(217,131,31,0.9) 100%)",
              boxShadow: "var(--app-glow)",
            }}
          />
          <Typography variant="h1" component="h1" fontWeight={700}>
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
  );
};
