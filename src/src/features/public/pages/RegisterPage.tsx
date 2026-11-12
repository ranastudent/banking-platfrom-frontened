import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, UserRound, Phone, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AuthShell } from "../components/AuthShell";
import { normalizeApiError } from "../../../lib/api/apiError";

export function RegisterPage(){
 const {register}=useAuth();const navigate=useNavigate();const [name,setName]=useState("");const [email,setEmail]=useState("");const [phone,setPhone]=useState("");const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [show,setShow]=useState(false);const [terms,setTerms]=useState(false);const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();if(password!==confirm){toast.error("Passwords do not match");return;}if(password.length<8){toast.error("Password must contain at least 8 characters");return;}if(!terms){toast.error("Please accept the Terms of Service and Privacy Policy");return;}setBusy(true);try{await register({name:name.trim(),email:email.trim(),...(phone.trim()?{phone:phone.trim()}:{}),password});toast.success("Account created. Verify your email to continue.");navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);}catch(err){toast.error(normalizeApiError(err).message);}finally{setBusy(false);}}
 return <AuthShell title="Create Your Account" subtitle="Join our secure banking platform" variant="register"><form className="auth-form register-form" onSubmit={submit}>
  <label>Full Name <b>*</b><div className="auth-input-wrap"><UserRound/><input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your full name"/></div></label>
  <label>Email Address <b>*</b><div className="auth-input-wrap"><Mail/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email address"/></div></label>
  <label>Phone Number <small>(Optional)</small><div className="auth-input-wrap"><Phone/><input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+8801XXXXXXXXX"/></div></label>
  <label>Password <b>*</b><div className="auth-input-wrap"><Lock/><input type={show?"text":"password"} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a strong password"/><button type="button" className="password-toggle" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
  <label>Confirm Password <b>*</b><div className="auth-input-wrap"><Lock/><input type={show?"text":"password"} required autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter your password"/><button type="button" className="password-toggle" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
  <label className="check-label terms-check"><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/> <span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></span></label>
  <button className="auth-submit" disabled={busy}>{busy?<><span className="spinner"/> Creating account...</>:<><UserPlus/> Create Account</>}</button>
  <div className="auth-divider"><span>Already have an account? <Link to="/login">Log In</Link></span></div>
 </form></AuthShell>;
}
