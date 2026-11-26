# Phase 36 — Backend / Frontend API Contract Map

**Scope:** static source audit of the supplied Backend (`src/`), Prisma project, and Frontend (`src/`).
**API base:** `VITE_API_BASE_URL + /api/v1`.

## Canonical contract fixes in this phase

### Internal transfer

- **Endpoint:** `POST /api/v1/transfers`
- **Backend route:** `src/transaction/routes/transfer.routes.ts`
- **Backend schema/service:** `src/transaction/schemas/transfer.schema.ts`, `src/transaction/services/transfer.service.ts`
- **Frontend:** `src/features/customer/phase6/CustomerPages.tsx`
- `senderAccount` and `receiverAccount` are both **customer-facing account-number strings**.
- Neither field accepts an internal `Account.id` UUID.
- Saved internal beneficiary `accountReference` is used as the receiver account number.
- `Idempotency-Key` remains required.
- `202 Accepted` may mean the transfer is on risk hold; it is not a completed money movement.

### Currency reserve

- **List:** `GET /api/v1/admin/currency-reserves?page=1&limit=100`
- **Detail:** `GET /api/v1/admin/currency-reserves/:currencyCode`
- **Adjustment:** `POST /api/v1/admin/currency-reserves/:currencyCode/adjust`
- Backend DTO fields are `availableReserve`, `lockedReserve`, and `minimumReserve`.
- Frontend Admin Reserve table now consumes `availableReserve` and `lockedReserve`.

## Frontend endpoint-to-backend route verification

