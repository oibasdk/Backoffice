import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./app/i18n";
import "./design-system/styles/global.css";

import { AppThemeProvider } from "./design-system/theme";
import { AuthProvider, type AuthTokens } from "./app/providers/AuthProvider";
import { ToastProvider } from "./app/providers/ToastProvider";
import { App } from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BASE_PATH } from "./app/config";

declare global {
  interface Window {
    __BACKOFFICE_TEST_AUTH__?: { tokens?: AuthTokens };
  }
}

const initialTokens =
  import.meta.env.MODE !== "production" ? window.__BACKOFFICE_TEST_AUTH__?.tokens ?? null : null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container missing");
}

createRoot(container).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialTokens={initialTokens}>
        <AppThemeProvider>
          <ToastProvider>
            <BrowserRouter
              basename={BASE_PATH}
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </BrowserRouter>
          </ToastProvider>
        </AppThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
