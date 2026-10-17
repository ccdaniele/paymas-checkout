import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import type { Logger } from "pino";
import { InstallmentSumMismatchError } from "../installments/split.js";
import { log, type LogFields } from "../logger.js";
import { createPurchase, parsePurchaseBody } from "./createPurchase.js";
import { PurchaseError } from "./errors.js";

type App = FastifyInstance<
  FastifyInstance["server"],
  IncomingMessage,
  ServerResponse,
  Logger
>;

function failureCode(error: unknown): string {
  if (error instanceof PurchaseError || error instanceof InstallmentSumMismatchError) return error.code;
  return "INTERNAL";
}

function failureStatus(code: string): number {
  if (code === "INSUFFICIENT_CREDIT") return 422;
  if (code === "INVALID_INPUT") return 400;
  return 500;
}

function requestFields(body: unknown): LogFields {
  const fields: LogFields = { route: "/purchases" };
  if (typeof body !== "object" || body === null) return fields;
  const record = body as Record<string, unknown>;
  if (typeof record.customer_id === "string") fields.customer_id = record.customer_id;
  if (typeof record.merchant_id === "string") fields.merchant_id = record.merchant_id;
  if (typeof record.plan === "string") fields.plan = record.plan;
  if (typeof record.amount_cents === "number" && Number.isInteger(record.amount_cents)) {
    fields.amount_cents = record.amount_cents;
  }
  return fields;
}

export function registerPurchaseRoutes(app: App): void {
  app.post("/purchases", async (request, reply) => {
    const fields = requestFields(request.body);
    try {
      const input = parsePurchaseBody(request.body);
      const customer = app.store.customers.get(input.customer_id);
      if (customer !== undefined) fields.customer_name = customer.name;
      const purchase = createPurchase(app.store, input);
      log("info", "purchase_created", fields);
      return reply.code(201).send(purchase);
    } catch (error) {
      const errorCode = failureCode(error);
      log("error", "purchase_failed", { ...fields, error_code: errorCode });
      return reply.code(failureStatus(errorCode)).send({ error_code: errorCode });
    }
  });
}
