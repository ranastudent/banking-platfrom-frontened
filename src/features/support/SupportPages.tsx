import { useMemo, useState } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity, AlertCircle, ArrowRight, BadgeCheck, Banknote, CheckCircle2,
  ClipboardList, FileSearch, Filter, RefreshCw, Search, ShieldCheck,
  UserRound, Users, Wallet,
} from "lucide-react";
import { api } from "../../lib/api/apiClient";

type AnyRecord = Record<string, any>;
type PageInfo = { page?: number; limit?: number; total?: number; totalPages?: number };
type ListResult<T> = { rows: T[]; pagination?: PageInfo };

function payload<T = AnyRecord>(response: any): T {
  let value = response?.data?.data ?? response?.data ?? response;
  if (value && typeof value === "object" && "data" in value && !Array.isArray(value.data)) value = value.data;
  return value as T;
}
function listResult<T = AnyRecord>(response: any, keys: string[]): ListResult<T> {
  const value = payload<AnyRecord>(response);
  const rows = keys.map((key) => value?.[key]).find(Array.isArray) ?? (Array.isArray(value) ? value : []);
  return { rows: rows as T[], pagination: value?.pagination };
}
function errorText(error: any): string {
  const status = error?.response?.status;
  const message = error?.response?.data?.message ?? error?.response?.data?.error?.message ?? error?.message ?? "Request failed.";
  if (status === 401) return "আপনার সেশন শেষ হয়েছে। আবার লগইন করুন।";
  if (status === 403) return "এই তথ্য দেখার অনুমতি আপনার নেই।";
  if (status === 404) return "রেকর্ড পাওয়া যায়নি। ID ও তথ্য যাচাই করুন।";
  if (status === 429) return "অনেকবার অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  return String(message);
}
function date(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}
function initials(name?: string) { return (name || "CU").split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase(); }
function money(value: any, currency?: string) {
  if (value === null || value === undefined) return "—";
  return `${String(value)}${currency ? ` ${currency}` : ""}`;
}

