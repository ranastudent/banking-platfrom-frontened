import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AuthShell } from "../components/AuthShell";
import { normalizeApiError } from "../../../lib/api/apiError";

export function VerifyEmailPage(){
 const [params]=useSearchParams();const email=params.get("email")||"";const [code,setCode]=useState("");const [busy,setBusy]=useState(false);const [resendWait,setResendWait]=useState(58);const {verifyEmail}=useAuth();const navigate=useNavigate();
 useEffect(()=>{const timer=window.setInterval(()=>setResendWait(v=>v>0?v-1:0),1000);return ()=>window.clearInterval(timer);},[]);
 async function submit(e:FormEvent){e.preventDefault();if(code.length!==6){toast.error("Enter the 6-digit verification code");return;}setBusy(true);try{await verifyEmail({email,otp:code});toast.success("Email verified. You can now log in.");navigate("/login");}catch(err){toast.error(normalizeApiError(err).message);}finally{setBusy(false);}}
 return <AuthShell title="Email Verification" subtitle={<>We’ve sent a 6-digit verification code to<br/><strong className="highlight-email">{email||"your email address"}</strong></>} variant="verify"><form className="auth-form verify-form" onSubmit={submit}>
  <label>Enter the verification code</label><input className="otp-input" inputMode="numeric" autoComplete="one-time-code" aria-label="Six digit verification code" maxLength={6} pattern="[0-9]{6}" required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="••••••"/>
  <button className="auth-submit" disabled={busy}>{busy?<><span className="spinner"/> Verifying...</>:<><Check/> Verify Email</>}</button>
  <div className="auth-divider"><span>Didn’t receive the code?</span></div><p className="resend-line">{resendWait>0?<>Resend code in <b>00:{String(resendWait).padStart(2,"0")}</b></>:<>Please request a new code from the registration support flow.</>}</p>
  <Link className="back-link" to="/login"><ArrowLeft/> Back to Login</Link>
 </form></AuthShell>;
}
