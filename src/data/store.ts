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

export type Store = {
  customers: Map<string, Customer>;
  merchants: Map<string, Merchant>;
};

export function createStore(): Store {
  return {
    customers: new Map(seedCustomers.map((customer) => [customer.id, { ...customer }])),
    merchants: new Map(seedMerchants.map((merchant) => [merchant.id, { ...merchant }])),
  };
}
