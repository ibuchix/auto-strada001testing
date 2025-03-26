
/**
 * Utility functions for formatting data
 */

export const currencyFormat = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const plnCurrencyFormat = (value: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const dateFormat = (date: string | Date): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(dateObj);
};

export const timeFormat = (date: string | Date): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

export const dateTimeFormat = (date: string | Date): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return `${dateFormat(dateObj)} at ${timeFormat(dateObj)}`;
};

export const numberFormat = (value: number): string => {
  return new Intl.NumberFormat('en-GB').format(value);
};

export const compactNumberFormat = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
};
