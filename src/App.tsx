import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./app/providers/ThemeProvider";
import { AuthProvider } from "./app/providers/AuthProvider";
import { Toaster } from "sonner";
import { PublicLayout } from "./features/public/components/PublicLayout";
import { AboutPage } from "./features/public/pages/AboutPage";
import { LoginPage } from "./features/public/pages/LoginPage";
import { RegisterPage } from "./features/public/pages/RegisterPage";
import { VerifyEmailPage } from "./features/public/pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./features/public/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/public/pages/ResetPasswordPage";

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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
export default App;
