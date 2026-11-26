import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowUpRight, Copy, Eye, Layers3, Plus, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { normalizeApiError } from "../../../../lib/api/apiError";
import { useAccounts, useCreateAccount } from "../hooks/useAccounts";
import type { AccountType, CreateAccountPayload } from "../account.types";

const money = (value: string | number, currency: string, symbol?: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${symbol ?? currency} —`;
  return `${symbol ?? currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const typeLabel = (type: AccountType) => ({ SAVINGS: "Savings", CURRENT: "Current", FOREIGN_CURRENCY: "Foreign currency" }[type as "SAVINGS" | "CURRENT" | "FOREIGN_CURRENCY"] ?? type);
const dateLabel = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export function AccountListPage() {
  const { data: accounts = [], isLoading, isError, error, refetch, isFetching } = useAccounts();
  const createAccount = useCreateAccount();
  const [filter, setFilter] = useState<"ALL" | AccountType>("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [accountType, setAccountType] = useState<CreateAccountPayload["accountType"]>("SAVINGS");
  const [currency, setCurrency] = useState("BDT");

  const filtered = useMemo(() => accounts.filter((account) =>
    (filter === "ALL" || account.accountType === filter) &&
    `${account.accountNumber} ${account.accountType} ${account.status}`.toLowerCase().includes(search.toLowerCase())
  ), [accounts, filter, search]);
  const activeCount = accounts.filter((a) => a.status === "ACTIVE").length;
  const inactiveCount = accounts.length - activeCount;
  const balanceByCurrency = accounts.flatMap((a) => a.balances).reduce<Record<string, number>>((acc, b) => {
    acc[b.currencyCode] = (acc[b.currencyCode] ?? 0) + Number(b.availableBalance || 0);
    return acc;
  }, {});

  async function copyAccount(value: string) {
    try { await navigator.clipboard.writeText(value); toast.success("Account number copied"); }
    catch { toast.error("Could not copy account number"); }
  }
  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createAccount.mutateAsync({ accountType, currency: currency.trim().toUpperCase() });
      toast.success("Account created successfully");
      setShowCreate(false);
    } catch (err) { toast.error(normalizeApiError(err).message); }
  }

  return <section className="portal-content customer-page">
    <div className="portal-page-heading"><div><p className="eyebrow">CUSTOMER ACCOUNTS</p><h1>My Accounts</h1><p className="muted">Manage and view all your accounts in one place.</p></div><Button onClick={() => setShowCreate(true)} leftIcon={<Plus size={16}/>}>Open New Account</Button></div>

    {isError && <div className="account-alert" role="alert"><div><strong>Unable to load your accounts</strong><p>{normalizeApiError(error).message}</p></div><Button variant="outline" size="sm" onClick={() => void refetch()}>Try again</Button></div>}

    <div className="account-stat-grid">
      <article className="portal-card account-stat"><span className="account-stat-icon blue"><Layers3 size={20}/></span><div><small>Total Accounts</small><strong>{isLoading ? "—" : accounts.length}</strong></div></article>
      <article className="portal-card account-stat"><span className="account-stat-icon green"><Wallet size={20}/></span><div><small>Available balances</small>{isLoading ? <strong>—</strong> : Object.keys(balanceByCurrency).length ? Object.entries(balanceByCurrency).map(([code,value]) => <strong className="account-stat-balance" key={code}>{money(value, code)}</strong>) : <strong>0.00</strong>}</div></article>
      <article className="portal-card account-stat"><span className="account-stat-icon blue"><ArrowUpRight size={20}/></span><div><small>Active Accounts</small><strong>{isLoading ? "—" : activeCount}</strong></div></article>
      <article className="portal-card account-stat"><span className="account-stat-icon purple"><Activity size={20}/></span><div><small>Inactive Accounts</small><strong>{isLoading ? "—" : inactiveCount}</strong></div></article>
    </div>

    <article className="portal-card account-list-card">
      <div className="account-list-toolbar"><div><h2>Accounts List</h2><p>Account details and available balances</p></div><div className="account-toolbar-actions"><input aria-label="Search accounts" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search account number or type…"/><Button variant="ghost" size="icon" aria-label="Refresh accounts" onClick={() => void refetch()} loading={isFetching}><RefreshCw size={16}/></Button></div></div>
      <div className="account-filter-row" role="group" aria-label="Filter accounts">
        {(["ALL", "SAVINGS", "CURRENT", "FOREIGN_CURRENCY"] as const).map((value) => <button key={value} className={`account-filter${filter === value ? " active" : ""}`} onClick={() => setFilter(value)}>{value === "ALL" ? `All (${accounts.length})` : typeLabel(value)}</button>)}
      </div>
      {isLoading ? <div className="account-state" role="status">Loading your accounts…</div> : filtered.length === 0 ? <div className="account-state"><Wallet size={28}/><strong>{accounts.length ? "No matching accounts" : "No accounts yet"}</strong><span>{accounts.length ? "Try another filter or search term." : "Open your first account to get started."}</span>{!accounts.length && <Button size="sm" onClick={() => setShowCreate(true)} leftIcon={<Plus size={15}/>}>Open Account</Button>}</div> : <div className="account-table-wrap"><table className="account-table"><thead><tr><th>#</th><th>Account Number</th><th>Account Type</th><th>Currency</th><th>Available Balance</th><th>Status</th><th>Opened On</th><th>Actions</th></tr></thead><tbody>{filtered.map((account,index) => <tr key={account.id}><td>{index + 1}</td><td><span className="account-number">{account.accountNumber}</span><button className="table-icon-button" onClick={() => void copyAccount(account.accountNumber)} aria-label={`Copy account ${account.accountNumber}`}><Copy size={14}/></button></td><td><span className={`account-type-pill type-${account.accountType.toLowerCase()}`}>{typeLabel(account.accountType)}</span></td><td>{account.balances.map((b) => b.currencyCode).join(", ") || "—"}</td><td className="account-balance-cell">{account.balances.map((b) => <span key={b.id}>{money(b.availableBalance,b.currencyCode,b.currency?.symbol)}</span>)}</td><td><Badge variant={account.status === "ACTIVE" ? "success" : account.status === "FROZEN" ? "warning" : "danger"}>{account.status}</Badge></td><td>{dateLabel(account.createdAt)}</td><td><Link className="table-icon-button" to={`/customer/accounts/${account.id}`} aria-label={`View account ${account.accountNumber}`}><Eye size={16}/></Link></td></tr>)}</tbody></table></div>}
    </article>
    <p className="account-disclaimer">Balances are retrieved from your authenticated account records. Currency balances are displayed separately and are not combined across currencies.</p>

    {showCreate && <div className="account-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}><section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="create-account-title"><div className="account-modal-heading"><div><h2 id="create-account-title">Open a new account</h2><p>Choose an account type and a supported 3-letter currency code.</p></div><button className="table-icon-button" onClick={() => setShowCreate(false)} aria-label="Close dialog">×</button></div><form onSubmit={handleCreate}><label>Account type<select value={accountType} onChange={(e) => setAccountType(e.target.value as CreateAccountPayload["accountType"])}><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option><option value="FOREIGN_CURRENCY">Foreign currency</option></select></label><label>Currency code<input required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="BDT"/><small>Currency must exist and be active in the backend.</small></label><div className="account-modal-actions"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" loading={createAccount.isPending}>Create Account</Button></div></form></section></div>}
  </section>;
}
