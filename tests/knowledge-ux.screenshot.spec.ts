import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { buildAuthState, getSuperAdminCredentials } from "./helpers/auth";

const credentials = getSuperAdminCredentials();

const screenshotsDir = path.resolve(process.cwd(), "..", "..", "docs", "ux", "knowledge");

test.describe("Knowledge UX screenshots", () => {
  test.skip(!process.env.PW_CAPTURE_UX, "Set PW_CAPTURE_UX=1 to capture screenshots.");
  test.skip(!credentials, "Missing DJANGO_SUPERUSER_* credentials for real login.");

  let authState: Awaited<ReturnType<typeof buildAuthState>> | null = null;

  test.beforeAll(async () => {
    if (!credentials) {
      return;
    }
    fs.mkdirSync(screenshotsDir, { recursive: true });
    authState = await buildAuthState(credentials);
  });

  test.beforeEach(async ({ page }) => {
    if (!authState) {
      return;
    }
    await page.addInitScript((state) => {
      window.sessionStorage.setItem("backoffice.auth", JSON.stringify(state));
    }, authState);
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("capture Knowledge Index + articles", async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto("/backoffice/app/knowledge");
    await expect(page.getByTestId("knowledge-index")).toBeVisible();
    await page.getByRole("heading", { name: /Knowledge/i }).first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotsDir, "knowledge-index-hero.png"), fullPage: true });

    await page.getByLabel("Category").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotsDir, "knowledge-index-filters.png"), fullPage: true });

    const readButtons = page.getByRole("button", { name: /read article|اقرأ المقال/i });
    if ((await readButtons.count()) > 0) {
      await readButtons.first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(screenshotsDir, "knowledge-index-cards.png"), fullPage: true });
    } else {
      await page.screenshot({ path: path.join(screenshotsDir, "knowledge-index-empty.png"), fullPage: true });
    }

    await page.goto("/backoffice/app/knowledge/getting-started");
    await expect(page.getByTestId("knowledge-getting-started")).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, "knowledge-article-meta.png"), fullPage: true });

    await page.goto("/backoffice/app/knowledge");
    await page.getByLabel(/search articles|بحث في المقالات/i).fill("no-such-knowledge-entry");
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, "knowledge-empty-state.png"), fullPage: true });
  });
});
