export type UserRole = "CUSTOMER" | "ADMIN" | "SUPPORT" | "AUDITOR" | string;
export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  [key: string]: unknown;
};
export type AuthTokens = { accessToken: string; refreshToken: string };
export type AuthResult = { user: AuthUser } & AuthTokens;
export type RegisterPayload = { name: string; email: string; password: string; phone?: string };
export type LoginPayload = { email: string; password: string };
export type VerifyEmailPayload = { email: string; otp: string };
