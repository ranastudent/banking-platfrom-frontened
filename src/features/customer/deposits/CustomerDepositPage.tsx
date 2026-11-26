import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowRight, BadgeCheck, Building2, CheckCircle2, CreditCard, Download, ExternalLink, FileText, Loader2, RefreshCw, ShieldCheck, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../lib/api/apiClient";
import { unwrapApiData } from "../../../lib/api/apiTypes";
import { depositApi, type DepositItem } from "./depositApi";
import { depositProviderIcon, depositProviderLabel, depositProviderMethods } from "./providerMetadata";
import type { CustomerAccount, CustomerAccountListResponse } from "../customer.types";

const unwrap = <T,>(r: unknown) => unwrapApiData<T>(r);
const finalStatuses = new Set(["SETTLED","FAILED","EXPIRED","CANCELLED","REVERSED"]);
const canCancel = (s: string) => ["INITIATED","PAYMENT_PENDING"].includes(s);
const money = (v: string | number | undefined, currency = "BDT") => {
  const n = Number(v); if (!Number.isFinite(n)) return "—";
  try { return new Intl.NumberFormat(undefined,{style:"currency",currency,maximumFractionDigits:2}).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
};
const dateText = (v?: string | null) => v ? new Date(v).toLocaleString() : "—";
const errorText = (e: any) => e?.response?.data?.error?.message ?? e?.response?.data?.message ?? e?.message ?? "Request failed. Please try again.";
const providerNames: Record<string,string> = { BKASH:"bKash", NAGAD:"Nagad", ROCKET:"Rocket", STRIPE:"Card (Visa / Mastercard)", WISE:"Wise", PAYPAL:"PayPal", PAYONEER:"Payoneer", BANK_TRANSFER:"Bank transfer", CARD:"Card payment" };
const statusLabel = (s: string) => s.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
function DepositStatusBadge({status}:{status:string}) {
  const tone = status==="SETTLED"||status==="CONFIRMED"?"success":["FAILED","EXPIRED","CANCELLED","REVERSED"].includes(status)?"danger":status==="PROCESSING"?"info":"warning";
  return <span className={`dep-status dep-${tone}`}>{statusLabel(status)}</span>;
}
function DepositNotice({kind="info",children}:{kind?:"info"|"warning"|"success";children:ReactNode}) {
  return <div className={`dep-notice dep-notice-${kind}`} role="status">{children}</div>;
}
function makeReceipt(deposit: DepositItem) {
  const content = [
    "BANKING PLATFORM — DEPOSIT RECEIPT",
    "----------------------------------",
    `Deposit ID: ${deposit.id}`,
    `Provider: ${providerNames[deposit.provider] ?? deposit.provider}`,
    `Status: ${deposit.status}`,
    `Amount: ${money(deposit.amount,deposit.currencyCode)}`,
    `Fee: ${money(deposit.fee,deposit.currencyCode)}`,
    `Net credit: ${money(deposit.netAmount,deposit.currencyCode)}`,
    `Provider reference: ${deposit.providerReference ?? "—"}`,
    `Created: ${dateText(deposit.createdAt)}`,
    `Settled: ${dateText(deposit.settledAt)}`,
    "",
    "This receipt reflects the backend deposit record. A pending request is not a completed credit.",
  ].join("\\n");
  const blob = new Blob([content],{type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href=url; a.download=`deposit-receipt-${deposit.id}.txt`; a.click(); URL.revokeObjectURL(url);
}

export function CustomerDepositPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { depositId: routeDepositId } = useParams();
  const idemRef = useRef<string>("");
  const resetIdem = () => { idemRef.current = ""; setIdempotencyKey(""); };
  const accountsQ = useQuery<CustomerAccount[]>({queryKey:["customer","accounts"],queryFn:async()=>unwrap<CustomerAccountListResponse>(await api.get("/accounts")).accounts});
  const methodsQ = useQuery({queryKey:["deposits","methods"],queryFn:depositApi.methods});
  const limitsQ = useQuery({queryKey:["deposits","limits"],queryFn:depositApi.limits});
  const [accountId,setAccountId]=useState("");
  const [provider,setProvider]=useState("BKASH");
  const [amount,setAmount]=useState("");
  const [currency,setCurrency]=useState("BDT");
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [,setIdempotencyKey]=useState("");
  const [selectedDepositId,setSelectedDepositId]=useState(routeDepositId??"");
  const [historyStatus,setHistoryStatus]=useState("");
  const [historyProvider,setHistoryProvider]=useState("");
  const [historyCurrency,setHistoryCurrency]=useState("");
  const [historyFrom,setHistoryFrom]=useState("");
  const [historyTo,setHistoryTo]=useState("");
  const [historyPage,setHistoryPage]=useState(1);
  const [demoMode,setDemoMode]=useState(false);
  const [demoReason,setDemoReason]=useState("Development test funding");

  const selectedAccount=accountsQ.data?.find(a=>a.id===accountId);
  const method=methodsQ.data?.methods?.find(m=>m.provider===provider);
  const validAmount=/^\d+(\.\d{1,8})?$/.test(amount)&&Number(amount)>0;
  const limits=limitsQ.data;
  const inRange=validAmount&&(!limits||(Number(amount)>=Number(limits.minimum)&&Number(amount)<=Number(limits.maximum)));
  const quoteQ=useQuery({
    queryKey:["deposits","quote",accountId,provider,amount,currency],
    queryFn:()=>depositApi.quote({accountId,provider,amount,currency}),
    enabled:!demoMode&&Boolean(accountId&&provider&&inRange&&selectedAccount?.status==="ACTIVE"&&method?.enabled),
    staleTime:0,
  });
  const historyQ=useQuery({
    queryKey:["deposits","history",historyPage,historyStatus,historyProvider],
    queryFn:()=>depositApi.list({page:historyPage,limit:100,status:historyStatus||undefined,provider:historyProvider||undefined}),
  });
  const detailQ=useQuery({
    queryKey:["deposits","detail",selectedDepositId],
    queryFn:()=>depositApi.detail(selectedDepositId),
    enabled:Boolean(selectedDepositId),
    refetchInterval:(q)=>{const status=(q.state.data as DepositItem|undefined)?.status;return status&&!finalStatuses.has(status)?5000:false;},
  });
  const createM=useMutation({
    mutationFn:()=>{const key=idemRef.current||crypto.randomUUID();idemRef.current=key;setIdempotencyKey(key);return depositApi.create({accountId,amount,currency,provider},key);},
    onSuccess:async(result)=>{resetIdem();setConfirmOpen(false);openDeposit(result.depositId);toast.success("Deposit request created. Your available balance has not been credited while payment is pending.");await qc.invalidateQueries({queryKey:["deposits","history"]});},
    onError:(e)=>toast.error(errorText(e)),
  });
  const demoM=useMutation({
    mutationFn:()=>{const key=idemRef.current||crypto.randomUUID();idemRef.current=key;setIdempotencyKey(key);return depositApi.demoFunding({accountId,amount,currency,reason:demoReason},key);},
    onSuccess:async(result)=>{resetIdem();setConfirmOpen(false);setDemoMode(false);setAmount("");toast.success("Demo funding recorded separately from external deposits.");await Promise.all([qc.invalidateQueries({queryKey:["deposits","history"]}),qc.invalidateQueries({queryKey:["customer","accounts"]})]);if(result.depositId)setSelectedDepositId(String(result.depositId));},
    onError:(e)=>toast.error(errorText(e)),
  });
  const cancelM=useMutation({mutationFn:(id:string)=>depositApi.cancel(id),onSuccess:async(_,id)=>{toast.success("Deposit request cancelled.");await Promise.all([qc.invalidateQueries({queryKey:["deposits","detail",id]}),qc.invalidateQueries({queryKey:["deposits","history"]})]);},onError:e=>toast.error(errorText(e))});
  const simulateM=useMutation({mutationFn:({id,provider:providerKey,outcome}:{id:string;provider:string;outcome:"success"|"failed"|"cancelled"})=>depositApi.simulate(id,providerKey,outcome),onSuccess:async()=>{toast.success("Virtual provider result submitted. No real payment was made.");await Promise.all([qc.invalidateQueries({queryKey:["deposits","detail",selectedDepositId]}),qc.invalidateQueries({queryKey:["deposits","history"]}),qc.invalidateQueries({queryKey:["customer","accounts"]})]);},onError:e=>toast.error(errorText(e))});
  const canInitiate=demoMode?Boolean(accountsQ.data?.some(a=>a.id===accountId&&a.status==="ACTIVE")&&inRange&&methodsQ.data?.demoFundingEnabled):Boolean(accountId&&method?.enabled&&inRange&&quoteQ.data&&!quoteQ.isError);
  const detail=detailQ.data;
  const detailMethod=methodsQ.data?.methods?.find(m=>m.provider===detail?.provider);
  const openDeposit=(id:string)=>{setSelectedDepositId(id);navigate(`/customer/deposits/${encodeURIComponent(id)}`);};
  const closeDeposit=()=>{setSelectedDepositId("");navigate("/customer/deposit");};
  useEffect(()=>{setSelectedDepositId(routeDepositId??"");},[routeDepositId]);
  const filteredHistoryItems=(historyQ.data?.items??[]).filter(d=>
    (!historyCurrency||d.currencyCode===historyCurrency.toUpperCase())&&
    (!historyFrom||new Date(d.createdAt)>=new Date(`${historyFrom}T00:00:00`))&&
    (!historyTo||new Date(d.createdAt)<=new Date(`${historyTo}T23:59:59`))
  );
  const settledSeen=useRef("");
  useEffect(()=>{if(detail?.status==="SETTLED"&&settledSeen.current!==detail.id){settledSeen.current=detail.id;void Promise.all([qc.invalidateQueries({queryKey:["customer","accounts"]}),qc.invalidateQueries({queryKey:["customer","transactions"]})]);}},[detail?.id,detail?.status,qc]);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"){setConfirmOpen(false);setSelectedDepositId("");}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);},[]);
  useEffect(()=>{if(!accountId)return;const acc=accountsQ.data?.find(a=>a.id===accountId);if(acc?.balances?.length&&!acc.balances.some(b=>b.currencyCode===currency))setCurrency(acc.balances[0].currencyCode);},[accountId,accountsQ.data,currency]);

  return <section className="portal-content deposit-content">
    <div className="dep-page-heading"><div><p className="eyebrow">CUSTOMER WORKSPACE / PAYMENTS</p><h1>Deposit funds</h1><p className="muted">Start a payment, track verification, and review your deposit history.</p></div><div className="dep-secure-pill"><ShieldCheck size={16}/> Secure deposit workflow</div></div>
    <DepositNotice kind="warning"><strong>Balance safety:</strong> creating a request or seeing “Pending” does not credit your available balance. Credit occurs only after backend payment verification and successful accounting settlement.</DepositNotice>
    <div className="dep-layout">
      <article className="portal-card dep-card">
        <div className="dep-card-title"><div><span className="dep-step">01</span><h2>Choose payment method</h2><p>Select a configured payment provider. Unconfigured options remain unavailable.</p></div><Wallet size={20}/></div>
        {methodsQ.isLoading?<p className="muted">Loading payment methods…</p>:methodsQ.isError?<DepositNotice kind="warning">Payment methods could not be loaded. <button className="dep-inline-btn" onClick={()=>void methodsQ.refetch()}>Retry</button></DepositNotice>:<div className="dep-method-grid">
          {depositProviderMethods(methodsQ.data?.methods??[]).map(m=>{const p=m.provider;const enabled=Boolean(m.enabled);return <button type="button" key={p} className={`dep-method${provider===p&&!demoMode?" selected":""}${!enabled?" unavailable":""}`} disabled={!enabled} onClick={()=>{setProvider(p);setDemoMode(false);resetIdem();}} aria-pressed={provider===p&&!demoMode}><span className={`dep-provider-icon dep-${p.toLowerCase()}`}>{depositProviderIcon(p,m)}</span><span><strong>{depositProviderLabel(p,m)}</strong><small>{enabled?m.status==="MOCK_SIMULATOR"?"Virtual simulator":"Configured": "Unavailable until configured"}</small></span>{provider===p&&!demoMode&&<CheckCircle2 size={17} className="dep-method-check"/>}</button>;})}
          <button type="button" className="dep-method unavailable" disabled><span className="dep-provider-icon"><Building2/></span><span><strong>Bank transfer</strong><small>Coming soon</small></span></button>
          <button type="button" className="dep-method unavailable" disabled><span className="dep-provider-icon"><CreditCard/></span><span><strong>Card payment</strong><small>Coming soon</small></span></button>
        </div>}
        {method&&<div className="dep-provider-message"><strong>{depositProviderLabel(provider,method)}</strong><span>{method.message} Processing time varies by provider; a guaranteed estimate is not returned by the current API.</span></div>}
        <div className="dep-divider"/>
        <div className="dep-card-title"><div><span className="dep-step">02</span><h2>Deposit details</h2><p>Choose an active account and enter the amount.</p></div><ArrowDownLeft size={20}/></div>
        <form className="dep-form" onSubmit={e=>{e.preventDefault();if(canInitiate)setConfirmOpen(true);}}>
          <label className="dep-field"><span>Deposit to account</span><select value={accountId} required onChange={e=>{setAccountId(e.target.value);resetIdem();}}><option value="">Select account</option>{(accountsQ.data??[]).map(a=><option key={a.id} value={a.id}>{a.accountNumber} · {a.accountType} · {a.status}</option>)}</select><small>Account number is masked in the summary after selection.</small></label>
          {accountsQ.isLoading&&<p className="muted">Loading your accounts…</p>}{accountsQ.isError&&<DepositNotice kind="warning">Could not load accounts. <button className="dep-inline-btn" onClick={()=>void accountsQ.refetch()}>Retry</button></DepositNotice>}
          {selectedAccount&&<div className="dep-account-summary"><div className="dep-account-icon"><Wallet/></div><div><strong>•••• {selectedAccount.accountNumber.slice(-4)}</strong><span>{selectedAccount.accountType} · {selectedAccount.status}</span></div><div className="dep-account-balances">{(selectedAccount.balances??[]).map(b=><small key={b.currencyCode}>{money(b.availableBalance,b.currencyCode)} available</small>)}</div></div>}
          <div className="dep-field-grid"><label className="dep-field"><span>Currency</span><select value={currency} onChange={e=>{setCurrency(e.target.value);resetIdem();}} disabled={!selectedAccount}><option value="">Choose currency</option>{(selectedAccount?.balances??[]).map(b=><option key={b.currencyCode} value={b.currencyCode}>{b.currencyCode}</option>)}</select></label><label className="dep-field"><span>Amount</span><div className="dep-amount-wrap"><span>{currency}</span><input value={amount} onChange={e=>{setAmount(e.target.value);resetIdem();}} inputMode="decimal" autoComplete="off" placeholder="0.00" aria-describedby="deposit-amount-help"/></div><small id="deposit-amount-help">Minimum {limits?money(limits.minimum,currency):"—"} · Maximum {limits?money(limits.maximum,currency):"—"}</small></label></div>
          <div className="dep-quick-amounts">{[500,1000,2000,5000].map(n=><button key={n} type="button" onClick={()=>{setAmount(String(n));resetIdem();}}>{n.toLocaleString()}</button>)}</div>
          {amount&&!validAmount&&<p className="dep-validation" role="alert">Enter a positive amount with up to 8 decimal places.</p>}
          {amount&&validAmount&&limits&&!inRange&&<p className="dep-validation" role="alert">Amount must be between {limits.minimum} and {limits.maximum} {currency}.</p>}
          {selectedAccount&&selectedAccount.status!=="ACTIVE"&&<p className="dep-validation">This account is {selectedAccount.status.toLowerCase()} and cannot receive deposits.</p>}
          {demoMode&&<label className="dep-field"><span>Demo funding reason</span><input value={demoReason} onChange={e=>setDemoReason(e.target.value)} minLength={3} maxLength={300}/><small>Internal synthetic funding, separate from an external provider payment.</small></label>}
          {!demoMode&&quoteQ.isFetching&&inRange&&<p className="muted dep-quote-loading"><Loader2 size={15}/> Calculating fee and net credit…</p>}
          {!demoMode&&quoteQ.data&&<div className="dep-quote"><div><span>Deposit amount</span><strong>{money(quoteQ.data.amount,currency)}</strong></div><div><span>Fee</span><strong>{money(quoteQ.data.fee,currency)}</strong></div><div><span>Net credited after verified settlement</span><strong className="dep-net">{money(quoteQ.data.netAmount,currency)}</strong></div><div className="dep-quote-total"><span>Total payment</span><strong>{money(Number(quoteQ.data.amount)+Number(quoteQ.data.fee),currency)}</strong></div></div>}
          {quoteQ.isError&&<p className="dep-validation" role="alert">{errorText(quoteQ.error)}</p>}
          <button className="btn btn-primary dep-submit" type="submit" disabled={!canInitiate||createM.isPending||demoM.isPending}>{createM.isPending||demoM.isPending?<><Loader2 size={16} className="dep-spin"/> Creating request…</>:<>Continue to confirmation <ArrowRight size={16}/></>}</button>
        </form>
        {methodsQ.data?.demoFundingEnabled&&<div className="dep-demo-toggle"><div><strong>Development demo funding</strong><small>Synthetic internal credit; not a provider payment.</small></div><button className="btn btn-secondary" onClick={()=>{setDemoMode(v=>!v);resetIdem();}}>{demoMode?"Use external provider":"Open demo funding"}</button></div>}
      </article>
      <aside className="portal-card dep-card dep-side-card">
        <div className="dep-side-head"><span className="dep-side-icon"><ShieldCheck/></span><div><h2>Deposit summary</h2><p>Review before confirming.</p></div></div>
        <div className="dep-summary-lines"><div><span>Method</span><strong>{demoMode?"Demo funding":depositProviderLabel(provider,method)}</strong></div><div><span>Account</span><strong>{selectedAccount?`•••• ${selectedAccount.accountNumber.slice(-4)}`:"Not selected"}</strong></div><div><span>Currency</span><strong>{currency||"—"}</strong></div><div><span>Amount</span><strong>{amount&&validAmount?money(amount,currency):"—"}</strong></div><div><span>Fee</span><strong>{demoMode?"0.00":quoteQ.data?money(quoteQ.data.fee,currency):"—"}</strong></div><div className="dep-summary-total"><span>Net credit</span><strong>{demoMode&&validAmount?money(amount,currency):quoteQ.data?money(quoteQ.data.netAmount,currency):"—"}</strong></div></div>
        <p className="dep-side-foot"><ShieldCheck size={15}/> No client-side balance updates. The backend is the source of truth.</p>
      </aside>
    </div>

    {confirmOpen&&<div className="dep-modal-backdrop" role="presentation"><section className="dep-modal" role="dialog" aria-modal="true" aria-labelledby="dep-confirm-title"><button className="dep-modal-close" aria-label="Close confirmation" onClick={()=>setConfirmOpen(false)}><XCircle size={20}/></button><div className="dep-modal-icon"><ShieldCheck/></div><p className="eyebrow">CONFIRM PAYMENT</p><h2 id="dep-confirm-title">Review your deposit</h2><p className="muted">Confirm the amount and destination before creating the payment request.</p><div className="dep-confirm-rows"><div><span>Payment method</span><strong>{demoMode?"Demo funding":depositProviderLabel(provider,method)}</strong></div><div><span>Account</span><strong>{selectedAccount?.accountNumber}</strong></div><div><span>Amount</span><strong>{money(amount,currency)}</strong></div><div><span>Fee</span><strong>{demoMode?money(0,currency):money(quoteQ.data?.fee,currency)}</strong></div><div><span>Total payment</span><strong>{demoMode?money(amount,currency):money(Number(amount)+Number(quoteQ.data?.fee??0),currency)}</strong></div><div><span>Net credit</span><strong>{demoMode?money(amount,currency):money(quoteQ.data?.netAmount,currency)}</strong></div></div><DepositNotice kind="warning">A deposit is credited only after verified payment settlement. Do not refresh or submit a second request while processing.</DepositNotice><div className="dep-modal-actions"><button className="btn btn-secondary" onClick={()=>setConfirmOpen(false)} disabled={createM.isPending||demoM.isPending}>Go back</button><button className="btn btn-primary" onClick={()=>demoMode?demoM.mutate():createM.mutate()} disabled={createM.isPending||demoM.isPending}>{createM.isPending||demoM.isPending?"Submitting…":"Confirm deposit"}</button></div></section></div>}

    <section className="portal-card dep-history-card">
      <div className="dep-history-heading"><div><p className="eyebrow">ACTIVITY</p><h2>Deposit history</h2><p className="muted">Requests and verified settlement records.</p></div><button className="btn btn-secondary" onClick={()=>void historyQ.refetch()}><RefreshCw size={15}/> Refresh</button></div>
      <div className="dep-filters"><label>Status<select value={historyStatus} onChange={e=>{setHistoryStatus(e.target.value);setHistoryPage(1);}}><option value="">All statuses</option>{["INITIATED","PAYMENT_PENDING","PROCESSING","SETTLED","FAILED","EXPIRED","CANCELLED","REVERSED"].map(s=><option key={s}>{s}</option>)}</select></label><label>Provider<select value={historyProvider} onChange={e=>{setHistoryProvider(e.target.value);setHistoryPage(1);}}><option value="">All providers</option>{depositProviderMethods(methodsQ.data?.methods??[]).map(m=><option key={m.provider} value={m.provider}>{depositProviderLabel(m.provider,m)}</option>)}</select></label><label>Currency<input maxLength={3} value={historyCurrency} onChange={e=>setHistoryCurrency(e.target.value.toUpperCase())} placeholder="BDT"/></label><label>From<input type="date" value={historyFrom} onChange={e=>setHistoryFrom(e.target.value)}/></label><label>To<input type="date" value={historyTo} onChange={e=>setHistoryTo(e.target.value)}/></label></div>
      {historyQ.isLoading?<div className="dep-empty"><Loader2 className="dep-spin"/> Loading deposit history…</div>:historyQ.isError?<DepositNotice kind="warning">{errorText(historyQ.error)} <button className="dep-inline-btn" onClick={()=>void historyQ.refetch()}>Retry</button></DepositNotice>:filteredHistoryItems.length===0?<div className="dep-empty"><FileText size={25}/><strong>No deposits found</strong><span>Your deposit requests will appear here.</span></div>:<div className="dep-table-wrap"><table className="dep-table"><thead><tr><th>Reference</th><th>Provider</th><th>Amount</th><th>Fee</th><th>Status</th><th>Date</th><th/></tr></thead><tbody>{filteredHistoryItems.map(d=><tr key={d.id}><td><button className="dep-ref-btn" onClick={()=>openDeposit(d.id)}>{d.id.slice(0,8).toUpperCase()}…</button><small>{d.providerReference??"No provider reference"}</small></td><td>{providerNames[d.provider]??d.provider}</td><td>{money(d.amount,d.currencyCode)}</td><td>{money(d.fee,d.currencyCode)}</td><td><DepositStatusBadge status={d.status}/></td><td>{dateText(d.createdAt)}</td><td><button className="btn btn-secondary dep-view-btn" onClick={()=>openDeposit(d.id)}>Details</button></td></tr>)}</tbody></table></div>}
      {historyQ.data&&historyQ.data.pagination.totalPages>1&&<div className="dep-pagination"><span>Page {historyPage} of {historyQ.data.pagination.totalPages} · {historyQ.data.pagination.total} records</span><div><button className="btn btn-secondary" disabled={historyPage<=1} onClick={()=>setHistoryPage(p=>p-1)}>Previous</button><button className="btn btn-secondary" disabled={historyPage>=historyQ.data.pagination.totalPages} onClick={()=>setHistoryPage(p=>p+1)}>Next</button></div></div>}
    </section>

    {selectedDepositId&&<div className="dep-modal-backdrop" role="presentation"><section className="dep-modal dep-detail-modal" role="dialog" aria-modal="true" aria-labelledby="dep-detail-title"><button className="dep-modal-close" aria-label="Close deposit details" onClick={closeDeposit}><XCircle size={20}/></button>{detailQ.isLoading?<div className="dep-empty"><Loader2 className="dep-spin"/> Loading deposit…</div>:detailQ.isError?<DepositNotice kind="warning">{errorText(detailQ.error)} <button className="dep-inline-btn" onClick={()=>void detailQ.refetch()}>Retry</button></DepositNotice>:detail&&<><div className="dep-detail-head"><div><p className="eyebrow">DEPOSIT DETAILS</p><h2 id="dep-detail-title">Deposit {detail.id.slice(0,8).toUpperCase()}</h2><p className="muted">{detail.id}</p></div><DepositStatusBadge status={detail.status}/></div><div className="dep-detail-amount">{money(detail.amount,detail.currencyCode)}<small>Net credit {money(detail.netAmount,detail.currencyCode)}</small></div><div className="dep-detail-grid"><div><span>Provider</span><strong>{providerNames[detail.provider]??detail.provider}</strong></div><div><span>Fee</span><strong>{money(detail.fee,detail.currencyCode)}</strong></div><div><span>Provider reference</span><strong>{detail.providerReference??"—"}</strong></div><div><span>Transaction reference</span><strong>{detail.transaction?.reference??"—"}</strong></div><div><span>Created</span><strong>{dateText(detail.createdAt)}</strong></div><div><span>Expires</span><strong>{dateText(detail.expiresAt)}</strong></div><div><span>Settled</span><strong>{dateText(detail.settledAt)}</strong></div></div><div className="dep-timeline"><h3>Status timeline</h3>{[["Request created",detail.createdAt],["Payment pending",detail.status==="INITIATED"?null:detail.updatedAt],["Payment verified",detail.paidAt],["Accounting settlement",detail.settledAt],["Reversed",detail.reversedAt]].map(([label,time])=><div className={`dep-timeline-item${time?" done":""}`} key={String(label)}><span className="dep-timeline-dot"/><div><strong>{String(label)}</strong><small>{dateText(time as string|null)}</small></div></div>)}</div>
        {detail.paymentUrl&&canCancel(detail.status)&&<a className="btn btn-primary dep-action-link" href={detail.paymentUrl} target="_blank" rel="noopener noreferrer" onClick={e=>{try{if(new URL(detail.paymentUrl!).protocol!=="https:")e.preventDefault();}catch{e.preventDefault();}}}>Resume payment <ExternalLink size={15}/></a>}
        {detailMethod?.status==="MOCK_SIMULATOR"&&detail.kind==="EXTERNAL"&&canCancel(detail.status)&&<div className="dep-simulator"><strong>Virtual payment simulator</strong><small>Development only — this does not contact a real provider or move real money.</small><div><button className="btn btn-primary" disabled={simulateM.isPending} onClick={()=>simulateM.mutate({id:detail.id,provider:detail.provider,outcome:"success"})}>Simulate success</button><button className="btn btn-secondary" disabled={simulateM.isPending} onClick={()=>simulateM.mutate({id:detail.id,provider:detail.provider,outcome:"failed"})}>Simulate failure</button></div></div>}
        {canCancel(detail.status)&&<button className="btn btn-secondary dep-action-link" disabled={cancelM.isPending} onClick={()=>{if(confirm("Cancel this unpaid deposit request?"))cancelM.mutate(detail.id);}}>Cancel deposit</button>}
        {["FAILED","EXPIRED"].includes(detail.status)&&<button className="btn btn-primary dep-action-link" onClick={()=>{setAccountId(detail.accountId??"");setProvider(detail.provider);setAmount(detail.amount);setDemoMode(false);closeDeposit();resetIdem();}}>Start a new deposit <ArrowRight size={15}/></button>}
        {detail.status==="SETTLED"&&<DepositNotice kind="success"><BadgeCheck size={16}/> Payment verified and deposit settled. Account balances will refresh from the backend.</DepositNotice>}
        <div className="dep-detail-actions"><button className="btn btn-secondary" onClick={()=>makeReceipt(detail)}><Download size={15}/> Download receipt</button><button className="btn btn-secondary" onClick={()=>void detailQ.refetch()}><RefreshCw size={15}/> Refresh status</button></div></>}
      </section></div>}
  </section>;
}
