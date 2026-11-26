import { api } from "../../../lib/api/apiClient";
import { unwrapApiData } from "../../../lib/api/apiTypes";
import type { CustomerAccount, CreateAccountPayload } from "./account.types";

export const accountApi = {
  async list(): Promise<CustomerAccount[]> {
    const result = unwrapApiData<{ accounts: CustomerAccount[] }>(await api.get("/accounts"));
    return result.accounts;
  },
  async getById(accountId: string): Promise<CustomerAccount> {
    const result = unwrapApiData<{ account: CustomerAccount }>(
      await api.get(`/accounts/${encodeURIComponent(accountId)}`),
    );
    return result.account;
  },
  async create(payload: CreateAccountPayload): Promise<CustomerAccount> {
    const result = unwrapApiData<{ account: CustomerAccount }>(await api.post("/accounts", payload));
    return result.account;
  },
};
