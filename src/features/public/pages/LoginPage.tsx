import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AuthShell } from "../components/AuthShell";
import { normalizeApiError } from "../../../lib/api/apiError";

export function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [show,setShow]=useState(false); const [busy,setBusy]=useState(false); const [remember,setRemember]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{await login({email:email.trim(),password});toast.success("Login successful");navigate("/about");}catch(err){toast.error(normalizeApiError(err).message);}finally{setBusy(false);}}
  return <AuthShell title="Log In to Your Account" subtitle="Access your banking account securely" variant="login">
    <form className="auth-form" onSubmit={submit}>
      <label>Email Address<div className="auth-input-wrap"><Mail/><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email"/></div></label>
      <label>Password<div className="auth-input-wrap"><Lock/><input type={show?"text":"password"} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" className="password-toggle" onClick={()=>setShow(!show)} aria-label="Toggle password visibility">{show?<EyeOff/>:<Eye/>}</button></div></label>
      <div className="form-options"><label className="check-label"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Remember me</label><Link to="/forgot-password">Forgot Password?</Link></div>
      <button className="auth-submit" disabled={busy}>{busy?<><span className="spinner"/> Logging in...</>:<>Log In <ArrowRight/></>}</button>
      <div className="auth-divider"><span>Don't have an account?</span></div><Link className="auth-secondary-submit" to="/register">Create an Account</Link>
    </form>
  </AuthShell>;
}
