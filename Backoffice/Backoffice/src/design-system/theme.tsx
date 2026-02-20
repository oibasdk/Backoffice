import React, { createContext, useMemo, useState, useEffect } from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { CssBaseline, ThemeProvider, createTheme, Shadows } from "@mui/material";
import { useTranslation } from "react-i18next";
import rtlPlugin from "stylis-plugin-rtl";

import { elevationTokens, paletteTokens, radiusTokens, spacingUnit, typographyTokens } from "./tokens";

export type ColorMode = "light" | "dark";

export const ColorModeContext = createContext({
  mode: "light" as ColorMode,
  toggleColorMode: () => { },
});

const buildTheme = (mode: ColorMode, direction: "ltr" | "rtl") => {
  const shadows = Array(25).fill("none") as Shadows;
  shadows[1] = elevationTokens.level1;
  shadows[2] = elevationTokens.level2;
  shadows[3] = elevationTokens.level3;
  shadows[4] = elevationTokens.level4;

  return createTheme({
    direction,
    spacing: spacingUnit,
    typography: {
      fontFamily: typographyTokens.fontFamilyBase,
      h1: typographyTokens.h1,
      h2: typographyTokens.h2,
      h3: typographyTokens.h3,
      h4: typographyTokens.h3,
      body1: typographyTokens.body,
      body2: typographyTokens.body,
      caption: typographyTokens.caption,
      overline: typographyTokens.overline,
      button: typographyTokens.bodyStrong,
    },
    palette: {
      mode,
      primary: {
        main: paletteTokens.brand[500],
        contrastText: paletteTokens.neutral[0],
      },
      background: {
        default: mode === "light" ? paletteTokens.neutral[50] : paletteTokens.neutral[900],
        paper: mode === "light" ? paletteTokens.neutral[0] : paletteTokens.neutral[800],
      },
      text: {
        primary: mode === "light" ? paletteTokens.neutral[900] : paletteTokens.neutral[50],
        secondary: mode === "light" ? paletteTokens.neutral[700] : paletteTokens.neutral[200],
      },
      divider: mode === "light" ? paletteTokens.neutral[200] : paletteTokens.neutral[700],
      success: { main: paletteTokens.success },
      warning: { main: paletteTokens.warning },
      error: { main: paletteTokens.error },
      info: { main: paletteTokens.info },
    },
    shape: { borderRadius: radiusTokens.large },
    shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            "--app-bg": mode === "light" ? "#F5F5F2" : "#0A0C0A",
            "--app-bg-pattern":
              mode === "light"
                ? "radial-gradient(1200px 600px at 10% -10%, rgba(14,124,120,0.14), transparent 70%), radial-gradient(800px 500px at 90% -5%, rgba(217,131,31,0.1), transparent 70%)"
                : "radial-gradient(1200px 600px at 10% -10%, rgba(14,124,120,0.18), transparent 70%), radial-gradient(800px 500px at 90% -5%, rgba(217,131,31,0.12), transparent 70%)",
            "--app-surface":
              mode === "light" ? "rgba(255,255,255,0.72)" : "rgba(23,21,18,0.78)",
            "--app-card-border":
              mode === "light" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
            "--app-blur": "24px",
            "--app-glow":
              mode === "light"
                ? "0 16px 40px rgba(14,124,120,0.12)"
                : "0 16px 40px rgba(14,124,120,0.2)",
          },
          body: {
            backgroundColor: "var(--app-bg)",
            backgroundImage: "var(--app-bg-pattern)",
            backgroundAttachment: "fixed",
            minHeight: "100vh",
          },
          "::selection": {
            backgroundColor: "rgba(14,124,120,0.18)",
          },
          "@keyframes app-fade-in": {
            "0%": { opacity: 0, transform: "translateY(8px) scale(0.99)" },
            "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
          },
          "@keyframes app-float": {
            "0%, 100%": { transform: "translateY(0)" },
            "50%": { transform: "translateY(-6px)" },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: radiusTokens.medium,
            transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            "&:active": {
              transform: "scale(0.975)",
            },
          },
          contained: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: elevationTokens.level2,
              transform: "translateY(-1px)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: radiusTokens.large,
            border: "1px solid",
            borderColor: "var(--app-card-border)",
            backgroundColor: "var(--app-surface)",
            backdropFilter: "blur(var(--app-blur))",
            "-webkit-backdrop-filter": "blur(var(--app-blur))",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: radiusTokens.large,
            border: "1px solid",
            borderColor: "var(--app-card-border)",
            boxShadow: elevationTokens.level1,
            transition: "all 240ms cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              boxShadow: elevationTokens.level3,
              borderColor: "rgba(14,124,120,0.3)",
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radiusTokens.medium,
            backgroundColor: mode === "light" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)",
            transition: "all 200ms ease",
            "&.Mui-focused": {
              backgroundColor: "var(--app-surface)",
            },
          },
          notchedOutline: {
            borderColor: "var(--app-card-border)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: radiusTokens.pill,
            border: "1px solid",
            borderColor: "var(--app-card-border)",
            backgroundColor: mode === "light" ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.05)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderInlineEnd: "1px solid var(--app-card-border)",
            boxShadow: "none",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: radiusTokens.xlarge as number,
            boxShadow: elevationTokens.level4,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            letterSpacing: 0.5,
            color: mode === "light" ? paletteTokens.neutral[600] : paletteTokens.neutral[300],
            borderBottom: "2px solid var(--app-card-border)",
          },
          body: {
            borderColor: "var(--app-card-border)",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "background-color 150ms ease",
            "&:hover": {
              backgroundColor: "rgba(14,124,120,0.04)",
            },
            "&:last-of-type td": {
              borderBottom: "none",
            },
          },
        },
      },
    },
  });
};

const rtlCache = createCache({
  key: "mui-rtl",
  stylisPlugins: [rtlPlugin],
});

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [mode, setMode] = useState<ColorMode>("light");
  const direction = i18n.language.startsWith("ar") ? "rtl" : "ltr";

  const theme = useMemo(() => buildTheme(mode, direction), [mode, direction]);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = i18n.language;
  }, [direction, i18n.language]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [mode]
  );

  const content = (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );

  if (direction === "rtl") {
    return <CacheProvider value={rtlCache}>{content}</CacheProvider>;
  }

  return content;
};
