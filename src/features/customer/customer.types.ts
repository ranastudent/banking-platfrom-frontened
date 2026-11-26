import type { PaginationMeta } from "../../lib/api/apiTypes";

export type CustomerCurrency = {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive?: boolean;
};

export type CustomerAccountBalance = {
  id?: string;
  currencyCode: string;
  availableBalance: string;
  lockedBalance: string;
  updatedAt?: string;
  currency?: CustomerCurrency;
};

export type CustomerAccount = {
  id: string;
  userId?: string;
  accountNumber: string;
  accountType: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  balances: CustomerAccountBalance[];
};

export type CustomerTransaction = {
  id: string;
  reference?: string | null;
  type: string;
  status: string;
  amount: string;
  currencyCode: string;
  createdAt: string;
  updatedAt?: string;
  description?: string | null;
  sourceAccountId?: string | null;
  destinationAccountId?: string | null;
  sourceAccount?: { id: string; accountNumber?: string } | null;
  destinationAccount?: { id: string; accountNumber?: string } | null;
};

export type CustomerBeneficiary = {
  id: string;
  beneficiaryType: string;
  displayName: string;
  accountReference: string;
  provider: string;
  currencyCode: string;
  status?: string;
};

export type CustomerAccountListResponse = { accounts: CustomerAccount[] };
export type CustomerTransactionListResponse = {
  transactions: CustomerTransaction[];
  pagination: PaginationMeta;
};
export type CustomerBeneficiaryListResponse = {
  beneficiaries: CustomerBeneficiary[];
  pagination?: PaginationMeta;
};

export type CreateInternalTransferRequest = {
  /** Customer-facing account number, never the database UUID. */
  senderAccount: string;
  /** Customer-facing account number, never the database UUID. */
  receiverAccount: string;
  amount: string;
  currency: string;
};

export type TransferResponseData = {
  message: string;
  transaction: CustomerTransaction;
  risk?: { decision?: string; score?: number; reasons?: string[] };
};

export type CustomerNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  metadata?: unknown;
  createdAt: string;
  readAt?: string | null;
};

export type CustomerNotificationListResponse = {
  notifications: CustomerNotification[];
  unreadCount: number;
  pagination: PaginationMeta;
};

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

export type CustomerDecisionExplanation = {
  publicReference: string;
  phase: string;
  decision: string;
  status: string;
  customerTitle: string;
  customerMessage: string;
  reasonCodes: string[];
  requiredActions: string[];
  transactionImpact?: unknown;
  decisionAt?: string | null;
  createdAt: string;
};

export type CustomerFxRequest = {
  id: string;
  status: string;
  requestedCurrency?: string;
  createdAt?: string;
  [key: string]: unknown;
};
