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

it("3x10 puts remainder cents on the first installment (INC-054365)", () => {
  const cases = [
    { total: 14_800, expected: [4_934, 4_933, 4_933] },
    { total: 5_200, expected: [1_734, 1_733, 1_733] },
    { total: 6_200, expected: [2_068, 2_066, 2_066] },
    { total: 4_700, expected: [1_568, 1_566, 1_566] },
    { total: 13_400, expected: [4_468, 4_466, 4_466] },
    { total: 5_800, expected: [1_934, 1_933, 1_933] },
    { total: 13_900, expected: [4_634, 4_633, 4_633] },
    { total: 7_700, expected: [2_568, 2_566, 2_566] },
  ] as const;

  for (const { total, expected } of cases) {
    expect(splitInstallments(total, "3x10")).toEqual([...expected]);
    expect(expected.reduce((a, b) => a + b, 0)).toBe(total);
  }
});
