import { format } from 'date-fns';

// Format currency based on locale
export function formatCurrency(
  amount: number, 
  currency: string, 
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  } catch {
    // Fallback formatting
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Format dates based on locale
export function formatLocalDate(
  date: Date, 
  locale: string = 'en-US',
  includeTime: boolean = false
): string {
  const dateStyle: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  const timeStyle: Intl.DateTimeFormatOptions | undefined = includeTime 
    ? { hour: '2-digit', minute: '2-digit' } 
    : undefined;

  try {
    return new Intl.DateTimeFormat(locale, { ...dateStyle, ...timeStyle }).format(date);
  } catch {
    // Fallback formatting
    return date.toISOString().split('T')[0];
  }
}

// Format tax IDs based on country
export function formatTaxId(id: string, country: string): string {
  const formatters: Record<string, (id: string) => string> = {
    US: (id) => `${id.slice(0,2)}-${id.slice(2)}`,
    CA: (id) => `${id.slice(0,9)}`,
    AU: (id) => `${id.slice(0,3)} ${id.slice(3,6)} ${id.slice(6)}`,
    UK: (id) => `GB ${id}`,
    DE: (id) => `${id.slice(0,3)}/${id.slice(3,6)}/${id.slice(6)}`,
    // ... other countries
  };

  return formatters[country]?.(id) || id;
}