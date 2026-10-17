/** Calendar date (YYYY-MM-DD) of an instant, taken from its UTC ISO string. */
export function utcCalendarDate(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}
