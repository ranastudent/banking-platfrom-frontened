# Banking Platform Frontend — Phase 1, 2 & 3

React + Vite + TypeScript frontend starter for the Banking & Financial Management Platform.

## Requirements
- Node.js 22 LTS recommended
- npm 10+
- VS Code

## Setup (Windows CMD)
```cmd
npm install
copy .env.example .env
```
Keep `.env` local. Do not commit it or share access/refresh tokens.

`.env`:
```env
VITE_API_BASE_URL=https://banking-platform-api-dzm3.onrender.com
```
Set only the API origin; the client appends `/api/v1` exactly once. The health endpoint is outside that prefix: `/health`.

## Run and verify
```cmd
npm run typecheck
npm run build
npm run dev
```
Open `http://localhost:5173`.

## Phase 3 implementation
- 3.1 Axios API client with 20-second timeout, JSON headers and credentials.
- 3.2 Environment-based API origin plus `/api/v1` prefix.
- 3.3 Bearer access-token request interceptor.
- 3.4 Central response interceptor with one-retry guard.
- 3.5 Session-scoped access/refresh token storage utility.
- 3.6 Single-flight refresh-token rotation; concurrent 401s share one refresh request; refresh failure clears session.
- 3.7 React AuthProvider/useAuth state, initial session restoration via `/auth/me`, login/register/verify/logout methods.
- 3.8 Normalized API errors including status, backend code, field errors and requestId.
- 3.9 Authentication services for login, register, email verification, forgot/reset password, current user and logout.
- 3.10 API client verification checklist in `src/lib/api/API_CLIENT_TESTING.md`.

## Backend contract notes
The supplied backend source confirms:
- Login returns user, accessToken and refreshToken.
- Refresh accepts `{ refreshToken }`, rotates both tokens, and revokes the old refresh token.
- Logout accepts `{ refreshToken }`.
- `/auth/me` is protected by bearer authentication.
- Forgot password accepts `{ email }`; reset password accepts `{ token, password }`.
- Refresh-token expiry is 7 days in the inspected service.

The supplied frontend API guide notes that responses commonly use `{ success, data, requestId }`, but some endpoints differ. The auth service unwraps the common envelope and validates the login token result.

## Security and scope
Tokens are stored in `sessionStorage` for this portfolio/demo implementation, so they are cleared when the browser session ends. This is still accessible to JavaScript and is not equivalent to HttpOnly secure cookies; mitigate XSS and revisit the storage strategy before production. Do not log tokens. This is a demo application: use test users and isolated test data only; do not connect real customer funds or payment rails.

## Phase 3 testing
Follow `src/lib/api/API_CLIENT_TESTING.md`. TypeScript/build checks do not prove live API compatibility; verify with a dedicated test account against your backend.


## Phase 4 — Public Pages 01–06

Implemented public routes and responsive light/dark layouts based on the supplied page designs:

| Page | Route | Status |
|---|---|---|
| 01 About | `/` and `/about` | Implemented |
| 02 Login | `/login` | Implemented; connected to `POST /auth/login` |
| 03 Registration | `/register` | Implemented; connected to `POST /auth/register` |
| 04 Email Verification | `/verify-email?email=...` | Implemented; submits six-digit code as `{ email, otp }` |
| 05 Forgot Password | `/forgot-password` | Implemented; connected to `POST /auth/forgot-password` |
| 06 Reset Password | `/reset-password?token=...` | Implemented; connected to `POST /auth/reset-password` |

### Phase 4 design-system and responsive audit
- [x] Same page supports Light and Dark theme; user can switch themes without navigating away.
- [x] Theme selection persists across reloads.
- [x] Semantic palette maintains the 60/30/10 visual hierarchy in both themes.
- [x] Shared typography, spacing, radii, inputs, buttons, cards and icon treatments.
- [x] Desktop, tablet and mobile breakpoints; mobile navigation menu is available instead of hiding navigation.
- [x] Forms remain fluid on small screens; OTP and registration layouts have narrow-phone adjustments.

## Phase 4 behaviour and notes
- Added public navigation, footer, theme switch, responsive layouts and visual illustrations built from CSS/SVG and Lucide icons.
- Light and dark themes use shared semantic tokens for page canvas, secondary surfaces, borders, text and action accents; theme choice persists in localStorage.
- Applied the 60/30/10 composition guideline: dominant page background, secondary cards/panels, and restrained high-contrast action accents.
- Kept shared typography, spacing, control heights, border radii, button treatments, cards and icon sizing consistent across all six public pages.
- Desktop-first responsive behavior: tablet authentication layouts stack the promo and form panels; mobile navigation becomes an accessible menu; narrow phones stack About content and use full-width form controls.
- Login and registration use the existing AuthProvider and Axios API client.
- Registration sends only `name`, `email`, optional `phone`, and `password`; confirm password and terms acceptance are frontend checks.
- Email verification follows the current frontend API service contract `{ email, otp }`. No resend-code endpoint was present in the supplied frontend API service, so the countdown is visual only and does not send a resend request.
- Forgot password sends `{ email }`; reset password reads `token` from the URL query string and sends `{ token, password }`.
- The “Remember me” control is currently visual only; Phase 3 stores tokens in `sessionStorage` (tab/session scoped).
- Google sign-in is intentionally not shown because it is not implemented by the supplied backend.
- After login, the app currently returns to the public About page; authenticated dashboards and protected role-based routes belong to a later phase.
- Logout UI is not part of this public-pages phase; it will be added with the authenticated application shell.

### Run locally (Windows CMD)
```cmd
npm install
copy .env.example .env
npm run typecheck
npm run build
npm run dev
```

Keep `.env` local and never include it in shared ZIP files or source control.
