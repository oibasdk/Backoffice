import { test, expect } from "@playwright/test";
import { buildAuthState, getSuperAdminCredentials } from "./helpers/auth";

const credentials = getSuperAdminCredentials();

test.describe("Real dashboard flows (no mocks)", () => {
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

  test("Experience studio saves brand settings", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/backoffice/app/studio");
    await expect(page.getByRole("heading", { name: "Experience studio" }).first()).toBeVisible({
      timeout: 20_000,
    });

    const waitForSaveSuccess = async () => {
      const toast = page.getByRole("alert").filter({ hasText: "Studio setting updated" });
      await expect(toast).toBeVisible({ timeout: 15_000 });
      await expect(toast).toBeHidden({ timeout: 10_000 });
    };

    const reloadButton = page.getByRole("button", { name: "Reload settings" });
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/bff/admin/app-settings/") &&
          resp.request().method() === "GET" &&
          resp.ok()
      ),
      reloadButton.click(),
    ]);

    const section = page
      .getByRole("heading", { name: "Brand identity", level: 3 })
      .locator('xpath=ancestor::*[contains(@class,"MuiPaper-root")]')
      .first();

    const brandInput = section.getByLabel("Brand name");
    const originalValue = await brandInput.inputValue();
    const nextValue = `Sharoobi QA ${Date.now()}`;

    await brandInput.fill(nextValue);
    await expect(section.getByText("Unsaved changes")).toBeVisible();

    const saveButton = section.getByRole("button", { name: "Save" });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await waitForSaveSuccess();

    await expect(section.getByText("Unsaved changes")).toBeHidden();

    await brandInput.fill(originalValue);
    await saveButton.click();
    await waitForSaveSuccess();
  });

  test("Configuration pages load (App Settings + Content Blocks)", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/backoffice/app/configuration/app-settings");
    await expect(page.getByRole("heading", { name: "App settings" }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("table")).toBeVisible();

    await page.goto("/backoffice/app/configuration/content-blocks");
    await expect(page.getByRole("heading", { name: "Content blocks" }).first()).toBeVisible();
  });

  test("Analytics supports custom range", async ({ page }) => {
    await page.goto("/backoffice/app/analytics");

    await expect(page.getByRole("heading", { name: "Analytics" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Custom" }).click();

    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    const start = startDate.toISOString().slice(0, 10);

    const startInput = page.getByLabel("Start date");
    const endInput = page.getByLabel("End date");
    await expect(startInput).toBeEnabled();
    await expect(endInput).toBeEnabled();

    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes("/bff/admin/overview") && resp.url().includes("start=")),
      startInput.fill(start),
      endInput.fill(end),
    ]);

    await expect(page.getByText("Logins")).toBeVisible();
  });
});
