import { defineConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const envExecutable = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const localChromium =
  process.platform === "win32" && process.env.LOCALAPPDATA
    ? path.join(
        process.env.LOCALAPPDATA,
        "ms-playwright",
        "chromium-1200",
        "chrome-win64",
        "chrome.exe"
      )
    : undefined;
const executablePath =
  envExecutable || (localChromium && fs.existsSync(localChromium) ? localChromium : undefined);
const launchOptions = executablePath ? { executablePath } : undefined;

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  outputDir: "playwright-results",
  use: {
    baseURL: "http://localhost:5174",
    actionTimeout: 15_000,
    navigationTimeout: 40_000,
    trace: "retain-on-failure",
    launchOptions,
  },
  webServer: {
    command: "npm run dev -- --host --port 5174",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_BFF_BASE_URL: process.env.VITE_BFF_BASE_URL || "http://localhost:9000",
      VITE_APP_BASE_PATH: process.env.VITE_APP_BASE_PATH || "/backoffice/app/",
    },
  },
});