function PageHeading({ eyebrow = "SUPPORT WORKSPACE", title, subtitle, action }: { eyebrow?: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="sp8-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{subtitle}</p></div>{action}</div>;
}
function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return <section className={`sp8-panel ${className}`}><div className="sp8-panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>{children}</section>;
}
function Loading({ label = "তথ্য লোড হচ্ছে…" }: { label?: string }) { return <div className="sp8-state" role="status"><RefreshCw size={18} className="sp8-spin"/><span>{label}</span></div>; }
function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) { return <div className="sp8-state sp8-error" role="alert"><AlertCircle size={19}/><span>{errorText(error)}</span>{retry && <button className="sp8-button secondary" onClick={retry}>আবার চেষ্টা করুন</button>}</div>; }
function Empty({ children = "কোনো রেকর্ড পাওয়া যায়নি।" }: { children?: ReactNode }) { return <div className="sp8-empty"><FileSearch size={25}/><span>{children}</span></div>; }
function StatusPill({ value }: { value?: string | boolean | null }) {
  const text = value === true ? "Verified" : value === false ? "Not verified" : String(value ?? "Unknown").replaceAll("_", " ");
  const normalized = text.toLowerCase();
  const kind = /active|completed|success|verified|resolved|true/.test(normalized) ? "good" : /pending|processing|review|investigat/.test(normalized) ? "warn" : /failed|blocked|suspended|false|closed/.test(normalized) ? "bad" : "neutral";
  return <span className={`sp8-status ${kind}`}>{text}</span>;
}
function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return <div className="sp8-pagination"><span>পৃষ্ঠা {page} / {pages}</span><div><button className="sp8-button secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>আগের</button><button className="sp8-button secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>পরের</button></div></div>;
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="sp8-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Input({ ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className="sp8-input" {...props}/>; }
function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className="sp8-input" {...props}>{children}</select>; }
// Page 38 — there is no dedicated support-dashboard aggregate endpoint. This dashboard
// summarizes only the latest 20 records returned by the documented support audit API.
export function SupportDashboardPage() {
  const q = useQuery({ queryKey: ["support", "dashboard", "recent-audit"], queryFn: () => api.get("/support/audit-logs", { params: { page: 1, limit: 20 } }), staleTime: 30_000 });
  const result = useMemo(() => q.data ? listResult(q.data, ["auditLogs"]) : { rows: [] as AnyRecord[], pagination: undefined }, [q.data]);
  const logs = result.rows;
  const successful = logs.filter((log) => log.success === true).length;
  const failed = logs.filter((log) => log.success === false).length;
  const uniqueCustomers = new Set(logs.map((log) => log.entityId).filter(Boolean)).size;
  return <section className="portal-content sp8-content">
    <PageHeading title="Support Dashboard" subtitle="সাম্প্রতিক customer assistance activity এবং support audit trail-এর সংক্ষিপ্ত চিত্র।" action={<span className="sp8-live-tag"><i/> API connected view</span>}/>
    {q.isLoading ? <Loading/> : q.isError ? <ErrorState error={q.error} retry={() => void q.refetch()}/> : <>
      <div className="sp8-metrics">
        <article className="sp8-metric"><span className="sp8-metric-icon blue"><Activity size={19}/></span><div><small>সাম্প্রতিক Audit Records</small><strong>{logs.length}</strong><em>সর্বশেষ ২০টি রেকর্ডের মধ্যে</em></div></article>
        <article className="sp8-metric"><span className="sp8-metric-icon green"><CheckCircle2 size={19}/></span><div><small>Successful Operations</small><strong>{successful}</strong><em>ফেরত আসা রেকর্ড অনুযায়ী</em></div></article>
        <article className="sp8-metric"><span className="sp8-metric-icon red"><AlertCircle size={19}/></span><div><small>Failed Operations</small><strong>{failed}</strong><em>ফেরত আসা রেকর্ড অনুযায়ী</em></div></article>
        <article className="sp8-metric"><span className="sp8-metric-icon violet"><Users size={19}/></span><div><small>Unique Customer Records</small><strong>{uniqueCustomers}</strong><em>এই audit sample-এ</em></div></article>
      </div>
      <div className="sp8-dashboard-grid">
        <Panel title="Recent Support Activity" subtitle="GET /support/audit-logs · page 1 · limit 20">
          {logs.length === 0 ? <Empty>এখনো কোনো Support audit record পাওয়া যায়নি।</Empty> : <div className="sp8-table-wrap"><table className="sp8-table"><thead><tr><th>Action</th><th>Customer / Entity</th><th>Support Agent</th><th>Result</th><th>Time</th></tr></thead><tbody>{logs.slice(0, 8).map((log) => <tr key={log.id}><td><strong>{log.action}</strong><small>{log.description || log.entityType}</small></td><td>{log.entityType}<small>{log.entityId || "—"}</small></td><td>{log.user?.name || log.user?.email || "—"}</td><td><StatusPill value={log.success}/></td><td>{date(log.createdAt)}</td></tr>)}</tbody></table></div>}
          <div className="sp8-panel-foot"><span>শুধু API থেকে পাওয়া সর্বশেষ রেকর্ড দেখানো হচ্ছে।</span><Link to="/support/audit-logs">সব Audit Logs দেখুন →</Link></div>
        </Panel>
        <Panel title="Quick Actions" subtitle="Customer assistance tools"><div className="sp8-quick-links">
          <Link to="/support/customers"><span className="sp8-quick-icon"><Search size={18}/></span><span><strong>Customer Search</strong><small>নাম, email বা phone দিয়ে খুঁজুন</small></span><ArrowRight size={16}/></Link>
          <Link to="/support/accounts"><span className="sp8-quick-icon"><Wallet size={18}/></span><span><strong>Account Assistance</strong><small>Account ID দিয়ে customer account দেখুন</small></span><ArrowRight size={16}/></Link>
          <Link to="/support/transactions"><span className="sp8-quick-icon"><Banknote size={18}/></span><span><strong>Transaction Assistance</strong><small>Customer ID দিয়ে transaction খুঁজুন</small></span><ArrowRight size={16}/></Link>
          <Link to="/support/operations"><span className="sp8-quick-icon"><ClipboardList size={18}/></span><span><strong>Record Support Operation</strong><small>সাহায্যের কার্যক্রম audit trail-এ রাখুন</small></span><ArrowRight size={16}/></Link>
        </div></Panel>
      </div>
      <p className="sp8-note"><ShieldCheck size={15}/> Backend-এ dedicated Support Dashboard aggregate endpoint নেই। তাই এখানে ticket totals বা lifetime statistics দেখানো হচ্ছে না; KPI-গুলো কেবল সাম্প্রতিক audit response থেকে গণনা করা।</p>
    </>}
  </section>;
}

