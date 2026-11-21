# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer-pages.spec.ts >> CUSTOMER browser + real API integration >> customer pages load, render and call the backend without mocked APIs
- Location: e2e\customer-pages.spec.ts:6:3

# Error details

```
TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary "Customer navigation" [ref=e4]:
      - generic [ref=e9]:
        - strong [ref=e10]: Banking Platform
        - generic [ref=e11]: Secure • Smart • Reliable
      - generic [ref=e12]: Customer Portal
      - navigation [ref=e13]:
        - link "Dashboard" [ref=e14] [cursor=pointer]:
          - /url: /customer/dashboard
        - link "My Accounts" [ref=e19] [cursor=pointer]:
          - /url: /customer/accounts
        - link "Transactions" [ref=e24] [cursor=pointer]:
          - /url: /customer/transactions
        - link "Deposit" [ref=e29] [cursor=pointer]:
          - /url: /customer/deposit
        - link "Withdrawal" [ref=e34] [cursor=pointer]:
          - /url: /customer/withdrawal
        - link "Transfer Money" [ref=e39] [cursor=pointer]:
          - /url: /customer/transfer
        - link "Beneficiaries" [ref=e44] [cursor=pointer]:
          - /url: /customer/beneficiaries
        - link "Notifications" [ref=e51] [cursor=pointer]:
          - /url: /customer/notifications
        - link "Decision Explanations" [ref=e56] [cursor=pointer]:
          - /url: /customer/decision-explanations
        - link "Profile & Settings" [ref=e61] [cursor=pointer]:
          - /url: /customer/profile
      - button "Log Out" [ref=e67] [cursor=pointer]
    - main [ref=e71]:
      - generic [ref=e72]:
        - generic [ref=e74]:
          - generic [ref=e75]: Customer workspace
          - strong [ref=e76]: Dashboard
        - generic [ref=e77]:
          - generic [ref=e78]:
            - textbox "Search this workspace" [ref=e82]:
              - /placeholder: Search accounts, transactions, or help…
            - generic [ref=e83]: Ctrl + K
          - button "Notifications" [ref=e84] [cursor=pointer]
          - button "Switch to dark theme" [ref=e89] [cursor=pointer]
          - button "T testuser5@example.test Customer" [ref=e93] [cursor=pointer]:
            - generic [ref=e94]: T
            - generic [ref=e95]:
              - strong [ref=e96]: testuser5@example.test
              - generic [ref=e97]: Customer
      - generic [ref=e100]:
        - generic [ref=e101]:
          - generic [ref=e102]:
            - paragraph [ref=e103]: CUSTOMER WORKSPACE
            - heading "Welcome" [level=1] [ref=e104]
            - paragraph [ref=e105]: A live overview of your accounts and recent activity.
          - link "Transfer money" [ref=e106] [cursor=pointer]:
            - /url: /customer/transfer
        - generic [ref=e110]:
          - article [ref=e111]:
            - generic [ref=e115]: My accounts
            - strong [ref=e116]: "2"
            - generic [ref=e117]: Accounts linked to your profile
          - article [ref=e118]:
            - generic [ref=e122]: Recent incoming
            - strong [ref=e123]: —
            - generic [ref=e124]: Completed deposits in returned page
          - article [ref=e125]:
            - generic [ref=e129]: Recent outgoing
            - strong [ref=e130]: —
            - generic [ref=e131]: Completed withdrawals and transfers in returned page
          - article [ref=e132]:
            - generic [ref=e136]: Recent transactions
            - strong [ref=e137]: "0"
            - generic [ref=e138]: Latest records returned by the API
        - generic [ref=e139]:
          - article [ref=e140]:
            - generic [ref=e141]:
              - generic [ref=e142]:
                - heading "Account balances" [level=2] [ref=e143]
                - paragraph [ref=e144]: Available balances grouped by currency
              - link "View accounts →" [ref=e145] [cursor=pointer]:
                - /url: /customer/accounts
            - generic [ref=e147]:
              - generic [ref=e148]: BDT
              - strong [ref=e149]: BDT 125,000.00
          - article [ref=e150]:
            - generic [ref=e152]:
              - heading "Quick actions" [level=2] [ref=e153]
              - paragraph [ref=e154]: Available customer actions
            - generic [ref=e155]:
              - link "Manage accounts" [ref=e156] [cursor=pointer]:
                - /url: /customer/accounts
              - link "Deposit" [ref=e159] [cursor=pointer]:
                - /url: /customer/deposit
              - link "Withdraw" [ref=e163] [cursor=pointer]:
                - /url: /customer/withdrawal
              - link "Beneficiaries" [ref=e167] [cursor=pointer]:
                - /url: /customer/beneficiaries
        - article [ref=e171]:
          - generic [ref=e172]:
            - generic [ref=e173]:
              - heading "Recent transactions" [level=2] [ref=e174]
              - paragraph [ref=e175]: Latest transactions returned by your account history
            - link "View all →" [ref=e176] [cursor=pointer]:
              - /url: /customer/transactions
          - alert [ref=e177]:
            - strong [ref=e181]: No transactions found.
        - paragraph [ref=e182]: Dashboard figures are calculated only from API records currently returned. Transaction flow totals reflect the latest page, not a complete statement.
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { expect, type Page, type Response } from "@playwright/test";
  2  | 
  3  | export function observeApi(page: Page) {
  4  |   const responses: Response[] = [];
  5  |   const failures: string[] = [];
  6  | 
  7  |   page.on("response", (response) => {
  8  |     if (response.url().includes("/api/v1/")) responses.push(response);
  9  |   });
  10 | 
  11 |   page.on("requestfailed", (request) => {
  12 |     if (!request.url().includes("/api/v1/")) return;
  13 |     const errorText = request.failure()?.errorText ?? "";
  14 | 
  15 |     // Navigation may cancel an in-flight request from the page being left.
  16 |     if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(errorText)) return;
  17 | 
  18 |     failures.push(
  19 |       `${request.method()} ${request.url()} :: ${errorText || "unknown request failure"}`,
  20 |     );
  21 |   });
  22 | 
  23 |   return {
  24 |     responses,
  25 |     failures,
  26 | 
  27 |     waitForResponse(pathFragment: string, method = "GET") {
> 28 |       return page.waitForResponse(
     |                   ^ TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
  29 |         (response) =>
  30 |           response.url().includes(pathFragment) &&
  31 |           response.request().method() === method,
  32 |       );
  33 |     },
  34 | 
  35 |     async assertNoServerErrors() {
  36 |       const bad = responses
  37 |         .filter((response) => response.status() >= 500)
  38 |         .map(
  39 |           (response) =>
  40 |             `${response.status()} ${response.request().method()} ${response.url()}`,
  41 |         );
  42 | 
  43 |       expect([...failures, ...bad], "API network/server errors detected").toEqual([]);
  44 |     },
  45 | 
  46 |     async assertRequest(pathFragment: string, method?: string) {
  47 |       await expect
  48 |         .poll(() =>
  49 |           responses.some(
  50 |             (response) =>
  51 |               response.url().includes(pathFragment) &&
  52 |               (!method || response.request().method() === method),
  53 |           ),
  54 |         )
  55 |         .toBeTruthy();
  56 |     },
  57 |   };
  58 | }
  59 | 
```