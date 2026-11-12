import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/api/tokenStorage";
import type { AuthResult, AuthUser, LoginPayload, RegisterPayload, VerifyEmailPayload } from "./auth.types";

type Envelope<T> = { data?: T } & T;
function unwrap<T>(response: { data: Envelope<T> }): T {
  return (response.data?.data ?? response.data) as T;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResult> {
    const result = unwrap<AuthResult>(await api.post("/auth/login", payload));
    if (!result.accessToken || !result.refreshToken || !result.user) {
      throw new Error("Login response is missing user or token data.");
    }
    tokenStorage.setTokens(result.accessToken, result.refreshToken);
    return result;
  },
  async register(payload: RegisterPayload) {
    return unwrap(await api.post("/auth/register", payload));
  },
  async verifyEmail(payload: VerifyEmailPayload) {
    return unwrap(await api.post("/auth/verify-email", payload));
  },
  async forgotPassword(email: string) {
    return unwrap(await api.post("/auth/forgot-password", { email }));
  },
  async resetPassword(payload: { token: string; password: string }) {
    return unwrap(await api.post("/auth/reset-password", payload));
  },
  async me(): Promise<AuthUser> {
    return unwrap<AuthUser>(await api.get("/auth/me"));
  },
  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } finally {
      tokenStorage.clear();
    }
  },
};
