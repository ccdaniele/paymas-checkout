import type { Store } from "../data/store.js";
import { customerStatus, type CustomerStatus } from "../credit/decision.js";
import { isPaymentOnTime } from "./onTime.js";

const PAID_AT_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export class PaymentError extends Error {
  readonly code = "INVALID_INPUT" as const;

  constructor() {
    super("INVALID_INPUT");
    this.name = "PaymentError";
  }
}

export type PaymentInput = {
  installment_id: string;
  paid_at: Date;
};

export type RecordedPayment = {
  installment_id: string;
  on_time: boolean;
  customer_status: CustomerStatus;
  became_delinquent: boolean;
  customer_id: string;
  customer_name: string;
  merchant_id: string;
  amount_cents: number;
};

export function parsePaymentBody(body: unknown): PaymentInput {
  if (typeof body !== "object" || body === null) throw new PaymentError();
  const record = body as Record<string, unknown>;
  const { installment_id, paid_at } = record;
  if (typeof installment_id !== "string" || installment_id.length === 0) throw new PaymentError();
  if (typeof paid_at !== "string" || !PAID_AT_WITH_OFFSET.test(paid_at)) throw new PaymentError();
  const paidAt = new Date(paid_at);
  if (Number.isNaN(paidAt.getTime())) throw new PaymentError();
  return { installment_id, paid_at: paidAt };
}

export function recordPayment(store: Store, input: PaymentInput): RecordedPayment {
  const installment = store.installments.get(input.installment_id);
  if (installment === undefined || installment.paid) throw new PaymentError();
  const customer = store.customers.get(installment.customerId);
  const purchase = store.purchases.get(installment.purchaseId);
  if (customer === undefined || purchase === undefined) throw new Error("installment is missing its customer or purchase");

  const onTime = isPaymentOnTime(installment.dueDate, input.paid_at);
  installment.paid = true;
  installment.paidAt = input.paid_at.toISOString();

  let becameDelinquent = false;
  if (!onTime && !customer.delinquent) {
    customer.delinquent = true;
    becameDelinquent = true;
  }

  return {
    installment_id: installment.id,
    on_time: onTime,
    customer_status: customerStatus(customer),
    became_delinquent: becameDelinquent,
    customer_id: customer.id,
    customer_name: customer.name,
    merchant_id: purchase.merchantId,
    amount_cents: installment.amountCents,
  };
}
