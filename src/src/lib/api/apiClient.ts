import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./tokenStorage";

const configuredOrigin = import.meta.env.VITE_API_BASE_URL?.trim();
const API_ORIGIN = (configuredOrigin || "https://banking-platform-api-dzm3.onrender.com").replace(/\/+$/, "");
const API_PREFIX = "/api/v1";
export const API_BASE_URL = `${API_ORIGIN}${API_PREFIX}`;

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

let refreshPromise: Promise<string> | null = null;
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/verify-email", "/auth/refresh", "/auth/logout", "/auth/forgot-password", "/auth/reset-password"];

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.url && !config.url.includes("/auth/refresh")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const requestUrl = original?.url ?? "";
    const isAuthRequest = AUTH_PATHS.some((path) => requestUrl.includes(path));
    if (error.response?.status !== 401 || !original || original._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      window.dispatchEvent(new Event("banking:session-expired"));
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient.post("/auth/refresh", { refreshToken })
          .then((response) => {
            const payload = response.data?.data ?? response.data;
            if (!payload?.accessToken || !payload?.refreshToken) {
              throw new Error("Refresh response did not contain both tokens.");
            }
            tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
            return payload.accessToken as string;
          })
          .finally(() => { refreshPromise = null; });
      }
      const newAccessToken = await refreshPromise;
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (refreshError) {
      tokenStorage.clear();
      window.dispatchEvent(new Event("banking:session-expired"));
      return Promise.reject(refreshError);
    }
  },
);
