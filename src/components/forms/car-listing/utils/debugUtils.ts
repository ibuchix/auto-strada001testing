
/**
 * Changes made:
 * - 2025-04-06: Simplified debug utilities with minimal required functionality
 * - 2025-04-06: Added environment check to prevent debug logs in production
 */

export const debugMileageData = (): number => {
  if (process.env.NODE_ENV === 'production') {
    return 0;
  }
  
  try {
    const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
    return mileage;
  } catch (error) {
    console.error('Error reading mileage data:', error);
    return 0;
  }
};

export const logAllLocalStorage = (): void => {
  // Skip in production environment
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  try {
    console.log('All localStorage items:');
    Object.keys(localStorage).forEach(key => {
      console.log(`${key}: ${localStorage.getItem(key)}`);
    });
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
};
