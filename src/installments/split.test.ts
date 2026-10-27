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

it("3x10 when total is not divisible by 3 (INC-517987)", () => {
  expect(splitInstallments(14_800, "3x10")).toEqual([4_934, 4_933, 4_933]);
  expect(splitInstallments(5_200, "3x10")).toEqual([1_734, 1_733, 1_733]);
  expect(splitInstallments(6_200, "3x10")).toEqual([2_068, 2_066, 2_066]);
  expect(splitInstallments(4_700, "3x10")).toEqual([1_568, 1_566, 1_566]);
});
