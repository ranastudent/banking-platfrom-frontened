import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api/apiClient";
import { unwrapApiData } from "../../../lib/api/apiTypes";
import type {
  CustomerAccount,
  CustomerBeneficiary,
  CustomerTransaction,
  CustomerAccountListResponse,
  CustomerTransactionListResponse,
  CustomerBeneficiaryListResponse,
  CreateInternalTransferRequest,
  TransferResponseData,
  CustomerNotificationListResponse,
  CustomerProfile,
  CustomerDecisionExplanation,
  CustomerFxRequest,
} from "../customer.types";
import { useAuth } from "../../../app/providers/AuthProvider";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Bell, Check, ChevronLeft, CircleAlert, CreditCard, RefreshCw, Search, ShieldCheck, UserRound, Wallet } from "lucide-react";

import type { ReactNode } from "react";
type AnyRecord = Record<string, any>;
type Account = CustomerAccount;
type Tx = CustomerTransaction;
const unwrap = <T = AnyRecord>(response: unknown): T => unwrapApiData<T>(response);
const money = (value:any, currency="BDT") => {
  const n=Number(value); if(!Number.isFinite(n)) return "—";
  try { return new Intl.NumberFormat(undefined,{style:"currency",currency,maximumFractionDigits:2}).format(n); } catch { return `${currency} ${n.toFixed(2)}`; }
};
const date = (v:any) => v ? new Date(v).toLocaleString() : "—";
const errorMessage = (e:any) => e?.response?.data?.error?.message ?? e?.response?.data?.message ?? e?.message ?? "Something went wrong. Please try again.";
function PageHeading({title,subtitle,action}:{title:string;subtitle:string;action?:ReactNode}) { return <div className="p6-heading"><div><p className="eyebrow">CUSTOMER WORKSPACE</p><h1>{title}</h1><p className="muted">{subtitle}</p></div>{action}</div>; }
function State({kind="loading",message, retry}:{kind?:"loading"|"empty"|"error"|"denied";message?:string;retry?:()=>void}) { return <div className={`p6-state p6-${kind}`} role={kind==="loading"?"status":"alert"}><span>{kind==="loading"?<RefreshCw size={20}/>:kind==="denied"?<ShieldCheck size={20}/>:<CircleAlert size={20}/>}</span><strong>{message ?? ({loading:"Loading your information…",empty:"Nothing to show yet.",error:"We could not load this information.",denied:"You do not have permission to access this information."}[kind])}</strong>{retry&&<button className="btn btn-secondary" onClick={retry}>Try again</button>}</div>; }
function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ["customer", "accounts"],
    queryFn: async () =>
      unwrap<CustomerAccountListResponse>(await api.get("/accounts")).accounts,
  });
}
function useTransactions(params: AnyRecord = {}) {
  return useQuery<{ rows: Tx[]; pagination: CustomerTransactionListResponse["pagination"] }>({
    queryKey: ["customer", "transactions", params],
    queryFn: async () => {
      const result = unwrap<CustomerTransactionListResponse>(
        await api.get("/transactions", { params: { page: 1, limit: 20, ...params } }),
      );
      return { rows: result.transactions, pagination: result.pagination };
    },
  });
}
function Status({value}:{value?:string}) { const v=value??"UNKNOWN"; return <span className={`p6-status status-${v.toLowerCase()}`}>{v.replaceAll("_"," ")}</span>; }
function TableShell({children}:{children:ReactNode}) { return <div className="p6-table-wrap"><table className="p6-table">{children}</table></div>; }

