import React, { useContext } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { useTranslation } from "react-i18next";

import { ColorModeContext } from "../../design-system/theme";
import { elevationTokens, radiusTokens } from "../../design-system/tokens";

export const Topbar: React.FC<{
  onToggleSidebar: () => void;
  onOpenPalette: () => void;
}> = ({ onToggleSidebar, onOpenPalette }) => {
  const { t, i18n } = useTranslation();
  const { mode, toggleColorMode } = useContext(ColorModeContext);

  const handleLanguageToggle = () => {
    const next = i18n.language.startsWith("ar") ? "en" : "ar";
    i18n.changeLanguage(next);
  };

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={(theme) => ({
        backdropFilter: "blur(12px)",
        backgroundColor: "var(--app-surface)",
        backgroundImage:
          theme.palette.mode === "light"
            ? "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 60%)"
            : "linear-gradient(135deg, rgba(15,18,15,0.35) 0%, rgba(15,18,15,0) 60%)",
        boxShadow: elevationTokens.level1,
        borderBottom: "1px solid",
        borderColor: "var(--app-card-border)",
      })}
    >
      <Toolbar sx={{ px: 3, gap: 2 }}>
        <IconButton edge="start" onClick={onToggleSidebar}>
          <MenuRoundedIcon />
        </IconButton>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onOpenPalette}
          startIcon={<SearchRoundedIcon />}
          sx={{
            textTransform: "none",
            borderRadius: radiusTokens.medium,
            px: 2,
            bgcolor: "var(--app-surface)",
            borderColor: "var(--app-card-border)",
            minWidth: 280,
            justifyContent: "flex-start",
            boxShadow: "var(--app-glow)",
          }}
        >
          <Box flex={1} display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {t("topbar.search")}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Ctrl + K
            </Typography>
          </Box>
        </Button>
        <Box flex={1} />
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={handleLanguageToggle} aria-label={t("topbar.language")}>
            <TranslateRoundedIcon />
          </IconButton>
          <IconButton onClick={toggleColorMode} aria-label={t("topbar.theme")}>
            {mode === "light" ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
          </IconButton>
          <IconButton aria-label={t("topbar.notifications")}>
            <NotificationsNoneRoundedIcon />
          </IconButton>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>A</Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
