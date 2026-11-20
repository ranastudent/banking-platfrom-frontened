import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../../../app/providers/AuthProvider";
import { AuthShell } from "../components/AuthShell";
import { normalizeApiError } from "../../../lib/api/apiError";
import { roleHome } from "../../../app/router/RoleRoutes";
import { authApi } from "../../auth/authApi";
import { Dialog } from "../../../components/ui/Dialog";

type ResetStep = "email" | "otp" | "password";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);

  // Password reset state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");

  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  // Modal messages: errors and success messages stay inside the modal.
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);

    try {
      const user = await login({
        email: email.trim(),
        password,
      });

      toast.success("Login successful");

      navigate(roleHome(user.role), {
        replace: true,
      });
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  // --------------------------------------------------
  // PASSWORD RESET: OPEN / CLOSE MODAL
  // --------------------------------------------------

  function clearResetState() {
    setResetStep("email");

    setResetEmail("");
    setOtp("");
    setResetToken("");

    setNewPassword("");
    setConfirmPassword("");

    setShowNewPassword(false);

    setResetError("");
    setResetMessage("");

    setResetBusy(false);
  }

  function openReset() {
    clearResetState();

    // Use the email already entered in the login form.
    setResetEmail(email.trim());

    setResetOpen(true);
  }

  function closeReset(open: boolean) {
    setResetOpen(open);

    if (!open) {
      clearResetState();
    }
  }

  // --------------------------------------------------
  // STEP 1: REQUEST PASSWORD RESET OTP
  // --------------------------------------------------

  async function requestOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (resetBusy) return;

    const cleanEmail = resetEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setResetError("Please enter your registered email address.");
      return;
    }

    setResetError("");
    setResetMessage("");
    setResetBusy(true);

    try {
      await authApi.requestPasswordReset(cleanEmail);

      setResetEmail(cleanEmail);
      setOtp("");
      setResetStep("otp");

      setResetMessage(
        "If an eligible account exists for this email, a verification code has been sent."
      );
    } catch (err) {
      setResetError(normalizeApiError(err).message);
    } finally {
      setResetBusy(false);
    }
  }

  // --------------------------------------------------
  // STEP 2: VERIFY OTP
  // --------------------------------------------------

  async function verifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (resetBusy) return;

    const cleanOtp = otp.trim();

    // OTP must contain exactly six numeric digits.
    if (!/^\d{6}$/.test(cleanOtp)) {
      setResetError("Please enter a valid 6-digit verification code.");
      return;
    }

    setResetError("");
    setResetMessage("");
    setResetBusy(true);

    try {
      const result = await authApi.verifyPasswordResetOtp(
        resetEmail.trim(),
        cleanOtp
      );

      if (!result?.resetToken) {
        throw new Error(
          "The verification response did not contain a reset token. Please try again."
        );
      }

      // Keep the sensitive reset token in component memory only.
      setResetToken(result.resetToken);

      // Move to the new password screen only after successful verification.
      setResetStep("password");

      setOtp("");
      setResetError("");

      setResetMessage(
        "Your email has been verified. You can now create a new password."
      );
    } catch (err) {
      setResetError(normalizeApiError(err).message);
    } finally {
      setResetBusy(false);
    }
  }

  // --------------------------------------------------
  // STEP 3: RESET PASSWORD
  // --------------------------------------------------

  async function submitNewPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (resetBusy) return;

    if (newPassword.length < 8 || newPassword.length > 128) {
      setResetError(
        "Password must contain between 8 and 128 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Your passwords do not match.");
      return;
    }

    if (!resetToken) {
      setResetError(
        "Your password reset session has expired. Please request a new verification code."
      );

      setResetStep("email");
      setOtp("");
      return;
    }

    setResetError("");
    setResetMessage("");
    setResetBusy(true);

    try {
      await authApi.resetPassword({
        token: resetToken,
        password: newPassword,
      });

      // Close modal and remove temporary reset information.
      setResetOpen(false);
      clearResetState();

      // Clear login password so the user can enter the new password.
      setPassword("");

      toast.success(
        "Password reset successful. Please sign in with your new password."
      );
    } catch (err) {
      setResetError(normalizeApiError(err).message);
    } finally {
      setResetBusy(false);
    }
  }

  // --------------------------------------------------
  // MODAL TITLE AND DESCRIPTION
  // --------------------------------------------------

  const resetTitle =
    resetStep === "email"
      ? "Forgot your password?"
      : resetStep === "otp"
        ? "Verify your email"
        : "Create a new password";

  const resetDescription =
    resetStep === "email"
      ? "Enter the email address associated with your banking account."
      : resetStep === "otp"
        ? `Enter the 6-digit verification code sent to ${resetEmail}.`
        : "Choose a strong new password for your banking account.";

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <>
      {/* LOGIN PAGE */}

      <AuthShell
        title="Log In to Your Account"
        subtitle="Access your banking account securely"
        variant="login"
      >
        <form className="auth-form" onSubmit={submit}>
          <label>
            Email Address

            <div className="auth-input-wrap">
              <Mail />

              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </label>

          <label>
            Password

            <div className="auth-input-wrap">
              <Lock />

              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShow((prev) => !prev)}
                aria-label="Toggle password visibility"
              >
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>

          <div className="form-options">
            <label className="check-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />

              Remember me
            </label>

            <button
              type="button"
              className="link-button"
              onClick={openReset}
            >
              Forgot Password?
            </button>
          </div>

          <button className="auth-submit" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" />
                Logging in...
              </>
            ) : (
              <>
                Log In <ArrowRight />
              </>
            )}
          </button>

          <div className="auth-divider">
            <span>Don't have an account?</span>
          </div>

          <Link className="auth-secondary-submit" to="/register">
            Create an Account
          </Link>
        </form>
      </AuthShell>

      {/* FORGOT PASSWORD DIALOG */}

      <Dialog
        open={resetOpen}
        onOpenChange={closeReset}
        title={resetTitle}
        description={resetDescription}
      >
        {/* INLINE ERROR MESSAGE */}

        {resetError && (
          <div className="reset-error" role="alert">
            {resetError}
          </div>
        )}

        {/* INLINE SUCCESS / INFORMATION MESSAGE */}

        {resetMessage && (
          <div className="reset-message" role="status">
            {resetMessage}
          </div>
        )}

        {/* STEP 1: EMAIL */}

        {resetStep === "email" && (
          <form
            className="auth-form reset-modal-form"
            onSubmit={requestOtp}
          >
            <label>
              Email Address

              <div className="auth-input-wrap">
                <Mail />

                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setResetError("");
                    setResetMessage("");
                  }}
                  placeholder="Enter your registered email"
                />
              </div>
            </label>

            <button
              className="auth-submit"
              type="submit"
              disabled={resetBusy}
            >
              {resetBusy ? (
                "Sending code..."
              ) : (
                <>
                  Send verification code <ArrowRight />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}

        {resetStep === "otp" && (
          <form
            className="auth-form reset-modal-form"
            onSubmit={verifyOtp}
          >
            <label>
              6-digit verification code

              <div className="auth-input-wrap">
                <ShieldCheck />

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => {
                    setOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    );

                    setResetError("");
                    setResetMessage("");
                  }}
                  placeholder="Enter 6-digit OTP"
                />
              </div>
            </label>

            <button
              className="auth-submit"
              type="submit"
              disabled={resetBusy || otp.length !== 6}
            >
              {resetBusy ? (
                "Verifying..."
              ) : (
                <>
                  Verify code <ArrowRight />
                </>
              )}
            </button>

            <button
              type="button"
              className="link-button"
              disabled={resetBusy}
              onClick={() => {
                setResetStep("email");
                setOtp("");
                setResetError("");
                setResetMessage("");
              }}
            >
              Change email address
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}

        {resetStep === "password" && (
          <form
            className="auth-form reset-modal-form"
            onSubmit={submitNewPassword}
          >
            <label>
              New Password

              <div className="auth-input-wrap">
                <Lock />

                <input
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setResetError("");
                  }}
                  placeholder="Enter new password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowNewPassword((prev) => !prev)
                  }
                  aria-label="Toggle new password visibility"
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>

            <label>
              Confirm New Password

              <div className="auth-input-wrap">
                <KeyRound />

                <input
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setResetError("");
                  }}
                  placeholder="Confirm new password"
                />
              </div>
            </label>

            <button
              className="auth-submit"
              type="submit"
              disabled={resetBusy}
            >
              {resetBusy ? (
                "Resetting password..."
              ) : (
                <>
                  Reset Password <ArrowRight />
                </>
              )}
            </button>
          </form>
        )}
      </Dialog>
    </>
  );
}