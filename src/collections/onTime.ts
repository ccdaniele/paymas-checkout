import { utcCalendarDate } from "./calendarDate.js";

/** On time when paid_at's UTC calendar date is on or before due_date. */
export function isPaymentOnTime(dueDate: string, paidAt: Date): boolean {
  return utcCalendarDate(paidAt) <= dueDate;
}
