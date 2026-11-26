# Phase 36 Implementation Report

## Implemented

### 1. Transfer UUID vs Account Number
- Canonical endpoint remains `POST /api/v1/transfers`.
- Both `senderAccount` and `receiverAccount` now mean customer-facing account numbers.
- Frontend source-account select now submits `accountNumber`, not `Account.id`.
- Receiver field is labelled and documented as an account number.
- Saved internal beneficiary `accountReference` is sent as the receiver account number.
- Backend Zod contract rejects UUID-shaped internal identifiers.
- Existing `transfer.service.ts` already resolves and locks accounts by account number, so its financial processing algorithm was preserved.

### 2. Admin Reserve API Response
- Backend response fields are `availableReserve`, `lockedReserve`, and `minimumReserve`.
- Admin Reserve table now reads `availableReserve` and `lockedReserve`.
- Existing backend response shape was preserved; it was already the correct canonical shape.

### 3. Customer API Response Types
- Added shared API envelope and pagination types in `src/lib/api/apiTypes.ts`.
- Added customer DTOs and request/response contracts in `src/features/customer/customer.types.ts`.
- Customer account, transaction history, beneficiary, notification, profile, decision explanation, FX request, and transfer response reads now use explicit response types where applicable.
- Account pages now reuse the shared CustomerAccount type.
- Account API and Auth API now use the shared response unwrapping helper.

### 4. Frontend / Backend Route Contract Review
- Added `PHASE36-API-CONTRACT-MAP.md` to the frontend root.
- Verified the active Frontend request paths against the Express route mounts and route definitions in `src/routes/index.ts`.
- Confirmed the Customer transfer uses `/transfers`; the older `/transactions/transfer/:sourceAccountId/:destinationAccountId` route is authorization-only and does not post a transfer.
- Removed the silent hardcoded production API origin fallback. `VITE_API_BASE_URL` must be configured.

### Tests added/extended
- Added `src/tests/transfer/transfer-api-contract.test.ts` to verify account-number payloads are accepted and UUID-shaped identifiers are rejected.
- Extended `src/tests/admin/admin-currency-reserve-read-authorization.test.ts` to verify the canonical reserve list response fields.
- Frontend Playwright/E2E work was intentionally deferred as requested.

## Files changed

### Backend
- `src/transaction/schemas/transfer.schema.ts`
- `src/tests/transfer/transfer-api-contract.test.ts` (new)
- `src/tests/admin/admin-currency-reserve-read-authorization.test.ts`

### Frontend
- `src/features/customer/phase6/CustomerPages.tsx`
- `src/features/customer/customer.types.ts` (new)
- `src/features/customer/accounts/account.types.ts`
- `src/features/customer/accounts/accountApi.ts`
- `src/features/auth/authApi.ts`
- `src/features/admin/AdminPages.tsx`
- `src/lib/api/apiTypes.ts` (new)
- `src/lib/api/apiClient.ts`
- `PHASE36-API-CONTRACT-MAP.md` (new)

### Prisma
- No Prisma schema or migration changes were needed for Phase 36.

## Validation status
- TypeScript transpile/syntax checks passed for all changed `.ts` and `.tsx` files.
- Full Frontend `npm run build` was not completed: dependency installation could not finish in this environment (registry access timed out; offline cache did not contain all packages).
- Backend Vitest tests were not run because the supplied Backend ZIP contains `src/` but no root package manifest/test runner configuration.
- Frontend E2E tests were not run, per request.

## Important run instructions
- Restore/configure the local `VITE_API_BASE_URL` in the Frontend environment (the client no longer silently falls back to the deployed production API).
- Run the Backend transfer contract tests and Admin reserve tests against a dedicated test database before merging.
- Do not use a production database for test execution.