| Frontend request | Backend route mount + route | Contract |
|---|---|---|
| `POST /auth/login` | `/auth` + `POST /login` | Match |
| `POST /auth/register` | `/auth` + `POST /register` | Match |
| `POST /auth/verify-email` | `/auth` + `POST /verify-email` | Match |
| `POST /auth/refresh` | `/auth` + `POST /refresh` | Match |
| `POST /auth/logout` | `/auth` + `POST /logout` | Match |
| `POST /auth/reset-password/request` | `/auth` + `POST /reset-password/request` | Match |
| `POST /auth/reset-password/verify-otp` | `/auth` + `POST /reset-password/verify-otp` | Match |
| `POST /auth/reset-password` | `/auth` + `POST /reset-password` | Match |
| `GET /auth/me` | `/auth` + `GET /me` | Match |
| `GET /accounts` | `/accounts` + `GET /` | Match |
| `POST /accounts` | `/accounts` + `POST /` | Match |
| `GET /accounts/:accountId` | `/accounts` + `GET /:accountId` | Match |
| `POST /accounts/:accountId/deposits` | `/accounts` + `POST /:accountId/deposits` | Match |
| `POST /accounts/:accountId/withdrawals` | `/accounts` + `POST /:accountId/withdrawals` | Match |
| `GET /transactions` | `/transactions` + `GET /` | Match |
| `GET /transactions/:transactionId` | `/transactions` + `GET /:transactionId` | Match |
| `POST /transfers` | `/transfers` + `POST /` | Match; request field semantics fixed |
| `GET /beneficiaries` | `/beneficiaries` + `GET /` | Match |
| `POST /beneficiaries` | `/beneficiaries` + `POST /` | Match |
| `PATCH /beneficiaries/:beneficiaryId` | `/beneficiaries` + `PATCH /:beneficiaryId` | Match |
| `DELETE /beneficiaries/:beneficiaryId` | `/beneficiaries` + `DELETE /:beneficiaryId` | Match |
| `GET /notifications` | `/notifications` + `GET /` | Match |
| `PATCH /notifications/:id/read` | `/notifications` + `PATCH /:id/read` | Match |
| `GET /users/me` | `/users` + `GET /me` | Match |
| `PATCH /users/me` | `/users` + `PATCH /me` | Match |
| `GET /customer/decision-explanations/me` | `/customer/decision-explanations` + `GET /me` | Match |
| `GET /fx-requests/:requestId` | `/fx-requests` + `GET /:requestId` | Match |
| `GET /admin/dashboard` | `/admin/dashboard` + `GET /` | Match |
| `GET /admin/users` and `GET /admin/users/:userId` | `/admin/users` + `GET /`, `GET /:userId` | Match |
| `PATCH /admin/users/:userId/status` | `/admin/users` + `PATCH /:userId/status` | Match |
| `GET /admin/accounts` and `GET /admin/accounts/:accountId` | `/admin/accounts` + `GET /`, `GET /:accountId` | Match |
| `GET /admin/transactions` and `GET /admin/transactions/:transactionId` | `/admin/transactions` + `GET /`, `GET /:transactionId` | Match |
| `GET /admin/audit-logs` | `/admin/audit-logs` + `GET /` | Match |
| `GET /admin/currencies` and `GET /admin/currencies/:code` | `/admin/currencies` + `GET /`, `GET /:code` | Match |
| `PATCH /admin/currencies/:code/status` | `/admin/currencies` + `PATCH /:code/status` | Match |
| `GET /admin/exchange-rates` and `POST /admin/exchange-rates` | `/admin/exchange-rates` + `GET /`, `POST /` | Match |
| `GET /admin/currency-reserves` | `/admin/currency-reserves` + `GET /` | Match; response field names fixed in UI |
| `POST /admin/currency-reserves/:currencyCode/adjust` | `/admin/currency-reserves` + `POST /:currencyCode/adjust` | Match |
| `GET /admin/approvals/fx-requests` | `/admin/approvals` + `GET /fx-requests` | Match |
| `POST /admin/approvals/fx-requests/:requestId/decision` | `/admin/approvals` + `POST /fx-requests/:requestId/decision` | Match |
| `GET /admin/risk-reviews` | `/admin/risk-reviews` + `GET /` | Match |
| `POST /admin/risk-reviews/:riskAnalysisId/decision` | `/admin/risk-reviews` + `POST /:riskAnalysisId/decision` | Match |
| `/admin/fraud/alerts`, `/admin/fraud/cases`, `/admin/fraud/dashboard` | `/admin/fraud` + matching routes | Match |
| `/admin/fraud-models` | `/admin/fraud-models` + `GET /`, `POST /`, `PATCH /:modelId/lifecycle` | Match |
| `/admin/monitoring/events` | `/admin/monitoring` + `POST /events`, `POST /events/:eventId/reprocess` | Match |
| `/support/customers` | `/support/customers` + `GET /` | Match |
| `/support/customers/accounts/:accountId` | `/support/customers/accounts` + `GET /:accountId` | Match |
| `/support/customers/:customerId/transactions` | `/support/customers` + `GET /:customerId/transactions` | Match |
| `/support/customers/:customerId/beneficiaries/:beneficiaryId` | `/support/customers` + matching `GET` route | Match |
| `/support/customers/:customerId/support-operations` | `/support/customers` + matching `POST` route | Match |
| `/support/audit-logs` | `/support/audit-logs` + `GET /` | Match |
| `/auditor/audit-logs` | `/auditor/audit-logs` + `GET /` | Match |
| `/auditor/transactions` | `/auditor/transactions` + `GET /` | Match |
| `/auditor/accounts/:accountId/activity` | `/auditor/accounts` + `GET /:accountId/activity` | Match |
| `/auditor/approvals` | `/auditor/approvals` + `GET /` | Match |
| `/auditor/fx-requests` | `/auditor/fx-requests` + `GET /` | Match |
| Auditor currency/reserve/rate reads | Existing `/admin/currencies`, `/admin/currency-reserves`, `/admin/exchange-rates` routes permit `AUDITOR` | Match |

## Deliberate non-use / legacy route

`POST /api/v1/transactions/transfer/:sourceAccountId/:destinationAccountId` is a legacy authorization-only endpoint. It does not post a transfer. The Customer UI correctly uses the canonical `POST /api/v1/transfers` endpoint.

## Known UI-only routes that remain outside Phase 36

Support Tickets and Support FX Requests are still placeholder pages in `src/App.tsx`; no matching frontend API calls are made from those placeholders. They are not represented as implemented backend integrations.

## Frontend E2E

Per the requested scope, frontend Playwright/E2E tests are deferred. Backend transfer contract tests and the existing currency-reserve response test are included/extended; they still need to be run in the project's configured test environment.
