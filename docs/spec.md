## Plans
| Plan id | Payments | Due days after purchase |
|---|---|---|
| 2x14 | 2 | 0, 14 |
| 3x10 | 3 | 0, 5, 10 |
| 4x28 | 4 | 0, 7, 14, 21 |

## Installment split
- Amounts are integer cents.
- base = floor(total / n). Every installment is base cents, and the first
  installment also receives the remainder (total − base × n).
- The installments must always sum exactly to the purchase total; if not,
  the purchase fails with error code INSTALLMENT_SUM_MISMATCH.

## On-time rule
- due_date is a calendar date (YYYY-MM-DD) in America/Caracas.
- A payment is on time if paid_at, converted to America/Caracas, falls on or
  before due_date (i.e. by 23:59:59 Caracas time).
- A late payment marks the customer delinquent. Delinquent customers have
  0 available credit.

## Endpoints
- GET /health → { status: "ok", version }
- POST /credit-check { customer_id, merchant_id }
  → { customer_id, status: "active" | "delinquent", credit_limit_cents,
      available_cents, approved }
- POST /purchases { customer_id, merchant_id, amount_cents, plan }
  → 201 { purchase_id, installments: [{ installment_id, number,
      amount_cents, due_date }] }
  → 422 if not enough available credit; 500 on internal error
- POST /payments { installment_id, paid_at (ISO 8601 with offset) }
  → { installment_id, on_time, customer_status }

## Log events (JSON, one per line)
Every line has: time, level, service "paymas-checkout", env "demo",
version (git short SHA), event, and where relevant: route, customer_id,
customer_name, merchant_id, plan, amount_cents, error_code.

| event | level | when |
|---|---|---|
| credit_check_completed | info | after /credit-check |
| purchase_created | info | purchase stored |
| purchase_declined | info | purchase rejected for insufficient credit |
| purchase_failed | error | unexpected purchase error (500) |
| payment_recorded | info | payment stored (with on_time) |
| marked_delinquent | warn | customer becomes delinquent |

## Seed data
- 20 customers; IDs look like Venezuelan cédulas ("V-14582093"), fake names,
  credit limits 200–1,000. Customer 1 is fixed: V-14582093,
  María Fernández, limit 50000 cents.
- 6 merchants, m-001 … m-006. m-001 is "Electro Valencia".
- Seed is deterministic (same data every start).
