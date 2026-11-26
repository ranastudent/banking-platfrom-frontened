# Banking Platform Frontend

React 19 + TypeScript + Vite client for the Banking & Financial Management Platform.

## Requirements
- Node.js 22+
- npm 10+

## Setup (Windows PowerShell)
```powershell
npm ci
Copy-Item .env.example .env
npm run typecheck
npm run build
npm run dev
```

Configure `.env` with the backend **origin only**:
```env
VITE_API_BASE_URL=http://localhost:5000
```
The shared API client appends `/api/v1`. Do not add `/api/v1` to this variable. Keep `.env`, `.env.e2e`, credentials, and tokens local; only `.env.example` belongs in Git.

## API integration
- API calls use the shared Axios client in `src/lib/api/apiClient.ts`.
- Authenticated requests attach the access token; refresh-token rotation is centralized.
- Feature API modules live beside their domain's types and pages.
- Deposit providers are loaded from `GET /api/v1/deposits/methods`; the UI renders backend-provided methods and availability. Stripe appears as a card method when the backend reports it enabled.
- Stripe uses hosted Checkout. The frontend must never collect or store raw card numbers/CVC. After creating a deposit, open the deposit details and follow the verified `paymentUrl` over HTTPS.
- A pending deposit is not a credited balance. The backend settles it only after verified provider status and ledger accounting.
- Mock/simulator payments are virtual only and must never be represented as real payment.

## Useful docs
- `BACKEND_INTEGRATION_GUIDE.md` — backend/frontend contract and environment setup.
- `PHASE36-API-CONTRACT-MAP.md` — route mapping and previously audited contracts.
- `DEPOSIT_FRONTEND_IMPLEMENTATION.md` — deposit flow implementation notes.
