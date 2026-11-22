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
import { CustomerDashboardPage, TransactionsPage, TransactionDetailsPage, DepositPage, WithdrawalPage, TransferPage, BeneficiariesPage, NotificationsPage, ProfilePage, DecisionExplanationsPage, FxRequestDetailsPage } from "./features/customer/phase6/CustomerPages";
import { AccountListPage } from "./features/customer/accounts/pages/AccountListPage";
import { AccountDetailsPage } from "./features/customer/accounts/pages/AccountDetailsPage";
import {
  AdminDashboardPage, AdminUsersPage, AdminUserDetailsPage, AdminAccountsPage, AdminAccountDetailsPage,
  AdminTransactionsPage, AdminTransactionDetailsPage, AdminAuditLogsPage, AdminCurrenciesPage,
  AdminExchangeRatesPage, AdminReservesPage, AdminFxApprovalsPage, AdminRiskReviewsPage,
  FraudDashboardPage, FraudAlertsPage, FraudCasesPage, FraudModelsPage, MonitoringPage,
} from "./features/admin/AdminPages";

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
                  <Route path="dashboard" element={<CustomerDashboardPage/>}/>
                  <Route path="accounts" element={<AccountListPage/>}/><Route path="accounts/:accountId" element={<AccountDetailsPage/>}/>
                  <Route path="transactions" element={<TransactionsPage/>}/><Route path="transactions/:transactionId" element={<TransactionDetailsPage/>}/>
                  <Route path="transfer" element={<TransferPage/>}/><Route path="deposit" element={<DepositPage/>}/><Route path="withdrawal" element={<WithdrawalPage/>}/>
                  <Route path="beneficiaries" element={<BeneficiariesPage/>}/>
                  <Route path="notifications" element={<NotificationsPage/>}/>
                  <Route path="profile" element={<ProfilePage/>}/><Route path="decision-explanations" element={<DecisionExplanationsPage/>}/><Route path="fx-requests/:requestId" element={<FxRequestDetailsPage/>}/>
                </Route>
              </Route>
              <Route path="/admin" element={<RequireRole allowed={["ADMIN"]}/>}>
                <Route element={<PortalLayout role="ADMIN"/>}>
                  <Route index element={<Navigate to="dashboard" replace/>}/>
                  <Route path="dashboard" element={<AdminDashboardPage/>}/>
                  <Route path="users" element={<AdminUsersPage/>}/><Route path="users/:userId" element={<AdminUserDetailsPage/>}/>
                  <Route path="accounts" element={<AdminAccountsPage/>}/><Route path="accounts/:accountId" element={<AdminAccountDetailsPage/>}/>
                  <Route path="transactions" element={<AdminTransactionsPage/>}/><Route path="transactions/:transactionId" element={<AdminTransactionDetailsPage/>}/>
                  <Route path="currencies" element={<AdminCurrenciesPage/>}/>
                  <Route path="exchange-rates" element={<AdminExchangeRatesPage/>}/>
                  <Route path="reserves" element={<AdminReservesPage/>}/>
                  <Route path="fx-approvals" element={<AdminFxApprovalsPage/>}/>
                  <Route path="risk-reviews" element={<AdminRiskReviewsPage/>}/>
                  <Route path="fraud" element={<FraudDashboardPage/>}/><Route path="fraud/alerts" element={<FraudAlertsPage/>}/><Route path="fraud/cases" element={<FraudCasesPage/>}/><Route path="fraud/models" element={<FraudModelsPage/>}/>
                  <Route path="monitoring" element={<MonitoringPage/>}/>
                  <Route path="audit-logs" element={<AdminAuditLogsPage/>}/>
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
