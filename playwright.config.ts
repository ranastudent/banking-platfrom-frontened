import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load Playwright credentials and E2E URLs from the frontend .env.e2e file.
dotenv.config({ path: ".env.e2e", override: false });

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";
const apiBaseURL = (
  process.env.VITE_API_BASE_URL || "http://127.0.0.1:5001"
).replace(/\/+$/, "");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/e2e-junit.xml" }],
  ],

  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Playwright starts Vite in "e2e" mode so it loads .env.e2e.
  // The Backend must already be running on the isolated test environment.
  webServer: {
    command: "npm run dev -- --mode e2e --host 127.0.0.1",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  

  metadata: { apiBaseURL },
});
