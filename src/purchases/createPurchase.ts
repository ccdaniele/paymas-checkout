import { randomUUID } from "node:crypto";
import { availableCents } from "../credit/decision.js";
import type { Store } from "../data/store.js";
import { isPlanId, type PlanId } from "../installments/plans.js";
import { scheduleInstallments } from "../installments/schedule.js";
import { PurchaseError } from "./errors.js";

export type PurchaseInput = {
  customer_id: string;
  merchant_id: string;
  amount_cents: number;
  plan: PlanId;
};

export type PurchaseResponse = {
  purchase_id: string;
  installments: Array<{
    installment_id: string;
    number: number;
    amount_cents: number;
    due_date: string;
  }>;
};

export function parsePurchaseBody(body: unknown): PurchaseInput {
  if (typeof body !== "object" || body === null) throw new PurchaseError("INVALID_INPUT");
  const record = body as Record<string, unknown>;
  const { customer_id, merchant_id, amount_cents, plan } = record;
  if (typeof customer_id !== "string" || customer_id.length === 0) {
    throw new PurchaseError("INVALID_INPUT");
  }
  if (typeof merchant_id !== "string" || merchant_id.length === 0) {
    throw new PurchaseError("INVALID_INPUT");
  }
  if (typeof amount_cents !== "number" || !Number.isInteger(amount_cents) || amount_cents <= 0) {
    throw new PurchaseError("INVALID_INPUT");
  }
  if (typeof plan !== "string" || !isPlanId(plan)) throw new PurchaseError("INVALID_INPUT");
  return { customer_id, merchant_id, amount_cents, plan };
}

export function createPurchase(store: Store, input: PurchaseInput, purchasedAt = new Date()): PurchaseResponse {
  const customer = store.customers.get(input.customer_id);
  const merchant = store.merchants.get(input.merchant_id);
  if (customer === undefined || merchant === undefined) throw new PurchaseError("INVALID_INPUT");

  if (input.amount_cents > availableCents(store, customer.id)) {
    throw new PurchaseError("INSUFFICIENT_CREDIT");
  }

  const scheduled = scheduleInstallments(input.amount_cents, input.plan, purchasedAt);
  const purchaseId = randomUUID();
  const installments = scheduled.map((installment) => ({
    id: randomUUID(),
    purchaseId,
    customerId: customer.id,
    number: installment.number,
    amountCents: installment.amountCents,
    dueDate: installment.dueDate,
    paid: false,
    paidAt: null,
  }));

  store.purchases.set(purchaseId, {
    id: purchaseId,
    customerId: customer.id,
    merchantId: merchant.id,
    amountCents: input.amount_cents,
    plan: input.plan,
    createdAt: purchasedAt.toISOString(),
  });
  for (const installment of installments) {
    store.installments.set(installment.id, installment);
  }

  return {
    purchase_id: purchaseId,
    installments: installments.map((installment) => ({
      installment_id: installment.id,
      number: installment.number,
      amount_cents: installment.amountCents,
      due_date: installment.dueDate,
    })),
  };
}