export function CustomerDashboardPage() {
 const accounts=useAccounts(); const tx=useTransactions({limit:8}); const {user}=useAuth();
 const all=tx.data?.rows??[];
 const balances=useMemo(()=>{const map=new Map<string,number>();(accounts.data??[]).forEach(a=>(a.balances??[]).forEach(b=>map.set(b.currencyCode,(map.get(b.currencyCode)??0)+Number(b.availableBalance))));return [...map.entries()];},[accounts.data]);
 const inflow=all.filter(t=>["DEPOSIT","EXTERNAL_DEPOSIT"].includes(t.type)&&t.status==="COMPLETED");
 const outflow=all.filter(t=>["WITHDRAWAL","INTERNAL_TRANSFER","EXTERNAL_TRANSFER"].includes(t.type)&&t.status==="COMPLETED");
 const sumByCurrency=(items:Tx[])=>{const totals=new Map<string,number>();items.forEach(t=>totals.set(t.currencyCode,(totals.get(t.currencyCode)??0)+Number(t.amount)));return [...totals.entries()].map(([c,v])=>money(v,c)).join(" · ")||"—";};

 return <section className="portal-content p6-content"><PageHeading title={`Welcome${typeof user?.name==="string"?`, ${user.name.split(" ")[0]}`:""}`} subtitle="A live overview of your accounts and recent activity." action={<Link className="btn btn-primary" to="/customer/transfer"><ArrowLeftRight size={16}/> Transfer money</Link>}/>
 <div className="p6-metrics"><article className="portal-card p6-metric"><Wallet/><span>My accounts</span><strong>{accounts.data?.length??"—"}</strong><small>Accounts linked to your profile</small></article><article className="portal-card p6-metric"><ArrowDownLeft/><span>Recent incoming</span><strong>{tx.isLoading?"—":sumByCurrency(inflow)}</strong><small>Completed deposits in returned page</small></article><article className="portal-card p6-metric"><ArrowUpRight/><span>Recent outgoing</span><strong>{tx.isLoading?"—":sumByCurrency(outflow)}</strong><small>Completed withdrawals and transfers in returned page</small></article><article className="portal-card p6-metric"><ArrowLeftRight/><span>Recent transactions</span><strong>{tx.data?.rows.length??"—"}</strong><small>Latest records returned by the API</small></article></div>
 <div className="p6-grid"><article className="portal-card p6-panel"><div className="p6-panel-head"><div><h2>Account balances</h2><p>Available balances grouped by currency</p></div><Link to="/customer/accounts">View accounts →</Link></div>{accounts.isLoading?<State/>:accounts.isError?<State kind="error" message={errorMessage(accounts.error)} retry={()=>void accounts.refetch()}/>:balances.length===0?<State kind="empty" message="No accounts yet. Create an account to get started."/>:<div className="p6-balance-list">{balances.map(([c,v])=><div key={c}><span>{c}</span><strong>{money(v,c)}</strong></div>)}</div>}</article>
 <article className="portal-card p6-panel"><div className="p6-panel-head"><div><h2>Quick actions</h2><p>Available customer actions</p></div></div><div className="p6-actions"><Link to="/customer/accounts"><CreditCard/> Manage accounts</Link><Link to="/customer/deposit"><ArrowDownLeft/> Deposit</Link><Link to="/customer/withdrawal"><ArrowUpRight/> Withdraw</Link><Link to="/customer/beneficiaries"><UserRound/> Beneficiaries</Link></div></article></div>
 <article className="portal-card p6-panel"><div className="p6-panel-head"><div><h2>Recent transactions</h2><p>Latest transactions returned by your account history</p></div><Link to="/customer/transactions">View all →</Link></div>{tx.isLoading?<State/>:tx.isError?<State kind="error" message={errorMessage(tx.error)} retry={()=>void tx.refetch()}/>:all.length===0?<State kind="empty" message="No transactions found."/>:<TableShell><thead><tr><th>Reference</th><th>Type</th><th>Date</th><th>Status</th><th className="align-right">Amount</th></tr></thead><tbody>{all.map(t=><tr key={t.id}><td><Link to={`/customer/transactions/${t.id}`}>{t.reference??t.id.slice(0,10)}</Link></td><td>{t.type.replaceAll("_"," ")}</td><td>{date(t.createdAt)}</td><td><Status value={t.status}/></td><td className="align-right">{money(t.amount,t.currencyCode)}</td></tr>)}</tbody></TableShell>}</article>
 <p className="demo-disclaimer">Dashboard figures are calculated only from API records currently returned. Transaction flow totals reflect the latest page, not a complete statement.</p></section>;
}

