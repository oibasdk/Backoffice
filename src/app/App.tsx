import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { AdminGuard } from "../auth/AdminGuard";
import { AppShell } from "./shell/AppShell";
import { LoginPage } from "../auth/pages/LoginPage";
import { NotFoundPage } from "./NotFoundPage";
import { FullPageLoader } from "../components/StateViews";
import { ALL_ROUTES } from "./moduleRegistry";

export const App: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<AdminGuard />}>
      <Route element={<AppShell />}>
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
