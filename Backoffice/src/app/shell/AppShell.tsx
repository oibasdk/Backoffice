import React, { useMemo, useState } from "react";
import { Box, Divider } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BreadcrumbsBar } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { buildCommandItems, buildNavSections } from "../moduleRegistry";
import { useAdminAccess } from "../../auth/useAdminAccess";
import { useFeatureFlags } from "../../auth/useFeatureFlags";
import { useAuth } from "../providers/AuthProvider";

const drawerWidth = 260;
const drawerCollapsedWidth = 84;

export const AppShell: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const { tokens } = useAuth();
  const { data } = useAdminAccess(tokens?.accessToken || null);

  const contentWidth = isSidebarOpen ? drawerWidth : drawerCollapsedWidth;

  const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);

  const { flags } = useFeatureFlags();
  const navSections = useMemo(() => buildNavSections(data, flags), [data, flags]);
  const paletteItems = useMemo(() => buildCommandItems(navSections), [navSections]);

  return (
    <Box display="flex" minHeight="100vh">
      <Sidebar
        open={isSidebarOpen}
        width={drawerWidth}
        collapsedWidth={drawerCollapsedWidth}
        onToggle={handleToggleSidebar}
        sections={navSections}
      />
      <Box
        flex={1}
        display="flex"
        flexDirection="column"
        sx={{ marginInlineStart: `${contentWidth}px` }}
      >
        <Topbar onToggleSidebar={handleToggleSidebar} onOpenPalette={() => setPaletteOpen(true)} />
        <Divider />
        <Box
          px={4}
          pt={2}
          pb={4}
          component="main"
          sx={(theme) => ({
            flex: 1,
            backgroundColor: "transparent",
            backgroundImage:
              theme.palette.mode === "light"
                ? "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 38%)"
                : "linear-gradient(180deg, rgba(15,18,15,0.65) 0%, rgba(15,18,15,0) 38%)",
            animation: "app-fade-in 320ms ease-out",
          })}
        >
          <BreadcrumbsBar path={location.pathname} />
          <Outlet />
        </Box>
      </Box>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpen={() => setPaletteOpen(true)}
        items={paletteItems}
      />
    </Box>
  );
};
