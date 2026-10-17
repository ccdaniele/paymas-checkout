import { caracasDate } from "../installments/schedule.js";

/** On time when paid_at's America/Caracas calendar date is on or before due_date. */
export function isPaymentOnTime(dueDate: string, paidAt: Date): boolean {
  return caracasDate(paidAt) <= dueDate;
}
