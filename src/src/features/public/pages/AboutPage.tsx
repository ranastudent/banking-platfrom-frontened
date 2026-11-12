import { ArrowRight, ArrowUpRight, BarChart3, Eye, Globe2, Layers3, ShieldCheck, Users, Target } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  [Layers3, "Account Management", "Create and manage multiple accounts with real-time balance."],
  [ArrowRight, "Transaction Management", "Deposit, withdrawal, transfer and complete transaction history."],
  [Globe2, "Multi-Currency Support", "Operate with multiple currencies and real-time exchange rates."],
  [ShieldCheck, "Fraud Monitoring", "AI-powered fraud detection and risk assessment."],
  [BarChart3, "Financial Reporting", "Insights, audit logs and compliance-ready reports."],
  [Users, "Role-Based Access", "Secure and controlled access for Customer, Admin, Support and Auditor."],
] as const;

export function AboutPage() {
  return <div className="about-page">
    <section className="about-hero">
      <div className="hero-text"><span className="section-pill">About Our Platform</span><h1>A Modern, Secure &amp; Scalable <em>Banking Platform</em></h1><p>A complete digital banking and financial management solution for individuals, businesses and institutions.</p><div className="hero-actions"><Link className="primary-action" to="/register">Get Started <ArrowRight size={16}/></Link><a className="secondary-action" href="#features">Explore Features</a></div></div>
      <div className="hero-visual" aria-hidden="true"><div className="hero-glow"></div><div className="hero-bank"><LandmarkIllustration/><strong>BANK</strong></div><div className="hero-shield"><ShieldCheck size={46}/></div><div className="hero-gold"><span/><span/><span/></div></div>
    </section>
    <section className="about-intro">
      <div className="building-photo"><div className="building-sky"></div><div className="building"><div className="building-sign"><LandmarkIllustration/> Banking Platform</div><div className="building-windows"></div></div><div className="building-green"></div></div>
      <div className="intro-copy"><h2>About the Platform</h2><p>Our Banking Platform is a production-grade digital banking solution that enables secure account management, multi-currency operations, fund transfers, transaction monitoring and financial administration through a role-based system.</p></div>
      <article className="purpose-card"><Target/><h3>Our Mission</h3><p>To deliver a secure, reliable and inclusive digital banking experience.</p></article>
      <article className="purpose-card"><Eye/><h3>Our Vision</h3><p>To be a trusted, intelligent and globally accessible financial platform.</p></article>
    </section>
    <section id="features" className="features-section"><div className="section-heading"><h2>Core Features</h2><span/></div><div className="feature-grid">{features.map(([Icon,title,description])=><article className="feature-card" key={title}><Icon/><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></section>
    <section id="security" className="security-strip"><div className="security-emblem"><ShieldCheck size={54}/></div><div className="security-copy"><h2>Security &amp; Reliability</h2><p>Built with industry best practices to help keep your money and data safe.</p><div className="security-points">{["JWT Authentication","Input Validation","Rate Limiting","Audit Logging","Idempotency"].map(x=><span key={x}><ShieldCheck size={13}/>{x}</span>)}</div></div></section>
    <section className="technology-section"><div className="section-heading"><h2>Technology Stack</h2><span/></div><div className="tech-grid">{[[ "React","Frontend", "⚛" ],["Node.js","Backend","⬡"],["Prisma","ORM","◈"],["PostgreSQL","Database","🐘"],["Redis","Caching","▰"],["Docker","Deployment","🐳"],["AWS","Cloud, Planned","aws"]].map(([name,sub,mark])=><div className="tech-card" key={name}><strong className={`tech-mark tech-${name.toLowerCase()}`}>{mark}</strong><b>{name}</b><small>({sub})</small></div>)}</div></section>
    <section id="contact" className="about-cta"><div><h2>Ready to get started?</h2><p>Explore the platform with a demo account.</p></div><Link className="primary-action" to="/register">Create an Account <ArrowUpRight size={16}/></Link></section>
  </div>;
}
function LandmarkIllustration(){return <svg viewBox="0 0 150 110"><path d="M8 32 75 5l67 27H8Z" fill="currentColor"/><path d="M17 38h116v8H17zM26 49h13v45H26zM56 49h13v45H56zM86 49h13v45H86zM116 49h13v45h-13zM12 96h126v9H12z" fill="currentColor"/></svg>}
