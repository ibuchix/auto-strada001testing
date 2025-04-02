
/**
 * Changes made:
 * - 2024-11-21: Created formatters utility
 */

/**
 * Format a number as currency
 */
export function formatCurrency(value?: number | null): string {
  if (value == null) return 'N/A';
  
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
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