export function TransactionsPage() {
 const [filters,setFilters]=useState({type:"",status:"",startDate:"",endDate:"",minAmount:"",maxAmount:""});
 const [page,setPage]=useState(1);
 const params=Object.fromEntries(Object.entries(filters).filter(([,v])=>v!==""));
 const tx=useTransactions({page,limit:20,...params}); const rows=tx.data?.rows??[]; const totalPages=tx.data?.pagination?.totalPages??1;
 return <section className="portal-content p6-content"><PageHeading title="Transactions" subtitle="Search and review transactions associated with your accounts."/>
 <div className="portal-card p6-panel"><div className="p6-filter-grid"><label>Type<select value={filters.type} onChange={e=>setFilters({...filters,type:e.target.value})}><option value="">All types</option>{["DEPOSIT","WITHDRAWAL","INTERNAL_TRANSFER","EXTERNAL_DEPOSIT","EXTERNAL_TRANSFER","FX_CONVERSION","REFUND"].map(x=><option key={x}>{x}</option>)}</select></label><label>Status<select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="">All statuses</option>{["PENDING","PROCESSING","COMPLETED","FAILED","CANCELLED","REFUNDED"].map(x=><option key={x}>{x}</option>)}</select></label><label>From<input type="date" value={filters.startDate} onChange={e=>setFilters({...filters,startDate:e.target.value})}/></label><label>To<input type="date" value={filters.endDate} onChange={e=>setFilters({...filters,endDate:e.target.value})}/></label><label>Min amount<input inputMode="decimal" value={filters.minAmount} onChange={e=>setFilters({...filters,minAmount:e.target.value})}/></label><label>Max amount<input inputMode="decimal" value={filters.maxAmount} onChange={e=>setFilters({...filters,maxAmount:e.target.value})}/></label></div><div className="p6-filter-actions"><button className="btn btn-secondary" onClick={()=>{setFilters({type:"",status:"",startDate:"",endDate:"",minAmount:"",maxAmount:""});setPage(1);}}>Clear filters</button><button className="btn btn-primary" onClick={()=>void tx.refetch()}><Search size={15}/> Apply filters</button></div></div>
 <article className="portal-card p6-panel"><div className="p6-panel-head"><div><h2>Transaction history</h2><p>{tx.data?.pagination?.total??rows.length} records in current result</p></div></div>{tx.isLoading?<State/>:tx.isError?<State kind="error" message={errorMessage(tx.error)} retry={()=>void tx.refetch()}/>:rows.length===0?<State kind="empty" message="No transactions match these filters."/>:<TableShell><thead><tr><th>Reference</th><th>Type</th><th>Created</th><th>Status</th><th>Currency</th><th className="align-right">Amount</th></tr></thead><tbody>{rows.map(t=><tr key={t.id}><td><Link to={`/customer/transactions/${t.id}`}>{t.reference??t.id.slice(0,12)}</Link></td><td>{t.type.replaceAll("_"," ")}</td><td>{date(t.createdAt)}</td><td><Status value={t.status}/></td><td>{t.currencyCode}</td><td className="align-right">{money(t.amount,t.currencyCode)}</td></tr>)}</tbody></TableShell>}<div className="p6-pagination"><span className="muted">Page {page} of {totalPages}</span><div><button className="btn btn-secondary btn-sm" disabled={page<=1||tx.isFetching} onClick={()=>setPage(v=>Math.max(1,v-1))}><ChevronLeft size={14}/> Previous</button><button className="btn btn-secondary btn-sm" disabled={page>=totalPages||tx.isFetching} onClick={()=>setPage(v=>v+1)}>Next <ChevronLeft size={14} style={{transform:"rotate(180deg)"}}/></button></div></div><p className="muted p6-footnote">Offset pagination is used here (page, limit). The API also supports cursor pagination; page and cursor are never combined.</p></article></section>;
}

export function TransactionDetailsPage() {
 const {transactionId=""}=useParams();
 const q=useQuery({queryKey:["transaction",transactionId],queryFn:async()=>unwrap<{transaction: Tx&AnyRecord}>(await api.get(`/transactions/${encodeURIComponent(transactionId)}`)).transaction});
 const accounts=useAccounts();
 if(q.isLoading)return <section className="portal-content"><State/></section>;
 if(q.isError)return <section className="portal-content"><State kind={q.error&&((q.error as any).response?.status===403)?"denied":"error"} message={errorMessage(q.error)} retry={()=>void q.refetch()}/></section>;
 const t=q.data as Tx&AnyRecord;
 const ownedAccounts=accounts.data??[];
 const accountById=new Map(ownedAccounts.map(account=>[account.id,account]));
 const sourceId=String(t.sourceAccountId??t.sourceAccount?.id??"");
 const destinationId=String(t.destinationAccountId??t.destinationAccount?.id??"");
 const isDebit=Boolean(sourceId&&accountById.has(sourceId));
 const isCredit=Boolean(destinationId&&accountById.has(destinationId));
 const direction=isDebit?"DEBIT":isCredit?"CREDIT":"—";
 const signedAmount=isDebit?`−${money(t.amount,t.currencyCode)}`:isCredit?`+${money(t.amount,t.currencyCode)}`:money(t.amount,t.currencyCode);
 const sourceAccountNumber=accountById.get(sourceId)?.accountNumber??t.sourceAccount?.accountNumber;
 const destinationAccountNumber=accountById.get(destinationId)?.accountNumber??t.destinationAccount?.accountNumber;
 return <section className="portal-content p6-content"><PageHeading title="Transaction details" subtitle="Read-only details returned by the transaction API." action={<Link className="btn btn-secondary" to="/customer/transactions"><ChevronLeft size={16}/> Back to transactions</Link>}/><article className="portal-card p6-panel"><div className="p6-detail-amount"><span>{isDebit?"TRANSFER SENT":isCredit?"TRANSFER RECEIVED":t.type?.replaceAll("_"," ")}</span><strong>{signedAmount}</strong><Status value={t.status}/></div><div className="p6-detail-grid">{Object.entries({Reference:t.reference,ID:t.id,Direction:direction,"Sender account":sourceAccountNumber,"Receiver account":destinationAccountNumber,Currency:t.currencyCode,Type:t.type,Status:t.status,Created:date(t.createdAt),Updated:date(t.updatedAt),Description:t.description}).filter(([,v])=>v!==undefined&&v!==null&&v!=="").map(([k,v])=><div key={k}><small>{k}</small><strong>{String(v)}</strong></div>)}</div>{accounts.isError&&<p className="muted">Account labels could not be loaded; signed direction is based on the account information returned by the API.</p>}</article></section>;
}

