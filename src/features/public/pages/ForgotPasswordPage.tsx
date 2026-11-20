import { Navigate } from "react-router-dom";

/**
 * Password recovery is now a three-step modal launched from the login page.
 * Keep this route as a compatibility redirect for old bookmarks.
 */
export function ForgotPasswordPage() {
  return <Navigate to="/login" replace />;
}
