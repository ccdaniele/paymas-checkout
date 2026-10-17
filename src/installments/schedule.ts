import { PLANS, type PlanId } from "./plans.js";
import { splitInstallments } from "./split.js";

const CARACAS = "America/Caracas";

const caracasDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CARACAS,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type ScheduledInstallment = {
  number: number;
  amountCents: number;
  dueDate: string;
};

export function caracasDate(instant: Date): string {
  const parts = caracasDateFormatter.formatToParts(instant);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("could not resolve America/Caracas date");
  }
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (match === null) throw new Error("invalid calendar date");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const y = String(shifted.getUTCFullYear()).padStart(4, "0");
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function scheduleInstallments(
  totalCents: number,
  planId: PlanId,
  purchasedAt: Date,
): ScheduledInstallment[] {
  const plan = PLANS[planId];
  const amounts = splitInstallments(totalCents, planId);
  const purchaseDate = caracasDate(purchasedAt);
  return amounts.map((amountCents, index) => {
    const dueDays = plan.dueDays[index];
    if (dueDays === undefined) throw new Error("plan due days do not match payments");
    return {
      number: index + 1,
      amountCents,
      dueDate: addCalendarDays(purchaseDate, dueDays),
    };
  });
}