// Page 39 — GET /support/customers?q=&page=&limit=
export function SupportCustomerSearchPage() {
  const [searchParams] = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const [submitted, setSubmitted] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["support", "customers", submitted, page], enabled: submitted.trim().length > 0, queryFn: () => api.get("/support/customers", { params: { q: submitted.trim(), page, limit: 10 } }) });
  const result = query.data ? listResult(query.data, ["customers"]) : { rows: [] as AnyRecord[], pagination: undefined };
  const navigate = useNavigate();
  return <section className="portal-content sp8-content"><PageHeading title="Customer Search" subtitle="নির্দিষ্ট customer খুঁজে তার account, transaction ও support operation-এ যান।"/>
    <Panel title="Find a customer" subtitle="নাম, email অথবা phone number দিয়ে সার্চ করুন।">
      <form className="sp8-search-form" onSubmit={(event) => { event.preventDefault(); if (!term.trim()) { toast.error("কমপক্ষে ১ অক্ষরের search term দিন।"); return; } if (term.trim().length > 100) { toast.error("Search term সর্বোচ্চ ১০০ অক্ষর হতে পারবে।"); return; } setPage(1); setSubmitted(term.trim()); }}>
        <div className="sp8-searchbox"><Search size={18}/><Input aria-label="Customer search" placeholder="Customer name, email or phone…" value={term} maxLength={100} onChange={(event) => setTerm(event.target.value)}/></div>
        <button className="sp8-button primary" type="submit" disabled={query.isFetching}><Search size={15}/> Search Customer</button>
      </form>
      <div className="sp8-helper">Backend contract: q required (1–100 characters), page ≥ 1, limit ≤ 100. এই স্ক্রিনে limit 10 ব্যবহার করা হয়েছে।</div>
    </Panel>
    <Panel title="Search Results" subtitle={submitted ? `“${submitted}” এর ফলাফল` : "Search করলে customer records এখানে দেখা যাবে।"}>
      {!submitted ? <Empty>Customer খুঁজতে উপরের search box ব্যবহার করুন।</Empty> : query.isLoading ? <Loading/> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()}/> : result.rows.length === 0 ? <Empty>এই search term-এর জন্য কোনো customer পাওয়া যায়নি।</Empty> : <>
        <div className="sp8-table-wrap"><table className="sp8-table"><thead><tr><th>Customer</th><th>Contact</th><th>Account Status</th><th>Email Verification</th><th>Joined</th><th>Assistance</th></tr></thead><tbody>{result.rows.map((customer) => <tr key={customer.id}><td><div className="sp8-person"><span className="sp8-avatar">{initials(customer.name)}</span><span><strong>{customer.name}</strong><small>{customer.id}</small></span></div></td><td>{customer.email}<small>{customer.phone || "Phone not provided"}</small></td><td><StatusPill value={customer.status}/></td><td><StatusPill value={Boolean(customer.emailVerifiedAt)}/></td><td>{date(customer.createdAt)}</td><td><div className="sp8-row-actions"><button className="sp8-button secondary" onClick={() => navigate(`/support/transactions?customerId=${encodeURIComponent(customer.id)}`)}>Transactions</button><button className="sp8-button secondary" onClick={() => navigate(`/support/operations?customerId=${encodeURIComponent(customer.id)}`)}>Record Help</button></div></td></tr>)}</tbody></table></div>
        <Pagination page={result.pagination?.page ?? page} pages={result.pagination?.totalPages ?? 1} onChange={setPage}/>
      </>}
    </Panel>
  </section>;
}

