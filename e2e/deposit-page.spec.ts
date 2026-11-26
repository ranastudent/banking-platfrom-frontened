import { test, expect } from "@playwright/test";
import { loginAs } from "./support/auth";
import { observeApi } from "./support/network";

test.describe("Customer deposit frontend integration", () => {
  test("loads provider methods, limits, account data and deposit history without initiating a payment", async ({ page, request }) => {
    await loginAs(request, page, "CUSTOMER");
    const network = observeApi(page);
    const methodsResponse = network.waitForResponse("/api/v1/deposits/methods", "GET");
    const limitsResponse = network.waitForResponse("/api/v1/deposits/limits", "GET");
    const historyResponse = network.waitForResponse("/api/v1/deposits", "GET");
    const accountsResponse = network.waitForResponse("/api/v1/accounts", "GET");

    await page.goto("/customer/deposit");

    const [methods, limits, history, accounts] = await Promise.all([
      methodsResponse, limitsResponse, historyResponse, accountsResponse,
    ]);
    expect(methods.status()).toBe(200);
    expect(limits.status()).toBe(200);
    expect(history.status()).toBe(200);
    expect(accounts.status()).toBe(200);

    await expect(page.getByRole("heading", { name: "Deposit funds" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Deposit history" })).toBeVisible();
    await expect(page.getByText(/balance safety/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /bank transfer/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /card payment/i })).toBeDisabled();

    // Invalid/non-positive amount must not open the confirmation step or send
    // an initiation request. This test deliberately does not move any funds.
    const amount = page.getByPlaceholder("0.00");
    await amount.fill("0");
    await expect(page.getByRole("button", { name: /continue to confirmation/i })).toBeDisabled();
    await expect(page.getByRole("heading", { name: /review your deposit/i })).toHaveCount(0);
    await network.assertNoServerErrors();
  });
});
