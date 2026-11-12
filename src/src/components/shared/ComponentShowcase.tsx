import { useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Bell, CheckCircle2, CreditCard, Ellipsis,
  Search, ShieldCheck, Wallet,
} from "lucide-react";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/Card";
import { Badge, StatusBadge } from "../ui/Badge";
import { Dialog } from "../ui/Dialog";
import { Dropdown } from "../ui/Dropdown";
import { Tooltip } from "../ui/Tooltip";
import { ThemeToggle } from "./ThemeToggle";

const transactions = [
  { name: "Salary payment", reference: "TRX-2048-001", date: "11 Nov 2026", amount: "+ ৳85,000.00", positive: true, status: "success" as const },
  { name: "Online purchase", reference: "TRX-2048-002", date: "10 Nov 2026", amount: "− ৳4,250.00", positive: false, status: "pending" as const },
  { name: "Utility bill", reference: "TRX-2048-003", date: "09 Nov 2026", amount: "− ৳1,850.00", positive: false, status: "failed" as const },
];

export function ComponentShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("finance@example.com");

  return (
    <div className="showcase-shell">
      <aside className="showcase-sidebar">
        <div className="brand-lockup"><span className="brand-mark"><Wallet size={20} /></span><span>Northstar<span>Banking</span></span></div>
        <p className="sidebar-caption">WORKSPACE</p>
        <a className="nav-link active" href="#overview"><Wallet size={17} />Overview</a>
        <a className="nav-link" href="#accounts"><CreditCard size={17} />Accounts</a>
        <a className="nav-link" href="#transactions"><ArrowDownLeft size={17} />Transactions</a>
        <a className="nav-link" href="#security"><ShieldCheck size={17} />Security</a>
        <div className="sidebar-bottom"><span className="avatar">RA</span><span>Demo Admin<small>ADMIN</small></span><Ellipsis size={18} /></div>
      </aside>

      <main className="showcase-main">
        <header className="topbar">
          <div><span className="topbar-kicker">BANKING PLATFORM / DESIGN SYSTEM</span><strong>Component Preview</strong></div>
          <div className="topbar-actions">
            <Tooltip content="Notifications"><Button variant="ghost" size="icon" aria-label="Notifications"><Bell size={18} /></Button></Tooltip>
            <ThemeToggle />
            <span className="avatar">RA</span>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">DESIGN SYSTEM · PHASE 2</p><h1>Welcome back</h1><p className="muted">A preview of the shared banking interface components.</p></div>
            <Button leftIcon={<ArrowUpRight size={16} />}>View reports</Button>
          </div>

          <section className="metric-grid" aria-label="Overview metrics">
            <Card><CardContent><div className="metric-top"><span>Total balance</span><Wallet size={18} /></div><strong className="metric-value">৳ 2,48,500.00</strong><span className="metric-note positive">+8.2% this month</span></CardContent></Card>
            <Card><CardContent><div className="metric-top"><span>Transactions</span><ArrowDownLeft size={18} /></div><strong className="metric-value">1,284</strong><span className="metric-note">Last 30 days</span></CardContent></Card>
            <Card><CardContent><div className="metric-top"><span>Active accounts</span><CreditCard size={18} /></div><strong className="metric-value">03</strong><span className="metric-note"><StatusBadge status="active" /></span></CardContent></Card>
          </section>

          <div className="content-grid">
            <Card className="transactions-card">
              <CardHeader><div><CardTitle>Recent transactions</CardTitle><CardDescription>Illustrative sample data for component preview</CardDescription></div><Dropdown triggerLabel={<><Ellipsis size={18} /> Actions</>} items={[{label:"Export CSV",onSelect:()=>{}},{label:"Refresh list",onSelect:()=>{}}]} /></CardHeader>
              <CardContent className="table-wrap">
                <table className="transactions-table">
                  <thead><tr><th>TRANSACTION</th><th>DATE</th><th>STATUS</th><th className="align-right">AMOUNT</th></tr></thead>
                  <tbody>{transactions.map((tx) => <tr key={tx.reference}><td><strong>{tx.name}</strong><small>{tx.reference}</small></td><td>{tx.date}</td><td><StatusBadge status={tx.status} /></td><td className={`align-right amount ${tx.positive ? "positive" : ""}`}>{tx.amount}</td></tr>)}</tbody>
                </table>
              </CardContent>
              <CardFooter><span className="muted">Showing 3 illustrative records</span><Button variant="outline" size="sm">View all</Button></CardFooter>
            </Card>

            <Card className="form-card">
              <CardHeader><div><CardTitle>Shared form controls</CardTitle><CardDescription>Label, hint and validation-ready input</CardDescription></div><Badge variant="info">Preview</Badge></CardHeader>
              <CardContent className="form-stack">
                <FormField id="email-demo" label="Notification email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} leading={<Search size={16} />} hint="Used for account activity notifications." />
                <FormField id="reference-demo" label="Reference ID" placeholder="Enter transaction reference" />
                <div className="button-row"><Button onClick={() => setDialogOpen(true)}>Open dialog</Button><Button variant="secondary">Secondary</Button></div>
                <div className="button-row"><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button></div>
                <div className="badge-row"><Badge variant="neutral">Draft</Badge><Badge variant="info">Processing</Badge><Badge variant="success">Completed</Badge><Badge variant="warning">Pending</Badge><Badge variant="danger">Failed</Badge></div>
              </CardContent>
              <CardFooter><span className="muted"><CheckCircle2 size={14} /> Shared components</span><Tooltip content="This is a keyboard-focusable tooltip"><Button variant="ghost" size="sm">Help</Button></Tooltip></CardFooter>
            </Card>
          </div>
          <p className="demo-disclaimer">Demo preview only — all figures and transactions above are illustrative, not live banking data.</p>
        </div>
      </main>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Confirm component preview"
        description="This dialog demonstrates the shared modal pattern. No banking action will be submitted."
        footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => setDialogOpen(false)}>Got it</Button></>}
      >
        <div className="dialog-message"><span className="dialog-icon"><ShieldCheck size={22} /></span><p>Dialog components will be reused for confirmations, details and safe review flows across the application.</p></div>
      </Dialog>
    </div>
  );
}
