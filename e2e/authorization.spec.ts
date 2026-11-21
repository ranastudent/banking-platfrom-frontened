import { test, expect } from "@playwright/test";
import { loginAs } from "./support/auth";

test("unauthenticated customer route redirects to login", async ({ page }) => {
  await page.goto("/customer/accounts");
  await expect(page).toHaveURL(/\/login$/);
});

test("customer cannot open admin, support or auditor areas", async ({ page, request }) => {
  await loginAs(request, page, "CUSTOMER");
  for (const path of ["/admin/dashboard", "/support/dashboard", "/auditor/dashboard"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/403$/);
    await expect(page.getByText(/access restricted/i)).toBeVisible();
  }
});