function MoneyMovementPage({mode}:{mode:"deposit"|"withdrawal"}) {
 const accounts=useAccounts(); const qc=useQueryClient(); const [accountId,setAccountId]=useState(""); const [amount,setAmount]=useState(""); const [currency,setCurrency]=useState("BDT"); const [idem,setIdem]=useState("");
 const selected=accounts.data?.find(a=>a.id===accountId);
 const mutation=useMutation({mutationFn:async()=>{const key=idem||crypto.randomUUID();setIdem(key);return unwrap(await api.post(`/accounts/${accountId}/${mode==="deposit"?"deposits":"withdrawals"}`,{amount,currency:currency.toUpperCase()},{headers:{"Idempotency-Key":key}}));},onSuccess:async()=>{toast.success(`${mode==="deposit"?"Deposit":"Withdrawal"} request completed.`);setAmount("");setIdem("");await Promise.all([qc.invalidateQueries({queryKey:["customer","accounts"]}),qc.invalidateQueries({queryKey:["customer","transactions"]})]);},onError:e=>toast.error(errorMessage(e))});
 return <section className="portal-content p6-content"><PageHeading title={mode==="deposit"?"Deposit funds":"Withdraw funds"} subtitle="Submit a money movement request using the account-scoped backend endpoint."/><div className="p6-form-layout"><article className="portal-card p6-panel"><form className="p6-form" onSubmit={e=>{e.preventDefault();if(!accountId)return;mutation.mutate();}}><label>Account<select required value={accountId} onChange={e=>{const next=accounts.data?.find(a=>a.id===e.target.value);setAccountId(e.target.value);setCurrency(next?.balances?.[0]?.currencyCode??"BDT");setIdem("");}}><option value="">Select an account</option>{(accounts.data??[]).map(a=><option key={a.id} value={a.id}>{a.accountNumber} · {a.accountType} · {a.status}</option>)}</select></label>{accounts.isLoading&&<small>Loading accounts…</small>}{accounts.isError&&<State kind="error" message={errorMessage(accounts.error)} retry={()=>void accounts.refetch()}/>}<label>Amount<input required inputMode="decimal" pattern="^\d+(\.\d{1,8})?$" min="0.00000001" placeholder="0.00" value={amount} onChange={e=>{setAmount(e.target.value);setIdem("");}}/><small>Positive decimal, up to 8 decimal places.</small></label><label>Currency<select required value={currency} onChange={e=>{setCurrency(e.target.value);setIdem("");}}>{(selected?.balances??[]).map(b=><option key={b.currencyCode} value={b.currencyCode}>{b.currencyCode}</option>)}</select><small>Choose a currency balance available on this account.</small></label>{selected&&<div className="p6-info-box">Selected account: <strong>{selected.accountNumber}</strong><br/>Available balance: {(selected.balances??[]).map(x=>`${money(x.availableBalance,x.currencyCode)}`).join(" · ")||"Not returned"}</div>}<div className="p6-info-box"><ShieldCheck size={16}/> This portfolio app uses test data only. Verify the selected account and amount before submitting.</div><button className="btn btn-primary" disabled={mutation.isPending||!accountId||!amount||Number(amount)<=0}>{mutation.isPending?"Processing…":mode==="deposit"?"Submit deposit":"Submit withdrawal"}</button>{mutation.isError&&<p className="p6-error-text" role="alert">{errorMessage(mutation.error)}{idem&&" You may retry this exact request with the same idempotency key."}</p>}{mutation.isSuccess&&<div className="p6-success-box"><Check/> {mutation.data?.message??"Request completed"}{mutation.data?.transaction?.id&&<div>Transaction ID: {mutation.data.transaction.id}</div>}</div>}</form></article><aside className="portal-card p6-panel"><h2>How it works</h2><ol className="p6-steps"><li>Choose one of your accounts.</li><li>Enter a positive amount and the account currency.</li><li>Confirm and submit once.</li><li>Review the returned transaction reference and updated balance.</li></ol><p className="muted">The client sends an Idempotency-Key. If a network timeout occurs, retry the same request using the same key; do not create a new key for the same intended action.</p></aside></div></section>;
}

