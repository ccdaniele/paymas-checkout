export const PLANS = {
  "2x14": { payments: 2, dueDays: [0, 14] },
  "3x10": { payments: 3, dueDays: [0, 5, 10] },
  "4x28": { payments: 4, dueDays: [0, 7, 14, 21] },
} as const;

export type PlanId = keyof typeof PLANS;

export function isPlanId(value: string): value is PlanId {
  return Object.prototype.hasOwnProperty.call(PLANS, value);
}
