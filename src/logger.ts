import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import pino, { type Logger, type LogFn } from "pino";

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
  pino.multistream([
    { level: "info", stream: pino.destination(1) },
    {
      level: "info",
      stream: pino.destination({
        dest: resolve(logDirectory, "app.log"),
        append: true,
        mkdir: true,
      }),
    },
  ]),
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
