import type { Customer, Merchant } from "./store.js";

type SeedCustomer = Omit<Customer, "delinquent">;

/**
 * Deterministic seed. Customer 1 is fixed by the spec.
 * Other credit limits are whole dollars in the 200–1,000 range, stored as cents.
 */
export const customers: readonly SeedCustomer[] = [
  { id: "V-14582093", name: "María Fernández", creditLimitCents: 50_000 },
  { id: "V-18273645", name: "Carlos Rodríguez", creditLimitCents: 20_000 },
  { id: "V-19827364", name: "Ana Martínez", creditLimitCents: 35_000 },
  { id: "V-21039485", name: "Luis Hernández", creditLimitCents: 42_000 },
  { id: "V-22394817", name: "Carmen López", creditLimitCents: 58_000 },
  { id: "V-23485719", name: "Pedro Díaz", creditLimitCents: 64_000 },
  { id: "V-24501928", name: "Rosa Pérez", creditLimitCents: 71_000 },
  { id: "V-25618273", name: "José García", creditLimitCents: 80_000 },
  { id: "V-26729384", name: "Lucía Romero", creditLimitCents: 91_000 },
  { id: "V-27830495", name: "Miguel Torres", creditLimitCents: 100_000 },
  { id: "V-28941506", name: "Elena Vargas", creditLimitCents: 27_500 },
  { id: "V-29052617", name: "Andrés Morales", creditLimitCents: 33_000 },
  { id: "V-30163728", name: "Isabel Castro", creditLimitCents: 46_000 },
  { id: "V-31274839", name: "Javier Rojas", creditLimitCents: 52_000 },
  { id: "V-32385940", name: "Patricia Núñez", creditLimitCents: 61_000 },
  { id: "V-33496051", name: "Ricardo Silva", creditLimitCents: 69_000 },
  { id: "V-34507162", name: "Gabriela Mendoza", creditLimitCents: 77_000 },
  { id: "V-35618274", name: "Fernando Herrera", creditLimitCents: 84_000 },
  { id: "V-36729385", name: "Valentina Cruz", creditLimitCents: 93_000 },
  { id: "V-37830496", name: "Diego Ramírez", creditLimitCents: 25_000 },
];

export const merchants: readonly Merchant[] = [
  { id: "m-001", name: "Electro Valencia" },
  { id: "m-002", name: "Farmacia Los Samanes" },
  { id: "m-003", name: "Supermercado Central" },
  { id: "m-004", name: "Tienda Maracay" },
  { id: "m-005", name: "Muebles Barquisimeto" },
  { id: "m-006", name: "Librería El Hatillo" },
];
