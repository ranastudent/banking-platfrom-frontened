import { expect, type APIRequestContext, type Page } from "@playwright/test";
import "dotenv/config";

const env = (globalThis as typeof globalThis & {
  process: { env: Record<string, string | undefined> };
}).process.env;

export type E2ERole = "CUSTOMER" | "ADMIN" | "SUPPORT" | "AUDITOR";

const roleEnv: Record<E2ERole, [string, string]> = {
  CUSTOMER: ["E2E_CUSTOMER_EMAIL", "E2E_CUSTOMER_PASSWORD"],
  ADMIN: ["E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD"],
  SUPPORT: ["E2E_SUPPORT_EMAIL", "E2E_SUPPORT_PASSWORD"],
  AUDITOR: ["E2E_AUDITOR_EMAIL", "E2E_AUDITOR_PASSWORD"],
};

export async function loginAs(request: APIRequestContext, page: Page, role: E2ERole) {
  const [emailKey, passwordKey] = roleEnv[role];
  const email = env[emailKey];
  const password = env[passwordKey];
  testEnvRequired(emailKey, email);
  testEnvRequired(passwordKey, password);

  const apiOrigin = (env.VITE_API_BASE_URL || "http://127.0.0.1:5000").replace(/\/+$/, "");
  const response = await request.post(`${apiOrigin}/api/v1/auth/login`, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status(), `Login API failed for ${role}: ${await response.text()}`).toBe(200);
  const body = await response.json();
  const auth = body?.data ?? body;
  expect(auth.accessToken, "Login response must include accessToken").toBeTruthy();
  expect(auth.refreshToken, "Login response must include refreshToken").toBeTruthy();
  expect(auth.user?.role, "Login response must include expected role").toBe(role);

  // Match the application's sessionStorage keys; no token is written to logs or artifacts.
  await page.addInitScript(({ accessToken, refreshToken }) => {
    sessionStorage.setItem("banking.accessToken", accessToken);
    sessionStorage.setItem("banking.refreshToken", refreshToken);
  }, { accessToken: auth.accessToken, refreshToken: auth.refreshToken });
}

function testEnvRequired(key: string, value?: string): asserts value is string {
  if (!value) throw new Error(`Missing ${key}. Copy .env.e2e.example to .env.e2e and configure a disposable test user.`);
}
