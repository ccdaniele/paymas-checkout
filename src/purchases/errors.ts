export class PurchaseError extends Error {
  readonly code: "INVALID_INPUT" | "INSUFFICIENT_CREDIT";

  constructor(code: "INVALID_INPUT" | "INSUFFICIENT_CREDIT") {
    super(code);
    this.name = "PurchaseError";
    this.code = code;
  }
}
