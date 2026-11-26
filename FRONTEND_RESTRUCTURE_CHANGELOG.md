# Frontend Update Summary

Updated against the provided full backend ZIP and backend `src.zip`, using the supplied frontend ZIP as the baseline.

## Structure
- Standardized on one source of truth: `src/`.
- Removed duplicate legacy source files at the project root and duplicate nested package/tool configs.
- Grouped customer, admin, auditor, and support page modules into each feature's `pages/` folder.
- Kept feature API/types close to their domain and shared transport in `src/lib/api/`.
- Added `ARCHITECTURE.md` and `BACKEND_INTEGRATION_GUIDE.md`.

## Backend alignment
- Deposit provider types and customer deposit UI now include `STRIPE`.
- Payment methods are rendered from backend `GET /api/v1/deposits/methods` rather than a fixed frontend list.
- Provider labels/icons use backend display name/category metadata, with safe fallback labels.
- Admin and auditor deposit provider filters include Stripe.
- Hosted Checkout `paymentUrl` remains an HTTPS-only external link; the frontend does not collect raw card details.
- Updated environment/security guidance and `.gitignore` to keep local env files out of Git.

## Validation
- `npm run typecheck` passed after restructuring and contract updates.
- Vite production bundling could not be completed in this Linux execution environment because the supplied `node_modules` archive lacks Rollup's Linux optional native package; the source typecheck passed. Run `npm ci` on your Windows machine and then `npm run build` to validate with the correct platform dependencies.
