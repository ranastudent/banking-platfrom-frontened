# Backend Integration Guide

## Local API
Backend runs on `http://localhost:5000`; frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```
The shared client adds `/api/v1` exactly once. For deployed environments, set the API origin in the deployment environment; never commit real `.env` files.

## Auth
Frontend uses the backend `/api/v1/auth` contract:
- `POST /register`
- `POST /login`
- `POST /verify-email`
- `POST /refresh`
- `POST /logout`
- `GET /me`
- password reset request/OTP verification/reset endpoints

Tokens are handled by the shared API client and token storage. Do not add independent token handling inside feature pages.

## Customer banking
- Accounts: `/api/v1/accounts`
- Transaction history/details: `/api/v1/transactions`
- Internal transfer: `POST /api/v1/transfers` with an `Idempotency-Key`
- Beneficiaries: `/api/v1/beneficiaries`
- Deposits: `/api/v1/deposits`
- Notifications: `/api/v1/notifications`
- Customer FX: `/api/v1/fx` and `/api/v1/fx-requests`

Internal transfer request account references are customer-facing account-number strings, not internal Account UUIDs. A `202 Accepted` response may represent a risk hold, not settled transfer completion.

## Deposits and Stripe
Backend endpoints:
- `GET /deposits/methods`
- `GET /deposits/limits`
- `POST /deposits/quote`
- `POST /deposits` (requires `Idempotency-Key`)
- `POST /deposits/demo` (requires `Idempotency-Key`, development simulator)
- `GET /deposits`, `GET /deposits/:depositId`
- `POST /deposits/:depositId/cancel`
- `POST /deposits/simulator/:provider/:depositId/complete`
- `POST /admin/deposits` routes for privileged review/reconciliation actions

Provider list is dynamic. Backend provider enum includes `STRIPE`; the method metadata contains `displayName`, `category`, `enabled`, `status`, `mode`, and `message`. Frontend now uses this response rather than maintaining a fixed list that could omit Stripe.

Stripe Checkout is a hosted redirect. The backend response may contain `paymentUrl` and checkout session metadata. Only follow a valid HTTPS payment URL. The backend webhook route is `POST /api/v1/deposits/webhooks/stripe`; it is provider-authenticated and must not use a customer bearer token. Frontend must not implement webhook handling or request card PAN/CVC.

For local virtual testing, backend simulator mode is separate from Stripe Sandbox Checkout. A simulator success is synthetic and does not contact Stripe or any wallet.

## Privileged areas
Admin, Support, and Auditor pages use role-specific backend routes. UI role checks are for navigation; never treat them as a replacement for server-side authorization. Support/auditor screens are read-only where the backend contract says so.
