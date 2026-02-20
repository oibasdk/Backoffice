import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

import "../i18n";
import { AdminGuard } from "../../auth/AdminGuard";
import { AuthProvider } from "../providers/AuthProvider";

vi.mock("../../auth/useAdminAccess", () => ({
  useAdminAccess: () => ({
    data: null,
    isLoading: false,
    isError: true,
    refetch: vi.fn(),
  }),
}));

test("shows error state when admin access fails", () => {
  const client = new QueryClient();

  render(
    <QueryClientProvider client={client}>
      <AuthProvider
        initialTokens={{
          accessToken: "token",
          refreshToken: "refresh",
        }}
      >
        <MemoryRouter
          initialEntries={["/"]}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route element={<AdminGuard />}>
              <Route path="/" element={<div>protected</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );

  expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
});
