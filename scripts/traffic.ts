const BASE_URL = "http://localhost:3000";
const RANDOM_SEED = 1;
const REQUEST_INTERVAL_MS = 500;
const MIN_DOLLARS = 20;
const MAX_DOLLARS = 400;

const CUSTOMER_IDS = [
  "V-14582093",
  "V-18273645",
  "V-19827364",
  "V-21039485",
  "V-22394817",
  "V-23485719",
  "V-24501928",
  "V-25618273",
  "V-26729384",
  "V-27830495",
  "V-28941506",
  "V-29052617",
  "V-30163728",
  "V-31274839",
  "V-32385940",
  "V-33496051",
  "V-34507162",
  "V-35618274",
  "V-36729385",
  "V-37830496",
] as const;

const MERCHANT_IDS = ["m-001", "m-002", "m-003", "m-004", "m-005", "m-006"] as const;
const PLANS = ["2x14", "3x10", "4x28"] as const;

type OpenInstallment = {
  installmentId: string;
  dueDate: string;
  paid: boolean;
};

function readMinutes(argv: readonly string[]): number {
  const raw = argv[2];
  if (raw === undefined) return 3;
  const minutes = Number(raw);
  if (!Number.isFinite(minutes) || minutes <= 0) return 3;
  return minutes;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  const index = Math.floor(rng() * items.length);
  const item = items[index];
  if (item === undefined) throw new Error("empty choice");
  return item;
}

function randomAmountCents(rng: () => number): number {
  const span = MAX_DOLLARS - MIN_DOLLARS + 1;
  const dollars = MIN_DOLLARS + Math.floor(rng() * span);
  return dollars * 100;
}

function caracasToday(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("could not resolve America/Caracas date");
  }
  return `${year}-${month}-${day}`;
}

/** Random clock time from 08:00 through 23:30 America/Caracas on the due date. */
function randomPaidAt(rng: () => number, dueDate: string): string {
  const startMinute = 8 * 60;
  const endMinute = 23 * 60 + 30;
  const minute = startMinute + Math.floor(rng() * (endMinute - startMinute + 1));
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${dueDate}T${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00-04:00`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type RequestResult = {
  status: number | "error";
  body: unknown;
};

async function post(path: string, payload: unknown): Promise<RequestResult> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    const text = await response.text();
    let body: unknown = null;
    if (text.length > 0) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = null;
      }
    }
    return { status: response.status, body };
  } catch {
    return { status: "error", body: null };
  }
}

function installmentsFromPurchase(body: unknown): OpenInstallment[] {
  if (typeof body !== "object" || body === null || !("installments" in body)) return [];
  const installments = body.installments;
  if (!Array.isArray(installments)) return [];
  const open: OpenInstallment[] = [];
  for (const installment of installments) {
    if (typeof installment !== "object" || installment === null) continue;
    const record = installment as Record<string, unknown>;
    if (typeof record.installment_id !== "string" || typeof record.due_date !== "string") continue;
    open.push({ installmentId: record.installment_id, dueDate: record.due_date, paid: false });
  }
  return open;
}

const minutes = readMinutes(process.argv);
const rng = mulberry32(RANDOM_SEED);
const deadline = Date.now() + minutes * 60_000;
const byEndpoint = new Map<string, number>();
const byStatus = new Map<string, number>();
const openInstallments: OpenInstallment[] = [];

function record(path: string, status: number | "error"): void {
  byEndpoint.set(path, (byEndpoint.get(path) ?? 0) + 1);
  const statusKey = String(status);
  byStatus.set(statusKey, (byStatus.get(statusKey) ?? 0) + 1);
  console.log(`POST ${path} ${statusKey}`);
}

async function send(path: string, payload: unknown): Promise<RequestResult | null> {
  if (Date.now() >= deadline) return null;
  const started = Date.now();
  const result = await post(path, payload);
  record(path, result.status);
  const remaining = REQUEST_INTERVAL_MS - (Date.now() - started);
  if (remaining > 0) await sleep(remaining);
  return result;
}

while (Date.now() < deadline) {
  const customerId = pick(rng, CUSTOMER_IDS);
  const merchantId = pick(rng, MERCHANT_IDS);
  const plan = pick(rng, PLANS);
  const amountCents = randomAmountCents(rng);

  const creditCheck = await send("/credit-check", {
    customer_id: customerId,
    merchant_id: merchantId,
  });
  if (creditCheck === null) break;

  const purchase = await send("/purchases", {
    customer_id: customerId,
    merchant_id: merchantId,
    amount_cents: amountCents,
    plan,
  });
  if (purchase === null) break;
  if (purchase.status === 201) {
    openInstallments.push(...installmentsFromPurchase(purchase.body));
  }

  const today = caracasToday(new Date());
  for (const installment of openInstallments) {
    if (installment.paid || installment.dueDate !== today) continue;
    const payment = await send("/payments", {
      installment_id: installment.installmentId,
      paid_at: randomPaidAt(rng, installment.dueDate),
    });
    if (payment === null) break;
    if (payment.status === 200) installment.paid = true;
  }
}

console.log("");
console.log("requests by endpoint");
for (const path of [...byEndpoint.keys()].sort()) {
  console.log(`${path} ${byEndpoint.get(path) ?? 0}`);
}
console.log("requests by status");
for (const status of [...byStatus.keys()].sort()) {
  console.log(`${status} ${byStatus.get(status) ?? 0}`);
}
