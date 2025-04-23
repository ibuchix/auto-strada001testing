
/**
 * Validator functions for data extraction
 * Created: 2025-04-23
 * Common validators for data extraction and type checking
 */

export const validators = {
  /**
   * Checks if a value is a string
   */
  isString: (value: any): boolean => {
    return typeof value === 'string';
  },
  
  /**
   * Checks if a value is a number
   */
  isNumber: (value: any): boolean => {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') return !isNaN(Number(value));
    return false;
  },
  
  /**
   * Checks if a value is a valid year
   * Between 1900 and current year + 1
   */
  isYear: (value: any): boolean => {
    const year = Number(value);
    const currentYear = new Date().getFullYear();
    return !isNaN(year) && year >= 1900 && year <= currentYear + 1;
  },
  
  /**
   * Checks if a value is a boolean
   */
  isBoolean: (value: any): boolean => {
    return typeof value === 'boolean';
  },
  
  /**
   * Checks if a value is a valid price
   * Must be a number >= 0
   */
  isPrice: (value: any): boolean => {
    const price = Number(value);
    return !isNaN(price) && price >= 0;
  }
};
