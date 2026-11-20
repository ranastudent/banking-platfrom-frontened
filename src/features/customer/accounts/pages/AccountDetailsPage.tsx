import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Copy, CreditCard, Landmark, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { normalizeApiError } from "../../../../lib/api/apiError";
import { useAccount } from "../hooks/useAccounts";

const money = (value: string | number, code: string, symbol?: string) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `${symbol ?? code} ${amount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : `${code} —`;
};
const typeName = (type: string) => ({ SAVINGS: "Savings Account", CURRENT: "Current Account", FOREIGN_CURRENCY: "Foreign Currency Account" }[type] ?? type);
const dateName = (value: string) => new Date(value).toLocaleString(undefined,{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"});

export function AccountDetailsPage() {
  const { accountId = "" } = useParams();
  const { data: account, isLoading, isError, error, refetch, isFetching } = useAccount(accountId);

  async function copyNumber() {
    if (!account) return;
    try { await navigator.clipboard.writeText(account.accountNumber); toast.success("Account number copied"); }
    catch { toast.error("Could not copy account number"); }
  }

  if (isLoading) return <section className="portal-content"><div className="account-state" role="status">Loading account details…</div></section>;
  if (isError || !account) return <section className="portal-content"><div className="portal-page-heading"><div><p className="eyebrow">CUSTOMER ACCOUNTS</p><h1>Account Details</h1></div><Link to="/customer/accounts" className="account-back-link"><ArrowLeft size={16}/> Back to accounts</Link></div><div className="account-alert" role="alert"><div><strong>{normalizeApiError(error).status === 404 ? "Account not found" : "Unable to load account"}</strong><p>{normalizeApiError(error).message}</p></div><Button variant="outline" onClick={() => void refetch()} loading={isFetching}>Try again</Button></div></section>;

  return <section className="portal-content customer-page">
    <div className="account-breadcrumb"><Link to="/customer/accounts"><ArrowLeft size={15}/> My Accounts</Link><span>/</span><span>Account Details</span></div>
    <div className="portal-page-heading"><div><p className="eyebrow">ACCOUNT OVERVIEW</p><h1>Account Details</h1><p className="muted">View account information and available balances.</p></div><Badge variant={account.status === "ACTIVE" ? "success" : account.status === "FROZEN" ? "warning" : "danger"}>{account.status}</Badge></div>
    <div className="account-detail-grid">
      <article className="account-balance-card"><div className="account-balance-card-top"><span className="account-balance-symbol"><Landmark size={25}/></span><Badge variant={account.status === "ACTIVE" ? "success" : account.status === "FROZEN" ? "warning" : "danger"}>{account.status}</Badge></div><span className="account-balance-type">{typeName(account.accountType)}</span><div className="account-number-large">{account.accountNumber}<button onClick={() => void copyNumber()} aria-label="Copy account number"><Copy size={15}/></button></div><div className="account-balance-list">{account.balances.map((balance) => <div key={balance.id}><small>Available balance · {balance.currency?.name ?? balance.currencyCode}</small><strong>{money(balance.availableBalance,balance.currencyCode,balance.currency?.symbol)}</strong><span>Locked: {money(balance.lockedBalance,balance.currencyCode,balance.currency?.symbol)}</span></div>)}</div></article>
      <article className="portal-card account-information-card"><div className="account-section-heading"><div><h2>Account Information</h2><p>Verified details from your account record</p></div><CreditCard size={19}/></div><dl className="account-info-list"><div><dt><Wallet size={15}/> Account number</dt><dd>{account.accountNumber}</dd></div><div><dt><Landmark size={15}/> Account type</dt><dd>{typeName(account.accountType)}</dd></div><div><dt><ShieldCheck size={15}/> Account status</dt><dd><Badge variant={account.status === "ACTIVE" ? "success" : account.status === "FROZEN" ? "warning" : "danger"}>{account.status}</Badge></dd></div><div><dt><CalendarDays size={15}/> Opened on</dt><dd>{dateName(account.createdAt)}</dd></div><div><dt><CalendarDays size={15}/> Last updated</dt><dd>{dateName(account.updatedAt)}</dd></div></dl></article>
    </div>
    <article className="portal-card account-balance-breakdown"><div className="account-section-heading"><div><h2>Balance Breakdown</h2><p>Balances are separated by currency and are never combined.</p></div></div><div className="account-balance-breakdown-grid">{account.balances.map((balance) => <div className="account-currency-tile" key={balance.id}><span>{balance.currency?.name ?? balance.currencyCode}</span><strong>{money(balance.availableBalance,balance.currencyCode,balance.currency?.symbol)}</strong><small>Available balance</small><div><span>Locked balance</span><b>{money(balance.lockedBalance,balance.currencyCode,balance.currency?.symbol)}</b></div></div>)}</div></article>
    <p className="account-disclaimer">This view displays account data returned by the backend. Transaction history and money movement actions will be connected in their dedicated Phase 6 sub-phases.</p>
  </section>;
}
