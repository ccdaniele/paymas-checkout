import { customers as seedCustomers, merchants as seedMerchants } from "./seed.js";

export type Customer = {
  id: string;
  name: string;
  creditLimitCents: number;
};

export type Merchant = {
  id: string;
  name: string;
};

export type Purchase = {
  id: string;
  customerId: string;
  merchantId: string;
  amountCents: number;
  plan: string;
  createdAt: string;
};

export type Installment = {
  id: string;
  purchaseId: string;
  customerId: string;
  number: number;
  amountCents: number;
  dueDate: string;
  paid: boolean;
};

export type Store = {
  customers: Map<string, Customer>;
  merchants: Map<string, Merchant>;
  purchases: Map<string, Purchase>;
  installments: Map<string, Installment>;
};

export function createStore(): Store {
  return {
    customers: new Map(seedCustomers.map((customer) => [customer.id, { ...customer }])),
    merchants: new Map(seedMerchants.map((merchant) => [merchant.id, { ...merchant }])),
    purchases: new Map(),
    installments: new Map(),
  };
}
