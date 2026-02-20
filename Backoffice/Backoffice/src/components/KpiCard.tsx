import React from "react";
import { Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";

export const KpiCard: React.FC<{
  label: string;
  value: React.ReactNode;
  caption?: string;
  loading?: boolean;
}> = ({ label, value, caption, loading = false }) => (
  <Card
    sx={{
      minHeight: 140,
      backgroundImage:
        "linear-gradient(135deg, rgba(14,124,120,0.08) 0%, rgba(217,131,31,0.06) 100%)",
      boxShadow: "var(--app-glow)",
    }}
  >
    <CardContent>
      <Stack spacing={1.5}>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width="60%" height={32} />
        ) : (
          <Typography variant="h2" fontWeight={700}>
            {value}
          </Typography>
        )}
        {caption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
      </Stack>
    </CardContent>
  </Card>
);
