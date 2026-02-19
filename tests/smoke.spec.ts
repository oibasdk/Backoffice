import { test, expect, Page } from "@playwright/test";

// Type declarations for test globals
declare global {
  interface Window {
    __BACKOFFICE_TEST_AUTH__?: { tokens: { accessToken: string; refreshToken: string } };
    __BACKOFFICE_TEST_BYPASS__?: boolean;
    __BACKOFFICE_TEST_ACCESS__?: {
      user: { id: number; email: string; role: string };
      role: string;
      is_staff: boolean;
      is_superuser: boolean;
      permissions: string[];
      permission_map: Record<string, string[]>;
    };
  }
}

const mockLogin = async (page: Page, role = "admin") => {
  await page.route("**/bff/public/auth/token/", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access: "access-token",
        refresh: "refresh-token",
        user: { email: "admin@example.com", role },
      }),
    })
  );
};

const mockAdminAccess = async (page: Page, role = "admin") => {
  await page.route("**/bff/admin/access**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: 1, email: "admin@example.com", role },
        role,
        is_staff: true,
        is_superuser: role === "superadmin",
        permissions: ["user.view", "role_template.view", "audit_log.view", "ticket.view"],
        permission_map: {},
      }),
    })
  );
};

test("redirects to login when unauthenticated", async ({ page }) => {
  await page.goto("/backoffice/app/");
  await expect(page).toHaveURL(/\/backoffice\/app\/login/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("blocks non-internal users via admin access check", async ({ page }) => {
  await mockLogin(page, "customer");
  await page.route("**/bff/admin/access**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ code: 403, message: "Admin access required." }),
    })
  );

  await page.goto("/backoffice/app/login");
  await page.getByLabel("Email or phone").fill("user@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Something went wrong")).toBeVisible();
});

test("loads users and audit logs pages", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    window.__BACKOFFICE_TEST_AUTH__ = {
      tokens: { accessToken: "access-token", refreshToken: "refresh-token" },
    };
    window.__BACKOFFICE_TEST_BYPASS__ = true;
    window.__BACKOFFICE_TEST_ACCESS__ = {
      user: { id: 1, email: "admin@example.com", role: "superadmin" },
      role: "superadmin",
      is_staff: true,
      is_superuser: true,
      permissions: ["user.view", "role_template.view", "audit_log.view", "ticket.view"],
      permission_map: {},
    };
  });
  await page.route("**/bff/admin/users/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
    })
  );
  await page.route("**/bff/admin/audit-logs/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
    })
  );

  await page.goto("/backoffice/app/iam/users", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Users", exact: true })).toBeVisible();

  await page.goto("/backoffice/app/audit", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Audit Logs" })).toBeVisible();
});
