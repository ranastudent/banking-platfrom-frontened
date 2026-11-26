import { api } from "../../lib/api/apiClient";
import { unwrapApiData } from "../../lib/api/apiTypes";
import { tokenStorage } from "../../lib/api/tokenStorage";
import type { AuthResult, AuthUser, LoginPayload, RegisterPayload, VerifyEmailPayload } from "./auth.types";

const unwrap = <T = unknown>(response: unknown): T => unwrapApiData<T>(response);

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
  async requestPasswordReset(email: string): Promise<unknown> {
    return unwrap(await api.post("/auth/reset-password/request", { email }));
  },
  async verifyPasswordResetOtp(email: string, otp: string): Promise<{ resetToken: string }> {
    const result = unwrap<{ resetToken?: string; token?: string }>(
      await api.post("/auth/reset-password/verify-otp", { email, otp }),
    );
    const resetToken = result.resetToken ?? result.token;
    if (!resetToken) {
      throw new Error("OTP verification response did not contain a reset token.");
    }
    return { resetToken };
  },
  async resetPassword(payload: { token: string; password: string }): Promise<unknown> {
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