// Page 40 — GET /support/customers/accounts/:accountId
export function SupportCustomerAccountsPage() {
  const [accountId, setAccountId] = useState("");
  const [requestedId, setRequestedId] = useState("");
  const query = useQuery({ queryKey: ["support", "customer-account", requestedId], enabled: Boolean(requestedId), queryFn: () => api.get(`/support/customers/accounts/${encodeURIComponent(requestedId)}`) });
  const data = query.data ? payload<AnyRecord>(query.data) : null;
  const account = data?.account ?? data;
  const balances: AnyRecord[] = Array.isArray(account?.balances) ? account.balances : [];
  return <section className="portal-content sp8-content"><PageHeading title="Customer Accounts" subtitle="Support permission অনুযায়ী নির্দিষ্ট customer account এবং currency balance দেখুন।"/>
    <Panel title="Lookup customer account" subtitle="Backend এই lookup-এর জন্য account UUID গ্রহণ করে; customer account ছাড়া অন্য role-এর account 404 দেয়।">
      <form className="sp8-inline-form" onSubmit={(e) => { e.preventDefault(); if (!accountId.trim()) return; setRequestedId(accountId.trim()); }}><Field label="Account ID (UUID)"><Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required/></Field><button className="sp8-button primary" disabled={query.isFetching}><Search size={15}/> Find Account</button></form>
    </Panel>
    {requestedId && <Panel title="Account Details" subtitle="GET /support/customers/accounts/:accountId">{query.isLoading ? <Loading/> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()}/> : account ? <>
      <div className="sp8-detail-grid"><div className="sp8-detail-card"><small>Account Number</small><strong>{account.accountNumber || "—"}</strong><span>Account ID: {account.id}</span></div><div className="sp8-detail-card"><small>Account Type</small><strong>{account.accountType || "—"}</strong><span>Created {date(account.createdAt)}</span></div><div className="sp8-detail-card"><small>Account Status</small><strong><StatusPill value={account.status}/></strong><span>Updated {date(account.updatedAt)}</span></div></div>
      <div className="sp8-customer-card"><span className="sp8-avatar large">{initials(account.user?.name)}</span><div><small>Account Owner</small><strong>{account.user?.name || "—"}</strong><span>{account.user?.email || "—"} · {account.user?.phone || "No phone"}</span></div><StatusPill value={account.user?.status}/></div>
      <h3 className="sp8-section-title">Currency Balances</h3>{balances.length === 0 ? <Empty>এই account-এ কোনো balance record নেই।</Empty> : <div className="sp8-balance-grid">{balances.map((balance) => <article className="sp8-balance-card" key={balance.id}><span>{balance.currency?.name || balance.currencyCode} ({balance.currencyCode})</span><strong>{money(balance.availableBalance, balance.currencyCode)}</strong><small>Locked: {money(balance.lockedBalance, balance.currencyCode)}</small><StatusPill value={balance.currency?.isActive}/></article>)}</div>}
    </> : <Empty/>}</Panel>}
  </section>;
}