export function DepositPage(){return <MoneyMovementPage mode="deposit"/>}
export function WithdrawalPage(){return <MoneyMovementPage mode="withdrawal"/>}

export function TransferPage() {
  const accounts = useAccounts();
  const beneficiaries = useQuery<CustomerBeneficiary[]>({
    queryKey: ["beneficiaries"],
    queryFn: async () =>
      unwrap<CustomerBeneficiaryListResponse>(
        await api.get("/beneficiaries", { params: { page: 1, limit: 100 } }),
      ).beneficiaries,
  });
  const qc = useQueryClient();

  // Canonical API contract: both fields contain customer-facing account numbers.
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [idem, setIdem] = useState("");

  const selectedSender = accounts.data?.find(
    (account) => account.accountNumber === sender,
  );

  const mutation = useMutation<TransferResponseData, Error, void>({
    mutationFn: async () => {
      const key = idem || crypto.randomUUID();
      setIdem(key);

      const payload: CreateInternalTransferRequest = {
        senderAccount: sender,
        receiverAccount: receiver.trim(),
        amount,
        currency: currency.toUpperCase(),
      };

      return unwrap<TransferResponseData>(
        await api.post("/transfers", payload, {
          headers: { "Idempotency-Key": key },
        }),
      );
    },
    onSuccess: async (result) => {
      toast.success(result.message ?? "Transfer request submitted.");
      setAmount("");
      setIdem("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["customer", "accounts"] }),
        qc.invalidateQueries({ queryKey: ["customer", "transactions"] }),
      ]);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <section className="portal-content p6-content">
      <PageHeading
        title="Fund transfer"
        subtitle="Transfer between accounts using customer-facing account numbers."
      />
      <div className="p6-form-layout">
        <article className="portal-card p6-panel">
          <form
            className="p6-form"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <label>
              From account
              <select
                required
                value={sender}
                onChange={(event) => {
                  const nextAccountNumber = event.target.value;
                  const nextAccount = accounts.data?.find(
                    (account) => account.accountNumber === nextAccountNumber,
                  );
                  setSender(nextAccountNumber);
                  setCurrency(nextAccount?.balances?.[0]?.currencyCode ?? "BDT");
                  setIdem("");
                }}
              >
                <option value="">Choose source account</option>
                {(accounts.data ?? []).map((account) => (
                  <option key={account.id} value={account.accountNumber}>
                    {account.accountNumber} · {account.accountType}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Receiver account number
              <input
                required
                inputMode="numeric"
                autoComplete="off"
                value={receiver}
                onChange={(event) => {
                  setReceiver(event.target.value.trim());
                  setIdem("");
                }}
                placeholder="Enter recipient account number"
              />
              <small>
                Enter the recipient’s customer-facing account number. Do not enter
                an internal database ID.
              </small>
            </label>

            {beneficiaries.data?.some(
              (beneficiary) =>
                beneficiary.beneficiaryType === "INTERNAL" &&
                beneficiary.provider === "INTERNAL",
            ) && (
              <label>
                Saved internal beneficiaries
                <select
                  value=""
                  onChange={(event) => {
                    const selected = beneficiaries.data?.find(
                      (beneficiary) => beneficiary.id === event.target.value,
                    );
                    if (selected) {
                      setReceiver(selected.accountReference);
                      setIdem("");
                    }
                  }}
                >
                  <option value="">Choose a saved beneficiary (optional)</option>
                  {beneficiaries.data
                    .filter(
                      (beneficiary) =>
                        beneficiary.beneficiaryType === "INTERNAL" &&
                        beneficiary.provider === "INTERNAL",
                    )
                    .map((beneficiary) => (
                      <option key={beneficiary.id} value={beneficiary.id}>
                        {beneficiary.displayName} · {beneficiary.accountReference}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <label>
              Amount
              <input
                required
                inputMode="decimal"
                pattern="^[0-9]+(\.[0-9]{1,8})?$"
                min="0.00000001"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setIdem("");
                }}
                placeholder="0.00"
              />
            </label>

            <label>
              Currency
              <select
                required
                value={currency}
                onChange={(event) => {
                  setCurrency(event.target.value);
                  setIdem("");
                }}
              >
                {(selectedSender?.balances ?? []).map((balance) => (
                  <option key={balance.currencyCode} value={balance.currencyCode}>
                    {balance.currencyCode}
                  </option>
                ))}
              </select>
            </label>

            <div className="p6-info-box">
              <ShieldCheck size={16} /> Transfers are final financial operations in
              this demo environment. Confirm the recipient account number and
              amount. A transfer placed on risk hold is not a completed money
              movement.
            </div>

            <button
              className="btn btn-primary"
              disabled={
                mutation.isPending ||
                !sender ||
                !receiver ||
                !amount ||
                Number(amount) <= 0
              }
            >
              {mutation.isPending ? "Submitting…" : "Submit transfer"}
            </button>

            {mutation.isError && (
              <p className="p6-error-text" role="alert">
                {errorMessage(mutation.error)}
                {idem && " Retry the same request with the same idempotency key."}
              </p>
            )}

            {mutation.isSuccess && (
              <div className="p6-success-box">
                <Check /> {mutation.data.message}
                {mutation.data.transaction?.id && (
                  <div>Transaction: {mutation.data.transaction.id}</div>
                )}
              </div>
            )}
          </form>
        </article>

        <aside className="portal-card p6-panel">
          <h2>Before you transfer</h2>
          <ul className="p6-steps">
            <li>Sender account must belong to you.</li>
            <li>Enter the recipient’s account number, not a database UUID.</li>
            <li>Currency must be available on both accounts.</li>
            <li>Backend may place a transfer on hold for risk review.</li>
          </ul>
          <p className="muted">
            Canonical API: POST /api/v1/transfers. Both senderAccount and
            receiverAccount are account-number strings. The legacy transaction
            transfer route only authorizes and does not move money.
          </p>
        </aside>
      </div>
    </section>
  );
}

export function BeneficiariesPage() {
 const qc=useQueryClient(); const [editing,setEditing]=useState<AnyRecord|null>(null); const [form,setForm]=useState({beneficiaryType:"INTERNAL",displayName:"",accountReference:"",provider:"INTERNAL",currencyCode:"BDT"});
 const q=useQuery<CustomerBeneficiary[]>({queryKey:["beneficiaries"],queryFn:async()=>unwrap<CustomerBeneficiaryListResponse>(await api.get("/beneficiaries",{params:{page:1,limit:100}})).beneficiaries});
 const save=useMutation({mutationFn:async()=>editing?unwrap(await api.patch(`/beneficiaries/${editing.id}`,{displayName:form.displayName,accountReference:form.accountReference,provider:form.provider,currencyCode:form.currencyCode})):unwrap(await api.post("/beneficiaries",form)),onSuccess:async()=>{toast.success(editing?"Beneficiary updated":"Beneficiary created");setEditing(null);setForm({beneficiaryType:"INTERNAL",displayName:"",accountReference:"",provider:"INTERNAL",currencyCode:"BDT"});await qc.invalidateQueries({queryKey:["beneficiaries"]});},onError:e=>toast.error(errorMessage(e))});
 const del=useMutation({mutationFn:(id:string)=>api.delete(`/beneficiaries/${id}`),onSuccess:async()=>{toast.success("Beneficiary deleted");await qc.invalidateQueries({queryKey:["beneficiaries"]});},onError:e=>toast.error(errorMessage(e))});
 return <section className="portal-content p6-content"><PageHeading title="Beneficiaries" subtitle="Create, update and remove your saved transfer recipients."/><div className="p6-form-layout"><article className="portal-card p6-panel"><h2>{editing?"Edit beneficiary":"Add beneficiary"}</h2><form className="p6-form" onSubmit={e=>{e.preventDefault();save.mutate();}}><label>Type<select value={form.beneficiaryType} onChange={e=>setForm({...form,beneficiaryType:e.target.value})}><option>INTERNAL</option><option>EXTERNAL</option></select></label><label>Display name<input required maxLength={100} value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})}/></label><label>Account reference<input required maxLength={128} value={form.accountReference} onChange={e=>setForm({...form,accountReference:e.target.value})}/></label><label>Provider<select value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})}>{["INTERNAL","BKASH","NAGAD","ROCKET","PAYPAL","PAYONEER","WISE"].map(x=><option key={x}>{x}</option>)}</select></label><label>Currency code<input required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" value={form.currencyCode} onChange={e=>setForm({...form,currencyCode:e.target.value.toUpperCase()})}/></label><div className="p6-form-actions"><button className="btn btn-primary" disabled={save.isPending}>{save.isPending?"Saving…":editing?"Save changes":"Create beneficiary"}</button>{editing&&<button type="button" className="btn btn-secondary" onClick={()=>{setEditing(null);setForm({beneficiaryType:"INTERNAL",displayName:"",accountReference:"",provider:"INTERNAL",currencyCode:"BDT"});}}>Cancel</button>}</div></form></article><article className="portal-card p6-panel"><div className="p6-panel-head"><div><h2>Saved beneficiaries</h2><p>Your saved recipients</p></div></div>{q.isLoading?<State/>:q.isError?<State kind="error" message={errorMessage(q.error)} retry={()=>void q.refetch()}/>:!q.data?.length?<State kind="empty" message="You have not added any beneficiaries yet."/>:<div className="p6-beneficiary-list">{(q.data ?? []).map((b:AnyRecord)=><div className="p6-beneficiary" key={b.id}><div><strong>{b.displayName}</strong><span>{b.accountReference}</span><small>{b.beneficiaryType} · {b.provider??"No provider"} · {b.currencyCode}</small><Status value={b.status}/></div><div className="p6-inline-actions"><button className="btn btn-secondary btn-sm" onClick={()=>{setEditing(b);setForm({beneficiaryType:b.beneficiaryType,displayName:b.displayName,accountReference:b.accountReference,provider:b.provider??"INTERNAL",currencyCode:b.currencyCode});}}>Edit</button><button className="btn btn-danger btn-sm" disabled={del.isPending} onClick={()=>{if(confirm(`Delete beneficiary ${b.displayName}?`))del.mutate(b.id);}}>Delete</button></div></div>)}</div>}</article></div></section>;
}

export function NotificationsPage() {
 const qc=useQueryClient(); const [unread,setUnread]=useState(false);
 const q=useQuery<CustomerNotificationListResponse>({queryKey:["notifications",unread],queryFn:async()=>unwrap<CustomerNotificationListResponse>(await api.get("/notifications",{params:{page:1,limit:50,unreadOnly:String(unread)}}))});
 const mark=useMutation({mutationFn:(id:string)=>api.patch(`/notifications/${id}/read`),onSuccess:()=>{toast.success("Notification marked as read");void qc.invalidateQueries({queryKey:["notifications"]});},onError:e=>toast.error(errorMessage(e))});
 const rows=q.data?.notifications??[];
 return <section className="portal-content p6-content"><PageHeading title="Notifications" subtitle="Review account and security updates." action={<label className="p6-check-filter"><input type="checkbox" checked={unread} onChange={e=>setUnread(e.target.checked)}/> Unread only</label>}/><article className="portal-card p6-panel"><div className="p6-panel-head"><div><h2>Inbox</h2><p>{q.data?.unreadCount??0} unread notifications</p></div></div>{q.isLoading?<State/>:q.isError?<State kind="error" message={errorMessage(q.error)} retry={()=>void q.refetch()}/>:rows.length===0?<State kind="empty" message="You are all caught up."/>:<div className="p6-notification-list">{rows.map((n:AnyRecord)=><div className={`p6-notification ${n.status==="SENT"?"unread":""}`} key={n.id}><span className="p6-notification-icon"><Bell size={18}/></span><div><strong>{n.title}</strong><p>{n.message}</p><small>{date(n.createdAt)} · {n.channel} · {n.status}</small></div>{n.status==="SENT"&&<button className="btn btn-secondary btn-sm" disabled={mark.isPending} onClick={()=>mark.mutate(n.id)}>Mark read</button>}</div>)}</div>}</article></section>;
}

export function ProfilePage() {
 const qc=useQueryClient(); const {refreshUser}=useAuth();
 const q=useQuery<CustomerProfile>({queryKey:["profile"],queryFn:async()=>unwrap<CustomerProfile>(await api.get("/users/me"))});
 const [name,setName]=useState<string|undefined>(undefined); const [phone,setPhone]=useState<string|undefined>(undefined);
 const profile=q.data as AnyRecord|undefined;
 const update=useMutation({mutationFn:async()=>unwrap(await api.patch("/users/me",{...(name!==undefined?{name}:{}),...(phone!==undefined?{phone:phone===""?null:phone}:{})})),onSuccess:async()=>{toast.success("Profile updated");await qc.invalidateQueries({queryKey:["profile"]});setName(undefined);setPhone(undefined);await refreshUser();},onError:e=>toast.error(errorMessage(e))});
 return <section className="portal-content p6-content"><PageHeading title="Profile & settings" subtitle="View your profile and update the fields supported by the backend."/><article className="portal-card p6-panel p6-profile"><div className="p6-profile-avatar"><UserRound size={28}/></div>{q.isLoading?<State/>:q.isError?<State kind="error" message={errorMessage(q.error)} retry={()=>void q.refetch()}/>:<><div className="p6-profile-meta"><h2>{profile?.name??"Customer"}</h2><p>{profile?.email??"—"}</p><Status value={profile?.status}/><small>Role: {profile?.role??"CUSTOMER"}</small></div><form className="p6-form p6-profile-form" onSubmit={e=>{e.preventDefault();update.mutate();}}><label>Name<input required minLength={2} maxLength={100} value={name??profile?.name??""} onChange={e=>setName(e.target.value)}/></label><label>Phone<input minLength={7} maxLength={20} value={phone??profile?.phone??""} onChange={e=>setPhone(e.target.value)}/></label><label>Email<input disabled value={profile?.email??""}/><small>Email changes are not supported by the current backend.</small></label><div className="p6-info-box">Only name and phone can be updated. Password, email and avatar editing endpoints are not present in the supplied backend source.</div><button className="btn btn-primary" disabled={update.isPending}>{update.isPending?"Saving…":"Save profile"}</button></form></>}</article></section>;
}

export function DecisionExplanationsPage() {
 const q=useQuery<CustomerDecisionExplanation[]>({queryKey:["decision-explanations"],queryFn:async()=>unwrap<CustomerDecisionExplanation[]>(await api.get("/customer/decision-explanations/me",{params:{page:1,limit:50}}))});
 const rows=q.data ?? [];
 return <section className="portal-content p6-content"><PageHeading title="Decision explanations" subtitle="Understand security and risk decisions associated with your transactions."/><article className="portal-card p6-panel">{q.isLoading?<State/>:q.isError?<State kind="error" message={errorMessage(q.error)} retry={()=>void q.refetch()}/>:rows.length===0?<State kind="empty" message="There are no decision explanations for your account."/>:<div className="p6-decision-list">{rows.map((d:AnyRecord,i:number)=><div className="p6-decision" key={`${d.publicReference??i}`}><div className="p6-panel-head"><div><h2>{d.customerTitle??"Transaction decision"}</h2><p>{d.publicReference??"Decision record"} · {d.phase??"—"} · {date(d.createdAt)}</p></div><Status value={d.status??d.decision}/></div><p>{d.customerMessage}</p>{Array.isArray(d.reasonCodes)&&<p className="muted">Reason codes: {d.reasonCodes.join(", ")}</p>}{Array.isArray(d.requiredActions)&&<div><strong>Suggested actions</strong><ul>{d.requiredActions.map((a:string)=> <li key={a}>{a}</li>)}</ul></div>}{d.transactionImpact&&<div className="p6-info-box">Transaction status: {d.transactionImpact.transactionStatus??"—"} · Funds movement confirmed: {String(d.transactionImpact.fundsMovementConfirmed??"Not specified")}</div>}</div>)}</div>}</article></section>;
}

export function FxRequestDetailsPage() {
 const {requestId=""}=useParams();
 const q=useQuery<CustomerFxRequest>({queryKey:["fx-request",requestId],queryFn:async()=>unwrap<{fxRequest:CustomerFxRequest}>(await api.get(`/fx-requests/${encodeURIComponent(requestId)}`)).fxRequest});
 if(q.isLoading)return <section className="portal-content"><State/></section>;
 if(q.isError)return <section className="portal-content"><State kind={(q.error as any)?.response?.status===403?"denied":"error"} message={errorMessage(q.error)} retry={()=>void q.refetch()}/></section>;
 const d=q.data as AnyRecord;
 return <section className="portal-content p6-content"><PageHeading title="FX request details" subtitle="Read-only foreign exchange request details."/><article className="portal-card p6-panel"><div className="p6-detail-grid">{Object.entries(d??{}).filter(([,v])=>v===null||["string","number","boolean"].includes(typeof v)).map(([k,v])=><div key={k}><small>{k.replace(/[A-Z]/g,m=>` ${m}`).replace(/^./,m=>m.toUpperCase())}</small><strong>{v===null?"—":String(v)}</strong></div>)}</div>{d?.id&&<p className="muted">Request ID: {d.id}</p>}</article></section>;
}
