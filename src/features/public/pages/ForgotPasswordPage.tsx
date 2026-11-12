import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../../../features/auth/authApi";
import { AuthShell } from "../components/AuthShell";
import { normalizeApiError } from "../../../lib/api/apiError";

export function ForgotPasswordPage(){
 const [email,setEmail]=useState("");const [busy,setBusy]=useState(false);const [sent,setSent]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{await authApi.forgotPassword(email.trim());setSent(true);toast.success("If the account exists, a reset link has been sent.");}catch(err){toast.error(normalizeApiError(err).message);}finally{setBusy(false);}}
 return <AuthShell title="Forgot Password" subtitle="Enter your email address and we’ll send you a password reset link." variant="forgot"><form className="auth-form centered-auth-form" onSubmit={submit}>
  <label>Email Address<div className="auth-input-wrap"><Mail/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email address"/></div></label>
  <button className="auth-submit" disabled={busy}>{busy?<><span className="spinner"/> Sending...</>:<><Send/> Send Reset Link</>}</button>
  {sent&&<p className="success-note">Check your inbox for the password reset instructions. If you do not see it, check your spam folder.</p>}
  <div className="auth-divider"><span>Remember your password? <Link to="/login">Log In</Link></span></div>
 </form></AuthShell>;
}
