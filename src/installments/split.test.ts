import { expect, it } from "vitest";
import { splitInstallments } from "./split.js";

it("$100 on 2x14", () => {
  expect(splitInstallments(10_000, "2x14")).toEqual([5_000, 5_000]);
});

it("$100 on 4x28", () => {
  expect(splitInstallments(10_000, "4x28")).toEqual([2_500, 2_500, 2_500, 2_500]);
});

it("$90 on 3x10", () => {
  expect(splitInstallments(9_000, "3x10")).toEqual([3_000, 3_000, 3_000]);
});

it("3x10 puts indivisible totals on the first installment (INC-624882)", () => {
  expect(splitInstallments(14_800, "3x10")).toEqual([4_934, 4_933, 4_933]);

  const incidentTotalsCents = [
    14_800, 5_200, 6_200, 4_700, 5_200, 13_400, 5_800, 13_900, 7_700, 13_900,
  ];
  for (const totalCents of incidentTotalsCents) {
    const amounts = splitInstallments(totalCents, "3x10");
    expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBe(totalCents);
  }
});
