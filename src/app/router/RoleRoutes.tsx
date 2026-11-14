import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import type { UserRole } from "../../features/auth/auth.types";

export function roleHome(role: UserRole) {
  switch (String(role).toUpperCase()) {
    case "CUSTOMER": return "/customer/dashboard";
    case "ADMIN": return "/admin/dashboard";
    case "SUPPORT": return "/support/dashboard";
    case "AUDITOR": return "/auditor/dashboard";
    default: return "/403";
  }
}

export function RequireAuth() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) return <div className="route-state" role="status">Restoring your secure session…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function RequireRole({ allowed }: { allowed: UserRole[] }) {
  const { user, isInitializing } = useAuth();
  if (isInitializing) return <div className="route-state" role="status">Checking your access…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(String(user.role).toUpperCase())) return <Navigate to="/403" replace />;
  return <Outlet />;
}
