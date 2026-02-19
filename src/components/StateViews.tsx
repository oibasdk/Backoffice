import React from "react";
import { Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export const FullPageLoader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="70vh">
      <Stack spacing={2} alignItems="center">
        <CircularProgress size={32} color="primary" />
        <Typography variant="body2" color="text.secondary">
          {t("state.loading")}
        </Typography>
      </Stack>
    </Box>
  );
};

export const FullPageError: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  const { t } = useTranslation();
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="70vh">
      <Paper
        sx={{
          p: 3,
          maxWidth: 420,
          backgroundColor: "var(--app-surface)",
          border: "1px solid",
          borderColor: "var(--app-card-border)",
        }}
      >
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h3">{t("state.error")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {message || t("route.forbidden.subtitle")}
          </Typography>
          {onRetry && (
            <Button variant="contained" onClick={onRetry}>
              {t("action.retry")}
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export const FullPageEmpty: React.FC<{ title?: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => {
  const { t } = useTranslation();
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="70vh">
      <Paper
        sx={{
          p: 3,
          maxWidth: 420,
          backgroundColor: "var(--app-surface)",
          border: "1px solid",
          borderColor: "var(--app-card-border)",
        }}
      >
        <Stack spacing={1} alignItems="flex-start">
          <Typography variant="h3">{title || t("state.empty")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle || t("state.empty")}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};
