
/**
 * Changes made:
 * - 2024-11-21: Created formatters utility
 * - 2025-04-05: Updated formatCurrency to support specifying the currency
 */

/**
 * Format a number as currency
 */
export function formatCurrency(value?: number | null, currency: string = 'PLN'): string {
  if (value == null) return 'N/A';
  
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(value?: number | null): string {
  if (value == null) return 'N/A';
  
  return new Intl.NumberFormat('pl-PL').format(value);
}
