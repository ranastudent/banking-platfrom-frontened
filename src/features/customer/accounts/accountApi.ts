import { api } from "../../../lib/api/apiClient";
import type { CustomerAccount, CreateAccountPayload } from "./account.types";

type ApiEnvelope<T> = { success: boolean; data: T; requestId?: string };

export const accountApi = {
  async list(): Promise<CustomerAccount[]> {
    const { data } = await api.get<ApiEnvelope<{ accounts: CustomerAccount[] }>>("/accounts");
    return data.data.accounts;
  },
  async getById(accountId: string): Promise<CustomerAccount> {
    const { data } = await api.get<ApiEnvelope<{ account: CustomerAccount }>>(`/accounts/${encodeURIComponent(accountId)}`);
    return data.data.account;
  },
  async create(payload: CreateAccountPayload): Promise<CustomerAccount> {
    const { data } = await api.post<ApiEnvelope<{ account: CustomerAccount }>>("/accounts", payload);
    return data.data.account;
  },
};
