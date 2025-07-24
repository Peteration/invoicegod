import { AuditLogger } from '../audit/auditLogger';

const audit = AuditLogger.getInstance();

export function generateCSV(
  data: Array<Array<string | number>>,
  delimiter: string = ','
): string {
  try {
    return data
      .map(row =>
        row
          .map(item => {
            const str = String(item);
            return str.includes(delimiter) || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(delimiter)
      .join('\n');
  } catch (error) {
    audit.logSecurityEvent('CSV_GENERATION_FAILED', {
      error: error.message
    });
    throw error;
  }
}

export async function generateCSVFromJSON(
  data: Array<Record<string, any>>,
  options: {
    headers?: Array<{ key: string; label: string }>;
    delimiter?: string;
  } = {}
): Promise<string> {
  const delimiter = options.delimiter || ',';
  const headers = options.headers || Object.keys(data[0] || {}).map(key => ({
    key,
    label: key
  }));

  const csvData = [
    headers.map(h => h.label),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header.key];
        return value === undefined || value === null ? '' : value;
      })
    )
  ];

  return generateCSV(csvData, delimiter);
}