import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, RefreshCw, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "../../../features/auth/authApi";
import { AuthShell } from "../components/AuthShell";
import { normalizeApiError } from "../../../lib/api/apiError";

export function ResetPasswordPage(){
 const [params]=useSearchParams();const token=params.get("token")||"";const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [show,setShow]=useState(false);const [busy,setBusy]=useState(false);const navigate=useNavigate();
 const rules=[{label:"At least 8 characters",ok:password.length>=8},{label:"At least one uppercase letter (A–Z)",ok:/[A-Z]/.test(password)},{label:"At least one lowercase letter (a–z)",ok:/[a-z]/.test(password)},{label:"At least one number (0–9)",ok:/\d/.test(password)}];
 async function submit(e:FormEvent){e.preventDefault();if(!token){toast.error("Reset token is missing. Please use the link from your email.");return;}if(!rules.every(r=>r.ok)){toast.error("Please meet all password requirements");return;}if(password!==confirm){toast.error("Passwords do not match");return;}setBusy(true);try{await authApi.resetPassword({token,password});toast.success("Password reset successful. Please log in.");navigate("/login");}catch(err){toast.error(normalizeApiError(err).message);}finally{setBusy(false);}}
 return <AuthShell title="Reset Password" subtitle="Enter a new password for your account." variant="reset"><form className="auth-form reset-form" onSubmit={submit}>
  <label>New Password<div className="auth-input-wrap"><Lock/><input type={show?"text":"password"} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter new password"/><button type="button" className="password-toggle" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
  <label>Confirm Password<div className="auth-input-wrap"><Lock/><input type={show?"text":"password"} required autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password"/><button type="button" className="password-toggle" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
  <div className="password-rules"><strong>Password must include:</strong>{rules.map(r=><span key={r.label} className={r.ok?"rule-ok":""}><CheckCircle2 size={15}/>{r.label}</span>)}</div>
  <button className="auth-submit" disabled={busy}>{busy?<><span className="spinner"/> Resetting...</>:<><RefreshCw/> Reset Password</>}</button>
  <Link className="back-link" to="/login"><ArrowLeft/> Back to Login</Link>
 </form></AuthShell>;
}
