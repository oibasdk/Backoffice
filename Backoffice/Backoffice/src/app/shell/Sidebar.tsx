import React from "react";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ColorModeContext } from "../../design-system/theme";
import { NavSection } from "../moduleRegistry";
import { elevationTokens, radiusTokens } from "../../design-system/tokens";
import { prefetchRoute } from "../routePrefetch";

export const Sidebar: React.FC<{
  open: boolean;
  width: number;
  collapsedWidth: number;
  onToggle: () => void;
  sections?: NavSection[];
}> = ({ open, width, collapsedWidth, onToggle, sections }) => {
  const { t, i18n } = useTranslation();
  const { mode } = React.useContext(ColorModeContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isRtl = i18n.language.startsWith("ar");
  const toggleIcon = isRtl ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />;

  return (
    <Drawer
      variant="permanent"
      anchor={isRtl ? "right" : "left"}
      PaperProps={{
        sx: {
          width: open ? width : collapsedWidth,
          transition: "width 200ms ease",
          overflowX: "hidden",
          backgroundColor: "var(--app-surface)",
          backgroundImage:
            "linear-gradient(180deg, rgba(14,124,120,0.08) 0%, rgba(217,131,31,0.04) 120%)",
          borderInlineEnd: "1px solid",
          borderColor: "var(--app-card-border)",
          boxShadow: elevationTokens.level2,
        },
      }}
    >
      <Box px={open ? 3 : 2} py={3} display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: radiusTokens.medium,
              backgroundImage:
                "linear-gradient(135deg, rgba(14,124,120,1) 0%, rgba(217,131,31,0.9) 100%)",
              boxShadow: "var(--app-glow)",
              animation: "app-float 6s ease-in-out infinite",
            }}
          />
          {open && (
            <Typography variant="h3">
              {t("app.name")}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onToggle} size="small">
          {toggleIcon}
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ px: open ? 2 : 1 }}>
        {(sections || []).map((section: NavSection) => (
          <Box key={section.id} mb={2}>
            {open && (
              <Typography variant="overline" color="text.secondary" sx={{ px: 2, display: "block", mb: 1 }}>
                {t(section.labelKey)}
              </Typography>
            )}
            {section.items.map((item: any) => {
              const active =
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`);
              const testId = `nav-${item.path.replace(/\//g, "-").replace(/^-/, "")}`;
              return (
                <Tooltip title={t(item.labelKey)} placement="right" disableHoverListener={open} key={item.path}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => prefetchRoute(item.path)}
                    onFocus={() => prefetchRoute(item.path)}
                    selected={active}
                    aria-current={active ? "page" : undefined}
                    data-testid={testId}
                    sx={{
                      borderRadius: radiusTokens.medium,
                      mb: 1,
                      px: open ? 2 : 1,
                      py: 1,
                      transition: "all 240ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                      border: "1px solid transparent",
                      "&.Mui-selected": {
                        bgcolor: "transparent",
                        borderColor: mode === "light" ? "rgba(14,124,120,0.2)" : "rgba(14,124,120,0.4)",
                        backgroundImage:
                          "linear-gradient(135deg, rgba(14,124,120,0.18) 0%, rgba(217,131,31,0.14) 100%)",
                        color: "text.primary",
                        boxShadow: "var(--app-glow)",
                        "& .MuiListItemIcon-root": {
                          color: "primary.main",
                          filter: "drop-shadow(0 0 8px rgba(14,124,120,0.4))",
                        }
                      },
                      "&:hover": {
                        borderColor: "var(--app-card-border)",
                        backgroundColor: mode === "light" ? "rgba(14,124,120,0.06)" : "rgba(14,124,120,0.12)",
                        transform: open ? "translateX(4px)" : "scale(1.05)",
                      },
                      "&:focus-visible": {
                        outline: "2px solid rgba(14,124,120,0.6)",
                        outlineOffset: 2,
                        backgroundColor: mode === "light" ? "rgba(14,124,120,0.08)" : "rgba(14,124,120,0.16)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: open ? 36 : 32 }}>{item.icon}</ListItemIcon>
                    {open && <ListItemText primary={t(item.labelKey)} />}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </List>
    </Drawer>
  );
};
