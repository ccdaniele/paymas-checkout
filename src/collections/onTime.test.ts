import { expect, it } from "vitest";
import { isPaymentOnTime } from "./onTime.js";

const dueDate = "2026-10-17";

it("a payment at 10:00 Caracas time on the due date is on time", () => {
  expect(isPaymentOnTime(dueDate, new Date("2026-10-17T10:00:00-04:00"))).toBe(true);
});

it("a payment at 10:00 Caracas time the day after is late", () => {
  expect(isPaymentOnTime(dueDate, new Date("2026-10-18T10:00:00-04:00"))).toBe(false);
});
