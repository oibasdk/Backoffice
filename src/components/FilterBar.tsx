import React, { useState } from "react";
import { Box, Button, Divider, Drawer, Paper, Stack, Typography } from "@mui/material";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import { useTranslation } from "react-i18next";

import { SavedViews } from "./SavedViews";

type SavedViewsConfig = {
  storageKey: string;
  getState: () => Record<string, unknown>;
  applyState: (state: Record<string, unknown>) => void;
  defaultState?: Record<string, unknown>;
};

type AdvancedFiltersConfig = {
  title?: string;
  content: React.ReactNode;
  onApply?: () => void;
  onReset?: () => void;
};

export const FilterBar: React.FC<{
  children: React.ReactNode;
  actions?: React.ReactNode;
  savedViews?: SavedViewsConfig;
  advanced?: AdvancedFiltersConfig;
}> = ({ children, actions, savedViews, advanced }) => {
  const { t, i18n } = useTranslation();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isRtl = i18n.language.startsWith("ar");

  const handleApply = () => {
    advanced?.onApply?.();
    setAdvancedOpen(false);
  };

  const handleReset = () => {
    advanced?.onReset?.();
  };

  return (
    <Paper
      sx={{
        p: 2,
        backgroundColor: "var(--app-surface)",
        backdropFilter: "blur(10px)",
        border: "1px solid",
        borderColor: "var(--app-card-border)",
      }}
    >
      <Stack spacing={2}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <Box flex={1} display="flex" flexWrap="wrap" gap={2}>
            {children}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {savedViews && (
              <SavedViews
                storageKey={savedViews.storageKey}
                getState={savedViews.getState}
                applyState={savedViews.applyState}
                defaultState={savedViews.defaultState}
              />
            )}
            {advanced && (
              <Button
                size="small"
                startIcon={<FilterAltRoundedIcon />}
                onClick={() => setAdvancedOpen(true)}
                variant="outlined"
              >
                {t("filter.advanced")}
              </Button>
            )}
            {actions && <Box>{actions}</Box>}
          </Stack>
        </Box>
      </Stack>
      {advanced && (
        <Drawer
          anchor={isRtl ? "left" : "right"}
          open={advancedOpen}
          onClose={() => setAdvancedOpen(false)}
          PaperProps={{
            sx: {
              width: 360,
              p: 3,
              backgroundColor: "var(--app-surface)",
              border: "1px solid",
              borderColor: "var(--app-card-border)",
            },
          }}
        >
          <Typography variant="h3">
            {advanced.title || t("filter.advanced")}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box>{advanced.content}</Box>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {advanced.onReset && (
              <Button variant="outlined" onClick={handleReset}>
                {t("action.reset")}
              </Button>
            )}
            <Button variant="contained" onClick={handleApply}>
              {t("action.apply")}
            </Button>
          </Stack>
        </Drawer>
      )}
    </Paper>
  );
};
