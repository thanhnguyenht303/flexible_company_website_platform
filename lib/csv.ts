const spreadsheetFormulaPrefix = /^[\s]*[=+\-@]/;

export function csvCell(value: string) {
  const neutralized = spreadsheetFormulaPrefix.test(value) ? `'${value}` : value;
  return `"${neutralized.replace(/"/g, '""')}"`;
}
