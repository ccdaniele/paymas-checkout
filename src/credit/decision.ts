import type { Customer, Store } from "../data/store.js";

export type CustomerStatus = "active" | "delinquent";

export type CreditDecision = {
  customer_id: string;
  status: CustomerStatus;
  credit_limit_cents: number;
  available_cents: number;
  approved: boolean;
};

export function customerStatus(customer: Customer): CustomerStatus {
  return customer.delinquent ? "delinquent" : "active";
}

/** Credit limit minus unpaid installments. Delinquent customers have none available. */
export function availableCents(store: Store, customerId: string): number {
  const customer = store.customers.get(customerId);
  if (customer === undefined || customer.delinquent) return 0;

  let unpaid = 0;
  for (const installment of store.installments.values()) {
    if (installment.customerId === customerId && !installment.paid) {
      unpaid += installment.amountCents;
    }
  }
  return customer.creditLimitCents - unpaid;
}

export function decideCredit(store: Store, customerId: string): CreditDecision {
  const customer = store.customers.get(customerId);
  if (customer === undefined) throw new Error("unknown customer");
  const available = availableCents(store, customer.id);
  return {
    customer_id: customer.id,
    status: customerStatus(customer),
    credit_limit_cents: customer.creditLimitCents,
    available_cents: available,
    approved: available > 0,
  };
}
