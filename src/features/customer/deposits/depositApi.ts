import { api } from "../../../lib/api/apiClient";
import { unwrapApiData } from "../../../lib/api/apiTypes";

export type DepositStatus =
  | "INITIATED" | "PAYMENT_PENDING" | "PROCESSING" | "CONFIRMED" | "SETTLED"
  | "FAILED" | "EXPIRED" | "CANCELLED" | "REVERSED" | string;
export type DepositProvider = "BKASH" | "NAGAD" | "ROCKET" | "WISE" | "PAYPAL" | "PAYONEER" | "STRIPE" | string;

export interface DepositMethod {
  provider: DepositProvider;
  enabled: boolean;
  status: "MOCK_SIMULATOR" | "CONFIGURED" | "INTEGRATION_NOT_CONFIGURED" | string;
  mode?: string;
  message?: string;
  displayName?: string;
  category?: "MOBILE_WALLET" | "CARD" | "INTERNATIONAL_PAYMENT" | string;
  requiresRedirect?: boolean;
}
export interface DepositMethodsResponse {
  externalEnabled: boolean;
  methods: DepositMethod[];
  demoFundingEnabled: boolean;
}
export interface DepositLimits {
  minimum: string;
  maximum: string;
  daily: string;
  monthly: string;
  feeRateBps: number;
  fixedFee: string;
}
export interface DepositQuote {
  accountId: string;
  currency: string;
  provider: DepositProvider;
  amount: string;
  fee: string;
  netAmount: string;
  limits: { minimum: string; maximum: string; daily: string; monthly: string };
}
export interface DepositItem {
  id: string;
  provider: DepositProvider;
  kind?: string;
  amount: string;
  fee: string;
  netAmount: string;
  currencyCode: string;
  status: DepositStatus;
  providerReference?: string | null;
  paymentUrl?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  settledAt?: string | null;
  createdAt: string;
  transactionId?: string | null;
  accountId?: string;
  userId?: string;
  transaction?: { reference?: string; status?: string; [key: string]: unknown };
  providerPayments?: Array<Record<string, unknown>>;
  journalEntries?: Array<Record<string, any>>;
  reconciliationRecords?: Array<Record<string, any>>;
  settlements?: Array<Record<string, any>>;
  [key: string]: unknown;
}
export interface DepositPageResponse {
  items: DepositItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface DepositCreateResponse {
  depositId: string;
  transactionReference?: string;
  provider: DepositProvider;
  status: DepositStatus;
  amount: string;
  fee: string;
  netAmount: string;
  currency: string;
  paymentUrl?: string | null;
  checkoutSessionId?: string | null;
  expiresAt?: string | null;
  [key: string]: unknown;
}
const unwrap = <T,>(response: unknown) => unwrapApiData<T>(response);

export const depositApi = {
  async methods() { return unwrap<DepositMethodsResponse>(await api.get("/deposits/methods")); },
  async limits() { return unwrap<DepositLimits>(await api.get("/deposits/limits")); },
  async quote(payload: { accountId: string; amount: string; currency: string; provider: string }) {
    return unwrap<DepositQuote>(await api.post("/deposits/quote", payload));
  },
  async create(payload: { accountId: string; amount: string; currency: string; provider: string }, idempotencyKey: string) {
    return unwrap<DepositCreateResponse>(await api.post("/deposits", payload, { headers: { "Idempotency-Key": idempotencyKey } }));
  },
  async demoFunding(payload: { accountId: string; amount: string; currency: string; reason?: string }, idempotencyKey: string) {
    return unwrap<Record<string, any>>(await api.post("/deposits/demo", payload, { headers: { "Idempotency-Key": idempotencyKey } }));
  },
  async list(params: Record<string, string | number | undefined>) {
    return unwrap<DepositPageResponse>(await api.get("/deposits", { params }));
  },
  async detail(id: string) { return unwrap<DepositItem>(await api.get(`/deposits/${encodeURIComponent(id)}`)); },
  async cancel(id: string, reason = "Customer cancelled payment") {
    return unwrap<Record<string, any>>(await api.post(`/deposits/${encodeURIComponent(id)}/cancel`, { reason }));
  },
  async simulate(id: string, provider: string, outcome: "success" | "failed" | "cancelled") {
    return unwrap<Record<string, any>>(await api.post(`/deposits/simulator/${provider.toLowerCase()}/${encodeURIComponent(id)}/complete`, { outcome }));
  },
  async adminList(params: Record<string, string | number | undefined>) {
    return unwrap<DepositPageResponse>(await api.get("/admin/deposits", { params }));
  },
  async adminDetail(id: string) { return unwrap<DepositItem>(await api.get(`/admin/deposits/${encodeURIComponent(id)}`)); },
  async reconcile(id: string, payload: { settlementReference: string; providerPaymentId: string; amount: string; currency: string; settledAt?: string; notes?: string }) {
    return unwrap<Record<string, any>>(await api.post(`/admin/deposits/${encodeURIComponent(id)}/reconcile`, payload));
  },
  async reverse(id: string, reason: string) {
    return unwrap<Record<string, any>>(await api.post(`/admin/deposits/${encodeURIComponent(id)}/reverse`, { reason }));
  },
};