// Page 41 — GET /support/customers/:customerId/transactions with only documented filters.
export function SupportCustomerTransactionsPage() {
  const [searchParams] = useSearchParams();
  const [customerId, setCustomerId] = useState(searchParams.get("customerId") ?? "");
  const [requestedId, setRequestedId] = useState(searchParams.get("customerId") ?? "");
  const [status, setStatus] = useState(""); const [type, setType] = useState(""); const [provider, setProvider] = useState(""); const [currencyCode, setCurrencyCode] = useState(""); const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["support", "customer-transactions", requestedId, status, type, provider, currencyCode, page], enabled: Boolean(requestedId), queryFn: () => api.get(`/support/customers/${encodeURIComponent(requestedId)}/transactions`, { params: { page, limit: 10, ...(status && { status }), ...(type && { type }), ...(provider && { provider }), ...(currencyCode.trim() && { currencyCode: currencyCode.trim().toUpperCase() }) } }) });
  const result = query.data ? listResult(query.data, ["transactions"]) : { rows: [] as AnyRecord[], pagination: undefined };
  return <section className="portal-content sp8-content"><PageHeading title="Customer Transactions" subtitle="নির্দিষ্ট customer-এর transaction history দেখুন এবং supported filters প্রয়োগ করুন।"/>
    <Panel title="Customer & transaction filters" subtitle="Customer ID আবশ্যক। Customer Search পেজ থেকে customer নির্বাচন করে এখানে আসতে পারেন।">
      <form className="sp8-form-grid" onSubmit={(e) => { e.preventDefault(); setPage(1); setRequestedId(customerId.trim()); }}><Field label="Customer ID (UUID)"><Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} required placeholder="Customer UUID"/></Field><Field label="Transaction Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{["PENDING","PROCESSING","COMPLETED","FAILED","CANCELLED","REFUNDED"].map((v) => <option key={v}>{v}</option>)}</Select></Field><Field label="Transaction Type"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{["DEPOSIT","WITHDRAWAL","INTERNAL_TRANSFER","EXTERNAL_DEPOSIT","EXTERNAL_TRANSFER","FX_CONVERSION","REFUND"].map((v) => <option key={v}>{v}</option>)}</Select></Field><Field label="Provider"><Select value={provider} onChange={(e) => setProvider(e.target.value)}><option value="">All providers</option>{["INTERNAL","BKASH","NAGAD","ROCKET","PAYPAL","PAYONEER","WISE"].map((v) => <option key={v}>{v}</option>)}</Select></Field><Field label="Currency Code"><Input value={currencyCode} maxLength={3} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} placeholder="BDT"/></Field><div className="sp8-form-action"><button className="sp8-button primary" disabled={query.isFetching}><Filter size={15}/> Apply Filters</button></div></form>
    </Panel>
    {requestedId && <Panel title="Transaction History" subtitle={`Customer: ${requestedId}`}>{query.isLoading ? <Loading/> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()}/> : result.rows.length === 0 ? <Empty>এই customer-এর জন্য transaction পাওয়া যায়নি।</Empty> : <><div className="sp8-table-wrap"><table className="sp8-table"><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th><th>Provider</th><th>Created</th></tr></thead><tbody>{result.rows.map((row) => <tr key={row.id}><td><strong>{row.reference || row.id}</strong><small>{row.id}</small></td><td>{String(row.type || "—").replaceAll("_", " ")}</td><td><strong>{money(row.amount, row.currencyCode)}</strong></td><td><StatusPill value={row.status}/></td><td>{row.provider || "—"}</td><td>{date(row.createdAt)}</td></tr>)}</tbody></table></div><Pagination page={result.pagination?.page ?? page} pages={result.pagination?.totalPages ?? 1} onChange={setPage}/></>}</Panel>}
  </section>;
}

