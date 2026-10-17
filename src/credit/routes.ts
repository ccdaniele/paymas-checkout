import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import type { Logger } from "pino";
import { log, type LogFields } from "../logger.js";
import { decideCredit } from "./decision.js";

type App = FastifyInstance<FastifyInstance["server"], IncomingMessage, ServerResponse, Logger>;

export class CreditCheckError extends Error {
  readonly code = "INVALID_INPUT" as const;

  constructor() {
    super("INVALID_INPUT");
    this.name = "CreditCheckError";
  }
}

function parseCreditCheckBody(body: unknown): { customer_id: string; merchant_id: string } {
  if (typeof body !== "object" || body === null) throw new CreditCheckError();
  const record = body as Record<string, unknown>;
  const { customer_id, merchant_id } = record;
  if (typeof customer_id !== "string" || customer_id.length === 0) throw new CreditCheckError();
  if (typeof merchant_id !== "string" || merchant_id.length === 0) throw new CreditCheckError();
  return { customer_id, merchant_id };
}

export function registerCreditRoutes(app: App): void {
  app.post("/credit-check", async (request, reply) => {
    const fields: LogFields = { route: "/credit-check" };
    try {
      const input = parseCreditCheckBody(request.body);
      fields.customer_id = input.customer_id;
      fields.merchant_id = input.merchant_id;
      const customer = app.store.customers.get(input.customer_id);
      const merchant = app.store.merchants.get(input.merchant_id);
      if (customer === undefined || merchant === undefined) throw new CreditCheckError();
      fields.customer_name = customer.name;
      const decision = decideCredit(app.store, customer.id);
      log("info", "credit_check_completed", fields);
      return reply.send(decision);
    } catch (error) {
      if (error instanceof CreditCheckError) {
        return reply.code(400).send({ error_code: error.code });
      }
      return reply.code(500).send({ error_code: "INTERNAL" });
    }
  });
}
