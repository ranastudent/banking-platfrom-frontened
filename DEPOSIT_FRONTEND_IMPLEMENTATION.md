# Deposit Frontend Implementation

Implemented against the backend source provided with the task.

## Customer workflow
- Deposit API client and TypeScript contracts in `src/features/customer/deposits/depositApi.ts`.
- Deposit page with account selection, account status/balance summary, supported provider selection, disabled Bank Transfer/Card states, positive decimal and backend limit validation, quick amounts, fee quote, net-credit summary and confirmation.
- External deposit initiation uses `POST /api/v1/deposits` and an idempotency key. The key is retained on a failed attempt so the user can retry the same request; changing form values resets it.
- Provider payment URL is only rendered as a resume action when it is HTTPS.
- Pending/processing status details poll the backend every 5 seconds and stop at terminal states.
- Cancel, mock provider success/failure, retry from failed/expired request, receipt download, status timeline and detail URL.
- Deposit history uses backend pagination and status/provider filters. Currency/date filters are applied client-side to the current returned page (up to 100 records), because the supplied customer list API currently only supports status/provider filters.
- Demo funding remains a separate `/deposits/demo` workflow, only shown when the backend reports it enabled. It is explicitly labeled synthetic.

## Admin workflow
- Admin deposits page at `/admin/deposits`, plus detail URL `/admin/deposits/:depositId`.
- Search/status/provider/currency/date filters, pagination, provider payment records, journal lines, settlement and reconciliation records.
- Settlement reconciliation uses the backend admin endpoint and displays the match result. It does not mark the deposit settled or credit customer funds from the browser.
- Reversal is only offered for a settled deposit and requires an explicit reason/confirmation. Backend handles the accounting and balance validation.
- Audit-log navigation is provided; admin action history is not returned as a separate collection by the supplied deposit detail endpoint.

## Backend routes used
- `GET /deposits/methods`
- `GET /deposits/limits`
- `POST /deposits/quote`
- `POST /deposits`
- `POST /deposits/demo`
- `GET /deposits`
- `GET /deposits/:depositId`
- `POST /deposits/:depositId/cancel`
- `POST /deposits/simulator/:provider/:depositId/complete`
- `GET /admin/deposits`
- `GET /admin/deposits/:depositId`
- `POST /admin/deposits/:depositId/reconcile`
- `POST /admin/deposits/:depositId/reverse`

Provider options not returned as enabled by the backend remain disabled. Bank Transfer and Card Payment are explicitly Coming Soon because the supplied backend does not expose them as deposit providers.

## Validation performed
- `npx tsc -b --pretty` passed in the prepared frontend workspace.
- Vite production bundling could not be verified in this Linux extraction because the uploaded Windows `node_modules` archive does not contain Rollup's Linux optional native package (`@rollup/rollup-linux-x64-gnu`). Reinstall dependencies on Windows (`npm ci`) before running `npm run build`.
- Added `e2e/deposit-page.spec.ts` to check customer deposit page/API loading and invalid amount protection without initiating a payment. It requires the project's existing isolated E2E test backend and credentials.
