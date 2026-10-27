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

it("$148 on 3x10 when total does not divide evenly", () => {
  expect(splitInstallments(14_800, "3x10")).toEqual([4_934, 4_933, 4_933]);
});
