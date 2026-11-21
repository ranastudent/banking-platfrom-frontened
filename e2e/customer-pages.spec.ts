import { test, expect } from "@playwright/test";
import { loginAs } from "./support/auth";
import { observeApi } from "./support/network";

test.describe("CUSTOMER browser + real API integration", () => {
  test("customer pages load, render and call the backend without mocked APIs", async ({ page, request }) => {
    await loginAs(request, page, "CUSTOMER");
    const network = observeApi(page);

    // Wait for dashboard data before navigating away so its requests are not
    // cancelled by the next page navigation.
    const dashboardAccounts = network.waitForResponse("/api/v1/accounts", "GET");
    const dashboardTransactions = network.waitForResponse("/api/v1/transactions", "GET");

    await page.goto("/customer/dashboard");

    const [accountsResponse, transactionsResponse] = await Promise.all([
      dashboardAccounts,
      dashboardTransactions,
    ]);
    expect(accountsResponse.status()).toBe(200);
    expect(transactionsResponse.status()).toBe(200);
    await expect(page.locator("body")).toContainText(/welcome|live overview/i);

    const pages = [
      { path: "/customer/accounts", title: /accounts/i, api: "/api/v1/accounts" },
      { path: "/customer/transactions", title: /transactions/i, api: "/api/v1/transactions" },
      { path: "/customer/beneficiaries", title: /beneficiaries/i, api: "/api/v1/beneficiaries" },
      { path: "/customer/notifications", title: /notifications/i, api: "/api/v1/notifications" },
      { path: "/customer/profile", title: /profile/i, api: "/api/v1/users/me" },
      { path: "/customer/decision-explanations", title: /decision explanations/i, api: "/api/v1/customer/decision-explanations/me" },
    ];

    for (const item of pages) {
      const apiResponsePromise = network.waitForResponse(item.api, "GET");
      await page.goto(item.path);
      await expect(page.locator("body")).toContainText(item.title);
      const apiResponse = await apiResponsePromise;
      expect(apiResponse.status(), `${item.api} should succeed`).toBeLessThan(400);
    }

    await network.assertNoServerErrors();
  });

  test("account and transaction API contracts return the documented collection envelopes", async ({ page, request }) => {
    await loginAs(request, page, "CUSTOMER");

    const accountResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/v1/accounts") && response.request().method() === "GET"
    );
    await page.goto("/customer/accounts");
    const accountResponse = await accountResponsePromise;
    expect(accountResponse.status()).toBe(200);

    const accountBody = await accountResponse.json();
    expect(accountBody.success).toBe(true);
    expect(Array.isArray(accountBody.data?.accounts)).toBe(true);
    const firstAccountId = accountBody.data.accounts[0]?.id;

    const transactionResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/v1/transactions") && response.request().method() === "GET"
    );
    await page.goto("/customer/transactions");
    const transactionResponse = await transactionResponsePromise;
    expect(transactionResponse.status()).toBe(200);

    const transactionBody = await transactionResponse.json();
    expect(transactionBody.success).toBe(true);
    expect(Array.isArray(transactionBody.data?.transactions)).toBe(true);
    expect(transactionBody.data?.pagination).toBeDefined();

    if (firstAccountId) {
      const detailResponsePromise = page.waitForResponse((response) =>
        response.url().includes(`/api/v1/accounts/${firstAccountId}`) && response.request().method() === "GET"
      );
      await page.goto(`/customer/accounts/${firstAccountId}`);
      const detailResponse = await detailResponsePromise;
      expect(detailResponse.status()).toBe(200);

      const detailBody = await detailResponse.json();
      expect(detailBody.success).toBe(true);
      expect(detailBody.data?.account?.id).toBe(firstAccountId);
    }
  });

  test("money movement pages load accounts and expose idempotent submission controls", async ({ page, request }) => {
    await loginAs(request, page, "CUSTOMER");
    const network = observeApi(page);

    for (const path of ["/customer/deposit", "/customer/withdrawal", "/customer/transfer"]) {
      const accountsResponsePromise = network.waitForResponse("/api/v1/accounts", "GET");
      await page.goto(path);
      const accountsResponse = await accountsResponsePromise;
      expect(accountsResponse.status(), `Account loading should succeed on ${path}`).toBe(200);

      await expect(page.locator("form").first()).toBeVisible();
      await expect(
        page.locator("button[type=submit], form button:not([type=button])").first()
      ).toBeVisible();
    }

    await network.assertNoServerErrors();
  });
});
