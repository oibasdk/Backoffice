import fs from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

type Credentials = {
  email: string;
  password: string;
};

type AuthState = {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user?: {
    email?: string;
    role?: string;
  } | null;
};
const parseEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const contents = fs.readFileSync(filePath, "utf-8");
  const entries: Record<string, string> = {};
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    entries[key] = value;
  });
  return entries;
};

const loadEnvFallback = () => {
  const rootEnvPath = path.resolve(process.cwd(), "..", "..", ".env");
  return parseEnvFile(rootEnvPath);
};

const envFallback = loadEnvFallback();

const readEnv = (key: string) => process.env[key] || envFallback[key] || "";

const getBffBaseUrl = () => process.env.VITE_BFF_BASE_URL || "http://localhost:9000";

export const getSuperAdminCredentials = (): Credentials | null => {
  const email = readEnv("DJANGO_SUPERUSER_EMAIL");
  const password = readEnv("DJANGO_SUPERUSER_PASSWORD");
  if (!email || !password) {
    return null;
  }
  return { email, password };
};

export const buildAuthState = async (creds: Credentials): Promise<AuthState> => {
  const response = await fetch(`${getBffBaseUrl()}/bff/public/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: creds.email, password: creds.password }),
  });

  if (!response.ok) {
    throw new Error(`Auth token request failed (${response.status}).`);
  }

  const payload = await response.json();
  return {
    tokens: {
      accessToken: payload.access,
      refreshToken: payload.refresh,
    },
    user: payload.user ? { email: payload.user.email, role: payload.user.role } : null,
  };
};

export const loginAsSuperAdmin = async (page: Page, creds: Credentials) => {
  await page.goto("/backoffice/app/login");

  const alreadyAuthed = await page
    .getByRole("heading", { name: "Mission Control" })
    .first()
    .isVisible()
    .catch(() => false);
  if (alreadyAuthed) {
    return;
  }

  const loginButton = page.getByRole("button", { name: "Sign in" });
  const emailField = page.getByLabel("Email or phone");
  const passwordField = page.getByLabel("Password");

  let lastResponseOk = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await emailField.fill(creds.email);
    await passwordField.fill(creds.password);
    const response = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes("/bff/public/auth/token/"), {
        timeout: 10_000,
      }),
      loginButton.click(),
    ])
      .then(([resp]) => resp)
      .catch(() => null);

    if (response && response.ok()) {
      lastResponseOk = true;
      break;
    }
    await page.waitForTimeout(1000);
  }

  if (!lastResponseOk) {
    throw new Error("Login failed or rate-limited; no successful token response.");
  }

  await expect(page).toHaveURL(/\/backoffice\/app\/?$/);
  await expect(page.getByRole("heading", { name: "Mission Control" })).toBeVisible();
};
