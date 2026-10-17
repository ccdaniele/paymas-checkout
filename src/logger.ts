import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import pino, { type DestinationStream, type Logger, type LogFn } from "pino";

export const SERVICE = "paymas-checkout";
export const ENV = "demo";

function readVersion(): string {
  try {
    const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return sha.length > 0 ? sha : "dev";
  } catch {
    return "dev";
  }
}

/** Git short SHA, read once at process start. "dev" when git is unavailable. */
export const version: string = readVersion();

const envFile = resolve(process.cwd(), ".env");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const logDirectory = resolve(process.cwd(), "logs");
mkdirSync(logDirectory, { recursive: true });

function withEvent(args: Parameters<LogFn>): Parameters<LogFn> {
  const [first, ...rest] = args;
  if (typeof first === "object" && first !== null && !Array.isArray(first)) {
    if ("event" in first && typeof first.event === "string" && first.event.length > 0) {
      return args;
    }
    return [{ ...first, event: "server" }, ...rest] as Parameters<LogFn>;
  }
  return [{ event: "server" }, ...args] as Parameters<LogFn>;
}

const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 2_000;

function statusFromLevel(level: unknown): "info" | "warn" | "error" {
  const label = typeof level === "number" ? pino.levels.labels[level] : level;
  if (label === "warn") return "warn";
  if (label === "error" || label === "fatal") return "error";
  return "info";
}

/** Buffer log lines and POST them to Datadog. Failures are dropped. */
function startDatadogShipping(apiKey: string): DestinationStream {
  const site = process.env.DD_SITE || "datadoghq.com";
  const intakeUrl = `https://http-intake.logs.${site}/api/v2/logs`;
  let pending: Record<string, unknown>[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let tail: Promise<void> = Promise.resolve();

  async function postBatch(batch: readonly Record<string, unknown>[]): Promise<void> {
    try {
      const response = await fetch(intakeUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "DD-API-KEY": apiKey,
        },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(5_000),
      });
      await response.arrayBuffer().catch(() => undefined);
      if (!response.ok) {
        console.error("warning: dropped Datadog log batch");
      }
    } catch {
      console.error("warning: dropped Datadog log batch");
    }
  }

  function flush(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (pending.length === 0) return tail;

    const batch = pending;
    pending = [];
    const shipment = tail.then(() => postBatch(batch));
    tail = shipment.then(
      () => undefined,
      () => undefined,
    );
    return shipment;
  }

  function enqueue(record: Record<string, unknown>): void {
    pending.push(record);
    if (pending.length >= BATCH_SIZE) {
      void flush();
      return;
    }
    if (timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined;
        void flush();
      }, FLUSH_INTERVAL_MS);
      timer.unref();
    }
  }

  let shuttingDown = false;
  const shutdown = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    void flush().finally(() => {
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return {
    write(msg: string): void {
      try {
        const parsed: unknown = JSON.parse(msg);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return;
        const record = parsed as Record<string, unknown>;
        enqueue({
          ...record,
          service: SERVICE,
          ddsource: "nodejs",
          ddtags: `env:${ENV},version:${version}`,
          status: statusFromLevel(record.level),
        });
      } catch {
        // Shipping must not affect the request that produced the log line.
      }
    },
  };
}

const streams: pino.StreamEntry[] = [
  { level: "info", stream: pino.destination(1) },
  {
    level: "info",
    stream: pino.destination({
      dest: resolve(logDirectory, "app.log"),
      append: true,
      mkdir: true,
    }),
  },
];

const ddApiKey = process.env.DD_API_KEY;
if (ddApiKey) {
  streams.push({ level: "info", stream: startDatadogShipping(ddApiKey) });
}

export const logger: Logger = pino(
  {
    level: "info",
    base: {
      service: SERVICE,
      env: ENV,
      version,
    },
    hooks: {
      logMethod(inputArgs, method) {
        method.apply(this, withEvent(inputArgs));
      },
    },
  },
  pino.multistream(streams),
);

export type LogLevel = "info" | "warn" | "error";

/** Fields the spec allows on a log line, besides the required event name. */
export type LogFields = {
  route?: string;
  customer_id?: string;
  customer_name?: string;
  merchant_id?: string;
  plan?: string;
  amount_cents?: number;
  error_code?: string;
  on_time?: boolean;
  msg?: string;
};

export function log(level: LogLevel, event: string, fields: LogFields = {}): void {
  logger[level]({ ...fields, event });
}
