
/**
 * Validation utility functions for data extraction
 * Created: 2025-04-23
 */

export const validators = {
  /**
   * Check if value is a string
   */
  isString: (value: any): boolean => {
    return typeof value === 'string';
  },

  /**
   * Check if value is a number
   */
  isNumber: (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value);
  },

  /**
   * Check if value is a valid year
   */
  isYear: (value: any): boolean => {
    const num = Number(value);
    const currentYear = new Date().getFullYear();
    return !isNaN(num) && num > 1900 && num <= currentYear + 1;
  },

  /**
   * Check if value is a boolean
   */
  isBoolean: (value: any): boolean => {
    return typeof value === 'boolean';
  }
};
