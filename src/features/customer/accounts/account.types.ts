import type { CustomerAccount, CustomerAccountBalance } from "../customer.types";

export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED" | string;
export type AccountType = "SAVINGS" | "CURRENT" | "FOREIGN_CURRENCY" | string;

export type AccountBalance = CustomerAccountBalance;
export type { CustomerAccount };

export type CreateAccountPayload = {
  accountType: "SAVINGS" | "CURRENT" | "FOREIGN_CURRENCY";
  currency: string;
};
