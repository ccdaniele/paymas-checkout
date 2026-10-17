import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import type { Logger } from "pino";
import { log } from "../logger.js";
import { parsePaymentBody, PaymentError, recordPayment } from "./payments.js";

type App = FastifyInstance<FastifyInstance["server"], IncomingMessage, ServerResponse, Logger>;

export function registerCollectionRoutes(app: App): void {
  app.post("/payments", async (request, reply) => {
    try {
      const input = parsePaymentBody(request.body);
      const payment = recordPayment(app.store, input);
      log("info", "payment_recorded", {
        route: "/payments",
        customer_id: payment.customer_id,
        customer_name: payment.customer_name,
        merchant_id: payment.merchant_id,
        amount_cents: payment.amount_cents,
        on_time: payment.on_time,
      });
      if (payment.became_delinquent) {
        log("warn", "marked_delinquent", {
          route: "/payments",
          customer_id: payment.customer_id,
          customer_name: payment.customer_name,
          merchant_id: payment.merchant_id,
        });
      }
      return reply.send({
        installment_id: payment.installment_id,
        on_time: payment.on_time,
        customer_status: payment.customer_status,
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        return reply.code(400).send({ error_code: error.code });
      }
      return reply.code(500).send({ error_code: "INTERNAL" });
    }
  });
}
