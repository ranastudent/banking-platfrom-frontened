# Playwright E2E — real browser + real backend

This suite is deliberately **not** using `page.route()` or mocked API responses. It starts Vite, logs in through the real `/api/v1/auth/login` endpoint, injects the returned session tokens into the same sessionStorage keys used by the app, and observes real browser API traffic.

## Safety first
- Use a local backend connected to a dedicated disposable test database and test Redis.
- Create separate verified ACTIVE test users for CUSTOMER, ADMIN, SUPPORT and AUDITOR.
- Never point money-movement tests at real funds or production data.
- Do not commit `.env.e2e`; it contains test credentials.
- The default suite does not submit deposit, withdrawal or transfer mutations. Those need separately seeded test accounts and explicit opt-in.

## Setup
1. Install dependencies: `npm ci`
2. Install browser: `npx playwright install chromium`
3. Copy `.env.e2e.example` to `.env.e2e` and configure local API URL and test credentials.
4. Start the backend separately using its isolated test configuration.
5. Run `npm run test:e2e`.

## Commands
- `npm run test:e2e` — headless Chromium
- `npm run test:e2e:headed` — visible browser
- `npm run test:e2e:ui` — Playwright UI runner
- `npm run test:e2e:report` — open HTML report

## What is covered now
- Public routes: About, Login, Register, Email Verification, Forgot Password, Reset Password.
- CUSTOMER: dashboard, accounts, transactions, deposit/withdrawal/transfer page rendering, beneficiaries, notifications, profile and decision explanations.
- Network monitoring: actual `/api/v1` responses, request failures and HTTP 5xx.
- Authorization: unauthenticated redirect and CUSTOMER denial for ADMIN/SUPPORT/AUDITOR paths.

## Current coverage boundary
The route audit shows several ADMIN, SUPPORT and AUDITOR screens are still `PlaceholderPage` components in `src/App.tsx`. These tests do not claim those pages are implemented or integrated. Add role-specific real API specs as those pages are implemented. Account details, transaction details and FX request details need valid seeded resource IDs; add them to the test data fixture before asserting those routes.

## Contract and UI release gates
Use the API guide and UI checklist alongside this suite:
- Assert only fields returned by the backend; do not infer fields from mockups.
- Verify loading, empty, error, success and access-denied states.
- Verify both themes, responsive breakpoints and keyboard/accessibility behavior.
- Test financial mutation idempotency with dedicated test accounts and assert exactly one resulting transaction.
