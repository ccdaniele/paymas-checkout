import { expect, it } from "vitest";
import { splitInstallments } from "./split.js";

/** INC-600582: totals not divisible by payment count must still split without error. */
it("14800c on 3x10 (remainder on first installment)", () => {
  expect(splitInstallments(14_800, "3x10")).toEqual([4_934, 4_933, 4_933]);
});

it("$100 on 2x14", () => {
  expect(splitInstallments(10_000, "2x14")).toEqual([5_000, 5_000]);
});

it("$100 on 4x28", () => {
  expect(splitInstallments(10_000, "4x28")).toEqual([2_500, 2_500, 2_500, 2_500]);
});

it("$90 on 3x10", () => {
  expect(splitInstallments(9_000, "3x10")).toEqual([3_000, 3_000, 3_000]);
});
