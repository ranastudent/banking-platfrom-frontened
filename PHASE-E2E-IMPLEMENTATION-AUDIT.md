# Frontend implementation and E2E audit — 2026-11-21

## What was changed
- Added Playwright Chromium E2E configuration and scripts.
- Added real-login helper that authenticates against `/api/v1/auth/login` and seeds the app's `sessionStorage` token keys (`banking.accessToken`, `banking.refreshToken`).
- Added browser network observer for API request failures and HTTP 5xx responses.
- Added public route smoke tests, CUSTOMER page/API integration tests, documented collection-envelope assertions, and CUSTOMER role-boundary tests.
- No API route mocking is used. The browser talks to the configured backend.
- Corrected the transfer source account selector to submit the account UUID (the API guide's transfer example passes account identifiers), rather than the human-readable account number.
- Updated auth interceptor exclusions to match the OTP password-reset endpoints in the API guide.

## Current frontend page coverage

| Page / area | Current code state | E2E coverage |
|---|---|---|
| About, Login, Register, Verify Email, Forgot Password, Reset Password | Implemented | Public route smoke |
| Customer Dashboard | Implemented | Render smoke |
| Accounts List | Implemented | Real GET + envelope assertion |
| Account Details | Implemented | Real GET when a seeded account exists |
| Transactions List | Implemented | Real GET + envelope assertion |
| Transaction Details | Implemented | Not yet seeded with a known transaction ID |
| Deposit, Withdrawal, Transfer | Implemented | Page and account-load checks only; no financial mutation |
| Beneficiaries, Notifications, Profile, Decision Explanations | Implemented | Real page/API smoke |
| FX Request Details | Implemented route; requires a valid request ID | Requires seeded `E2E_FX_REQUEST_ID` before an assertion can be enabled |
| ADMIN / SUPPORT / AUDITOR areas | Several routes still render `PlaceholderPage` | Role boundary only; not represented as completed feature integrations |

## Important contract and verification limits
- The supplied API Integration Guide is a static review of a backend `src/` tree, not a live contract test. The supplied `src.zip` in this upload is the frontend `src/` tree (React files), not the backend source tree. Therefore this update cannot truthfully certify every backend controller/schema or the running API.
- The Frontend Architecture & Page Plan and UI Audit Checklist list 51 screens, and explicitly require each displayed dynamic field to map to a backend response, all page states, responsive behavior, role boundaries and both themes to be checked. Placeholder routes remain blocked from being called integrated.
- The E2E suite asserts the documented accounts and transactions envelopes. Other page endpoints are observed for request and 5xx behavior, but their full response schema still needs backend-source/live-test verification.
- Financial action tests intentionally do not submit deposit, withdrawal or transfer requests. Add separate opt-in mutation tests only after disposable test accounts, database reset/cleanup, idempotency replay assertions and a safe local backend are available.
- Password reset in the API guide is the three-step OTP flow: `/auth/reset-password/request`, `/auth/reset-password/verify-otp`, then `/auth/reset-password`. The page smoke test does not send OTPs or reset passwords.

## Install and run
1. `npm install` (updates `package-lock.json` with Playwright and dotenv).
2. `npx playwright install chromium`.
3. Copy `.env.e2e.example` to `.env.e2e`; use disposable local test users.
4. Start the backend on the configured local API origin with a dedicated test database and test Redis.
5. Run `npm run test:e2e`.
6. Use `npm run test:e2e:headed` to watch the browser and `npm run test:e2e:report` for the HTML report.

Never use production customer accounts or live money for this suite.
