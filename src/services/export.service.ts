// =============================================================================
// Export Service - CSV generation for orders, products, payments, users
// =============================================================================

/** Escapes a CSV cell per RFC 4180 */
function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Converts an array of objects into CSV text */
export function toCsv<T extends Record<string, unknown>>(rows: T[], columns?: { key: string; label: string }[]): string {
  if (rows.length === 0) return columns ? columns.map((c) => c.label).join(',') + '\n' : '';

  const cols = columns || Object.keys(rows[0]).map((key) => ({ key, label: key }));
  const header = cols.map((c) => escapeCsvCell(c.label)).join(',');
  const body = rows
    .map((row) => cols.map((c) => escapeCsvCell(row[c.key])).join(','))
    .join('\n');

  return `${header}\n${body}\n`;
}

/** Creates a downloadable Response with a CSV attachment */
export function csvResponse<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns?: { key: string; label: string }[]
): Response {
  const csv = toCsv(rows, columns);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
