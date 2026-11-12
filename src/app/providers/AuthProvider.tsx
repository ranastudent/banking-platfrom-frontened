import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "../../features/auth/authApi";
import type { AuthUser, LoginPayload, RegisterPayload, VerifyEmailPayload } from "../../features/auth/auth.types";
import { tokenStorage } from "../../lib/api/tokenStorage";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<unknown>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<unknown>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshUser = useCallback(async () => {
    const current = await authApi.me();
    setUser(current);
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      if (!tokenStorage.getAccessToken() && !tokenStorage.getRefreshToken()) {
        if (active) setIsInitializing(false);
        return;
      }
      try {
        const current = await authApi.me();
        if (active) setUser(current);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsInitializing(false);
      }
    };
    const onExpired = () => setUser(null);
    window.addEventListener("banking:session-expired", onExpired);
    void initialize();
    return () => {
      active = false;
      window.removeEventListener("banking:session-expired", onExpired);
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload);
    setUser(result.user);
    return result.user;
  }, []);
  const register = useCallback((payload: RegisterPayload) => authApi.register(payload), []);
  const verifyEmail = useCallback((payload: VerifyEmailPayload) => authApi.verifyEmail(payload), []);
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user, isAuthenticated: Boolean(user), isInitializing, login, register, verifyEmail, logout, refreshUser,
  }), [user, isInitializing, login, register, verifyEmail, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
