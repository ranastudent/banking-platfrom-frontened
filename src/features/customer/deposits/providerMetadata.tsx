import { Building2, CreditCard, Wallet, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import type { DepositMethod, DepositProvider } from "./depositApi";

export const depositProviderLabel = (provider: DepositProvider, method?: DepositMethod): string => {
  if (method?.displayName) return method.displayName;
  const labels: Record<string, string> = {
    BKASH: "bKash",
    NAGAD: "Nagad",
    ROCKET: "Rocket",
    STRIPE: "Card (Visa / Mastercard)",
    WISE: "Wise",
    PAYPAL: "PayPal",
    PAYONEER: "Payoneer",
  };
  return labels[provider] ?? provider;
};

export const depositProviderIcon = (provider: DepositProvider, method?: DepositMethod): ReactNode => {
  const category = method?.category;
  if (category === "CARD" || provider === "STRIPE") return <CreditCard />;
  if (category === "INTERNATIONAL_PAYMENT" || ["WISE", "PAYPAL", "PAYONEER"].includes(provider)) return <Wallet />;
  if (provider === "BANK_TRANSFER") return <Building2 />;
  return <Smartphone />;
};

export const depositProviderMethods = (methods: DepositMethod[] = []): DepositMethod[] => {
  const order = ["BKASH", "NAGAD", "ROCKET", "STRIPE", "WISE", "PAYPAL", "PAYONEER"];
  return [...methods].sort((a, b) => {
    const ai = order.indexOf(a.provider);
    const bi = order.indexOf(b.provider);
    return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
  });
};
