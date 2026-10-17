import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import { createStore, type Store } from "./data/store.js";
import { logger, version } from "./logger.js";

declare module "fastify" {
  interface FastifyInstance {
    store: Store;
  }
}

export function buildServer() {
  const app = Fastify({
    loggerInstance: logger,
    logController: new Fastify.LogController({ disableRequestLogging: true }),
  });

  app.decorate("store", createStore());

  app.get("/health", async () => {
    return { status: "ok" as const, version };
  });

  return app;
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const app = buildServer();
  try {
    await app.listen({ port: 3000, host: "127.0.0.1" });
  } catch (error) {
    logger.error({ event: "server", err: error }, "server failed to start");
    process.exit(1);
  }
}
