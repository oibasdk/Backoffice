import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "../i18n";
import { AdminGuard } from "../../auth/AdminGuard";
import { AuthProvider } from "../providers/AuthProvider";

const renderWithProviders = (
  ui: React.ReactNode,
  { token, accessData }: { token?: string; accessData?: unknown } = {}
) => {
  const client = new QueryClient();
  if (token && accessData) {
    client.setQueryData(["admin-access", token], accessData);
  }
  const wrapper = (
    <QueryClientProvider client={client}>
      <AuthProvider
        initialTokens={
          token
            ? {
                accessToken: token,
                refreshToken: "refresh",
              }
            : null
        }
      >
        <MemoryRouter
          initialEntries={["/"]}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          {ui}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
  return { client, ...render(wrapper) };
};

test("redirects to login when unauthenticated", () => {
  renderWithProviders(
    <Routes>
      <Route element={<AdminGuard />}>
        <Route path="/" element={<div>protected</div>} />
      </Route>
      <Route path="/login" element={<div>login</div>} />
    </Routes>
  );

  expect(screen.getByText("login")).toBeInTheDocument();
});

test("renders protected content when access is available", () => {
  renderWithProviders(
    <Routes>
      <Route element={<AdminGuard />}>
        <Route path="/" element={<div>protected</div>} />
      </Route>
      <Route path="/login" element={<div>login</div>} />
    </Routes>,
    {
      token: "token",
      accessData: {
        user: { id: 1, email: "admin@example.com", role: "admin" },
        role: "admin",
        is_staff: true,
        is_superuser: false,
        permissions: [],
        permission_map: {},
      },
    }
  );

  expect(screen.getByText("protected")).toBeInTheDocument();
});
