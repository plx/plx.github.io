const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a calendar date at midnight UTC so builds are timezone-independent. */
export function parseContentDate(value: string | Date): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.valueOf())) {
      throw new Error("Invalid Date object");
    }
    return new Date(Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ));
  }

  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Expected a date in YYYY-MM-DD format, received: ${value}`);
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return date;
}