// Page 42 — GET /support/customers/:customerId/beneficiaries/:beneficiaryId (read only).
export function SupportBeneficiaryAssistancePage() {
  const [customerId, setCustomerId] = useState(""); const [beneficiaryId, setBeneficiaryId] = useState(""); const [lookup, setLookup] = useState<{ customerId: string; beneficiaryId: string } | null>(null);
  const query = useQuery({ queryKey: ["support", "beneficiary", lookup], enabled: Boolean(lookup), queryFn: () => api.get(`/support/customers/${encodeURIComponent(lookup!.customerId)}/beneficiaries/${encodeURIComponent(lookup!.beneficiaryId)}`) });
  const value = query.data ? payload<AnyRecord>(query.data) : null; const beneficiary = value?.beneficiary ?? value;
  return <section className="portal-content sp8-content"><PageHeading title="Beneficiary Assistance" subtitle="Customer-এর নির্দিষ্ট beneficiary record read-only ভাবে যাচাই করুন।"/>
    <Panel title="Find beneficiary" subtitle="Backend ownership যাচাই করে: beneficiary অবশ্যই দেওয়া customer-এর হতে হবে।">
      <form className="sp8-form-grid two" onSubmit={(e) => { e.preventDefault(); setLookup({ customerId: customerId.trim(), beneficiaryId: beneficiaryId.trim() }); }}><Field label="Customer ID (UUID)"><Input required value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer UUID"/></Field><Field label="Beneficiary ID (UUID)"><Input required value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)} placeholder="Beneficiary UUID"/></Field><div className="sp8-form-action"><button className="sp8-button primary" disabled={query.isFetching}><Search size={15}/> Lookup Beneficiary</button></div></form>
    </Panel>
    {lookup && <Panel title="Beneficiary Details" subtitle="Read-only assistance view">{query.isLoading ? <Loading/> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()}/> : beneficiary ? <div className="sp8-beneficiary-card"><div className="sp8-beneficiary-top"><span className="sp8-avatar large"><UserRound size={22}/></span><div><small>Beneficiary Display Name</small><h2>{beneficiary.displayName || "Unnamed beneficiary"}</h2><p>{beneficiary.beneficiaryType || "—"}</p></div><StatusPill value={beneficiary.status}/></div><div className="sp8-detail-grid"><div className="sp8-detail-card"><small>Account Reference</small><strong>{beneficiary.accountReference || "—"}</strong></div><div className="sp8-detail-card"><small>Provider</small><strong>{beneficiary.provider || "—"}</strong></div><div className="sp8-detail-card"><small>Currency</small><strong>{beneficiary.currencyCode || "—"}</strong></div><div className="sp8-detail-card"><small>Created</small><strong>{date(beneficiary.createdAt)}</strong></div><div className="sp8-detail-card"><small>Last Updated</small><strong>{date(beneficiary.updatedAt)}</strong></div><div className="sp8-detail-card"><small>Beneficiary ID</small><strong className="sp8-break">{beneficiary.id}</strong></div></div><p className="sp8-note"><ShieldCheck size={15}/> এই পেজে beneficiary edit বা delete control নেই; backend-এ Support-এর জন্য শুধু read endpoint রয়েছে।</p></div> : <Empty/>}</Panel>}
  </section>;
}

