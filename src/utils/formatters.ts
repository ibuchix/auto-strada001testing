
/**
 * Changes made:
 * - 2024-11-21: Created formatters utility
 * - 2025-04-05: Updated formatCurrency to support specifying the currency
 * - 2025-06-01: Enhanced Polish Zloty formatting and proper handling of null values
 */

/**
 * Format a number as currency
 */
export function formatCurrency(value?: number | null, currency: string = 'PLN'): string {
  // Handle null or undefined properly
  if (value === null || value === undefined) return 'N/A';
  
  // Handle zero value with proper formatting
  if (value === 0) return '0 PLN';
  
  // Format the number with Polish locale for PLN currency
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
  if (value === null || value === undefined) return 'N/A';
  
  return new Intl.NumberFormat('pl-PL').format(value);
}
