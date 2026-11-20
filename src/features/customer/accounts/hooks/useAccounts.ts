import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "../accountApi";
import type { CreateAccountPayload } from "../account.types";

export const accountKeys = {
  all: ["customer", "accounts"] as const,
  detail: (id: string) => ["customer", "accounts", id] as const,
};

export function useAccounts() {
  return useQuery({ queryKey: accountKeys.all, queryFn: accountApi.list, staleTime: 30_000 });
}

export function useAccount(accountId: string) {
  return useQuery({
    queryKey: accountKeys.detail(accountId),
    queryFn: () => accountApi.getById(accountId),
    enabled: Boolean(accountId),
    staleTime: 30_000,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => accountApi.create(payload),
    onSuccess: (account) => {
      queryClient.setQueryData(accountKeys.detail(account.id), account);
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
