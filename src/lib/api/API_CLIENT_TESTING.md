# Phase 3 — API Client Test Plan

Run `npm run typecheck` and `npm run build` first. Then use a dedicated backend test account and browser DevTools > Network.

1. **Base URL:** confirm requests target `${VITE_API_BASE_URL}/api/v1/...` (the `/api/v1` prefix appears exactly once).
2. **Request interceptor:** sign in, then call `GET /auth/me`; confirm `Authorization: Bearer ...` is present. Never copy tokens into screenshots or logs.
3. **Public endpoints:** login/register/verify-email requests must not carry a stale bearer token.
4. **Login/token storage:** successful login should store both tokens in sessionStorage and set the authenticated user in React state.
5. **Refresh:** for a test session, expire/revoke the access token while retaining a valid refresh token; call a protected endpoint. Confirm one `POST /auth/refresh`, both rotated tokens are stored, and the original request is retried once.
6. **Concurrent 401s:** trigger multiple protected requests together with an expired access token. Confirm they share one refresh request.
7. **Refresh failure:** use an invalid/expired refresh token. Confirm both tokens are cleared and `banking:session-expired` is dispatched; no infinite retry loop.
8. **Logout:** confirm `POST /auth/logout` sends `{ refreshToken }` and local tokens are cleared even if the request fails.
9. **Errors:** verify 400 field errors, 401 session expiry, 403 access denied, 404 not found, 409 conflict, 429 rate limit and 5xx generic messaging. Preserve `requestId` for support diagnostics.
10. **Session persistence:** refresh the browser tab. The provider should call `/auth/me` and restore the user if the session remains valid.

Backend auth contract verified from the supplied backend ZIP:
- `POST /auth/login` returns `{ user, accessToken, refreshToken }` inside the success envelope.
- `POST /auth/refresh` accepts `{ refreshToken }`, rotates both tokens and revokes the previous refresh token.
- `POST /auth/logout` accepts `{ refreshToken }`.
- `GET /auth/me` requires a bearer access token.
- Refresh tokens expire after 7 days in the inspected service.
- Password reset uses `{ email }` for forgot-password and `{ token, password }` for reset-password. The reset token is not the email OTP.

These are test instructions, not a claim that live Render API tests were run.
