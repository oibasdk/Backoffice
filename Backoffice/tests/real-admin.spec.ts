import { test, expect, type Page } from "@playwright/test";
import { buildAuthState, getSuperAdminCredentials } from "./helpers/auth";

const credentials = getSuperAdminCredentials();

const expectHeading = async (page: Page, name: string | RegExp) => {
  await expect(page.getByRole("heading", { name }).first()).toBeVisible({ timeout: 15000 });
};

const expectHeadingOrPermission = async (page: Page, name: string | RegExp) => {
  try {
    await expectHeading(page, name);
  } catch (error) {
    await expect(
      page.getByText("You do not have permission to view this area.", { exact: true })
    ).toBeVisible({ timeout: 5000 });
  }
};

test.describe("Real admin navigation (no mocks)", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!credentials, "Missing DJANGO_SUPERUSER_* credentials for real login.");

  let authState: Awaited<ReturnType<typeof buildAuthState>> | null = null;

  test.beforeAll(async () => {
    if (!credentials) {
      return;
    }
    authState = await buildAuthState(credentials);
  });

  test.beforeEach(async ({ page }) => {
    if (!authState) {
      return;
    }
    await page.addInitScript((state) => {
      window.sessionStorage.setItem("backoffice.auth", JSON.stringify(state));
    }, authState);
  });

  test("IAM pages load", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/backoffice/app/iam/users");
    await expectHeading(page, "Users");

    await page.goto("/backoffice/app/iam/roles");
    await expectHeading(page, "Roles & permissions");

    await page.goto("/backoffice/app/iam/permissions");
    await expectHeading(page, "Permissions");

    await page.goto("/backoffice/app/iam/user-permissions");
    await expectHeading(page, "User permissions");

    await page.goto("/backoffice/app/iam/devices");
    await expectHeading(page, "User devices");

    await page.goto("/backoffice/app/iam/sessions");
    await expectHeading(page, "User sessions");

    await page.goto("/backoffice/app/iam/access");
    await expectHeadingOrPermission(page, "Access");
  });

  test("Support Ops pages load", async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto("/backoffice/app/tickets");
    await expectHeading(page, "Tickets");

    await page.goto("/backoffice/app/sla-policies");
    await expectHeading(page, "SLA Policies");

    await page.goto("/backoffice/app/escalation-policies");
    await expectHeading(page, "Escalation Policies");

    await page.goto("/backoffice/app/remote-sessions");
    await expectHeading(page, "Remote Sessions");

    await page.goto("/backoffice/app/remote-session-policies");
    await expectHeading(page, "Remote session policies");

    await page.goto("/backoffice/app/ras/session-logs");
    await expectHeading(page, "Session logs");

    await page.goto("/backoffice/app/ras/metrics");
    await expectHeadingOrPermission(page, /ras metrics/i);

    await page.goto("/backoffice/app/ras/session-consents");
    await expectHeading(page, "Session consents");

    await page.goto("/backoffice/app/ras/session-events");
    await expectHeading(page, "Session events");

    await page.goto("/backoffice/app/ras/session-artifacts");
    await expectHeading(page, "Session artifacts");

    await page.goto("/backoffice/app/ras/chat-moderation-logs");
    await expectHeading(page, "Chat moderation logs");

    await page.goto("/backoffice/app/ras/policy-audit-logs");
    await expectHeading(page, "Policy audit logs");
  });

  test("Payments pages load", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/backoffice/app/payments/orders");
    await expectHeading(page, "Orders");

    await page.goto("/backoffice/app/payments/intents");
    await expectHeading(page, "Payment intents");

    await page.goto("/backoffice/app/payments/proofs");
    await expectHeading(page, "Payment proofs");

    await page.goto("/backoffice/app/payments/methods");
    await expectHeading(page, "Payment methods");

    await page.goto("/backoffice/app/payments/banks");
    await expectHeading(page, "Banks");

    await page.goto("/backoffice/app/payments/escrows");
    await expectHeading(page, "Escrows");

    await page.goto("/backoffice/app/payments/escrow-transactions");
    await expectHeading(page, "Escrow transactions");

    await page.goto("/backoffice/app/payments/payouts");
    await expectHeading(page, "Payouts");

    await page.goto("/backoffice/app/payments/audit-logs");
    await expectHeading(page, "Payment audit logs");
  });

  test("Catalog, Marketplace, and Communications pages load", async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto("/backoffice/app/catalog/categories");
    await expectHeading(page, "Categories");

    await page.goto("/backoffice/app/catalog/products");
    await expectHeading(page, "Products");

    await page.goto("/backoffice/app/catalog/professions");
    await expectHeading(page, "Professions");

    await page.goto("/backoffice/app/catalog/bundles");
    await expectHeading(page, "Bundles");

    await page.goto("/backoffice/app/marketplace/vendor-approvals");
    await expectHeading(page, "Vendor approvals");

    await page.goto("/backoffice/app/marketplace/product-approvals");
    await expectHeading(page, "Product approvals");

    await page.goto("/backoffice/app/chat/threads");
    await expectHeading(page, "Chat threads");

    await page.goto("/backoffice/app/chat/policies");
    await expectHeading(page, "Chat policies");

    await page.goto("/backoffice/app/knowledge");
    await expect(page.getByTestId("knowledge-index")).toBeVisible();
    await expect(page.getByLabel("Category")).toBeVisible();
    await expect(page.getByLabel("Owner")).toBeVisible();
    await expect(page.getByLabel("Last updated")).toBeVisible();

    await page.goto("/backoffice/app/knowledge/getting-started");
    await expect(page.getByTestId("knowledge-getting-started")).toBeVisible();

    await page.goto("/backoffice/app/knowledge/security");
    await expect(page.getByTestId("knowledge-security")).toBeVisible();

    await page.goto("/backoffice/app/knowledge/payments");
    await expect(page.getByTestId("knowledge-payments")).toBeVisible();
  });

  test("Legacy route redirects map to admin equivalents", async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto("/backoffice/app/services");
    await expect(page).toHaveURL(/\/backoffice\/app\/catalog\/products/);

    await page.goto("/backoffice/app/support");
    await expect(page).toHaveURL(/\/backoffice\/app\/tickets/);

    await page.goto("/backoffice/app/wallet");
    await expect(page).toHaveURL(/\/backoffice\/app\/payments\/payouts/);
  });

  test("Ops & observability pages load", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/backoffice/app/ops");
    await expectHeading(page, "Ops center");

    await page.goto("/backoffice/app/ops/observability");
    await expectHeading(page, "Observability");

    await page.goto("/backoffice/app/ops/system-health");
    await expectHeading(page, "System health");

    await page.goto("/backoffice/app/ops/system-alerts");
    await expectHeading(page, "System alerts");

    await page.goto("/backoffice/app/ops/notifications");
    await expectHeading(page, "Notifications");

    await page.goto("/backoffice/app/ops/admin-console");
    await expectHeading(page, "Admin console");
  });
});
