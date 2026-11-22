import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api/apiClient";
import {
  AlertCircle, ArrowDownUp, ArrowRight, BadgeCheck, ChevronLeft, ChevronRight,
  CircleDollarSign, ClipboardList, Filter, RefreshCw, Search, ShieldCheck, Wallet, X,
} from "lucide-react";

type Row = Record<string, any>;
type PageMeta = { page?: number; limit?: number; total?: number; totalPages?: number };
type Result = { rows: Row[]; pagination?: PageMeta; raw: Row };

const unwrap = (response: any): Row => {
  let value = response?.data?.data ?? response?.data ?? response ?? {};
  if (value && typeof value === "object" && value.data && !Array.isArray(value.data)) value = value.data;
  return value as Row;
};
const resultOf = (response: any, keys: string[]): Result => {
  const raw = unwrap(response);
  const rows = keys.map((key) => raw?.[key]).find(Array.isArray) ?? (Array.isArray(raw) ? raw : []);
  return { rows, pagination: raw?.pagination, raw };
};
const text = (value: any): string => value === null || value === undefined || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
const date = (value: any): string => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
};
const money = (value: any, currency = "BDT"): string => {
  if (value === null || value === undefined) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${text(value)} ${currency}`;
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
};
const errorMessage = (error: any): string => {
  const status = error?.response?.status;
  if (status === 401) return "সেশন শেষ হয়েছে। আবার লগইন করুন।";
  if (status === 403) return "এই Auditor resource দেখার অনুমতি নেই।";
  if (status === 404) return "রেকর্ড পাওয়া যায়নি।";
  if (status === 429) return "অনেকগুলো request হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  return error?.response?.data?.message ?? error?.response?.data?.error?.message ?? error?.message ?? "ডেটা লোড করা যায়নি।";
};
const paramsFrom = (values: Record<string, string>, page: number, limit = 20) => ({
  page, limit,
  ...Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim() !== "")),
});

function Heading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <div className="aud-heading"><div><p className="eyebrow">AUDIT & COMPLIANCE</p><h1>{title}</h1><p className="muted">{subtitle}</p></div>{action}</div>;
}
function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="portal-card aud-panel"><div className="aud-panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
function State({ kind, message, retry }: { kind: "loading" | "error" | "empty"; message?: string; retry?: () => void }) {
  return <div className={`aud-state aud-${kind}`} role={kind === "loading" ? "status" : "alert"}>
    {kind === "loading" ? <RefreshCw size={18} className="aud-spin"/> : <AlertCircle size={19}/>}
    <span>{message ?? (kind === "loading" ? "তথ্য লোড হচ্ছে…" : kind === "empty" ? "কোনো রেকর্ড পাওয়া যায়নি।" : "ডেটা লোড করা যায়নি।")}</span>
    {retry && <button className="aud-button secondary" onClick={retry}>আবার চেষ্টা করুন</button>}
  </div>;
}
function Badge({ value }: { value: any }) {
  const label = text(value).replaceAll("_", " ");
  const cls = /COMPLETED|APPROVED|ACTIVE|SUCCESS|VERIFIED|RESOLVED/i.test(label) ? "good" :
    /PENDING|PROCESSING|NEEDS_MORE|REVIEW|IN_PROGRESS/i.test(label) ? "warn" :
    /FAILED|REJECTED|BLOCKED|CANCELLED|SUSPENDED/i.test(label) ? "bad" : "neutral";
  return <span className={`aud-badge ${cls}`}>{label}</span>;
}
function Table({ rows, columns, onOpen, empty = "কোনো রেকর্ড পাওয়া যায়নি।" }: {
  rows: Row[]; columns: { key: string; label: string; render?: (row: Row) => ReactNode }[];
  onOpen?: (row: Row) => void; empty?: string;
}) {
  if (!rows.length) return <State kind="empty" message={empty}/>;
  return <div className="aud-table-wrap"><table className="aud-table"><thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}{onOpen && <th>Details</th>}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={row.id ?? row.code ?? row.reference ?? row.requestId ?? index}>
      {columns.map(c => <td key={c.key}>{c.render ? c.render(row) : text(row[c.key])}</td>)}
      {onOpen && <td><button className="aud-icon-action" onClick={() => onOpen(row)} aria-label="View details"><ArrowRight size={16}/></button></td>}
    </tr>)}</tbody></table></div>;
}
function Pager({ pagination, page, setPage }: { pagination?: PageMeta; page: number; setPage: (page: number) => void }) {
  const pages = Math.max(1, pagination?.totalPages ?? 1);
  if (pages <= 1) return <div className="aud-page-meta">{pagination?.total !== undefined ? `${pagination.total} records` : ""}</div>;
  return <div className="aud-pager"><span>পৃষ্ঠা {page} / {pages} · মোট {pagination?.total ?? "—"}টি</span><div>
    <button className="aud-button secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={15}/> আগের</button>
    <button className="aud-button secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>পরের <ChevronRight size={15}/></button>
  </div></div>;
}
function FilterForm({ children, onSubmit, onReset }: { children: ReactNode; onSubmit: (event: FormEvent) => void; onReset: () => void }) {
  return <form className="aud-filters" onSubmit={onSubmit}>{children}<div className="aud-filter-actions"><button className="aud-button primary" type="submit"><Filter size={15}/> Apply filters</button><button className="aud-button secondary" type="button" onClick={onReset}>Reset</button></div></form>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="aud-field"><span>{label}</span>{children}</label>; }
function DetailDrawer({ title, record, loading, error, onClose }: { title: string; record?: Row; loading: boolean; error?: any; onClose: () => void }) {
  return <div className="aud-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="aud-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="aud-drawer-head"><div><p className="eyebrow">RECORD INSPECTION</p><h2>{title}</h2></div><button className="aud-icon-action" onClick={onClose} aria-label="Close details"><X size={18}/></button></div>
      {loading ? <State kind="loading"/> : error ? <State kind="error" message={errorMessage(error)}/> : record ? <div className="aud-detail-grid">
        {Object.entries(record).filter(([key, value]) => !["__v", "passwordHash", "refreshTokens"].includes(key) && value !== undefined).map(([key, value]) =>
          <div className="aud-detail-item" key={key}><small>{key.replace(/([A-Z])/g, " $1").replaceAll("_", " ")}</small>
            <strong>{/At$|Date$/.test(key) ? date(value) : typeof value === "object" ? <pre>{JSON.stringify(value, null, 2)}</pre> : text(value)}</strong></div>)}
      </div> : <State kind="empty"/>}
    </aside>
  </div>;
}
function Stat({ label, value, icon, tone = "blue", note }: { label: string; value: any; icon: ReactNode; tone?: string; note?: string }) {
  return <article className={`portal-card aud-stat ${tone}`}><span className="aud-stat-icon">{icon}</span><small>{label}</small><strong>{text(value)}</strong>{note && <em>{note}</em>}</article>;
}
function useAuditorList(key: string, endpoint: string, params: Record<string, any>, enabled = true, keys: string[] = []) {
  return useQuery({
    queryKey: ["auditor", key, params],
    enabled,
    queryFn: async () => resultOf(await api.get(endpoint, { params }), keys),
    staleTime: 20_000,
  });
}
function useAuditorRecord(key: string, endpoint: string, enabled: boolean) {
  return useQuery({
    queryKey: ["auditor", key, endpoint],
    enabled,
    queryFn: async () => unwrap(await api.get(endpoint)),
  });
}
function useAppliedFilters(initial: Record<string, string> = {}) {
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const update = (key: string, value: string) => setDraft(old => ({ ...old, [key]: value }));
  const apply = (event: FormEvent) => { event.preventDefault(); setFilters(draft); };
  const reset = () => { setDraft(initial); setFilters(initial); };
  return { draft, filters, update, apply, reset };
}

export function AuditorDashboardPage() {
  const logs = useAuditorList("dashboard-logs", "/auditor/audit-logs", { page: 1, limit: 6 }, true, ["auditLogs"]);
  const txns = useAuditorList("dashboard-transactions", "/auditor/transactions", { page: 1, limit: 6 }, true, ["transactions"]);
  const approvals = useAuditorList("dashboard-approvals", "/auditor/approvals", { page: 1, limit: 6 }, true, ["approvalRecords"]);
  const fx = useAuditorList("dashboard-fx", "/auditor/fx-requests", { page: 1, limit: 6 }, true, ["fxRequests"]);
  const loading = logs.isLoading || txns.isLoading || approvals.isLoading || fx.isLoading;
  const error = logs.error || txns.error || approvals.error || fx.error;
  const recentLogs = logs.data?.rows ?? [];
  const recentTxns = txns.data?.rows ?? [];
  const recentApprovals = approvals.data?.rows ?? [];
  const recentFx = fx.data?.rows ?? [];
  return <section className="portal-content aud-content">
    <Heading title="Auditor Dashboard" subtitle="Read-only overview of audit activity, transaction history, approval decisions and FX requests." action={<span className="aud-readonly"><ShieldCheck size={15}/> Read-only workspace</span>}/>
    <div className="aud-stat-grid">
      <Stat label="Audit log records" value={logs.data?.pagination?.total ?? "—"} icon={<ClipboardList/>} note="Total matching records"/>
      <Stat label="Transactions" value={txns.data?.pagination?.total ?? "—"} icon={<ArrowDownUp/>} tone="green" note="Total matching records"/>
      <Stat label="Approval records" value={approvals.data?.pagination?.total ?? "—"} icon={<BadgeCheck/>} tone="purple" note="Total matching records"/>
      <Stat label="FX requests" value={fx.data?.pagination?.total ?? "—"} icon={<CircleDollarSign/>} tone="orange" note="Total matching records"/>
    </div>
    {loading && <State kind="loading" message="Auditor overview data is loading…"/>}
    {error && <State kind="error" message={errorMessage(error)} retry={() => { void logs.refetch(); void txns.refetch(); void approvals.refetch(); void fx.refetch(); }}/>}
    <div className="aud-dashboard-grid">
      <Panel title="Recent audit activity" subtitle="Latest records returned by the audit-log endpoint" action={<Link className="aud-text-link" to="/auditor/audit-logs">View all <ArrowRight size={14}/></Link>}>
        <Table rows={recentLogs.slice(0, 5)} columns={[
          { key: "action", label: "Action" }, { key: "entityType", label: "Entity" },
          { key: "user", label: "User", render: r => text(r.user?.name ?? r.user?.email) },
          { key: "createdAt", label: "Date", render: r => date(r.createdAt) },
          { key: "success", label: "Result", render: r => <Badge value={r.success ? "SUCCESS" : "FAILED"}/> },
        ]}/>
      </Panel>
      <Panel title="Transaction review snapshot" subtitle="Latest transaction records" action={<Link className="aud-text-link" to="/auditor/transactions">View all <ArrowRight size={14}/></Link>}>
        <Table rows={recentTxns.slice(0, 5)} columns={[
          { key: "reference", label: "Reference" }, { key: "type", label: "Type" },
          { key: "amount", label: "Amount", render: r => money(r.amount, r.currencyCode) },
          { key: "status", label: "Status", render: r => <Badge value={r.status}/> },
        ]}/>
      </Panel>
      <Panel title="Recent approval decisions" subtitle="Read-only approval records" action={<Link className="aud-text-link" to="/auditor/approvals">View all <ArrowRight size={14}/></Link>}>
        <Table rows={recentApprovals.slice(0, 5)} columns={[
          { key: "decision", label: "Decision", render: r => <Badge value={r.decision}/> },
          { key: "reviewer", label: "Reviewer", render: r => text(r.reviewer?.name) },
          { key: "requestId", label: "Request ID" }, { key: "createdAt", label: "Date", render: r => date(r.createdAt) },
        ]}/>
      </Panel>
      <Panel title="Recent FX requests" subtitle="Foreign currency request history" action={<Link className="aud-text-link" to="/auditor/fx-requests">View all <ArrowRight size={14}/></Link>}>
        <Table rows={recentFx.slice(0, 5)} columns={[
          { key: "user", label: "Customer", render: r => text(r.user?.name ?? r.user?.email) },
          { key: "requestedCurrency", label: "Currency" },
          { key: "requestedAmount", label: "Requested", render: r => money(r.requestedAmount, r.requestedCurrency) },
          { key: "status", label: "Status", render: r => <Badge value={r.status}/> },
        ]}/>
      </Panel>
    </div>
  </section>;
}

export function AuditorAuditLogsPage() {
  const [page, setPage] = useState(1);
  const f = useAppliedFilters({ action: "", entityType: "", userId: "" });
  const params = useMemo(() => paramsFrom(f.filters, page), [f.filters, page]);
  const query = useAuditorList("audit-logs", "/auditor/audit-logs", params, true, ["auditLogs"]);
  const [selected, setSelected] = useState("");
  const detail = useAuditorRecord("audit-log-detail", `/auditor/audit-logs/${selected}`, !!selected);
  return <section className="portal-content aud-content">
    <Heading title="Audit Logs" subtitle="Inspect immutable audit records, actors, entity references and request metadata."/>
    <Panel title="Audit log register" subtitle="Filter by exact action, entity type or user UUID.">
      <FilterForm onSubmit={e => { f.apply(e); setPage(1); }} onReset={() => { f.reset(); setPage(1); }}>
        <Field label="Action"><input value={f.draft.action} onChange={e => f.update("action", e.target.value)} placeholder="e.g. USER_LOGIN"/></Field>
        <Field label="Entity type"><input value={f.draft.entityType} onChange={e => f.update("entityType", e.target.value)} placeholder="e.g. TRANSACTION"/></Field>
        <Field label="User ID (UUID)"><input value={f.draft.userId} onChange={e => f.update("userId", e.target.value)} placeholder="User UUID"/></Field>
      </FilterForm>
      {query.isLoading ? <State kind="loading"/> : query.error ? <State kind="error" message={errorMessage(query.error)} retry={() => void query.refetch()}/> :
        <Table rows={query.data?.rows ?? []} onOpen={r => setSelected(String(r.id))} columns={[
          { key: "createdAt", label: "Timestamp", render: r => date(r.createdAt) },
          { key: "action", label: "Action" }, { key: "entityType", label: "Entity" },
          { key: "entityId", label: "Entity ID" }, { key: "user", label: "Actor", render: r => <><strong>{text(r.user?.name)}</strong><small className="aud-subline">{text(r.user?.email)}</small></> },
          { key: "success", label: "Result", render: r => <Badge value={r.success ? "SUCCESS" : "FAILED"}/> },
        ]}/>}
      <Pager pagination={query.data?.pagination} page={page} setPage={setPage}/>
    </Panel>
    {selected && <DetailDrawer title="Audit log detail" record={detail.data?.auditLog ?? detail.data} loading={detail.isLoading} error={detail.error} onClose={() => setSelected("")}/>}
  </section>;
}

export function AuditorTransactionsPage() {
  const [page, setPage] = useState(1);
  const f = useAppliedFilters({ status: "", type: "", provider: "", currencyCode: "", userId: "", sourceAccountId: "", destinationAccountId: "" });
  const params = useMemo(() => paramsFrom(f.filters, page), [f.filters, page]);
  const query = useAuditorList("transactions", "/auditor/transactions", params, true, ["transactions"]);
  const [selected, setSelected] = useState("");
  const detail = useAuditorRecord("transaction-detail", `/auditor/transactions/${selected}`, !!selected);
  return <section className="portal-content aud-content">
    <Heading title="Transaction Review" subtitle="Read-only transaction register with strict backend-supported filters and record inspection."/>
    <Panel title="Transaction register" subtitle="Filter using the exact enum values accepted by the API.">
      <FilterForm onSubmit={e => { f.apply(e); setPage(1); }} onReset={() => { f.reset(); setPage(1); }}>
        <Field label="Status"><select value={f.draft.status} onChange={e => f.update("status", e.target.value)}><option value="">All statuses</option>{["PENDING","PROCESSING","COMPLETED","FAILED","CANCELLED","REFUNDED"].map(v=><option key={v}>{v}</option>)}</select></Field>
        <Field label="Type"><select value={f.draft.type} onChange={e => f.update("type", e.target.value)}><option value="">All types</option>{["DEPOSIT","WITHDRAWAL","INTERNAL_TRANSFER","EXTERNAL_DEPOSIT","EXTERNAL_TRANSFER","FX_CONVERSION","REFUND"].map(v=><option key={v}>{v}</option>)}</select></Field>
        <Field label="Provider"><select value={f.draft.provider} onChange={e => f.update("provider", e.target.value)}><option value="">All providers</option>{["INTERNAL","BKASH","NAGAD","ROCKET","PAYPAL","PAYONEER","WISE"].map(v=><option key={v}>{v}</option>)}</select></Field>
        <Field label="Currency code"><input maxLength={3} value={f.draft.currencyCode} onChange={e => f.update("currencyCode", e.target.value.toUpperCase())} placeholder="BDT"/></Field>
        <Field label="User UUID"><input value={f.draft.userId} onChange={e => f.update("userId", e.target.value)} placeholder="User ID"/></Field>
        <Field label="Source account UUID"><input value={f.draft.sourceAccountId} onChange={e => f.update("sourceAccountId", e.target.value)} placeholder="Account ID"/></Field>
        <Field label="Destination account UUID"><input value={f.draft.destinationAccountId} onChange={e => f.update("destinationAccountId", e.target.value)} placeholder="Account ID"/></Field>
      </FilterForm>
      {query.isLoading ? <State kind="loading"/> : query.error ? <State kind="error" message={errorMessage(query.error)} retry={() => void query.refetch()}/> :
        <Table rows={query.data?.rows ?? []} onOpen={r => setSelected(String(r.id))} columns={[
          { key: "createdAt", label: "Date", render: r => date(r.createdAt) },
          { key: "reference", label: "Reference" }, { key: "type", label: "Type" },
          { key: "amount", label: "Amount", render: r => money(r.amount, r.currencyCode) },
          { key: "provider", label: "Provider" }, { key: "status", label: "Status", render: r => <Badge value={r.status}/> },
        ]}/>}
      <Pager pagination={query.data?.pagination} page={page} setPage={setPage}/>
    </Panel>
    {selected && <DetailDrawer title="Transaction detail" record={detail.data?.transaction ?? detail.data} loading={detail.isLoading} error={detail.error} onClose={() => setSelected("")}/>}
  </section>;
}

export function AuditorAccountActivityPage() {
  const [accountId, setAccountId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [page, setPage] = useState(1);
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submittedId);
  const query = useQuery({
    queryKey: ["auditor", "account-activity", submittedId, page],
    enabled: validId,
    queryFn: async () => unwrap(await api.get(`/auditor/accounts/${submittedId}/activity`, { params: { page, limit: 20 } })),
  });
  const account = query.data?.account;
  const activity = query.data?.activity ?? {};
  const transactions = activity.transactions ?? [];
  return <section className="portal-content aud-content">
    <Heading title="Account Activity" subtitle="Review account ownership, currency balances and related transaction history."/>
    <Panel title="Find an account" subtitle="Enter a valid account UUID to retrieve its activity.">
      <form className="aud-lookup" onSubmit={e => { e.preventDefault(); setPage(1); setSubmittedId(accountId.trim()); }}>
        <Field label="Account ID (UUID)"><input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/></Field>
        <button className="aud-button primary" type="submit" disabled={!accountId.trim()}><Search size={15}/> Load account activity</button>
      </form>
      {submittedId && !validId && <p className="aud-inline-error">সঠিক UUID format-এর Account ID দিন।</p>}
      {validId && query.isLoading && <State kind="loading"/>}
      {validId && query.error && <State kind="error" message={errorMessage(query.error)} retry={() => void query.refetch()}/>}
      {validId && account && <>
        <div className="aud-account-summary">
          <div><small>Account number</small><strong>{text(account.accountNumber)}</strong></div>
          <div><small>Account type</small><strong>{text(account.accountType)}</strong></div>
          <div><small>Account status</small><Badge value={account.status}/></div>
          <div><small>Account holder</small><strong>{text(account.user?.name)}</strong><small>{text(account.user?.email)}</small></div>
        </div>
        <div className="aud-balance-grid">{(account.balances ?? []).map((balance: Row) => <article key={balance.id ?? balance.currencyCode}><small>{balance.currency?.name ?? balance.currencyCode}</small><strong>{money(balance.availableBalance, balance.currencyCode)}</strong><span>Locked: {money(balance.lockedBalance, balance.currencyCode)}</span></article>)}</div>
      </>}
    </Panel>
    {validId && account && <Panel title="Account transaction activity" subtitle={`${activity.pagination?.total ?? transactions.length} matching transactions`}>
      <Table rows={transactions} columns={[
        { key: "createdAt", label: "Date", render: r => date(r.createdAt) }, { key: "reference", label: "Reference" },
        { key: "type", label: "Type" }, { key: "amount", label: "Amount", render: r => money(r.amount, r.currencyCode) },
        { key: "status", label: "Status", render: r => <Badge value={r.status}/> },
      ]}/>
      <Pager pagination={activity.pagination} page={page} setPage={setPage}/>
    </Panel>}
  </section>;
}

export function AuditorApprovalsPage() {
  const [page, setPage] = useState(1);
  const f = useAppliedFilters({ decision: "", reviewerId: "", requestId: "" });
  const params = useMemo(() => paramsFrom(f.filters, page), [f.filters, page]);
  const query = useAuditorList("approvals", "/auditor/approvals", params, true, ["approvalRecords"]);
  const [selected, setSelected] = useState("");
  const detail = useAuditorRecord("approval-detail", `/auditor/approvals/${selected}`, !!selected);
  return <section className="portal-content aud-content">
    <Heading title="Approval Records" subtitle="Review historical approval decisions and the linked FX request context. This workspace is read-only."/>
    <Panel title="Approval register" subtitle="Filter by decision, reviewer UUID or request UUID.">
      <FilterForm onSubmit={e => { f.apply(e); setPage(1); }} onReset={() => { f.reset(); setPage(1); }}>
        <Field label="Decision"><select value={f.draft.decision} onChange={e => f.update("decision", e.target.value)}><option value="">All decisions</option>{["APPROVED","REJECTED","NEEDS_MORE_INFORMATION"].map(v=><option key={v}>{v}</option>)}</select></Field>
        <Field label="Reviewer UUID"><input value={f.draft.reviewerId} onChange={e => f.update("reviewerId", e.target.value)} placeholder="Reviewer ID"/></Field>
        <Field label="Request UUID"><input value={f.draft.requestId} onChange={e => f.update("requestId", e.target.value)} placeholder="Request ID"/></Field>
      </FilterForm>
      {query.isLoading ? <State kind="loading"/> : query.error ? <State kind="error" message={errorMessage(query.error)} retry={() => void query.refetch()}/> :
        <Table rows={query.data?.rows ?? []} onOpen={r => setSelected(String(r.id))} columns={[
          { key: "createdAt", label: "Decision date", render: r => date(r.createdAt) },
          { key: "decision", label: "Decision", render: r => <Badge value={r.decision}/> },
          { key: "reviewer", label: "Reviewer", render: r => text(r.reviewer?.name ?? r.reviewer?.email) },
          { key: "requestId", label: "Request ID" }, { key: "comment", label: "Comment" },
        ]}/>}
      <Pager pagination={query.data?.pagination} page={page} setPage={setPage}/>
    </Panel>
    {selected && <DetailDrawer title="Approval record detail" record={detail.data?.approvalRecord ?? detail.data} loading={detail.isLoading} error={detail.error} onClose={() => setSelected("")}/>}
  </section>;
}

export function AuditorFxRequestsPage() {
  const [page, setPage] = useState(1);
  const f = useAppliedFilters({ status: "", userId: "", accountId: "", requestedCurrency: "" });
  const params = useMemo(() => paramsFrom(f.filters, page), [f.filters, page]);
  const query = useAuditorList("fx-requests", "/auditor/fx-requests", params, true, ["fxRequests"]);
  const [selected, setSelected] = useState("");
  const detail = useAuditorRecord("fx-request-detail", `/auditor/fx-requests/${selected}`, !!selected);
  return <section className="portal-content aud-content">
    <Heading title="FX Request Review" subtitle="Inspect foreign-currency requests, applicant information and recorded approval history."/>
    <Panel title="FX request register" subtitle="This page is read-only; approval decisions are handled by authorized roles.">
      <FilterForm onSubmit={e => { f.apply(e); setPage(1); }} onReset={() => { f.reset(); setPage(1); }}>
        <Field label="Status"><select value={f.draft.status} onChange={e => f.update("status", e.target.value)}><option value="">All statuses</option>{["PENDING","APPROVED","REJECTED","NEEDS_MORE_INFORMATION","EXPIRED","CANCELLED"].map(v=><option key={v}>{v}</option>)}</select></Field>
        <Field label="User UUID"><input value={f.draft.userId} onChange={e => f.update("userId", e.target.value)} placeholder="User ID"/></Field>
        <Field label="Account UUID"><input value={f.draft.accountId} onChange={e => f.update("accountId", e.target.value)} placeholder="Account ID"/></Field>
        <Field label="Requested currency"><input maxLength={3} value={f.draft.requestedCurrency} onChange={e => f.update("requestedCurrency", e.target.value.toUpperCase())} placeholder="USD"/></Field>
      </FilterForm>
      {query.isLoading ? <State kind="loading"/> : query.error ? <State kind="error" message={errorMessage(query.error)} retry={() => void query.refetch()}/> :
        <Table rows={query.data?.rows ?? []} onOpen={r => setSelected(String(r.id))} columns={[
          { key: "createdAt", label: "Requested", render: r => date(r.createdAt) },
          { key: "user", label: "Customer", render: r => <><strong>{text(r.user?.name)}</strong><small className="aud-subline">{text(r.user?.email)}</small></> },
          { key: "requestedCurrency", label: "Currency" }, { key: "requestedAmount", label: "Amount", render: r => money(r.requestedAmount, r.requestedCurrency) },
          { key: "purposeCategory", label: "Purpose" }, { key: "status", label: "Status", render: r => <Badge value={r.status}/> },
        ]}/>}
      <Pager pagination={query.data?.pagination} page={page} setPage={setPage}/>
    </Panel>
    {selected && <DetailDrawer title="FX request detail" record={detail.data?.fxRequest ?? detail.data} loading={detail.isLoading} error={detail.error} onClose={() => setSelected("")}/>}
  </section>;
}

export function AuditorCurrencyReservePage() {
  const currencies = useQuery({ queryKey: ["auditor", "currencies"], queryFn: async () => resultOf(await api.get("/admin/currencies", { params: { page: 1, limit: 100 } }), ["currencies"]) });
  const reserves = useQuery({ queryKey: ["auditor", "reserves"], queryFn: async () => resultOf(await api.get("/admin/currency-reserves", { params: { page: 1, limit: 100 } }), ["reserves"]) });
  const rates = useQuery({ queryKey: ["auditor", "exchange-rates"], queryFn: async () => resultOf(await api.get("/admin/exchange-rates", { params: { page: 1, limit: 100 } }), ["exchangeRates", "rates"]) });
  const [selectedCode, setSelectedCode] = useState("");
  const reserveDetail = useAuditorRecord("reserve-detail", `/admin/currency-reserves/${selectedCode}`, !!selectedCode);
  const currencyDetail = useAuditorRecord("currency-detail", `/admin/currencies/${selectedCode}`, !!selectedCode);
  const allLoading = currencies.isLoading || reserves.isLoading || rates.isLoading;
  const error = currencies.error || reserves.error || rates.error;
  const reserveRows = reserves.data?.rows ?? [];
  const currencyRows = currencies.data?.rows ?? [];
  const rateRows = rates.data?.rows ?? [];
  const merged = useMemo(() => {
    const map = new Map<string, Row>();
    for (const item of currencyRows) map.set(String(item.code), { ...item });
    for (const item of reserveRows) {
      const code = String(item.currencyCode ?? item.code ?? item.currency?.code ?? "");
      map.set(code, { ...(map.get(code) ?? {}), ...item, code });
    }
    return Array.from(map.values());
  }, [currencyRows, reserveRows]);
  return <section className="portal-content aud-content">
    <Heading title="Currency & Reserve Review" subtitle="Read-only oversight of supported currencies, reserve positions and published exchange rates." action={<span className="aud-readonly"><ShieldCheck size={15}/> Read-only</span>}/>
    <div className="aud-stat-grid aud-stat-grid-three">
      <Stat label="Currencies returned" value={currencies.data?.pagination?.total ?? currencyRows.length} icon={<CircleDollarSign/>}/>
      <Stat label="Reserve records returned" value={reserves.data?.pagination?.total ?? reserveRows.length} icon={<Wallet/>} tone="green"/>
      <Stat label="Exchange rates returned" value={rates.data?.pagination?.total ?? rateRows.length} icon={<ArrowDownUp/>} tone="purple"/>
    </div>
    {allLoading && <State kind="loading" message="Currency, reserve and exchange-rate data loading…"/>}
    {error && <State kind="error" message={errorMessage(error)} retry={() => { void currencies.refetch(); void reserves.refetch(); void rates.refetch(); }}/>}
    <div className="aud-dashboard-grid aud-currency-grid">
      <Panel title="Currency register" subtitle="Currency configuration available to the Auditor role.">
        <Table rows={merged} onOpen={r => setSelectedCode(String(r.code))} columns={[
          { key: "code", label: "Code" }, { key: "name", label: "Currency" }, { key: "symbol", label: "Symbol" },
          { key: "decimalPlaces", label: "Decimals" }, { key: "isActive", label: "Status", render: r => <Badge value={r.isActive ? "ACTIVE" : "INACTIVE"}/> },
        ]}/>
      </Panel>
      <Panel title="Latest exchange rates" subtitle="Read-only exchange-rate records.">
        <Table rows={rateRows.slice(0, 12)} columns={[
          { key: "baseCurrency", label: "Base" }, { key: "quoteCurrency", label: "Quote" },
          { key: "rate", label: "Rate" }, { key: "buyRate", label: "Buy" },
          { key: "sellRate", label: "Sell" }, { key: "status", label: "Status", render: r => <Badge value={r.status}/> },
        ]}/>
      </Panel>
    </div>
    <Panel title="Currency reserve positions" subtitle="Select a currency to inspect its reserve detail.">
      <Table rows={reserveRows} onOpen={r => setSelectedCode(String(r.currencyCode ?? r.code ?? r.currency?.code ?? ""))} columns={[
        { key: "currencyCode", label: "Currency", render: r => text(r.currencyCode ?? r.code ?? r.currency?.code) },
        { key: "availableReserve", label: "Available reserve", render: r => money(r.availableReserve, r.currencyCode ?? r.code) },
        { key: "lockedReserve", label: "Locked reserve", render: r => money(r.lockedReserve, r.currencyCode ?? r.code) },
        { key: "minimumReserve", label: "Minimum reserve", render: r => money(r.minimumReserve, r.currencyCode ?? r.code) },
        { key: "updatedAt", label: "Last updated", render: r => date(r.updatedAt) },
      ]}/>
    </Panel>
    {selectedCode && <DetailDrawer title={`${selectedCode} currency & reserve`} record={{
      currency: currencyDetail.data?.currency ?? currencyDetail.data,
      reserve: reserveDetail.data?.reserve ?? reserveDetail.data,
    }} loading={currencyDetail.isLoading || reserveDetail.isLoading} error={currencyDetail.error || reserveDetail.error} onClose={() => setSelectedCode("")}/>}
  </section>;
}
