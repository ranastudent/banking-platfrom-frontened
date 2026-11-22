import { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Activity, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Bell, Building2, ChevronDown, CircleHelp, ClipboardList,
   FileClock, FileText, Gauge, Globe2,  Home, Landmark, LogOut,
  Menu, Moon, Search, Settings, Shield, ShieldAlert, Sun, Users, Wallet, X, UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTheme } from "../../app/providers/ThemeProvider";


type PortalRole = "CUSTOMER" | "ADMIN" | "SUPPORT" | "AUDITOR";
const roleLabels: Record<PortalRole,string> = { CUSTOMER:"Customer", ADMIN:"Admin", SUPPORT:"Support", AUDITOR:"Auditor" };
const navByRole = {
  CUSTOMER: [
    ["Dashboard","/customer/dashboard",Gauge],["My Accounts","/customer/accounts",Wallet],
    ["Transactions","/customer/transactions",ArrowLeftRight],["Deposit","/customer/deposit",ArrowDownLeft],["Withdrawal","/customer/withdrawal",ArrowUpRight],["Transfer Money","/customer/transfer",ArrowLeftRight],
    ["Beneficiaries","/customer/beneficiaries",Users],["Notifications","/customer/notifications",Bell],
    ["Decision Explanations","/customer/decision-explanations",FileText],["Profile & Settings","/customer/profile",Settings],
  ],
  ADMIN: [
    ["Admin Dashboard","/admin/dashboard",Gauge],["Users & Status","/admin/users",Users],
    ["Accounts","/admin/accounts",Wallet],["Transactions","/admin/transactions",ArrowLeftRight],
    ["Currencies","/admin/currencies",Globe2],["Exchange Rates","/admin/exchange-rates",Activity],
    ["Currency Reserves","/admin/reserves",Building2],["FX Approvals","/admin/fx-approvals",ClipboardList],
    ["Risk Reviews","/admin/risk-reviews",ShieldAlert],["Fraud Dashboard","/admin/fraud",Shield],["Fraud Alerts","/admin/fraud/alerts",ShieldAlert],
    ["Fraud Cases","/admin/fraud/cases",ClipboardList],["Fraud Models","/admin/fraud/models",Shield],
    ["Monitoring Events","/admin/monitoring",Activity],["Audit Logs","/admin/audit-logs",FileClock],
  ],
  SUPPORT: [
    ["Support Dashboard","/support/dashboard",Gauge],["Customer Lookup","/support/customers",Users],
    ["Account Assistance","/support/accounts",Wallet],["Transaction Assistance","/support/transactions",ArrowLeftRight],
    ["Beneficiary Assistance","/support/beneficiaries",Users],["Support Tickets","/support/tickets",FileText],
    ["Support Operations","/support/operations",Settings],["FX Requests (Read)","/support/fx-requests",Globe2],
    ["Support Audit Logs","/support/audit-logs",FileClock],
  ],
  AUDITOR: [
    ["Auditor Dashboard","/auditor/dashboard",Gauge],["Audit Logs","/auditor/audit-logs",FileClock],
    ["Transactions (Read)","/auditor/transactions",ArrowLeftRight],["Account Activity","/auditor/account-activity",Activity],
    ["Approval Records","/auditor/approvals",ClipboardList],["FX Requests (Read)","/auditor/fx-requests",Globe2],
    ["Currencies (Read)","/auditor/currencies",Globe2],["Reserves (Read)","/auditor/reserves",Building2],
  ],
} satisfies Record<PortalRole, [string,string,typeof Gauge][]>;

