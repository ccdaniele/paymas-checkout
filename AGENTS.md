## What this is
Paymas (fictional) is a buy-now-pay-later service. This repo is its checkout API:
merchants check a customer's available credit, create purchases split into
installments, and record payments. It is a demo service.

## Stack
- TypeScript, Node 22, ESM
- Fastify for HTTP; its built-in pino logger for JSON logs
- Vitest for tests
- No database: in-memory data seeded at startup (src/data/)
- Do not add other frameworks or libraries without asking

## Layout
- src/server.ts — Fastify app and routes
- src/installments/ — plans and installment split (checkout)
- src/purchases/ — purchase creation
- src/credit/ — credit limits and decisioning (protected)
- src/collections/ — payments and on-time checks (protected)
- src/data/ — in-memory store and seed data
- src/logger.ts — log event helper
- scripts/ — traffic generator and dev scripts
- docs/spec.md — contracts; read it before changing any endpoint, plan or log event

## Rules for every change
1. Read docs/spec.md first. Do not change a contract unless asked.
2. Keep changes small and limited to what was asked.
3. Money is always integer cents. Never use floating-point amounts.
4. Instants are stored in UTC; business dates are in America/Caracas (UTC−4).
5. Every log line goes through src/logger.ts with an event name from docs/spec.md.
6. Never log or commit secrets.

## Rules for bug fixes
1. Write a failing regression test that reproduces the bug first, then fix it.
2. Change only the files needed for the fix.
3. Do not modify src/credit/ or src/collections/. If the root cause is there,
   stop and explain the needed change in the PR description instead.
4. All tests must pass: npm test.
5. PR description: root cause, the fix, and the test that proves it.
