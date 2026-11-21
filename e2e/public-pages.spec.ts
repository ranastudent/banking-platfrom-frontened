import { test, expect } from "@playwright/test";

test("public pages render without requiring an authenticated session", async ({ page }) => {
  const routes = [
    ["/about", /about|banking/i],
    ["/login", /sign in|login/i],
    ["/register", /create account|register/i],
    ["/verify-email", /verify|email/i],
    ["/forgot-password", /forgot|reset/i],
    ["/reset-password", /reset|password/i],
  ] as const;

  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.locator("body")).not.toContainText("Page not found");
    await expect(page.locator("body")).toContainText(heading);
  }
});
