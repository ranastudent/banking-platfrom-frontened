import type { ReactNode } from "react";
import { BarChart3, LockKeyhole, ShieldCheck, Zap } from "lucide-react";

type Props = { title: string; subtitle: ReactNode; children: ReactNode; variant?: "login" | "register" | "verify" | "forgot" | "reset" };
const copy = {
  login: { heading: <>Manage Your Money<br/>Effortlessly</>, description: "A secure and modern banking platform for your personal and business needs.", items: ["Secure & Trusted", "Fast Transactions", "Real-time Insights"] },
  register: { heading: <>Open Your<br/>Banking Account<br/>Today</>, description: "Create a secure account and access a complete range of banking and financial services in one platform.", items: ["Secure & Verified", "Fast & Easy Registration", "Manage Money Anytime"] },
  verify: { heading: <>Verify Your<br/>Email Address</>, description: "Confirm your email to activate your banking account and access all features.", items: ["Secure verification", "Activate your account", "Protect your identity"] },
  forgot: { heading: <>Forgot Your<br/>Password?</>, description: "No worries! Enter your registered email address and we'll send you a link to reset your password.", items: ["Secure Reset Link", "Quick & Easy Process", "Keep Your Account Safe"] },
  reset: { heading: <>Reset Your<br/>Password</>, description: "Create a new, strong password to keep your account secure.", items: ["Stronger Security", "Keep Your Data Safe", "Regain Account Access"] },
};
export function AuthShell({ title, subtitle, children, variant = "login" }: Props) {
  const data = copy[variant];
  return <section className={`auth-shell auth-${variant}`}>
    <aside className="auth-promo">
      <div className="promo-copy"><span className="promo-kicker">BANKING PLATFORM</span><h1>{data.heading}</h1><p>{data.description}</p>
        <ul>{data.items.map((item, i) => <li key={item}><span className="promo-feature-icon">{[<ShieldCheck size={20}/>, <Zap size={20}/>, <BarChart3 size={20}/>][i]}</span>{item}</li>)}</ul>
      </div>
      <div className="promo-art" aria-hidden="true"><div className="art-orbit"></div><div className="art-bank"><LandmarkIcon/><b>BANK</b></div><div className="art-card"><span>▰</span><i></i><i></i></div><div className="art-coins"><span></span><span></span><span></span></div><div className="art-leaf"></div></div>
    </aside>
    <section className="auth-panel">
      <div className="auth-panel-heading"><span className="auth-mini-mark"><LockKeyhole size={17}/></span><h2>{title}</h2><p>{subtitle}</p></div>
      {children}
    </section>
  </section>;
}
function LandmarkIcon(){ return <svg viewBox="0 0 120 90" role="img"><path d="M8 27 60 4l52 23H8Z" fill="currentColor"/><path d="M17 33h86v8H17zM22 43h10v33H22zM52 43h10v33H52zM82 43h10v33H82zM12 78h96v8H12z" fill="currentColor"/><path d="M5 88h110v4H5z" fill="currentColor"/></svg>;}