export function PortalLayout({ role }: { role: PortalRole }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen,setMobileOpen] = useState(false);
  const [profileOpen,setProfileOpen] = useState(false);
  const [loggingOut,setLoggingOut] = useState(false);
  const items = useMemo(() => navByRole[role], [role]);
  const displayName = String(user?.name ?? user?.fullName ?? user?.email ?? "Account User");
  async function handleLogout() {
    setLoggingOut(true);
    try { await logout(); toast.success("You have been signed out."); }
    catch { toast.error("Signed out locally. The server could not confirm token revocation."); }
    finally { setLoggingOut(false); navigate("/login",{replace:true}); }
  }
  return <div className={`portal-shell portal-${role.toLowerCase()}`}>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation menu" onClick={()=>setMobileOpen(false)} />}
    <aside className={`portal-sidebar ${mobileOpen?"is-open":""}`} aria-label={`${roleLabels[role]} navigation`}>
      <div className="portal-brand"><span className="portal-brand-mark"><Landmark size={21}/></span><span><strong>Banking Platform</strong><small>Secure • Smart • Reliable</small></span><button className="icon-button mobile-close" onClick={()=>setMobileOpen(false)} aria-label="Close menu"><X size={19}/></button></div>
      <div className="sidebar-role-label">{roleLabels[role]} Portal</div>
      <nav className="portal-nav">
        {items.map(([label,path,Icon])=> <NavLink key={path} to={path} end={path.endsWith("dashboard")} onClick={()=>setMobileOpen(false)} className={({isActive})=>`portal-nav-link${isActive?" active":""}`}><Icon size={17}/><span>{label}</span></NavLink>)}
      </nav>
      <div className="portal-sidebar-bottom">
        {role!=="CUSTOMER" && <NavLink to="/customer/dashboard" className="portal-nav-link"><Home size={17}/><span>Back to App</span></NavLink>}
        <button className="portal-logout" onClick={()=>void handleLogout()} disabled={loggingOut}><LogOut size={17}/>{loggingOut?"Signing out…":"Log Out"}</button>
      </div>
    </aside>
    <main className="portal-main">
      <header className="portal-header">
        <div className="portal-header-title"><button className="icon-button mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Open navigation menu"><Menu/></button><div><span className="header-kicker">{roleLabels[role]} workspace</span><strong>{location.pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-"," ")?.replace(/^./, c=>c.toUpperCase()) ?? roleLabels[role]}</strong></div></div>
        <div className="portal-header-actions">
          <label className="portal-search"><Search size={16}/><input aria-label="Search this workspace" placeholder="Search accounts, transactions, or help…"/><kbd>Ctrl + K</kbd></label>
          <button className="icon-button" aria-label="Notifications" onClick={()=>navigate(role==="CUSTOMER"?"/customer/notifications":`/${role.toLowerCase()}/dashboard`)}><Bell size={18}/><i className="notification-dot"/></button>
          <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme==="light"?"dark":"light"} theme`}>{theme==="light"?<Moon size={18}/>:<Sun size={18}/>}</button>
          <div className="profile-wrap">
            <button className="profile-trigger" aria-expanded={profileOpen} onClick={()=>setProfileOpen(v=>!v)}><span className="avatar">{displayName.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}</span><span className="profile-copy"><strong>{displayName}</strong><small>{roleLabels[role]}</small></span><ChevronDown size={16}/></button>
            {profileOpen && <div className="profile-menu"><button onClick={()=>{setProfileOpen(false);navigate(`/${role.toLowerCase()}/profile`);}}><UserRound size={15}/> Profile</button><button onClick={()=>void handleLogout()}><LogOut size={15}/> Log out</button></div>}
          </div>
        </div>
      </header>
      <Outlet/>
    </main>
  </div>;
}

export function PortalDashboard({ role }: { role: PortalRole }) {
 const copy = {
 CUSTOMER:{title:"Dashboard",subtitle:"Your money, accounts and everyday banking at a glance.",metrics:[["Total Balance","৳ 125,430.75"],["Active Accounts","3"],["This Month In","৳ 86,500.00"],["This Month Out","৳ 42,320.00"]],links:[["Transfer Money","/customer/transfer"],["My Accounts","/customer/accounts"],["Transactions","/customer/transactions"]]},
 ADMIN:{title:"Admin Dashboard",subtitle:"Overview of users, accounts, transactions, FX requests, risks and system health.",metrics:[["Total Users","—"],["Total Accounts","—"],["Total Transactions","—"],["Fraud Alerts","—"]],links:[["Users & Status","/admin/users"],["Transactions","/admin/transactions"],["Audit Logs","/admin/audit-logs"]]},
 SUPPORT:{title:"Support Dashboard",subtitle:"Customer assistance, case operations and support activities overview.",metrics:[["Total Tickets","—"],["Resolved","—"],["In Progress","—"],["Escalated","—"]],links:[["Customer Lookup","/support/customers"],["Support Tickets","/support/tickets"],["Support Operations","/support/operations"]]},
 AUDITOR:{title:"Auditor Dashboard",subtitle:"Read-only overview of critical system, user and approval activities.",metrics:[["Total Logs","—"],["Success","—"],["Warning","—"],["Failed / Blocked","—"]],links:[["Audit Logs","/auditor/audit-logs"],["Transaction Review","/auditor/transactions"],["Approval Records","/auditor/approvals"]]},
 }[role];
 return <section className="portal-content"><div className="portal-page-heading"><div><p className="eyebrow">{roleLabels[role]} OVERVIEW</p><h1>{copy.title}</h1><p className="muted">{copy.subtitle}</p></div><span className="demo-tag">Demo dashboard · API data integration pending</span></div>
 <div className="portal-metrics">{copy.metrics.map(([label,value],i)=><article className="portal-card metric-card" key={label}><div className="metric-icon">{[<Wallet/>,<Users/>,<ArrowLeftRight/>,<ShieldAlert/>][i]}</div><span>{label}</span><strong>{value}</strong></article>)}</div>
 <div className="portal-dashboard-grid"><article className="portal-card overview-card"><div className="portal-card-heading"><div><h2>{role==="CUSTOMER"?"Balance Overview":role==="SUPPORT"?"Ticket Activity":role==="AUDITOR"?"Audit Activity":"Platform Activity"}</h2><p>Workspace overview</p></div><Activity size={19}/></div><div className="empty-chart"><div className="chart-placeholder"><Activity size={28}/><span>Live analytics will appear here when dashboard APIs are connected.</span></div></div></article>
 <article className="portal-card quick-card"><div className="portal-card-heading"><div><h2>Quick Access</h2><p>Frequently used workspace pages</p></div><CircleHelp size={19}/></div><div className="quick-link-list">{copy.links.map(([label,path])=><a key={path} href={path} className="quick-link"><span>{label}</span><span aria-hidden="true">→</span></a>)}</div></article></div>
 <p className="demo-disclaimer">Portfolio demonstration interface. Figures shown as placeholders are not live banking balances.</p></section>;
}

export function PlaceholderPage({ title, description }: { title:string; description?:string }) {
 return <section className="portal-content"><div className="portal-page-heading"><div><p className="eyebrow">WORKSPACE</p><h1>{title}</h1><p className="muted">{description ?? "This page is scaffolded for the next implementation phase."}</p></div></div><article className="portal-card placeholder-panel"><Activity size={28}/><h2>{title}</h2><p>Navigation and role protection are active. Detailed page functionality will be implemented in its designated phase.</p></article></section>;
}
