import React from "react";
import { Box, Stack, Typography } from "@mui/material";

export type TimelineItem = {
  id: string | number;
  title: string;
  timestamp: string;
  description?: string;
  badge?: React.ReactNode;
};

export const Timeline: React.FC<{ items: TimelineItem[] }> = ({ items }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {items.map((item, index) => (
        <Box key={item.id} display="flex" gap={2}>
          <Box position="relative" width={24} display="flex" justifyContent="center">
            <Box
              sx={{
                width: (theme) => theme.spacing(1),
                height: (theme) => theme.spacing(1),
                backgroundImage:
                  "linear-gradient(135deg, rgba(14,124,120,1) 0%, rgba(217,131,31,0.9) 100%)",
                borderRadius: "50%",
                mt: 1,
                boxShadow: "var(--app-glow)",
              }}
            />
            {index < items.length - 1 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  width: (theme) => theme.spacing(0.25),
                  height: "calc(100% - 12px)",
                  bgcolor: "var(--app-card-border)",
                }}
              />
            )}
          </Box>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" fontWeight={600}>
                {item.title}
              </Typography>
              {item.badge}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.timestamp}
            </Typography>
            {item.description && (
              <Typography variant="body2" color="text.secondary" mt={1}>
                {item.description}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Stack>
  );
};
