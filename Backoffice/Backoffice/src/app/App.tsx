import React, { Suspense, useMemo } from "react";
import { Route, Routes } from "react-router-dom";

import { AdminGuard } from "../auth/AdminGuard";
import { AppShell } from "./shell/AppShell";
import { AppShellTailwind } from "./shell/AppShell.Tailwind";
import { LoginPage } from "../auth/pages/LoginPage";
import { NotFoundPage } from "./NotFoundPage";
import { FullPageLoader } from "../components/StateViews";
import { ALL_ROUTES } from "./moduleRegistry";
import { useUIFeatures } from "./hooks/useUIFeatures";

export const App: React.FC = () => {
  const { useTailwindShell } = useUIFeatures();
  const Shell = useMemo(() => (useTailwindShell ? AppShellTailwind : AppShell), [useTailwindShell]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminGuard />}>
        <Route element={<Shell />}>
          {ALL_ROUTES.map((route) =>
            route.index ? (
              <Route
                key="index"
                index
                element={<Suspense fallback={<FullPageLoader />}>{route.element}</Suspense>}
              />
            ) : (
              <Route
                key={route.path}
                path={route.path}
                element={<Suspense fallback={<FullPageLoader />}>{route.element}</Suspense>}
              />
            )
          )}
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
