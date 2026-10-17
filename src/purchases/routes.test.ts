import { beforeEach, expect, it, vi } from "vitest";

const log = vi.hoisted(() => vi.fn());

vi.mock("../logger.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../logger.js")>();
  return { ...actual, log };
});

vi.mock("../installments/split.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../installments/split.js")>();
  return {
    ...actual,
    splitInstallments(totalCents: number, planId: Parameters<typeof actual.splitInstallments>[1]) {
      if (totalCents === 100) throw new actual.InstallmentSumMismatchError();
      return actual.splitInstallments(totalCents, planId);
    },
  };
});

const { buildServer } = await import("../server.js");

const purchase = {
  customer_id: "V-14582093",
  merchant_id: "m-001",
  plan: "2x14",
};

beforeEach(() => {
  log.mockClear();
});

it("logs purchase_declined at info when credit is insufficient", async () => {
  const app = buildServer();
  const response = await app.inject({
    method: "POST",
    url: "/purchases",
    payload: { ...purchase, amount_cents: 50_001 },
  });

  expect(response.statusCode).toBe(422);
  expect(response.json()).toEqual({ error_code: "INSUFFICIENT_CREDIT" });
  expect(log).toHaveBeenCalledWith(
    "info",
    "purchase_declined",
    expect.objectContaining({
      route: "/purchases",
      customer_id: "V-14582093",
      customer_name: "María Fernández",
      merchant_id: "m-001",
      plan: "2x14",
      amount_cents: 50_001,
      error_code: "INSUFFICIENT_CREDIT",
    }),
  );
  expect(log).not.toHaveBeenCalledWith("error", "purchase_failed", expect.anything());
  await app.close();
});

it("logs purchase_failed at error when the installment sum does not match", async () => {
  const app = buildServer();
  const response = await app.inject({
    method: "POST",
    url: "/purchases",
    payload: { ...purchase, amount_cents: 100 },
  });

  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual({ error_code: "INSTALLMENT_SUM_MISMATCH" });
  expect(log).toHaveBeenCalledWith(
    "error",
    "purchase_failed",
    expect.objectContaining({
      route: "/purchases",
      customer_id: "V-14582093",
      error_code: "INSTALLMENT_SUM_MISMATCH",
    }),
  );
  expect(log).not.toHaveBeenCalledWith("info", "purchase_declined", expect.anything());
  await app.close();
});