// Page 43 — POST /support/customers/:customerId/support-operations
export function SupportOperationsPage() {
  const [searchParams] = useSearchParams();
  const [customerId, setCustomerId] = useState(searchParams.get("customerId") ?? ""); const [operationType, setOperationType] = useState("GENERAL_SUPPORT"); const [description, setDescription] = useState(""); const [lastResult, setLastResult] = useState<AnyRecord | null>(null);
  const mutation = useMutation({ mutationFn: () => api.post(`/support/customers/${encodeURIComponent(customerId.trim())}/support-operations`, { operationType, description: description.trim() }), onSuccess: (response) => { const result = payload<AnyRecord>(response); setLastResult(result); setDescription(""); toast.success("Support operation audit trail-এ রেকর্ড হয়েছে।"); }, onError: (error) => toast.error(errorText(error)) });
  const queryClient = useQueryClient();
  return <section className="portal-content sp8-content"><PageHeading title="Support Operations" subtitle="Customer assistance action রেকর্ড করুন। এটি customer account বা transaction পরিবর্তন করে না; audit trail তৈরি করে।"/>
    <div className="sp8-dashboard-grid"><Panel title="Record a support operation" subtitle="শুধু নির্ধারিত operation type এবং description পাঠানো হবে।">
      <form className="sp8-form-grid one" onSubmit={(e) => { e.preventDefault(); if (description.trim().length < 3 || description.trim().length > 1000) { toast.error("Description ৩–১০০০ অক্ষরের মধ্যে হতে হবে।"); return; } mutation.mutate(); }}>
        <Field label="Customer ID (UUID)"><Input required value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer UUID"/></Field>
        <Field label="Operation Type"><Select value={operationType} onChange={(e) => setOperationType(e.target.value)}><option value="ACCOUNT_INQUIRY">Account Inquiry</option><option value="TRANSACTION_INQUIRY">Transaction Inquiry</option><option value="BENEFICIARY_ASSISTANCE">Beneficiary Assistance</option><option value="GENERAL_SUPPORT">General Support</option></Select></Field>
        <Field label="Description" hint={`${description.length}/1000 · কমপক্ষে ৩ অক্ষর`}><textarea className="sp8-input sp8-textarea" required minLength={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Customer কী বিষয়ে সহায়তা চেয়েছেন এবং কী সহায়তা দেওয়া হয়েছে তা লিখুন…"/></Field>
        <div className="sp8-callout"><ShieldCheck size={17}/><span>এই API কেবল SUPPORT audit log তৈরি করে। এটি customer-এর account, beneficiary বা transaction পরিবর্তন করে না।</span></div>
        <button className="sp8-button primary" disabled={mutation.isPending || !customerId.trim() || description.trim().length < 3}><ClipboardList size={15}/>{mutation.isPending ? "Recording…" : "Record Support Operation"}</button>
      </form>
    </Panel>
    <Panel title="Latest operation response" subtitle="সফলভাবে submit হলে API response এখানে দেখানো হবে.">
      {!lastResult ? <Empty>এখনো কোনো operation submit করা হয়নি।</Empty> : <div className="sp8-result"><div className="sp8-result-success"><CheckCircle2 size={19}/><strong>Operation recorded</strong></div><div className="sp8-detail-grid"><div className="sp8-detail-card"><small>Customer</small><strong>{lastResult.customer?.name || "—"}</strong><span>{lastResult.customer?.email || "—"}</span></div><div className="sp8-detail-card"><small>Audit Action</small><strong>{lastResult.supportOperation?.action || "—"}</strong></div><div className="sp8-detail-card"><small>Created</small><strong>{date(lastResult.supportOperation?.createdAt)}</strong></div><div className="sp8-detail-card"><small>Audit Record ID</small><strong className="sp8-break">{lastResult.supportOperation?.id || "—"}</strong></div></div><button className="sp8-button secondary" onClick={() => { void queryClient.invalidateQueries({ queryKey: ["support", "audit-logs"] }); toast.info("Audit log list refreshed when opened."); }}>Audit log recorded <BadgeCheck size={15}/></button></div>}
    </Panel></div>
  </section>;
}

// Page 44 — GET /support/audit-logs and GET /support/audit-logs/:auditLogId
export function SupportAuditLogsPage() {
  const [page, setPage] = useState(1); const [action, setAction] = useState(""); const [entityType, setEntityType] = useState(""); const [selectedId, setSelectedId] = useState("");
  const query = useQuery({ queryKey: ["support", "audit-logs", page, action, entityType], queryFn: () => api.get("/support/audit-logs", { params: { page, limit: 10, ...(action.trim() && { action: action.trim().toUpperCase() }), ...(entityType.trim() && { entityType: entityType.trim() }) } }) });
  const detail = useQuery({ queryKey: ["support", "audit-log", selectedId], enabled: Boolean(selectedId), queryFn: () => api.get(`/support/audit-logs/${encodeURIComponent(selectedId)}`) });
  const result = query.data ? listResult(query.data, ["auditLogs"]) : { rows: [] as AnyRecord[], pagination: undefined };
  const log = detail.data ? (payload<AnyRecord>(detail.data).auditLog ?? payload<AnyRecord>(detail.data)) : null;
  return <section className="portal-content sp8-content"><PageHeading title="Support Audit Logs" subtitle="Support role-এর করা customer assistance activity-এর immutable audit records দেখুন।"/>
    <Panel title="Filter audit records" subtitle="Action filter অবশ্যই SUPPORT_ prefix-সহ হতে হবে।">
      <form className="sp8-form-grid two" onSubmit={(e) => { e.preventDefault(); if (action && !/^SUPPORT_[A-Z0-9_]+$/.test(action.trim().toUpperCase())) { toast.error("Action অবশ্যই SUPPORT_ দিয়ে শুরু হবে এবং A–Z, 0–9 বা underscore ব্যবহার করবে।"); return; } setPage(1); }}><Field label="Action (optional)"><Input value={action} onChange={(e) => setAction(e.target.value.toUpperCase())} placeholder="SUPPORT_CUSTOMER_OPERATION"/></Field><Field label="Entity Type (optional)"><Input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="CUSTOMER"/></Field><div className="sp8-form-action"><button className="sp8-button primary" type="submit"><Filter size={15}/> Apply Filters</button><button className="sp8-button secondary" type="button" onClick={() => { setAction(""); setEntityType(""); setPage(1); }}>Clear</button></div></form>
    </Panel>
    <Panel title="Audit Trail" subtitle="GET /support/audit-logs · page/limit pagination">{query.isLoading ? <Loading/> : query.isError ? <ErrorState error={query.error} retry={() => void query.refetch()}/> : result.rows.length === 0 ? <Empty>কোনো Support audit log পাওয়া যায়নি।</Empty> : <><div className="sp8-table-wrap"><table className="sp8-table"><thead><tr><th>Action / Description</th><th>Support Agent</th><th>Entity</th><th>Result</th><th>Timestamp</th><th>Details</th></tr></thead><tbody>{result.rows.map((row) => <tr key={row.id}><td><strong>{row.action}</strong><small>{row.description || "—"}</small></td><td>{row.user?.name || "—"}<small>{row.user?.email || "—"}</small></td><td>{row.entityType}<small>{row.entityId || "—"}</small></td><td><StatusPill value={row.success}/></td><td>{date(row.createdAt)}</td><td><button className="sp8-button secondary" onClick={() => setSelectedId(row.id)}>View</button></td></tr>)}</tbody></table></div><Pagination page={result.pagination?.page ?? page} pages={result.pagination?.totalPages ?? 1} onChange={setPage}/></>}</Panel>
    {selectedId && <Panel title="Audit Record Details" subtitle={`Record ID: ${selectedId}`}><div className="sp8-detail-toolbar"><span>GET /support/audit-logs/:auditLogId</span><button className="sp8-button secondary" onClick={() => setSelectedId("")}>Close details</button></div>{detail.isLoading ? <Loading/> : detail.isError ? <ErrorState error={detail.error} retry={() => void detail.refetch()}/> : log ? <><div className="sp8-detail-grid"><div className="sp8-detail-card"><small>Action</small><strong>{log.action}</strong></div><div className="sp8-detail-card"><small>Entity</small><strong>{log.entityType}</strong><span>{log.entityId || "—"}</span></div><div className="sp8-detail-card"><small>Support User</small><strong>{log.user?.name || "—"}</strong><span>{log.user?.email || "—"}</span></div><div className="sp8-detail-card"><small>Result</small><strong><StatusPill value={log.success}/></strong><span>{log.failureReason || "No failure reason"}</span></div><div className="sp8-detail-card"><small>IP Address</small><strong>{log.ipAddress || "—"}</strong></div><div className="sp8-detail-card"><small>Request ID</small><strong className="sp8-break">{log.requestId || "—"}</strong></div><div className="sp8-detail-card"><small>Created</small><strong>{date(log.createdAt)}</strong></div><div className="sp8-detail-card"><small>User Agent</small><strong className="sp8-break">{log.userAgent || "—"}</strong></div></div><div className="sp8-json-block"><strong>Metadata</strong><pre>{JSON.stringify(log.metadata ?? null, null, 2)}</pre></div></> : <Empty/>}</Panel>}
  </section>;
}
