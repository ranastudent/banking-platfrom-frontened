export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED" | string;
export type AccountType = "SAVINGS" | "CURRENT" | "FOREIGN_CURRENCY" | string;

export type AccountBalance = {
  id: string;
  currencyCode: string;
  availableBalance: string | number;
  lockedBalance: string | number;
  updatedAt?: string;
  currency?: { code: string; name: string; symbol: string; decimalPlaces: number };
};

export type CustomerAccount = {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: AccountType;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
  balances: AccountBalance[];
};

export type CreateAccountPayload = {
  accountType: "SAVINGS" | "CURRENT" | "FOREIGN_CURRENCY";
  currency: string;
};
