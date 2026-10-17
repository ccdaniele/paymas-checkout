import { PLANS, type PlanId } from "./plans.js";

export class InstallmentSumMismatchError extends Error {
  readonly code = "INSTALLMENT_SUM_MISMATCH" as const;

  constructor() {
    super("INSTALLMENT_SUM_MISMATCH");
    this.name = "InstallmentSumMismatchError";
  }
}

/** base = floor(total / n); the first installment also receives total − base × n. */
export function splitInstallments(totalCents: number, planId: PlanId): number[] {
  const count = PLANS[planId].payments;
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  const amounts: number[] = [];
  for (let index = 0; index < count; index += 1) {
    amounts.push(index === 0 ? base + remainder : base);
  }

  let sum = 0;
  for (const amount of amounts) sum += amount;
  if (sum !== totalCents) throw new InstallmentSumMismatchError();
  return amounts;
}
