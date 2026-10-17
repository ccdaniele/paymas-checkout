import { PLANS, type PlanId } from "./plans.js";

export class InstallmentSumMismatchError extends Error {
  readonly code = "INSTALLMENT_SUM_MISMATCH" as const;

  constructor() {
    super("INSTALLMENT_SUM_MISMATCH");
    this.name = "InstallmentSumMismatchError";
  }
}

/** Each installment is an equal share of the total, rounded to the nearest cent. */
export function splitInstallments(totalCents: number, planId: PlanId): number[] {
  const count = PLANS[planId].payments;
  const share = Math.round(totalCents / count);
  const amounts = Array.from({ length: count }, () => share);

  let sum = 0;
  for (const amount of amounts) sum += amount;
  if (sum !== totalCents) throw new InstallmentSumMismatchError();
  return amounts;
}
