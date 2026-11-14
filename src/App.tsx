import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./app/providers/ThemeProvider";
import { AuthProvider, useAuth } from "./app/providers/AuthProvider";
import { Toaster } from "sonner";
import { PublicLayout } from "./features/public/components/PublicLayout";
import { AboutPage } from "./features/public/pages/AboutPage";
import { LoginPage } from "./features/public/pages/LoginPage";
import { RegisterPage } from "./features/public/pages/RegisterPage";
import { VerifyEmailPage } from "./features/public/pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./features/public/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/public/pages/ResetPasswordPage";
import { RequireAuth, RequireRole, roleHome } from "./app/router/RoleRoutes";
import { PlaceholderPage, PortalDashboard, PortalLayout } from "./components/layout/PortalLayout";

function EntryRedirect() {
  const { user, isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return <div className="route-state" role="status">Restoring your secure session…</div>;
  return <Navigate to={isAuthenticated && user ? roleHome(user.role) : "/login"} replace />;
}
function ForbiddenPage() {
  return <main className="system-page"><div className="system-card"><span className="system-code">403</span><h1>Access restricted</h1><p>Your account does not have permission to view this page.</p><a className="btn btn-primary" href="/">Return to home</a></div></main>;
}
function MissingPage() {
  return <main className="system-page"><div className="system-card"><span className="system-code">404</span><h1>Page not found</h1><p>The page you requested does not exist.</p><a className="btn btn-primary" href="/">Return to home</a></div></main>;
}
const page = (title:string) => <PlaceholderPage title={title}/>;

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<AboutPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            <Route element={<RequireAuth/>}>
              <Route path="/customer" element={<RequireRole allowed={["CUSTOMER"]}/>}>
                <Route element={<PortalLayout role="CUSTOMER"/>}>
                  <Route index element={<Navigate to="dashboard" replace/>}/>
                  <Route path="dashboard" element={<PortalDashboard role="CUSTOMER"/>}/>
                  <Route path="accounts" element={page("My Accounts")}/>
                  <Route path="transactions" element={page("Transactions")}/>
                  <Route path="transfer" element={page("Transfer Money")}/>
                  <Route path="beneficiaries" element={page("Beneficiaries")}/>
                  <Route path="notifications" element={page("Notifications")}/>
                  <Route path="profile" element={page("Profile & Settings")}/>
                </Route>
              </Route>
              <Route path="/admin" element={<RequireRole allowed={["ADMIN"]}/>}>
                <Route element={<PortalLayout role="ADMIN"/>}>
                  <Route index element={<Navigate to="dashboard" replace/>}/>
                  <Route path="dashboard" element={<PortalDashboard role="ADMIN"/>}/>
                  <Route path="users" element={page("Users & Status")}/>
                  <Route path="accounts" element={page("Accounts")}/>
                  <Route path="transactions" element={page("Transactions")}/>
                  <Route path="currencies" element={page("Currencies")}/>
                  <Route path="exchange-rates" element={page("Exchange Rates")}/>
                  <Route path="reserves" element={page("Currency Reserves")}/>
                  <Route path="fx-approvals" element={page("FX Approvals")}/>
                  <Route path="risk-reviews" element={page("Risk Reviews")}/>
                  <Route path="fraud" element={page("Fraud Management")}/>
                  <Route path="monitoring" element={page("Monitoring")}/>
                  <Route path="audit-logs" element={page("Audit Logs")}/>
                </Route>
              </Route>
              <Route path="/support" element={<RequireRole allowed={["SUPPORT"]}/>}>
                <Route element={<PortalLayout role="SUPPORT"/>}>
                  <Route index element={<Navigate to="dashboard" replace/>}/>
                  <Route path="dashboard" element={<PortalDashboard role="SUPPORT"/>}/>
                  <Route path="customers" element={page("Customer Lookup")}/>
                  <Route path="accounts" element={page("Account Assistance")}/>
                  <Route path="transactions" element={page("Transaction Assistance")}/>
                  <Route path="beneficiaries" element={page("Beneficiary Assistance")}/>
                  <Route path="tickets" element={page("Support Tickets")}/>
                  <Route path="operations" element={page("Support Operations")}/>
                  <Route path="fx-requests" element={page("FX Requests (Read)")}/>
                  <Route path="audit-logs" element={page("Support Audit Logs")}/>
                </Route>
              </Route>
              <Route path="/auditor" element={<RequireRole allowed={["AUDITOR"]}/>}>
                <Route element={<PortalLayout role="AUDITOR"/>}>
                  <Route index element={<Navigate to="dashboard" replace/>}/>
                  <Route path="dashboard" element={<PortalDashboard role="AUDITOR"/>}/>
                  <Route path="audit-logs" element={page("Audit Logs (Read Only)")}/>
                  <Route path="transactions" element={page("Transactions (Read Only)")}/>
                  <Route path="account-activity" element={page("Account Activity")}/>
                  <Route path="approvals" element={page("Approval Records")}/>
                  <Route path="fx-requests" element={page("FX Requests (Read Only)")}/>
                  <Route path="currencies" element={page("Currencies (Read Only)")}/>
                  <Route path="reserves" element={page("Reserves (Read Only)")}/>
                </Route>
              </Route>
            </Route>
            <Route path="/403" element={<ForbiddenPage/>}/>
            <Route path="/entry" element={<EntryRedirect/>}/>
            <Route path="*" element={<MissingPage/>}/>
          </Routes>
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
export default App;
